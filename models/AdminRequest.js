// import mongoose from "mongoose";

// const adminRequestSchema = new mongoose.Schema({
//   name: String,
//   email: String,
//   password: String,
//   libraryName: String,
//   status: {
//     type: String,
//     enum: ["pending", "approved", "rejected"],
//     default: "pending"
//   }
// }, { timestamps: true });

// export default mongoose.model("AdminRequest", adminRequestSchema);

import mongoose from "mongoose";

const adminRequestSchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin",
    required: false // Not present during New_Registration
  },
  libraryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Library",
    required: false // Not present during New_Registration
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  libraryName: {
    type: String,
    required: true
  },


  // 👇 NEW DATE FIELDS
  accessStartDate: {
    type: Date,
    required: true
  },
  accessEndDate: {
    type: Date,
    required: true
  },
  requestType: {
    type: String,
    enum: ["New_Registration", "Extension"],
    default: "New_Registration"
  },
  status: {
    type: String,
    enum: ["Pending", "Approved", "Rejected"],
    default: "Pending"
  },
  superAdminRemarks: {
    type: String,
    default: ""
  }
}, { timestamps: true });

export default mongoose.model("AdminRequest", adminRequestSchema);