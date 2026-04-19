// import User from "../models/User.js";
// import Seat from "../models/Seat.js";
// import bcrypt from "bcrypt";

// export const registerUser = async (req, res) => {
//     try {
//         console.log("Request Body:", req.body);

//         const { name, email, password, seatId, shiftId, libraryId } = req.body;

//         if (!name || !email || !password || !seatId || !shiftId) {
//             return res.status(400).json({ message: "Required fields missing" });
//         }

//         const existingBooking = await User.findOne({
//             seatId,
//             shiftId,
//             libraryId: req.admin.libraryId
//         });


//         if (existingBooking) {
//             return res.status(400).json({
//                 success: false,
//                 message: `Seat already booked for this shift`
//             });
//         }
// const hashedPassword = await bcrypt.hash(password, 10);

//         const newUser = new User({ name, email, hashedPassword:password, seatId, shiftId, libraryId: req.admin.libraryId });
//         const savedUser = await newUser.save();

//         // await Seat.findByIdAndUpdate(seatId, {
//         //     occupiedBy: savedUser._id
//         // });

//         res.status(200).json({ message: "Register user success", success: true, user: savedUser });

//     } catch (error) {
//         console.error("Error in registerUser:", error);  // Log full error here
//         res.status(500).json({ message: "Server error", success: false, error: error.message });
//     }
// };


// export const getAllUsers = async (req, res) => {
//     try {
//         // We populate 'seatId' to see which seat the user belongs to
//         const users = await User.find({ libraryId: req.admin.libraryId }).populate("seatId").populate("shiftId");
//         console.log(users)

//         res.status(200).json({ message: "get user successfully", success: true, users: users })
//     } catch (error) {
//         res.status(500).json({ message: "Server error" });
//     }
// };

// export const updateUser = async (req, res) => {
//   try {
//     const { userId } = req.params;
//     const { name, email, seatId, shiftId } = req.body;

//     const updatedUser = await User.findByIdAndUpdate(
//       userId,
//       { name, email, seatId, shiftId },
//       { new: true }
//     );

//     if (!updatedUser) {
//       return res.status(404).json({
//         success: false,
//         message: "User not found"
//       });
//     }

//     res.json({
//       success: true,
//       message: "User updated successfully",
//       user: updatedUser
//     });

//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: "Error updating user",
//       error: error.message
//     });
//   }
// };
// export const updateUserStatus = async (req, res) => {
//     try {
//         const { userId } = req.params;
//         const { status } = req.body; // Expecting 'Active' or 'Inactive'

//         const updatedUser = await User.findByIdAndUpdate(
//             userId,
//             { status },
//             { new: true }
//         );

//         if (!updatedUser) {
//             return res.status(404).json({ success: false, message: "User not found" });
//         }

//         res.status(200).json({
//             success: true,
//             message: `User status updated to ${status}`,
//             user: updatedUser
//         });
//     } catch (error) {
//         res.status(500).json({ success: false, message: "Server error", error: error.message });
//     }
// };


import User from "../models/User.js";
import Seat from "../models/Seat.js";
import bcrypt from "bcrypt";

export const registerUser = async (req, res) => {
    try {
        console.log("Request Body:", req.body);

        const { name, email, password, seatId, shiftId } = req.body;

        if (!name || !email || !password || !seatId || !shiftId) {
            return res.status(400).json({ message: "Required fields missing" });
        }

        // Check seat already booked for this shift in same library
        const existingBooking = await User.findOne({
            seatId,
            shiftId,
            libraryId: req.admin.libraryId,
            status: "Active"   // ✅ only block if active user has this seat+shift
        });

        if (existingBooking) {
            return res.status(400).json({
                success: false,
                message: `Seat already booked for this shift`
            });
        }

        // ✅ FIX: hash karo aur CORRECT field mein save karo
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            name,
            email,
            password: hashedPassword,   // ✅ was: hashedPassword: password (WRONG)
            seatId,
            shiftId,
            libraryId: req.admin.libraryId
        });

        const savedUser = await newUser.save();

        res.status(200).json({
            message: "Register user success",
            success: true,
            user: savedUser
        });

    } catch (error) {
        console.error("Error in registerUser:", error);
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: "Email already registered in this library"
            });
        }
        res.status(500).json({
            message: "Server error",
            success: false,
            error: error.message
        });
    }
};


export const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({ libraryId: req.admin.libraryId })
            .populate("seatId")
            .populate("shiftId");

        res.status(200).json({
            message: "get user successfully",
            success: true,
            users
        });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};


export const updateUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const { name, email, seatId, shiftId, password } = req.body;

        const updateFields = { name, email, seatId, shiftId };

        // ✅ FIX: edit mode mein password blank aaye toh update mat karo
        if (password && password.trim() !== "") {
            updateFields.password = await bcrypt.hash(password, 10);
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            updateFields,
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        res.json({
            success: true,
            message: "User updated successfully",
            user: updatedUser
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error updating user",
            error: error.message
        });
    }
};


export const updateUserStatus = async (req, res) => {
    try {
        const { userId } = req.params;
        const { status } = req.body;

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { status },
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        res.status(200).json({
            success: true,
            message: `User status updated to ${status}`,
            user: updatedUser
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
    }
};