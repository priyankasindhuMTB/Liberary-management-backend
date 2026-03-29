import mongoose from "mongoose";

const shiftSchema = new mongoose.Schema({
  name: { type: String, required: true }, // e.g. "Morning", "Night", "6AM-10AM"
  startTime: String,
  endTime: String
});

export default mongoose.model("Shift", shiftSchema);