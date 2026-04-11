import Admin from "../models/Admin.js";
import AdminRequest from "../models/AdminRequest.js";
import Library from "../models/Library.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { emailExactMatch, normalizeEmail } from "../utils/email.js";

/** True if at least one super_admin exists (setup wizard is disabled after this). */
export const getHasSuperAdmin = async (req, res) => {
  try {
    const count = await Admin.countDocuments({ role: "super_admin" });
    res.json({ hasSuperAdmin: count > 0 });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * One-time: create the first super_admin + HQ library. Disabled once any super_admin exists.
 */
export const setupFirstSuperAdmin = async (req, res) => {
  try {
    const existing = await Admin.countDocuments({ role: "super_admin" });
    if (existing > 0) {
      return res.status(403).json({
        message:
          "A super admin already exists. Log in as super admin, or run: npm run promote:superadmin -- your@email.com",
      });
    }

    const { name, email: rawEmail, password } = req.body;
    const email = normalizeEmail(rawEmail);

    if (!name?.trim() || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const pattern = emailExactMatch(email);
    const dup = await Admin.findOne({ email: pattern });
    if (dup) {
      return res.status(400).json({
        message: "That email is already an admin. Log in and use promote:superadmin to make them super_admin.",
      });
    }

    const library = await Library.create({
      name: "HQ",
      ownerName: name.trim(),
    });

    const hashed = await bcrypt.hash(password, 10);
    await Admin.create({
      name: name.trim(),
      email,
      password: hashed,
      libraryId: library._id,
      role: "super_admin",
    });

    res.status(201).json({
      message: "Super admin created. Log in with this email and password, then open /super-admin to approve requests.",
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/** Who may call PUT /api/admin-request/approve/:id (matches isSuperAdmin middleware). */
export const getApproveCapability = async (req, res) => {
  try {
    const bypass = process.env.ALLOW_LIBRARY_ADMIN_APPROVE === "true";
    const isSuper = req.admin.role === "super_admin";
    res.json({
      canApprove: isSuper || bypass,
      devBypassActive: bypass && !isSuper,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const loginAdmin = async (req, res) => {
  try {
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        message: "Server misconfiguration: JWT_SECRET is not set in .env",
      });
    }

    const { email, password } = req.body;
    const emailPattern = emailExactMatch(email);

    if (!emailPattern || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const admin = await Admin.findOne({ email: emailPattern });

    if (!admin) {
      const pending = await AdminRequest.findOne({
        email: emailPattern,
        status: "pending",
      });

      if (pending) {
        return res.status(400).json({
          message:
            "Your signup request is still pending. A super admin must approve it at /super-admin before you can log in.",
          code: "PENDING_APPROVAL",
        });
      }

      return res.status(400).json({
        message:
          "No admin account for this email. If you have not signed up yet, submit a library request first (see link on this page).",
        code: "NO_ADMIN",
      });
    }

    const isMatch = await bcrypt.compare(password, admin.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Wrong password" });
    }

    const token = jwt.sign(
      {
        id: admin._id,
        libraryId: admin.libraryId,
        role: admin.role
      },
     process.env.JWT_SECRET, 
  { expiresIn: "1d" }
    );

    const adminObj = admin.toObject();
    delete adminObj.password;

    res.json({
      success: true,
      token,
      admin: adminObj,
    });

  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};