import express from "express";
import { protect } from "../utils/authMiddleware.js";
import {
  listEvents,
  createEvent,
  joinEvent,
  leaveEvent,
  myEvents,
} from "../controllers/eventController.js";

const router = express.Router();

// Public
router.get("/", listEvents); // public list
router.get("/mine", protect, myEvents); // created/joined

// Protected
router.post("/", protect, createEvent); // create
router.post("/:id/join", protect, joinEvent);
router.post("/:id/leave", protect, leaveEvent);

export default router;
