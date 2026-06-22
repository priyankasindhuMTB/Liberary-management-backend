
import express from "express";
import {loginAdmin,getAdminProfile,hasSuperAdmin,approveCapability,setupFirstSuper,getAllAdmins,createAdminDirectly,updateAdminDirectly,toggleAdminStatus,updateFcmToken} from "../controllers/adminController.js"; // Verify correct path case mapping strings matches
import { verifyAdmin } from "../middleware/authMiddleware.js";

const adminRouter = express.Router();

// 🔓 Public Authentication & Setup Boundaries
adminRouter.post("/login", loginAdmin);
adminRouter.get("/has-super-admin", hasSuperAdmin);
adminRouter.post("/setup-first-super", setupFirstSuper);

// 🔐 Protected Workspace Sub-Routes
adminRouter.get("/all", verifyAdmin, getAllAdmins);
adminRouter.get("/profile", verifyAdmin, getAdminProfile);
adminRouter.get("/approve-capability", verifyAdmin, approveCapability);

// 🛠️ Direct Account Provisioning, Updates & Status Actions
adminRouter.post("/create-direct", verifyAdmin, createAdminDirectly);
adminRouter.put("/update-direct/:id", verifyAdmin, updateAdminDirectly);
adminRouter.put("/toggle-status/:id", verifyAdmin, toggleAdminStatus);

// 📱 Cloud Messaging Handlers
adminRouter.put("/update-fcm-token", verifyAdmin, updateFcmToken);

export default adminRouter;