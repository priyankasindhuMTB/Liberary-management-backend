import mongoose from "mongoose";

const librarySchema = new mongoose.Schema({
  name: String,
  ownerName: String
}, { timestamps: true });

export default mongoose.model("Library", librarySchema);