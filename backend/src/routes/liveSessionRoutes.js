import express from "express";
import { protect } from "../utils/authMiddleware.js";
import {
  startSession,
  updateLocation,
  endSession,
  getSession,
} from "../controllers/liveSessionController.js";

const router = express.Router();

router.post("/start", protect, startSession);
router.put("/:sessionId/location", protect, updateLocation);
router.post("/:sessionId/end", protect, endSession);
router.get("/:sessionId", protect, getSession);

export default router;
