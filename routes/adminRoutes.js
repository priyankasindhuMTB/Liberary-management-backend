import express from "express";
import {
  getApproveCapability,
  getHasSuperAdmin,
  loginAdmin,
  setupFirstSuperAdmin,
} from "../Controllers/adminController.js";
import { verifyAdmin } from "../middleware/authMiddleware.js";

const adminRouter = express.Router();

adminRouter.get("/has-super-admin", getHasSuperAdmin);
adminRouter.post("/setup-first-super", setupFirstSuperAdmin);
adminRouter.post("/login", loginAdmin);
adminRouter.get("/approve-capability", verifyAdmin, getApproveCapability);

export default adminRouter;