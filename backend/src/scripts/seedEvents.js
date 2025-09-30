import "dotenv/config";
import mongoose from "mongoose";
import Event from "../models/Event.js";
import User from "../models/User.js";

async function run() {
  const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/meetmux";
  await mongoose.connect(uri);
  console.log("DB connected");

  const users = await User.find({
    email: {
      $in: [
        "arjun@example.com",
        "priya@example.com",
        "vikram@example.com",
        "aisha@example.com",
        "rohan@example.com",
      ],
    },
  }).select("_id name location");
  if (!users.length) throw new Error("Seed users first.");

  const pick = (i) => users[i % users.length];

  const base = new Date();
  base.setMinutes(0, 0, 0);
  const mkTime = (hrsFromNow, durHrs = 2) => {
    const s = new Date(base.getTime() + hrsFromNow * 3600 * 1000);
    const e = new Date(s.getTime() + durHrs * 3600 * 1000);
    return [s, e];
  };

  const data = [
    { name: "Morning Run", activityType: "Sports", i: 0, d: 6 },
    { name: "Cafe Hangout", activityType: "Food", i: 1, d: 10 },
    { name: "Tech Talk Meetup", activityType: "Tech", i: 2, d: 18 },
    { name: "Sunset Music Jam", activityType: "Music", i: 3, d: 19 },
    { name: "Weekend Hike", activityType: "Travel", i: 4, d: 32 },
    { name: "Basketball 3v3", activityType: "Sports", i: 2, d: 26 },
  ];

  await Event.deleteMany({ name: { $in: data.map((d) => d.name) } });

  const docs = data.map((ev, idx) => {
    const u = pick(ev.i);
    const lat = (u.location?.lat ?? 17.6868) + idx * 0.001;
    const lng = (u.location?.lng ?? 83.2185) + idx * 0.001;
    const [startsAt, endsAt] = mkTime(ev.d);
    return {
      name: ev.name,
      description: `${ev.activityType} session near you.`,
      activityType: ev.activityType,
      location: { lat, lng },
      locationGeo: { type: "Point", coordinates: [lng, lat] }, // important for $geoNear
      startsAt,
      endsAt,
      createdBy: u._id,
      participants: [u._id],
      capacity: 20,
      visibility: "public",
    };
  });

  await Event.insertMany(docs);
  console.log(
    "Seeded events:",
    docs.map((d) => d.name)
  );
  await mongoose.disconnect();
  console.log("Done.");
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
