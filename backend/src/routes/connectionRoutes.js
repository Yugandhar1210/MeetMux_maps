import express from "express";
import { protect } from "../utils/authMiddleware.js";
import {
  sendRequest,
  respondRequest,
  listConnections,
  listRequests,
} from "../controllers/connectionController.js";

const router = express.Router();

router.post("/request", protect, sendRequest);
router.put("/request/:id", protect, respondRequest);
router.get("/list", protect, listConnections);
router.get("/requests", protect, listRequests);

export default router;
