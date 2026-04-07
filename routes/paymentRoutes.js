import express from "express";
import { addPayment, getUserPayment } from "../Controllers/paymentController.js"
import { verifyAdmin } from "../middleware/authMiddleware.js";

const paymentRouter = express.Router();

paymentRouter.post("/pay", verifyAdmin,addPayment);
paymentRouter.get("/user-payment/:userId", verifyAdmin, getUserPayment);

export default paymentRouter;