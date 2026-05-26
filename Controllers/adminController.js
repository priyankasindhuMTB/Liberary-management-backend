// import { sendPushNotification } from "../config/firebase.js"
// import Admin from "../models/Admin.js";
// import bcrypt from "bcrypt";
// import jwt from "jsonwebtoken";

// export const getAllAdmins = async (req, res) => {
//   try {
//     const admins = await Admin.find({ role: "admin" })
//       .select("-password")
//       .populate("libraryId", "name"); 
//     res.json(admins);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };


// // 🔐 ADMIN LOGIN
// export const loginAdmin = async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     const admin = await Admin.findOne({ email });

//     if (!admin) {
//       return res.status(400).json({
//         message: "Admin not found",
//         code: "NO_ADMIN"
//       });
//     }

//     // ✅ FIX: agar password hash nahi hai (purana data) toh bhi handle karo
//     let isMatch = false;
//     try {
//       isMatch = await bcrypt.compare(password, admin.password);
//     } catch {
//       // hash nahi tha, plain text compare
//       isMatch = password === admin.password;
//     }

//     if (!isMatch) {
//       return res.status(400).json({ message: "Invalid password" });
//     }

//     const token = jwt.sign(
//       {
//         id: admin._id,
//         role: admin.role,
//         libraryId: admin.libraryId
//       },
//       process.env.JWT_SECRET,
//       { expiresIn: "7d" }
//     );

//     res.json({
//       message: "Login successful",
//       token,
//       admin: {
//         _id: admin._id,
//         name: admin.name,
//         email: admin.email,
//         role: admin.role,
//         libraryId: admin.libraryId
//       }
//     });

//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };


// // 👤 GET ADMIN PROFILE
// export const getAdminProfile = async (req, res) => {
//   try {
//     const admin = await Admin.findById(req.admin._id).select("-password");
//     res.json(admin);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };


// // ✅ NEW: Check karo koi super_admin exist karta hai ya nahi
// export const hasSuperAdmin = async (req, res) => {
//   try {
//     const superAdmin = await Admin.findOne({ role: "super_admin" });
//     res.json({ hasSuperAdmin: !!superAdmin });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };


// // ✅ NEW: Check karo current logged-in admin approve kar sakta hai ya nahi
// export const approveCapability = async (req, res) => {
//   try {
//     const canApprove = req.admin.role === "super_admin" ||
//       process.env.ALLOW_LIBRARY_ADMIN_APPROVE === "true";

//     res.json({
//       canApprove,
//       devBypassActive: process.env.ALLOW_LIBRARY_ADMIN_APPROVE === "true"
//     });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };


// // ✅ NEW: Pehli baar super admin banana (koi super_admin na ho tabhi)
// export const setupFirstSuper = async (req, res) => {
//   try {
//     const { name, email, password } = req.body;

//     if (!name || !email || !password) {
//       return res.status(400).json({ message: "All fields required" });
//     }

//     // Already exists?
//     const existing = await Admin.findOne({ role: "super_admin" });
//     if (existing) {
//       return res.status(400).json({ message: "Super admin already exists" });
//     }

//     const hashedPassword = await bcrypt.hash(password, 10);

//     await Admin.create({
//       name,
//       email,
//       password: hashedPassword,
//       role: "super_admin"
//     });

//     res.json({ message: "Super admin created successfully" });

//   } catch (error) {
//     if (error.code === 11000) {
//       return res.status(400).json({ message: "Email already in use" });
//     }
//     res.status(500).json({ message: error.message });
//   }
// };


// // Add this to the very bottom of your adminController.js file

// // ✅ NEW: Store or Clear a Firebase Cloud Messaging Device Token
// export const updateFcmToken = async (req, res) => {
//   try {
//     const { fcmToken } = req.body;
//     const adminId = req.admin?.id || req.admin?._id; // Reads verified payload id safely

//     if (!adminId) {
//       return res.status(401).json({ message: "Unauthorized: Invalid session metadata" });
//     }

//     // Locate the matching admin document and update its notification key target
//     const updatedAdmin = await Admin.findByIdAndUpdate(
//       adminId,
//       { fcmToken: fcmToken || null }, // Saves generated key string, or strips it if logging out
//       { new: true }
//     );

//     if (!updatedAdmin) {
//       return res.status(404).json({ message: "Administrator account not found" });
//     }

//     res.json({ message: "Firebase Device Token updated successfully" });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

import { sendPushNotification } from "../config/firebase.js";
import Admin from "../models/Admin.js";
import Library from "../models/Library.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// 📋 GET ALL REGISTERED ADMINS
export const getAllAdmins = async (req, res) => {
  try {
    // Fetches all administrators so they render perfectly inside your dashboard list
    const admins = await Admin.find()
      .select("-password")
      .populate("libraryId", "name"); 
    res.json(admins);
    console.log("admin",admins);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🏢 DIRECT ADMIN CREATION (By Super Admin or Library Admin)
export const createAdminDirectly = async (req, res) => {
  try {
    const { name, email, password, libraryName,accessStartDate, accessEndDate,status } = req.body;
    
    // req.admin is set by your verifyAdmin middleware matrix wrapper
    const creatorRole = req.admin?.role; 
    const creatorLibraryId = req.admin?.libraryId;

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
          status: "Active"
        });
      }
      targetLibraryId = library._id;
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
      accessStartDate, accessEndDate,
      role: "admin",
      status: "Active" // Defaults directly to active state upon registration initialization
    });

    res.status(201).json({ 
      message: "Administrative account provisioned successfully!",
      admin: { _id: newAdmin._id, name: newAdmin.name, email: newAdmin.email }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 📝 UPDATE ADMIN DETAILS (Inline Name and Email Changes)
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

    let isMatch = false;
    try {
      isMatch = await bcrypt.compare(password, admin.password);
    } catch {
      isMatch = password === admin.password;
    }

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid password" });
    }

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
    const adminId = req.admin?.id || req.admin?._id;

    if (!adminId) {
      return res.status(401).json({ message: "Unauthorized: Invalid session metadata" });
    }

    const updatedAdmin = await Admin.findByIdAndUpdate(
      adminId,
      { fcmToken: fcmToken || null },
      { new: true }
    );

    if (!updatedAdmin) {
      return res.status(404).json({ message: "Administrator account not found" });
    }

    res.json({ message: "Firebase Device Token updated successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};