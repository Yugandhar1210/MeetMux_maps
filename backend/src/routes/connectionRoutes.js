import express from "express";
import { protect } from "../utils/authMiddleware.js";
import { listConnections } from "../controllers/connectionController.js";

const router = express.Router();

router.get("/", protect, listConnections);

export default router;
