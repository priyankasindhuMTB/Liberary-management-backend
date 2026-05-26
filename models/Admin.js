import mongoose from "mongoose";

const adminSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  libraryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Library"
  },
  role: {
    type: String,
    enum: ["super_admin", "admin"],
    default: "admin"
  },
  
  // 📅 👇 NEW TIMELINE DATE FIELDS ADDED HERE
  accessStartDate: {
    type: Date,
    default: null
  },
  accessEndDate: {
    type: Date,
    default: null
  },
  
  // 🔄 👇 STATUS TOGGLE FIELD ADDED HERE
  status: {
    type: String,
    enum: ["Active", "Inactive"],
    default: "Active"
  },
  
  fcmToken: {
    type: String,
    default: null, 
  }
}, { timestamps: true }); 
export default mongoose.model("Admin", adminSchema);