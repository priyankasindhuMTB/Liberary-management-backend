import express from "express";
import { createShift, getShifts } from "../Controllers/shiftController.js";
import { verifyAdmin } from "../middleware/authMiddleware.js";


const shiftRouter = express.Router();

shiftRouter.get("/get-shifts",verifyAdmin, getShifts);
shiftRouter.post("/create-shifts",verifyAdmin, createShift);

export default shiftRouter; 