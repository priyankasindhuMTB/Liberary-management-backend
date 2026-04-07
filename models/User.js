import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  seatId: { type: mongoose.Schema.Types.ObjectId, ref: 'Seat' },
  shiftId: { 
  type: mongoose.Schema.Types.ObjectId, 
  ref: "Shift",
  required: true
},
  status:{type:String,enum:['Active','Inactive'],default:"Active"},
  joinedAt:{type:Date,default:Date.now},

  libraryId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Library",
  required: true
}
});

userSchema.index({ email: 1, libraryId: 1 }, { unique: true });
const User=mongoose.model('User',userSchema)
export default User
