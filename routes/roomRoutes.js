import express from "express";
import { createRoom, getAllRooms, updateRoom, toggleRoomStatus } from "../controllers/roomController.js";
import { verifyAdmin } from "../middleware/authMiddleware.js";

const roomRouter = express.Router();

roomRouter.post("/create",          verifyAdmin, createRoom);
roomRouter.get("/all",              verifyAdmin, getAllRooms);
roomRouter.put("/:roomId",          verifyAdmin, updateRoom);
roomRouter.put("/status/:roomId",   verifyAdmin, toggleRoomStatus); // ← DELETE ki jagah
// ❌ router.delete("/:roomId", ...) — yeh bilkul nahi

export default roomRouter;