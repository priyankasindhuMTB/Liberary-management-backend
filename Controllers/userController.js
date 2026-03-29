import User from "../models/User.js";
import Seat from "../models/Seat.js";

export const registerUser = async (req, res) => {
  try {
    console.log("Request Body:", req.body);

    const { name, email, password, seatId, shiftId } = req.body;

    if (!name || !email || !password || !seatId || !shiftId) {
      return res.status(400).json({ message: "Required fields missing" });
    }

    const existingBooking=await User.findOne({seatId,shiftId})

   if (existingBooking) {
      return res.status(400).json({
        success: false,
        message: `Seat already booked for this shift`
      });
    }


    const newUser = new User({ name, email, password, seatId, shiftId });
    const savedUser = await newUser.save();

   
    //   await Seat.findByIdAndUpdate(seatId, {
    //   $push: { occupiedSlots: shiftId } 
    // });

  res.status(200).json({ message: "Register user success", success: true,user:savedUser });

  } catch (error) {
    console.error("Error in registerUser:", error);  // Log full error here
    res.status(500).json({ message: "Server error", success: false, error: error.message });
  }
};


export const getAllUsers = async (req, res) => {
    try {
        // We populate 'seatId' to see which seat the user belongs to
        const users = await User.find().populate("seatId").populate("shiftId");
        console.log(users)
        
        res.status(200).json({message:"get user successfully",success:true,users:users})
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

export const updateUserStatus = async (req, res) => {
    try {
        const { userId } = req.params;
        const { status } = req.body; // Expecting 'Active' or 'Inactive'

        const updatedUser = await User.findByIdAndUpdate(
            userId, 
            { status }, 
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        res.status(200).json({ 
            success: true, 
            message: `User status updated to ${status}`, 
            user: updatedUser 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};