

import mongoose from "mongoose";

const librarySchema = new mongoose.Schema({
  name: String,
  ownerName: String,
  // 👇 NEW FIELDS TO TRACK ACCESS TIME
  isApproved: { 
    type: Boolean, 
    default: false 
  },
  accessStartDate: { 
    type: Date, 
    default: null 
  },
  accessEndDate: { 
    type: Date, 
    default: null 
  },
  status: { 
    type: String, 
    enum: ["Active", "Expired", "Pending"], 
    default: "Pending" 
  }
}, { timestamps: true });

export default mongoose.model("Library", librarySchema);