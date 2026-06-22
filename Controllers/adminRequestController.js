
import mongoose from "mongoose";
import AdminRequest from "../models/AdminRequest.js";
import Admin from "../models/Admin.js";
import Library from "../models/Library.js";
import bcrypt from "bcrypt";
import { sendPushNotification } from "../utils/Firebase/notification.js";

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
          `${name} requested access from ${new Date(accessStartDate).toLocaleDateString()} to ${new Date(accessEndDate).toLocaleDateString()}.`,
          {
            type: "new_request",
            url: "/super-admin",
          }
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

// 🏢 3. APPROVE REQUEST
export const approveRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { superAdminRemarks, durationMonths } = req.body; // 👈 Frontend se durationMonths read kiya

    const request = await AdminRequest.findById(id);
    if (!request) return res.status(404).json({ message: "Request not found" });
    if (request.status === "Approved") return res.status(400).json({ message: "Already approved" });

    // 📅 DYNAMIC TIMELINE DATE CALCULATION LOGIC
    const startDate = new Date(); // Aaj ki date
    const endDate = new Date();

    // Dropdown ki value padhega, agar kuch nahi mila toh default 3 mahine set karega
    const monthsToAdd = durationMonths ? parseInt(durationMonths) : 3;
    endDate.setMonth(endDate.getMonth() + monthsToAdd);

    let library;
    let targetAdminId = request.adminId;

    if (request.requestType === "New_Registration") {
      library = await Library.create({
        name: request.libraryName || "Library Branch",
        ownerName: request.name,
        isApproved: true,
        status: "Active",
        accessStartDate: startDate, // Updated to dynamic calculated date
        accessEndDate: endDate       // Updated to dynamic calculated date
      });

      const newAdmin = await Admin.create({
        name: request.name,
        email: request.email,
        password: request.password,
        libraryId: library._id,
        role: "admin",
        status: "Active",
        accessStartDate: startDate,
        accessEndDate: endDate
      });

      console.log("NEW ADMIN CREATED: ", newAdmin);
      targetAdminId = newAdmin._id;

    } else if (request.requestType === "Extension") {
      const existingAdmin = await Admin.findOne({ email: request.email });
      if (!existingAdmin) return res.status(404).json({ message: "Administrator profile missing" });

      library = await Library.findById(existingAdmin.libraryId);
      if (!library) return res.status(404).json({ message: "Associated library profile not found" });

      // Override baseline profiles with current extended parameters
      library.isApproved = true;
      library.status = "Active";
      library.accessStartDate = startDate;
      library.accessEndDate = endDate;
      await library.save();

      // Sync data windows to admin profile collection schema
      existingAdmin.status = "Active";
      existingAdmin.accessStartDate = startDate;
      existingAdmin.accessEndDate = endDate;
      await existingAdmin.save();
    }

    request.status = "Approved";
    request.libraryId = library._id;
    request.adminId = targetAdminId;
    request.accessStartDate = startDate; // Sync back to requests tracker
    request.accessEndDate = endDate;     // Sync back to requests tracker
    request.superAdminRemarks = superAdminRemarks || "Approved by administration";
    await request.save();

    // ── FCM NOTIFICATION FOR TARGETED ADMIN ──
    try {
      const activeAdminProfile = await Admin.findById(targetAdminId);
      if (activeAdminProfile && activeAdminProfile.fcmToken) {
        await sendPushNotification(

          activeAdminProfile.fcmToken,
          "Access Request Approved! 🎉",
          `Aapki library "${library.name}" ka access window ab ${endDate.toDateString()} tak active kar diya gaya hai.`,
          {
            type: "approval",
            url: "/login"
          }
        )
      }else {
    // Naye registration ke liye yahan aap Nodemailer ka Email trigger hook kar sakte hain
    console.log("ℹ️ Push notification skipped: New registration has no active FCM device token yet.");
  }
    } catch (fcmError) {
      console.error("❌ Failed to send approval push notification:", fcmError.message);
    }

    res.json({ message: "Approved successfully", accessUntil: endDate.toDateString() });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ❌ 4. REJECT REQUEST 
export const rejectRequest = async (req, res) => {
    console.log("🚨 REJECT API CALLED");
  console.log("REQUEST ID:", req.params.id);
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
      console.log("ACTIVE ADMIN PROFILE:", activeAdminProfile);
      if (activeAdminProfile && activeAdminProfile.fcmToken) {
        await sendPushNotification(
          activeAdminProfile.fcmToken,
          "Request Rejected ❌",
          `Your request was rejected. Remarks: ${request.superAdminRemarks}`,
          {
            type: "rejected",
            url: "/request"
          }
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