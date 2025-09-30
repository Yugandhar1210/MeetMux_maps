import express from "express";
import { protect } from "../utils/authMiddleware.js";
import {
  sendRequest,
  respondRequest,
  listRequests,
  listConnections,
} from "../controllers/connectionController.js";

const router = express.Router();

router.get("/", protect, listConnections);
router.get("/requests", protect, listRequests);
router.post("/request", protect, sendRequest);
router.post("/respond", protect, respondRequest);

export default router;
