import express from "express";
import { protectRoute } from "../middleware/protectRoute.js";
import { deleteNotifications, getNotifications } from "../controllers/notificationController.js";

const router = express.Router();

router.get("/notification", protectRoute, getNotifications);
router.delete("/notification", protectRoute, deleteNotifications);

export default router;