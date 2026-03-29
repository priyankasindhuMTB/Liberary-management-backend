import express from "express";
import { createShift, getShifts } from "../Controllers/shiftController.js";


const shiftRouter = express.Router();

shiftRouter.get("/get-shifts", getShifts);
shiftRouter.post("/create-shifts", createShift);

export default shiftRouter; 