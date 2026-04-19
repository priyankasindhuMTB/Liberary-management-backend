import express from 'express'
import { getSeats, insertSeat, updateSeat } from "../Controllers/seatController.js";
import {verifyAdmin} from "../middleware/authMiddleware.js"

const seatRouter = express.Router();

// Corrected syntax:
seatRouter.get("/getSeats",verifyAdmin, getSeats); 
seatRouter.post("/createSeat", verifyAdmin ,insertSeat)
seatRouter.put("/updateSeat/:seatId", verifyAdmin, updateSeat); 


export default seatRouter;