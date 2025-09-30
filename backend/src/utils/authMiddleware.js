import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protect = async (req, res, next) => {
  try {
    let token =
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
        ? req.headers.authorization.split(" ")[1]
        : req.headers.Authorization &&
          String(req.headers.Authorization).startsWith("Bearer ")
        ? String(req.headers.Authorization).split(" ")[1]
        : req.headers["x-access-token"] || req.query.token || null;

    if (!token)
      return res.status(401).json({ message: "Not authorized, no token" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "dev_secret");
    const user = await User.findById(decoded.id).select("-password");
    if (!user)
      return res.status(401).json({ message: "Not authorized, user missing" });

    req.user = { id: user._id.toString(), email: user.email };
    next();
  } catch (e) {
    return res.status(401).json({ message: "Not authorized" });
  }
};

// Admin middleware
const admin = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    res.status(401).json({ message: "Not authorized as admin" });
  }
};

export { admin };
