
// import express from "express";
// import { loginAdmin, getAdminProfile } from "../controllers/adminController.js";
// import { verifyAdmin } from "../middleware/authMiddleware.js";

// const adminRouter = express.Router();

// adminRouter.post("/login", loginAdmin);
// adminRouter.get("/profile", verifyAdmin, getAdminProfile);

// export default adminRouter;


import express from "express";
import {
  loginAdmin,
  getAdminProfile,
  hasSuperAdmin,
  approveCapability,
  setupFirstSuper,
  getAllAdmins
} from "../Controllers/adminController.js";
import { verifyAdmin } from "../middleware/authMiddleware.js";

const adminRouter = express.Router();

// Public routes (no auth needed)
adminRouter.post("/login", loginAdmin);
adminRouter.get("/all", verifyAdmin, getAllAdmins);
adminRouter.get("/has-super-admin", hasSuperAdmin);         // ✅ SuperAdmin.jsx needs this
adminRouter.post("/setup-first-super", setupFirstSuper);    // ✅ SetupFirstSuper.jsx needs this

// Protected routes
adminRouter.get("/profile", verifyAdmin, getAdminProfile);
adminRouter.get("/approve-capability", verifyAdmin, approveCapability); // ✅ SuperAdmin.jsx needs this

export default adminRouter;