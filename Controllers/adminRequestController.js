
import mongoose from "mongoose";
import AdminRequest from "../models/AdminRequest.js";
import { sendPushNotification } from "../config/firebase.js";
import Admin from "../models/Admin.js";
import Library from "../models/Library.js";
import bcrypt from "bcrypt";

// 📨 1. ADMIN REQUEST (Saves request with custom duration)
export const requestAdmin = async (req, res) => {
  try {
    const { name, email, password, libraryName, accessStartDate, accessEndDate, requestType } = req.body;

    if (!name || !email || !password || !libraryName || !accessStartDate || !accessEndDate) {
      return res.status(400).json({ message: "All fields including dates are required" });
    }

    // Date logical sanity check
    if (new Date(accessStartDate) >= new Date(accessEndDate)) {
      return res.status(400).json({ message: "End date must be after the start date" });
    }

    const typeOfRequest = requestType || "New_Registration";
    if (typeOfRequest === "New_Registration") {
      const existingAdmin = await Admin.findOne({ email });
      if (existingAdmin) {
        return res.status(400).json({ message: "Admin already exists with this email" });
      }
    }

    const pending = await AdminRequest.findOne({ email, status: "Pending", requestType: typeOfRequest });
    if (pending) {
      return res.status(400).json({ message: "A similar request is already pending verification" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Build cleaner baseline parameters directly matching your modified schema
    const requestData = {
      name,
      email,
      password: hashedPassword,
      libraryName,
      accessStartDate: new Date(accessStartDate),
      accessEndDate: new Date(accessEndDate),
      requestType: typeOfRequest,
      status: "Pending"
    };

    // Only look up structure records if processing operational extensions
    if (typeOfRequest === "Extension") {
      const activeAdmin = await Admin.findOne({ email });
      if (!activeAdmin) {
        return res.status(404).json({ message: "No active administrator account found to extend" });
      }
      requestData.adminId = activeAdmin._id;
      requestData.libraryId = activeAdmin.libraryId;
    }

    // This safely keeps everything aligned with your schema configuration constraints!
    const request = await AdminRequest.create(requestData);

    // ── FCM NOTIFICATION FOR SUPER ADMIN ──
    try {
      const superAdmin = await Admin.findOne({ role: "super_admin" });
      if (superAdmin && superAdmin.fcmToken) {
        const titleMsg = typeOfRequest === "Extension" ? "Library Renewal Request ⏳" : "New Library Request 🏢";
        await sendPushNotification(
          superAdmin.fcmToken,
          titleMsg,
          `${name} requested access from ${new Date(accessStartDate).toLocaleDateString()} to ${new Date(accessEndDate).toLocaleDateString()}.`
        );
      }
    } catch (fcmError) {
      console.error("❌ Failed to send request push notification:", fcmError.message);
    }

    res.json({ message: "Request dispatched successfully", request });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 📋 2. GET ALL PENDING REQUESTS (Super Admin view panel)
export const getAllRequests = async (req, res) => {
  try {
    const requests = await AdminRequest.find({ status: "Pending" });
    res.json(requests);
    
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ 3. APPROVE REQUEST (Calculates Dates perfectly)
export const approveRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { superAdminRemarks } = req.body;

    const request = await AdminRequest.findById(id);
    if (!request) return res.status(404).json({ message: "Request not found" });
    if (request.status === "Approved") return res.status(400).json({ message: "Already approved" });

    let library;
    let targetAdminId = request.adminId;

    if (request.requestType === "New_Registration") {
      library = await Library.create({
        name: request.libraryName || "Library Branch",
        ownerName: request.name,
        isApproved: true,
        status: "Active",
        accessStartDate: request.accessStartDate, // Direct assignment
        accessEndDate: request.accessEndDate     // Direct assignment
      });

      const newAdmin = await Admin.create({
        name: request.name,
        email: request.email,
        password: request.password,
        libraryId: library._id,
        role: "admin"
      });

      targetAdminId = newAdmin._id;

    } else if (request.requestType === "Extension") {
      const existingAdmin = await Admin.findOne({ email: request.email });
      if (!existingAdmin) return res.status(404).json({ message: "Administrator profile missing" });

      library = await Library.findById(existingAdmin.libraryId);
      if (!library) return res.status(404).json({ message: "Associated library profile not found" });

      // Override allocation records with user requested structural ranges
      library.isApproved = true;
      library.status = "Active";
      library.accessStartDate = request.accessStartDate;
      library.accessEndDate = request.accessEndDate;
      await library.save();
    }

    request.status = "Approved";
    request.libraryId = library._id;
    request.adminId = targetAdminId;
    request.superAdminRemarks = superAdminRemarks || "Approved by administration";
    await request.save();

    // ── FCM NOTIFICATION FOR TARGETED ADMIN ──
    try {
      const activeAdminProfile = await Admin.findById(targetAdminId);
      if (activeAdminProfile && activeAdminProfile.fcmToken) {
        await sendPushNotification(
          activeAdminProfile.fcmToken,
          "Access Request Approved! 🎉",
          `Your access window for "${library.name}" is now active until ${library.accessEndDate.toDateString()}.`
        );
      }
    } catch (fcmError) {
      console.error("❌ Failed to send approval push notification:", fcmError.message);
    }

    res.json({ message: "Approved successfully", accessUntil: library.accessEndDate.toDateString() });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ❌ 4. REJECT REQUEST 
export const rejectRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { superAdminRemarks } = req.body;

    const request = await AdminRequest.findById(id);
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    request.status = "Rejected";
    request.superAdminRemarks = superAdminRemarks || "Does not comply with platform guidelines.";
    await request.save();

    // ── FCM NOTIFICATION FOR REJECTION ──
    try {
      const activeAdminProfile = await Admin.findOne({ email: request.email });
      if (activeAdminProfile && activeAdminProfile.fcmToken) {
        await sendPushNotification(
          activeAdminProfile.fcmToken,
          "Request Update ❌",
          `Your operational adjustments request was denied. Remarks: ${request.superAdminRemarks}`
        );
      }
    } catch (fcmError) {
      console.error("❌ Failed to send rejection push notification:", fcmError.message);
    }

    res.json({ message: "Request rejected successfully", request });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};