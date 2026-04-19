import AdminRequest from "../models/AdminRequest.js";
import Admin from "../models/Admin.js";
import Library from "../models/Library.js";
import bcrypt from "bcrypt";


// 📨 1. ADMIN REQUEST (Register)
export const requestAdmin = async (req, res) => {
  try {
    const { name, email, password, libraryName } = req.body;

    if (!name || !email || !password || !libraryName) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // check existing admin
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ message: "Admin already exists" });
    }

    // check pending request
    const pending = await AdminRequest.findOne({ email, status: "pending" });
    if (pending) {
      return res.status(400).json({ message: "Request already pending" });
    }

    // password hash
    const hashedPassword = await bcrypt.hash(password, 10);

    // save request
    const request = await AdminRequest.create({
      name,
      email,
      password: hashedPassword,
      libraryName
    });

    res.json({ message: "Request sent successfully", request });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



// 📋 2. GET ALL PENDING REQUESTS (Super Admin)
export const getAllRequests = async (req, res) => {
  try {
    const requests = await AdminRequest.find({ status: "pending" });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



// ✅ 3. APPROVE REQUEST (Super Admin)
export const approveRequest = async (req, res) => {
  try {
    const request = await AdminRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    if (request.status === "approved") {
      return res.status(400).json({ message: "Already approved" });
    }

    // 1. create library
// ✅ check if library already exists
let library = await Library.findOne({ name: request.libraryName });

if (!library) {
  // create new if not exists
  library = await Library.create({
    name: request.libraryName,
    ownerName: request.name
  });
}

    // 2. create admin
    await Admin.create({
      name: request.name,
      email: request.email,
      password: request.password,
      libraryId: library._id
    });

    // 3. update request
    request.status = "approved";
    await request.save();

    res.json({ message: "Approved successfully" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



// ❌ 4. REJECT REQUEST (optional)
export const rejectRequest = async (req, res) => {
  try {
    const request = await AdminRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    request.status = "rejected";
    await request.save();

    res.json({ message: "Request rejected" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};