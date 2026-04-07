import mongoose from "mongoose";

const seatSchema = new mongoose.Schema({
  seatNumber: {
    type: Number,
    required: true,
  },

  occupiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  },
  // price: { type: Number,default:0 },
  price: [
    {
      shiftId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Shift"
      },
      amount: {
        type: Number,
        default: 0
      }
    }
  ],

  libraryId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Library",
  required: true
}
});
seatSchema.index({ seatNumber: 1, libraryId: 1 }, { unique: true });

const Seat = mongoose.model("Seat", seatSchema);
export default Seat;
