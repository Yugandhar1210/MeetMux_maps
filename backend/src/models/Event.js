import mongoose from "mongoose";

const eventSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    activityType: { type: String, required: true, trim: true }, // e.g., Music, Food, Sports
    location: {
      lat: Number,
      lng: Number,
    },
    locationGeo: {
      type: { type: String, enum: ["Point"] },
      coordinates: { type: [Number] }, // [lng, lat]
    },
    startsAt: { type: Date, required: true },
    endsAt: { type: Date, required: true },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    capacity: { type: Number, default: 50 },
    visibility: { type: String, enum: ["public"], default: "public" },
  },
  { timestamps: true }
);

eventSchema.index({ locationGeo: "2dsphere" }, { sparse: true });

eventSchema.pre("save", function (next) {
  const lat = Number(this.location?.lat);
  const lng = Number(this.location?.lng);
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    this.locationGeo = { type: "Point", coordinates: [lng, lat] };
  } else {
    this.locationGeo = undefined;
  }
  next();
});

export default mongoose.model("Event", eventSchema);
