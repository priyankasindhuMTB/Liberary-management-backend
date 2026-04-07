import Admin from "../models/Admin.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("req,body login",req.body)

    const admin = await Admin.findOne({ email });

    if (!admin) {
      return res.status(400).json({ message: "Admin not found" });
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

    res.json({
      success: true,
      token,
      admin
    });

  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};