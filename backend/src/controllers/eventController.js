import Event from "../models/Event.js";
import User from "../models/User.js";

export const createEvent = async (req, res) => {
  try {
    const data = { ...req.body, createdBy: req.user._id };
    const event = await Event.create(data);
    return res.status(201).json(event);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const getEvents = async (req, res) => {
  try {
    const { type, dateFrom, dateTo } = req.query;
    const filter = {};
    if (type) filter.type = type;
    if (dateFrom || dateTo) {
      filter.date = {};
      if (dateFrom) filter.date.$gte = new Date(dateFrom);
      if (dateTo) filter.date.$lte = new Date(dateTo);
    }
    const events = await Event.find(filter).populate(
      "createdBy",
      "name avatarUrl"
    );
    return res.json(events);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate("createdBy", "name avatarUrl")
      .populate("participants", "name avatarUrl");
    if (!event) return res.status(404).json({ message: "Event not found" });
    return res.json(event);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const updateEvent = async (req, res) => {
  try {
    const updated = await Event.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user._id },
      req.body,
      { new: true }
    );
    if (!updated)
      return res
        .status(404)
        .json({ message: "Event not found or not authorized" });
    return res.json(updated);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const deleteEvent = async (req, res) => {
  try {
    const deleted = await Event.findOneAndDelete({
      _id: req.params.id,
      createdBy: req.user._id,
    });
    if (!deleted)
      return res
        .status(404)
        .json({ message: "Event not found or not authorized" });
    return res.json({ message: "Event deleted" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const joinEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });
    if (
      !event.participants.find((u) => u.toString() === req.user._id.toString())
    ) {
      event.participants.push(req.user._id);
      await event.save();
    }
    return res.json(event);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const leaveEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });
    event.participants = event.participants.filter(
      (u) => u.toString() !== req.user._id.toString()
    );
    await event.save();
    return res.json(event);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const likeEvent = async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { likes: req.user._id } },
      { new: true }
    );
    if (!event) return res.status(404).json({ message: "Event not found" });
    return res.json(event);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const commentOnEvent = async (req, res) => {
  // Placeholder: implement comments collection later
  return res.status(501).json({ message: "Comments not implemented" });
};

export const getFeed = async (req, res) => {
  try {
    const { lat, lng, radiusKm = 10, type, timeOfDay, dateFilter } = req.query;
    const filter = { visibility: "public" };

    // Type filter
    if (type) filter.type = type;

    // Date filter
    const now = new Date();
    if (dateFilter === "today") {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const end = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1
      );
      filter.date = { $gte: start, $lt: end };
    } else if (dateFilter === "tomorrow") {
      const start = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1
      );
      const end = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 2
      );
      filter.date = { $gte: start, $lt: end };
    }

    // Time of day
    if (timeOfDay) {
      const ranges = {
        morning: ["05:00", "11:59"],
        afternoon: ["12:00", "16:59"],
        evening: ["17:00", "20:59"],
        night: ["21:00", "23:59"],
      };
      const r = ranges[timeOfDay];
      if (r) filter.startTime = { $gte: r[0], $lte: r[1] };
    }

    // Geospatial filter
    if (lat !== undefined && lng !== undefined) {
      const meters = Number(radiusKm) * 1000;
      filter.locationGeo = {
        $near: {
          $geometry: { type: "Point", coordinates: [Number(lng), Number(lat)] },
          $maxDistance: meters,
        },
      };
    }

    const events = await Event.find(filter)
      .limit(200)
      .populate("createdBy", "name avatarUrl");
    return res.json(events);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
