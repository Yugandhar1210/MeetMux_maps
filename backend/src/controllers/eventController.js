import Event from "../models/Event.js";
import Connection from "../models/Connection.js";

function dateRange(range) {
  const now = new Date();
  const start = new Date();
  const end = new Date();
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  if (range === "today") return { $gte: start, $lte: end };

  if (range === "tomorrow") {
    const s = new Date(start);
    s.setDate(s.getDate() + 1);
    const e = new Date(end);
    e.setDate(e.getDate() + 1);
    return { $gte: s, $lte: e };
  }

  if (range === "weekend") {
    // upcoming Saturday/Sunday
    const day = now.getDay(); // 0 Sun..6 Sat
    const sat = new Date(start);
    const sun = new Date(end);
    const toSat = (6 - day + 7) % 7;
    const toSun = (7 - day + 7) % 7;
    sat.setDate(sat.getDate() + toSat);
    sun.setDate(sun.getDate() + toSun);
    return { $gte: sat, $lte: sun };
  }

  if (range === "nextweek") {
    // next Mon-Sun after current week
    const day = now.getDay();
    const nextMon = new Date(start);
    nextMon.setDate(nextMon.getDate() + ((8 - day) % 7 || 7));
    const nextSun = new Date(nextMon);
    nextSun.setDate(nextSun.getDate() + 6);
    nextSun.setHours(23, 59, 59, 999);
    return { $gte: nextMon, $lte: nextSun };
  }

  return null;
}

function timeOfDayRange(tod) {
  // local hours
  const mk = (h) => ({
    $expr: {
      $and: [
        { $gte: [{ $hour: "$startsAt" }, h.start] },
        { $lt: [{ $hour: "$startsAt" }, h.end] },
      ],
    },
  });
  if (tod === "morning") return mk({ start: 5, end: 12 });
  if (tod === "afternoon") return mk({ start: 12, end: 17 });
  if (tod === "evening") return mk({ start: 17, end: 21 });
  if (tod === "night") return mk({ start: 21, end: 24 }); // note: 0-5 not included
  return null;
}

export const listEvents = async (req, res) => {
  try {
    const {
      type, // activityType
      createdBy, // "connections" | "all"
      timeOfDay, // morning | afternoon | evening | night
      dateRange: dr, // today | tomorrow | weekend | nextweek
      lat,
      lng,
      radius, // optional near filter (meters)
    } = req.query;

    const q = { visibility: "public" };
    if (type) q.activityType = type;

    // date range
    const drf = dateRange(dr);
    if (drf) q.startsAt = drf;

    // geo near pipeline if coords provided
    const pipeline = [];
    if (lat && lng && radius) {
      pipeline.push({
        $geoNear: {
          near: { type: "Point", coordinates: [Number(lng), Number(lat)] },
          distanceField: "dist",
          spherical: true,
          key: "locationGeo",
          maxDistance: Number(radius),
        },
      });
    } else {
      pipeline.push({ $match: {} });
    }

    pipeline.push({ $match: q });

    // time of day (aggregation expr)
    const todExpr = timeOfDayRange(timeOfDay);
    if (todExpr) pipeline.push({ $match: todExpr });

    // createdBy=connections
    if (createdBy === "connections" && req.user?.id) {
      const me = String(req.user.id);
      const cons = await Connection.find({
        status: "accepted",
        $or: [{ requester: me }, { receiver: me }],
      })
        .select("requester receiver")
        .lean();
      const ids = new Set(
        cons.map((c) =>
          String(c.requester) === me ? String(c.receiver) : String(c.requester)
        )
      );
      pipeline.push({ $match: { createdBy: { $in: Array.from(ids) } } });
    }

    pipeline.push(
      { $sort: { startsAt: 1 } },
      { $limit: 200 },
      {
        $lookup: {
          from: "users",
          localField: "createdBy",
          foreignField: "_id",
          as: "creator",
        },
      },
      { $unwind: { path: "$creator", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          name: 1,
          description: 1,
          activityType: 1,
          location: 1,
          startsAt: 1,
          endsAt: 1,
          createdBy: 1,
          participants: 1,
          capacity: 1,
          creator: {
            _id: "$creator._id",
            name: "$creator.name",
            email: "$creator.email",
          },
        },
      }
    );

    const events = await Event.aggregate(pipeline);
    res.json(events);
  } catch (e) {
    res.status(500).json({ message: e.message || "Failed to load events" });
  }
};

export const createEvent = async (req, res) => {
  try {
    const {
      name,
      description,
      activityType,
      location,
      startsAt,
      endsAt,
      capacity,
    } = req.body;
    if (!name || !activityType || !startsAt || !endsAt) {
      return res.status(400).json({ message: "Missing fields" });
    }
    const ev = await Event.create({
      name,
      description,
      activityType,
      location,
      startsAt: new Date(startsAt),
      endsAt: new Date(endsAt),
      capacity: capacity || 50,
      createdBy: req.user.id,
      participants: [req.user.id],
    });
    res.status(201).json(ev);
  } catch (e) {
    res.status(500).json({ message: e.message || "Failed to create event" });
  }
};

export const joinEvent = async (req, res) => {
  try {
    const id = req.params.id;
    const ev = await Event.findById(id);
    if (!ev) return res.status(404).json({ message: "Event not found" });
    const uid = String(req.user.id);
    if (ev.participants.map(String).includes(uid)) {
      return res.status(400).json({ message: "Already joined" });
    }
    if (ev.participants.length >= ev.capacity) {
      return res.status(400).json({ message: "Event full" });
    }
    ev.participants.push(req.user.id);
    await ev.save();
    res.json(ev);
  } catch (e) {
    res.status(500).json({ message: e.message || "Failed to join event" });
  }
};

export const leaveEvent = async (req, res) => {
  try {
    const id = req.params.id;
    const uid = String(req.user.id);
    const ev = await Event.findByIdAndUpdate(
      id,
      { $pull: { participants: req.user.id } },
      { new: true }
    );
    if (!ev) return res.status(404).json({ message: "Event not found" });
    res.json(ev);
  } catch (e) {
    res.status(500).json({ message: e.message || "Failed to leave event" });
  }
};

export const myEvents = async (req, res) => {
  try {
    const me = req.user.id;
    const [created, joined] = await Promise.all([
      Event.find({ createdBy: me }).sort({ startsAt: 1 }),
      Event.find({ participants: me }).sort({ startsAt: 1 }),
    ]);
    res.json({ created, joined });
  } catch (e) {
    res.status(500).json({ message: e.message || "Failed to load my events" });
  }
};
