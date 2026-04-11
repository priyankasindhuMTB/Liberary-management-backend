import Admin from "../models/Admin.js";
import AdminRequest from "../models/AdminRequest.js";
import Library from "../models/Library.js";
import bcrypt from "bcrypt";
import { emailExactMatch, normalizeEmail } from "../utils/email.js";


export const requestAdmin = async (req, res) => {
  try {
    const { name, password, libraryName } = req.body;
    const email = normalizeEmail(req.body.email);

    if (!name || !email || !password || !libraryName) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingAdmin = await Admin.findOne({ email: emailExactMatch(email) });
    if (existingAdmin) {
      return res.status(400).json({ message: "An admin with this email already exists. Log in instead." });
    }

    const pending = await AdminRequest.findOne({
      email: emailExactMatch(email),
      status: "pending",
    });
    if (pending) {
      return res.status(400).json({ message: "You already have a pending request for this email." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const request = new AdminRequest({
      name,
      email,
      password: hashedPassword,
      libraryName
    });

    console.log("request>>>>>>>>>>",request)

    await request.save();

    res.json({ message: "Request sent successfully" });

  } catch (error) {
    res.status(500).json({ message: "Error", error });
  }
};


export const approveRequest = async (req, res) => {
  try {
    const request = await AdminRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    if (request.status === "approved") {
      return res.status(400).json({ message: "Already approved" });
    }

    const existingAdmin = await Admin.findOne({
      email: emailExactMatch(request.email),
    });
    if (existingAdmin) {
      return res.status(400).json({ message: "Admin already exists" });
    }

    // 1. Create Library
    const library = new Library({
      name: request.libraryName,
      ownerName: request.name
    });

    await library.save();

    // 2. Create Admin
    const admin = new Admin({
      name: request.name,
      email: normalizeEmail(request.email),
      password: request.password,
      libraryId: library._id,
      role: "admin"
    });

    await admin.save();

    // 3. Delete request
    await AdminRequest.findByIdAndDelete(req.params.id);

    res.json({ message: "Approved successfully" });

  } catch (error) {
    res.status(500).json({ message: "Error", error });
  }
};