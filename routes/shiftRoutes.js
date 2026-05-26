import express from "express";
import { createShift, getShifts } from "../Controllers/shiftController.js";
import { verifyAdmin } from "../middleware/authMiddleware.js";
import { verifySubscriptionActive } from "../middleware/subscriptionCheck.js";


const shiftRouter = express.Router();

shiftRouter.get("/get-shifts",verifyAdmin,verifySubscriptionActive, getShifts);
shiftRouter.post("/create-shifts",verifyAdmin,verifySubscriptionActive,  createShift);

export default shiftRouter; 