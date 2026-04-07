import Admin from "../models/Admin.js";
import AdminRequest from "../models/AdminRequest.js";
import Library from "../models/Library.js";
import bcrypt from "bcrypt";


export const requestAdmin = async (req, res) => {
  try {
    const { name, email, password, libraryName } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const request = new AdminRequest({
      name,
      email,
      password: hashedPassword,
      libraryName
    });

    await request.save();

    res.json({ message: "Request sent successfully" });

  } catch (error) {
    res.status(500).json({ message: "Error", error });
  }
};


export const approveRequest = async (req, res) => {
  try {
    const request = await AdminRequest.findById(req.params.id);

    // 1. Library create
    const library = new Library({
      name: request.libraryName,
      ownerName: request.name
    });

    await library.save();

    // 2. Admin create
    const admin = new Admin({
      name: request.name,
      email: request.email,
      password: request.password,
      libraryId: library._id,
      role: "admin"
    });

    await admin.save();

    // 3. status update
    request.status = "approved";
    await request.save();

    res.json({ message: "Approved successfully" });

  } catch (error) {
    res.status(500).json({ message: "Error", error });
  }
};