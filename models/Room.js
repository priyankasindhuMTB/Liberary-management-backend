import mongoose from "mongoose";

const roomSchema = new mongoose.Schema({
  name:        { type: String, required: true },
  description: { type: String },
  amenities:   [String],
  status:      { type: String, enum: ["Active", "Inactive"], default: "Active" }, // ← ADD
  libraryId:   { type: mongoose.Schema.Types.ObjectId, ref: "Library", required: true },
  createdAt:   { type: Date, default: Date.now }
});

const Room = mongoose.model("Room", roomSchema);
export default Room;