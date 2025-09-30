import express from "express";
import {
  registerUser,
  loginUser,
  getProfile,
  updateProfile,
  setStatus,
  getNearbyUsers,
} from "../controllers/userController.js";
import { protect } from "../utils/authMiddleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/profile", protect, getProfile);
router.put("/profile", protect, updateProfile);
router.put("/status", protect, setStatus);
router.get("/nearby", protect, getNearbyUsers);

export default router;
