import mongoose from "mongoose";

const adminSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  libraryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Library"
  },
  role: {
    type: String,
    enum: ["super_admin", "admin"],
    default: "admin"
  }
});

export default mongoose.model("Admin", adminSchema);