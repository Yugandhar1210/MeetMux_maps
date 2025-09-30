import jwt from "jsonwebtoken";
import User from "../models/User.js";
import bcrypt from "bcryptjs";

const signToken = (user) =>
  jwt.sign({ id: user._id }, process.env.JWT_SECRET || "dev_secret", {
    expiresIn: "7d",
  });

export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!email || !password || !name)
      return res.status(400).json({ message: "Missing fields" });
    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists)
      return res.status(400).json({ message: "Email already in use" });
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
    });
    const token = signToken(user);
    res.status(201).json({
      token,
      user: { _id: user._id, name: user.name, email: user.email },
    });
  } catch (e) {
    console.error("registerUser error:", e.message);
    res.status(500).json({ message: "Registration error" });
  }
};

export const loginUser = async (req, res) => {
  try {
    const email = (req.body.email || "").toLowerCase();
    const password = req.body.password || "";
    if (!email || !password)
      return res.status(400).json({ message: "Missing credentials" });

    // Important: do not use .lean() here
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(400).json({ message: "Invalid credentials" });

    const token = signToken(user);
    res.json({
      token,
      user: { _id: user._id, name: user.name, email: user.email },
    });
  } catch (e) {
    console.error("loginUser error:", e.message);
    res.status(500).json({ message: "Login error" });
  }
};

export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    return res.json(user);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const updates = { ...req.body };
    if (updates.location) {
      const lat = Number(updates.location.lat);
      const lng = Number(updates.location.lng);
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        updates.location = { lat, lng };
        updates.locationGeo = { type: "Point", coordinates: [lng, lat] };
      } else {
        updates.locationGeo = undefined;
      }
    }
    const user = await User.findByIdAndUpdate(req.user.id, updates, {
      new: true,
      runValidators: true,
    })
      .select("-password")
      .exec();
    res.json(user);
  } catch (e) {
    res.status(500).json({ message: e.message || "Update failed" });
  }
};

export const setStatus = async (req, res) => {
  try {
    const { status } = req.body; // online | offline | busy | away
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { status, isOnline: status === "online", lastSeen: new Date() },
      { new: true }
    ).select("-password");
    return res.json(user);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const getNearbyUsers = async (req, res) => {
  try {
    const { lat, lng, radiusKm = 5, interestsOnly = false } = req.query;
    if (lat === undefined || lng === undefined) {
      return res.status(400).json({ message: "lat and lng are required" });
    }

    const meters = Number(radiusKm) * 1000;
    const filters = {
      locationGeo: {
        $near: {
          $geometry: { type: "Point", coordinates: [Number(lng), Number(lat)] },
          $maxDistance: meters,
        },
      },
      // Respect visibility: everyone OR connections handled in future with aggregation
      locationVisibility: { $ne: "private" },
      _id: { $ne: req.user._id },
    };

    if (interestsOnly) {
      const me = await User.findById(req.user._id);
      if (me?.interests?.length) {
        filters.interests = { $in: me.interests };
      }
    }

    const users = await User.find(filters)
      .select("name avatarUrl interests location status isOnline")
      .limit(100);
    return res.json(users);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
