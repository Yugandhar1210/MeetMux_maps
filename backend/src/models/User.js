import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    avatarUrl: { type: String, default: "" },
    bio: { type: String, maxlength: 280, default: "" },
    interests: [{ type: String, trim: true }],
    location: {
      lat: { type: Number },
      lng: { type: Number },
    },
    locationGeo: {
      type: {
        type: String,
        enum: ["Point"],
      },
      coordinates: {
        type: [Number], // [lng, lat]
      },
    },
    status: {
      type: String,
      enum: ["online", "offline", "busy", "away"],
      default: "offline",
    },
    locationVisibility: {
      type: String,
      enum: ["everyone", "connections", "private"],
      default: "everyone",
    },
    isOnline: { type: Boolean, default: false },
    lastSeen: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Sparse so docs without locationGeo are allowed
userSchema.index({ locationGeo: "2dsphere" }, { sparse: true });

userSchema.pre("save", async function (next) {
  // sync GeoJSON only if valid coords
  if (this.isModified("location") || this.isNew) {
    const hasLatLng =
      this.location &&
      Number.isFinite(this.location.lat) &&
      Number.isFinite(this.location.lng);

    if (hasLatLng) {
      this.locationGeo = {
        type: "Point",
        coordinates: [this.location.lng, this.location.lat],
      };
    } else {
      this.locationGeo = undefined;
    }
  }

  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    return next();
  } catch (err) {
    return next(err);
  }
});

userSchema.methods.matchPassword = function (entered) {
  return bcrypt.compare(entered, this.password);
};

export default mongoose.model("User", userSchema);
