

import express from "express";
import {
  requestAdmin,
  getAllRequests,
  approveRequest,
  rejectRequest
} from "../Controllers/adminRequestController.js";

import { verifyAdmin } from "../middleware/authMiddleware.js";
import { isSuperAdmin } from "../middleware/roleMiddleware.js";

const adminRequestRouter = express.Router();

// ✅ Public: koi bhi request kar sakta hai
adminRequestRouter.post("/request", requestAdmin);

// ✅ FIX: GET pe sirf verifyAdmin — super_admin aur dev-bypass dono kaam karein
// isSuperAdmin guard sirf approve/reject pe lagao
adminRequestRouter.get("/", verifyAdmin, getAllRequests);

// ✅ Approve aur Reject: super admin ya dev bypass
adminRequestRouter.put("/approve/:id", verifyAdmin, isSuperAdminOrBypass, approveRequest);
adminRequestRouter.put("/reject/:id",  verifyAdmin, isSuperAdminOrBypass, rejectRequest);

export default adminRequestRouter;


// ─────────────────────────────────────────────────────────────
// Helper middleware: super_admin OR dev env bypass
// ─────────────────────────────────────────────────────────────
function isSuperAdminOrBypass(req, res, next) {
  if (
    req.admin.role === "super_admin" ||
    process.env.ALLOW_LIBRARY_ADMIN_APPROVE === "true"
  ) {
    return next();
  }
  return res.status(403).json({ message: "Access denied: Super Admin only" });
}