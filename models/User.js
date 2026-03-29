import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  seatId: { type: mongoose.Schema.Types.ObjectId, ref: 'Seat' },
  shiftId: { 
  type: mongoose.Schema.Types.ObjectId, 
  ref: "Shift",
  required: true
},
  status:{type:String,enum:['Active','Inactive'],default:"Active"},
  joinedAt:{type:Date,default:Date.now}
});
const User=mongoose.model('User',userSchema)
export default User
