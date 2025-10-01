import "dotenv/config";
import mongoose from "mongoose";
import User from "../models/User.js";
import Connection from "../models/Connection.js"; // Adjust import if your model path/name differs

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min; // inclusive
}

function randomPastDate(days = 60) {
  const now = Date.now();
  const delta = randInt(0, days * 24 * 60 * 60 * 1000);
  return new Date(now - delta);
}

function makeKey(a, b) {
  return a < b ? `${a}_${b}` : `${b}_${a}`;
}

async function run() {
  const uri =
    process.env.MONGODB_URI ||
    process.env.MONGO_URI ||
    "mongodb://127.0.0.1:27017/meetmux";
  await mongoose.connect(uri);
  console.log("✅ Connected to MongoDB");

  const users = await User.find({}).select("_id name");
  if (users.length < 2) {
    throw new Error(
      "Need at least 2 users to seed connections. Seed users first."
    );
  }

  // Clear existing connections
  await Connection.deleteMany({});
  console.log("🧹 Cleared existing connections");

  const ids = users.map((u) => u._id.toString());

  // Targets: strictly >5 and <20 => 6..19
  const target = {};
  const degree = {};
  ids.forEach((id) => {
    target[id] = randInt(6, 19);
    degree[id] = 0;
  });

  const edgeSet = new Set();
  const edges = [];

  // Helper to add an undirected edge if possible
  function addEdge(u, v) {
    if (!u || !v || u === v) return false;
    const key = makeKey(u, v);
    if (edgeSet.has(key)) return false;
    if (degree[u] >= 19 || degree[v] >= 19) return false;

    edgeSet.add(key);
    edges.push([u, v]);
    degree[u] += 1;
    degree[v] += 1;
    return true;
  }

  // First pass: greedy pairing to approach targets
  const maxAttempts = ids.length * 800;
  let attempts = 0;
  while (attempts < maxAttempts) {
    const needers = ids.filter((id) => degree[id] < target[id]);
    if (needers.length === 0) break;

    const u = needers[randInt(0, needers.length - 1)];
    // Prefer partners who also still need connections and not already connected
    const candidates = needers
      .filter((v) => v !== u && !edgeSet.has(makeKey(u, v)) && degree[v] < 19)
      // Sort by remaining need (desc) to balance graph
      .sort((a, b) => target[b] - degree[b] - (target[a] - degree[a]));

    let added = false;
    for (const v of candidates) {
      if (addEdge(u, v)) {
        added = true;
        break;
      }
    }
    if (!added) attempts += 1;
  }

  // Second pass: ensure minimum 6 connections for everyone
  for (const u of ids) {
    while (degree[u] < 6) {
      // Pick best candidate with headroom and not already connected
      const candidates = ids
        .filter((v) => v !== u && degree[v] < 19 && !edgeSet.has(makeKey(u, v)))
        .sort((a, b) => 19 - degree[b] - (19 - degree[a])); // more headroom first
      if (candidates.length === 0) break;
      addEdge(u, candidates[0]);
    }
  }

  // Build connection docs (single doc per undirected pair)
  // Use requester/receiver as required by your schema
  const docs = edges.map(([a, b]) => {
    // Randomize direction a bit
    const flip = Math.random() < 0.5;
    const requester = flip ? a : b;
    const receiver = flip ? b : a;

    return {
      requester: new mongoose.Types.ObjectId(requester),
      receiver: new mongoose.Types.ObjectId(receiver),
      status: "accepted",
      createdAt: randomPastDate(),
      updatedAt: new Date(),
    };
  });

  if (docs.length === 0) {
    console.warn("No connections generated. Check user count/targets.");
  } else {
    await Connection.insertMany(docs);
  }

  // Stats
  const degValues = Object.values(degree);
  const minDeg = Math.min(...degValues);
  const maxDeg = Math.max(...degValues);
  const avgDeg =
    degValues.reduce((s, v) => s + v, 0) / Math.max(1, degValues.length);

  console.log(`🔗 Inserted ${docs.length} connections (undirected pairs)`);
  console.log(
    `📊 Degree stats -> min: ${minDeg}, max: ${maxDeg}, avg: ${avgDeg.toFixed(
      2
    )}`
  );
  const below6 = ids.filter((id) => degree[id] < 6).length;
  const above19 = ids.filter((id) => degree[id] > 19).length;
  console.log(
    `✅ Users with >=6 connections: ${ids.length - below6}/${ids.length}`
  );
  console.log(
    `✅ Users with <=19 connections: ${ids.length - above19}/${ids.length}`
  );

  await mongoose.disconnect();
  console.log("🔐 Disconnected");
}

run().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
