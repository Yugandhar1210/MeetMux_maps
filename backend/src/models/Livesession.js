import mongoose from "mongoose";

const liveSessionSchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true, unique: true },
    users: [
      { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    ],
    liveLocations: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        lat: Number,
        lng: Number,
        updatedAt: { type: Date, default: Date.now },
      },
    ],
    route: {
      // Optional shared route between two users (encoded polyline or list of points)
      points: [
        {
          lat: Number,
          lng: Number,
        },
      ],
      provider: {
        type: String,
        enum: ["osrm", "mapbox", "google", "other"],
        default: "osrm",
      },
    },
    isActive: { type: Boolean, default: true },
    startedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    endedAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model("LiveSession", liveSessionSchema);
