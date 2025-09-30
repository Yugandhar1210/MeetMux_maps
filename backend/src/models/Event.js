import mongoose from "mongoose";

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    type: { type: String, required: true, trim: true }, // e.g. "sports", "tech", "music"
    location: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
      address: { type: String, trim: true },
    },
    // GeoJSON for geospatial queries
    locationGeo: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [lng, lat]
        required: true,
      },
    },
    date: { type: Date, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String },
    visibility: {
      type: String,
      enum: ["public", "private"],
      default: "public",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    tags: [{ type: String, trim: true }],
  },
  { timestamps: true }
);

// Indexes for performance on heatmap/filters
eventSchema.index({ locationGeo: "2dsphere" });
eventSchema.index({ date: 1, type: 1 });

// Sync GeoJSON coordinates from location before save
eventSchema.pre("validate", function (next) {
  if (
    this.location &&
    typeof this.location.lat === "number" &&
    typeof this.location.lng === "number"
  ) {
    this.locationGeo = {
      type: "Point",
      coordinates: [this.location.lng, this.location.lat],
    };
  }
  next();
});

export default mongoose.model("Event", eventSchema);
