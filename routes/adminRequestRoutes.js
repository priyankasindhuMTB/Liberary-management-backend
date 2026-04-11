// import express from "express";
// import { approveRequest, requestAdmin } from "../Controllers/adminRequestController.js";
// import { verifyAdmin } from "../middleware/authMiddleware.js";
// import { isSuperAdmin } from "../middleware/roleMiddleware.js";


// const adminRequestRouter = express.Router();

// adminRequestRouter.post("/request", requestAdmin);
// adminRequestRouter.get("/", (req, res) => {
//   res.send("Admin Request API Working ✅");
// });

// adminRequestRouter.put("/approve/:id",verifyAdmin, isSuperAdmin, approveRequest);

// export default adminRequestRouter;


import express from "express";
import { approveRequest, requestAdmin } from "../Controllers/adminRequestController.js";
import { verifyAdmin } from "../middleware/authMiddleware.js";
import { isSuperAdmin } from "../middleware/roleMiddleware.js";
import AdminRequest from "../models/AdminRequest.js";

const adminRequestRouter = express.Router();

adminRequestRouter.post("/request", requestAdmin);

// Requires valid admin JWT (same as approve) so expired sessions do not still show a misleading list.
adminRequestRouter.get("/", verifyAdmin, async (req, res) => {
  try {
    const requests = await AdminRequest.find({ status: "pending" });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: "Error fetching requests" });
  }
});

adminRequestRouter.put("/approve/:id", verifyAdmin, isSuperAdmin, approveRequest);

export default adminRequestRouter;