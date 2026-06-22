import Admin from "../models/Admin.js";
import Library from "../models/Library.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
// ✅ Import the new clean firebase notification helper
import { sendPushNotification } from "../utils/Firebase/notification.js"; 

// 📋 GET ALL REGISTERED ADMINS
export const getAllAdmins = async (req, res) => {
  try {
    const admins = await Admin.find()
      .select("-password")
      .populate("libraryId", "name accessStartDate accessEndDate status"); 
    res.json(admins);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🏢 DIRECT ADMIN CREATION (By Super Admin or Library Admin)
export const createAdminDirectly = async (req, res) => {
  try {
    const { name, email, password, libraryName, accessStartDate, accessEndDate } = req.body;
    
    const creatorRole = req.admin?.role; 
    const creatorLibraryId = req.admin?.libraryId || req.admin?.id;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password fields are required" });
    }

    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ message: "An administrator account already exists with this email address" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    let targetLibraryId;

    if (creatorRole === "super_admin") {
      if (!libraryName) {
        return res.status(400).json({ message: "Library name is required when created by Super Admin" });
      }

      let library = await Library.findOne({ name: libraryName });
      
      if (!library) {
        library = await Library.create({
          name: libraryName,
          ownerName: name,
          isApproved: true,
          status: "Active",
          accessStartDate: accessStartDate ? new Date(accessStartDate) : new Date(), 
          accessEndDate: accessEndDate ? new Date(accessEndDate) : new Date(new Date().setMonth(new Date().getMonth() + 3)) 
        });
      } else {
        library.accessStartDate = accessStartDate ? new Date(accessStartDate) : library.accessStartDate;
        library.accessEndDate = accessEndDate ? new Date(accessEndDate) : library.accessEndDate;
        await library.save();
      }
      targetLibraryId = library._id;
      currentLibrary = library.name;
    } else {
      if (!creatorLibraryId) {
        return res.status(400).json({ message: "Your current account is not linked to any active library infrastructure branch" });
      }
      targetLibraryId = creatorLibraryId;
    }

    const newAdmin = await Admin.create({
      name,
      email,
      password: hashedPassword,
      libraryId: targetLibraryId,
      accessStartDate: accessStartDate ? new Date(accessStartDate) : new Date(), 
      accessEndDate: accessEndDate ? new Date(accessEndDate) : new Date(new Date().setMonth(new Date().getMonth() + 3)),   
      role: "admin",
      status: "Active",
      fcmToken: adminFcmToken || null
    });

    // ── FCM NOTIFICATION FOR DIRECT CREATION ──
    try {
      // 1. Send confirmation to the creator (Super Admin)
      if (req.admin && req.admin.fcmToken) {
         await sendPushNotification(
            req.admin.fcmToken,
            "Admin Account Provisioned 🚀",
            `${name} has been successfully registered under library "${currentLibraryName}".`
         );
      }
    } catch (fcmError) {
      console.error("❌ Failed to send direct creation push notification:", fcmError.message);
    }

    res.status(201).json({ 
      message: "Administrative account provisioned successfully!",
      admin: { _id: newAdmin._id, name: newAdmin.name, email: newAdmin.email }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 📝 UPDATE ADMIN DETAILS (Name, Email, Start Date, & End Date)
export const updateAdminDirectly = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, accessStartDate, accessEndDate } = req.body;

    if (!name || !email || !accessStartDate || !accessEndDate) {
      return res.status(400).json({ message: "All fields including dates are required" });
    }

    if (new Date(accessStartDate) >= new Date(accessEndDate)) {
      return res.status(400).json({ message: "Access End Date must fall after the Start Date" });
    }

    const updatedAdmin = await Admin.findByIdAndUpdate(
      id,
      { 
        name, 
        email,
        accessStartDate: new Date(accessStartDate),
        accessEndDate: new Date(accessEndDate)
      },
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedAdmin) {
      return res.status(404).json({ message: "Admin account not found" });
    }

    if (updatedAdmin.libraryId) {
      await Library.findByIdAndUpdate(updatedAdmin.libraryId, {
        accessStartDate: new Date(accessStartDate),
        accessEndDate: new Date(accessEndDate)
      });
    }

    // ── FCM NOTIFICATION FOR TIMELINE MODIFICATIONS ──
    try {
      if (updatedAdmin.fcmToken) {
        await sendPushNotification(
          updatedAdmin.fcmToken,
          "Account Profile Updated 📝",
          `Aapki profile details aur license access window update kar di gayi hai.`
        );
      }
    } catch (fcmError) {
      console.error("❌ Failed to send profile update push notification:", fcmError.message);
    }

    res.json({ message: "Admin account updated successfully", admin: updatedAdmin });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🔄 TOGGLE STATUS (Active / Inactive)
export const toggleAdminStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["Active", "Inactive"].includes(status)) {
      return res.status(400).json({ message: "Invalid status property assigned. Must be Active or Inactive" });
    }

    const updatedAdmin = await Admin.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).select("-password");

    if (!updatedAdmin) {
      return res.status(404).json({ message: "Target account registry key could not be located" });
    }

    // ── FCM NOTIFICATION FOR STATUS CHANGE ──
    try {
      if (updatedAdmin.fcmToken) {
        const title = status === "Active" ? "Account Activated! ✅" : "Account Suspended! ⚠️";
        const message = status === "Active" 
          ? "Your access privileges have been successfully restored."
          : "Your access privilege has been marked Inactive by management staff.";

        await sendPushNotification(updatedAdmin.fcmToken, title, message);
      }
    } catch (fcmError) {
      console.error("❌ Failed to send status change push notification:", fcmError.message);
    }

    res.json({ message: `Account operational status flipped to ${status}`, admin: updatedAdmin });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🔐 ADMIN LOGIN
export const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await Admin.findOne({ email });

    if (!admin) {
      return res.status(400).json({ message: "Admin not found", code: "NO_ADMIN" });
    }

    // 1. PASSWORD CHECK
    let isMatch = false;
    try {
      isMatch = await bcrypt.compare(password, admin.password);
    } catch {
      isMatch = password === admin.password;
    }

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid password" });
    }

    // ── 🛑 NEW SECURITY CHECKS FOR MULTI-LIBRARY MANAGEMENT ──

    // 2. CHECK STATUS (Skip checking for super_admin)
    if (admin.role !== "super_admin") {
      if (admin.status === "Pending") {
        return res.status(403).json({ 
          message: "Your library registration request is still pending approval.", 
          code: "PENDING_APPROVAL" 
        });
      }

      if (admin.status === "Inactive" || admin.status === "Rejected") {
        return res.status(403).json({ 
          message: "Your account is inactive or access has been revoked.", 
          code: "ACCESS_DENIED" 
        });
      }

      // 3. CHECK SUBSCRIPTION EXPIRATION
      const today = new Date();
      if (admin.accessEndDate && new Date(admin.accessEndDate) < today) {
        return res.status(403).json({ 
          message: "Your library access period has expired. Please submit a renewal request.", 
          code: "ACCESS_EXPIRED" 
        });
      }
    }

    // ── GENERATE SESSION TOKEN IF ALL CHECKS PASS ──
    const token = jwt.sign(
      { id: admin._id, role: admin.role, libraryId: admin.libraryId },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      token,
      admin: {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        libraryId: admin.libraryId
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// 👤 GET ADMIN PROFILE
export const getAdminProfile = async (req, res) => {
  try {
    const adminId = req.admin?.id || req.admin?._id;
    const admin = await Admin.findById(adminId).select("-password");
    res.json(admin);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🔍 CHECK FOR ROOT SUPER ADMIN
export const hasSuperAdmin = async (req, res) => {
  try {
    const superAdmin = await Admin.findOne({ role: "super_admin" });
    res.json({ hasSuperAdmin: !!superAdmin });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ⚡ APPROVAL CAPABILITY VERIFIER
export const approveCapability = async (req, res) => {
  try {
    const canApprove = req.admin?.role === "super_admin" || process.env.ALLOW_LIBRARY_ADMIN_APPROVE === "true";
    res.json({ canApprove, devBypassActive: process.env.ALLOW_LIBRARY_ADMIN_APPROVE === "true" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🛡️ INITIAL SYSTEM SETUP FOR SUPER ADMIN
export const setupFirstSuper = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields required" });
    }

    const existing = await Admin.findOne({ role: "super_admin" });
    if (existing) {
      return res.status(400).json({ message: "Super admin already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await Admin.create({
      name,
      email,
      password: hashedPassword,
      role: "super_admin",
      status: "Active"
    });

    res.json({ message: "Super admin created successfully" });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Email already in use" });
    }
    res.status(500).json({ message: error.message });
  }
};

// 📱 FCM TOKEN DEVICE MANAGEMENT
export const updateFcmToken = async (req, res) => {
  try {
    const { fcmToken } = req.body;
    const adminId = req.admin?.id || req.admin?._id || req.user?.id || req.user?._id;
    // console.log("ADMIN ID:", adminId);

    if (!adminId) {
      return res.status(401).json({ message: "Unauthorized: Invalid session metadata fallback structure" });
    }

    const updatedAdmin = await Admin.findByIdAndUpdate(
      adminId,
      { fcmToken: fcmToken || null },
      { new: true }
    ).select("-password");

    if (!updatedAdmin) {
      return res.status(404).json({ message: "Administrator account not found" });
    }

    // console.log(`📱 FCM Device Token updated successfully in database for: ${updatedAdmin.email}`);
    res.json({ message: "Firebase Device Token updated successfully", admin: updatedAdmin });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};