import express from 'express'
import { getSeats, insertSeat, updateSeat } from "../Controllers/seatController.js";
import {verifyAdmin} from "../middleware/authMiddleware.js"
import { verifySubscriptionActive } from '../middleware/subscriptionCheck.js';
const seatRouter = express.Router();

// Corrected syntax:
seatRouter.get("/getSeats",verifyAdmin, getSeats); 
seatRouter.post("/createSeat", verifyAdmin, verifySubscriptionActive,insertSeat)
seatRouter.put("/updateSeat/:seatId", verifyAdmin,verifySubscriptionActive, updateSeat); 


export default seatRouter;