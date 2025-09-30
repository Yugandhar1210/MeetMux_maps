import express from "express";
import http from "http";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { Server } from "socket.io";
import userRoutes from "./routes/userRoutes.js";
import eventRoutes from "./routes/eventRoutes.js";
import connectionRoutes from "./routes/connectionRoutes.js";
import handleLocationSocket from "./sockets/locationSocket.js";
import liveSessionRoutes from "./routes/liveSessionRoutes.js";

dotenv.config();
const app = express();
const server = http.createServer(app);

app.use(express.json());

const allowedOrigins = (
  process.env.CORS_ORIGINS ||
  "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000"
)
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const corsOptions = {
  origin(origin, cb) {
    // Allow non-browser clients and same-origin
    if (!origin) return cb(null, true);
    // Simple exact match or startsWith to allow port variations if needed
    const ok = allowedOrigins.some(
      (allowed) => origin === allowed || origin.startsWith(allowed)
    );
    if (ok) return cb(null, true);
    console.warn("CORS blocked origin:", origin);
    return cb(null, false);
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions)); // preflight

// Routes
app.use("/api/users", userRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/live", liveSessionRoutes);
app.use("/api/connections", connectionRoutes);

app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

// MongoDB Connection
mongoose
  .connect(
    process.env.MONGO_URI ||
      process.env.MONGODB_URI ||
      "mongodb://localhost:27017/meetmux"
  )
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error(err));

// Socket.IO setup
const io = new Server(server, { cors: { origin: "*" } });
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);
  handleLocationSocket(io, socket);
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
