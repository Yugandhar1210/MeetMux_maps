import User from "../models/User.js";
import LiveSession from "../models/livesession.js";

export default function handleLocationSocket(io, socket) {
  // When client authenticates, they should send { userId }
  socket.on("auth", async ({ userId }) => {
    socket.data.userId = userId;
    socket.join(`user:${userId}`);
    await User.findByIdAndUpdate(userId, {
      isOnline: true,
      status: "online",
      lastSeen: new Date(),
    });
    io.emit("presence:update", { userId, isOnline: true });
  });

  // Location updates (privacy-aware broadcast)
  socket.on("update-location", async ({ lat, lng }) => {
    const userId = socket.data.userId;
    if (!userId) return;
    await User.findByIdAndUpdate(userId, {
      location: { lat, lng },
      lastSeen: new Date(),
    });

    const user = await User.findById(userId).select("locationVisibility");
    const payload = { userId, lat, lng, ts: Date.now() };

    // For now, broadcast to everyone unless private
    if (user.locationVisibility !== "private") {
      io.emit("location-update", payload);
    } else {
      // Only to self
      io.to(`user:${userId}`).emit("location-update", payload);
    }
  });

  // Live session channels
  socket.on("live:start", async ({ sessionId, users }) => {
    socket.join(`live:${sessionId}`);
    await LiveSession.findOneAndUpdate(
      { sessionId },
      { sessionId, users, isActive: true, startedBy: socket.data.userId },
      { upsert: true, new: true }
    );
    io.to(`live:${sessionId}`).emit("live:started", { sessionId, users });
  });

  socket.on("live:update", async ({ sessionId, lat, lng }) => {
    const userId = socket.data.userId;
    if (!userId) return;
    await LiveSession.findOneAndUpdate(
      { sessionId, isActive: true, users: { $in: [userId] } },
      { $pull: { liveLocations: { userId } } }
    );
    await LiveSession.findOneAndUpdate(
      { sessionId, isActive: true },
      { $push: { liveLocations: { userId, lat, lng, updatedAt: new Date() } } }
    );
    io.to(`live:${sessionId}`).emit("live:location", {
      userId,
      lat,
      lng,
      sessionId,
    });
  });

  socket.on("live:end", async ({ sessionId }) => {
    await LiveSession.findOneAndUpdate(
      { sessionId },
      { isActive: false, endedAt: new Date() }
    );
    io.to(`live:${sessionId}`).emit("live:ended", { sessionId });
  });

  socket.on("disconnect", async () => {
    const userId = socket.data.userId;
    if (userId) {
      await User.findByIdAndUpdate(userId, {
        isOnline: false,
        status: "offline",
        lastSeen: new Date(),
      });
      io.emit("presence:update", { userId, isOnline: false });
    }
  });
}
