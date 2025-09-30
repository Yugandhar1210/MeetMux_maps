import express from "express";
import { protect } from "../utils/authMiddleware.js";
import {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  joinEvent,
  leaveEvent,
  getFeed,
  likeEvent,
  commentOnEvent,
} from "../controllers/eventController.js";

const router = express.Router();

// Public
router.get("/", getEvents);
router.get("/feed", protect, getFeed);
router.get("/:id", getEventById);

// Protected
router.post("/", protect, createEvent);
router.put("/:id", protect, updateEvent);
router.delete("/:id", protect, deleteEvent);
router.post("/:id/join", protect, joinEvent);
router.post("/:id/leave", protect, leaveEvent);
router.post("/:id/like", protect, likeEvent);
router.post("/:id/comment", protect, commentOnEvent);

export default router;
