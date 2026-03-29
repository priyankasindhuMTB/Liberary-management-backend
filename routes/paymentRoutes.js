import express from "express";
import { addPayment, getUserPayment } from "../Controllers/paymentController.js"

const paymentRouter = express.Router();

paymentRouter.post("/pay", addPayment);
paymentRouter.get("/user-payment/:userId", getUserPayment);

export default paymentRouter;