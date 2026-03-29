import express from 'express'
import { getSeats, insertSeat } from "../Controllers/seatController.js";

const seatRouter = express.Router();

// Corrected syntax:
seatRouter.get("/getSeats", getSeats); 
seatRouter.post("/createSeat",insertSeat)


export default seatRouter;