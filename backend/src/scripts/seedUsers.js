import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/User.js";

async function run() {
  const uri =
    process.env.MONGODB_URI ||
    process.env.MONGO_URI ||
    "mongodb://localhost:27017/meetmux";
  await mongoose.connect(uri);
  console.log("Connected to DB");

  const users = [
    {
      name: "Arjun Rao",
      email: "arjun@example.com",
      password: "Password123!",
      avatarUrl: "https://i.pravatar.cc/150?img=1",
      bio: "Tech enthusiast and runner.",
      interests: ["Tech", "Music"],
      location: { lat: 17.6868, lng: 83.2185 }, //17.656707, 83.213461
      status: "online",
      isOnline: true,
    },
    {
      name: "Priya Singh",
      email: "priya@example.com",
      password: "Password123!",
      avatarUrl: "https://i.pravatar.cc/150?img=2",
      bio: "Foodie and travel lover.",
      interests: ["Food", "Travel"],
      location: { lat: 17.6882, lng: 83.219 },
      status: "online",
      isOnline: true,
    },
    {
      name: "Vikram Desai",
      email: "vikram@example.com",
      password: "Password123!",
      avatarUrl: "https://i.pravatar.cc/150?img=3",
      bio: "Basketball and startups.",
      interests: ["Sports", "Tech"],
      location: { lat: 17.6855, lng: 83.2202 },
      status: "offline",
      isOnline: false,
    },
    {
      name: "Aisha Khan",
      email: "aisha@example.com",
      password: "Password123!",
      avatarUrl: "https://i.pravatar.cc/150?img=4",
      bio: "Live music and coffee.",
      interests: ["Music", "Food"],
      location: { lat: 17.6879, lng: 83.2174 },
      status: "online",
      isOnline: true,
    },
    {
      name: "Rohan Mehta",
      email: "rohan@example.com",
      password: "Password123!",
      avatarUrl: "https://i.pravatar.cc/150?img=5",
      bio: "Hiking and photography.",
      interests: ["Travel", "Sports"],
      location: { lat: 17.6891, lng: 83.218 },
      status: "away",
      isOnline: false,
    },
  ];

  const emails = users.map((u) => u.email);
  await User.deleteMany({ email: { $in: emails } });

  const hashed = await Promise.all(
    users.map(async (u) => {
      const pass = await bcrypt.hash(u.password, 10);
      const hasLatLng =
        u.location &&
        Number.isFinite(u.location.lat) &&
        Number.isFinite(u.location.lng);
      return {
        ...u,
        email: u.email.toLowerCase(),
        password: pass,
        locationGeo: hasLatLng
          ? { type: "Point", coordinates: [u.location.lng, u.location.lat] }
          : undefined,
      };
    })
  );

  await User.insertMany(hashed);
  console.log("Seeded users:", emails);
  await mongoose.disconnect();
  console.log("Done.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
