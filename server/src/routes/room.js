import express from "express";
import {
  createRoom,
  getRooms,
  getRoomById,
  validateRoomAccess,
  deleteRoom,
} from "../controllers/roomController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.post("/", protect, createRoom);
router.get("/", protect, getRooms);
router.get("/:roomId", protect, getRoomById);
router.post("/:roomId/validate", protect, validateRoomAccess);
router.delete("/:roomId", protect, deleteRoom);

export default router;
