import mongoose from "mongoose";

const adminRequestSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  libraryName: String,
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending"
  }
}, { timestamps: true });

export default mongoose.model("AdminRequest", adminRequestSchema);