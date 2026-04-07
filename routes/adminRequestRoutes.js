import express from "express";
import { approveRequest, requestAdmin } from "../Controllers/adminRequestController.js";
import { verifyAdmin } from "../middleware/authMiddleware.js";
import { isSuperAdmin } from "../middleware/roleMiddleware.js";


const adminRequestRouter = express.Router();

adminRequestRouter.post("/request", requestAdmin);

adminRequestRouter.put("/approve/:id",verifyAdmin, isSuperAdmin, approveRequest);

export default adminRequestRouter;