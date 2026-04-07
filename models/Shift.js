import mongoose from "mongoose";

const shiftSchema = new mongoose.Schema({
  name: { type: String, required: true }, // e.g. "Morning", "Night", "6AM-10AM"
  startTime: String,
  endTime: String,
  libraryId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Library",
  required: true
}
});

export default mongoose.model("Shift", shiftSchema);