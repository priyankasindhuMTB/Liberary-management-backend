
import Admin from "../models/Admin.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const getAllAdmins = async (req, res) => {
  try {
    const admins = await Admin.find({ role: "admin" })
      .select("-password")
      .populate("libraryId", "name"); // Library ka naam bhi dikhane ke liye
      
    res.json(admins);
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
      return res.status(400).json({
        message: "Admin not found",
        code: "NO_ADMIN"
      });
    }

    // ✅ FIX: agar password hash nahi hai (purana data) toh bhi handle karo
    let isMatch = false;
    try {
      isMatch = await bcrypt.compare(password, admin.password);
    } catch {
      // hash nahi tha, plain text compare
      isMatch = password === admin.password;
    }

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid password" });
    }

    const token = jwt.sign(
      {
        id: admin._id,
        role: admin.role,
        libraryId: admin.libraryId
      },
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
    const admin = await Admin.findById(req.admin._id).select("-password");
    res.json(admin);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// ✅ NEW: Check karo koi super_admin exist karta hai ya nahi
export const hasSuperAdmin = async (req, res) => {
  try {
    const superAdmin = await Admin.findOne({ role: "super_admin" });
    res.json({ hasSuperAdmin: !!superAdmin });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// ✅ NEW: Check karo current logged-in admin approve kar sakta hai ya nahi
export const approveCapability = async (req, res) => {
  try {
    const canApprove = req.admin.role === "super_admin" ||
      process.env.ALLOW_LIBRARY_ADMIN_APPROVE === "true";

    res.json({
      canApprove,
      devBypassActive: process.env.ALLOW_LIBRARY_ADMIN_APPROVE === "true"
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// ✅ NEW: Pehli baar super admin banana (koi super_admin na ho tabhi)
export const setupFirstSuper = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields required" });
    }

    // Already exists?
    const existing = await Admin.findOne({ role: "super_admin" });
    if (existing) {
      return res.status(400).json({ message: "Super admin already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await Admin.create({
      name,
      email,
      password: hashedPassword,
      role: "super_admin"
    });

    res.json({ message: "Super admin created successfully" });

  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Email already in use" });
    }
    res.status(500).json({ message: error.message });
  }
};