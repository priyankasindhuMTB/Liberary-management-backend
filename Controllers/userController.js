import User from "../models/User.js";
import Seat from "../models/Seat.js";
import bcrypt from "bcrypt";
import Shift from "../models/Shift.js";

// ── Helper: conflict check ──────────────────────────────────────────
const checkSeatConflict = async (seatId, shiftId, libraryId, excludeUserId = null) => {
    const requestedShift = await Shift.findById(shiftId);
    if (!requestedShift) return { conflict: true, message: "Invalid shift selected" };

    const query = {
        seatId,
        libraryId,
        status: "Active"
    };
    if (excludeUserId) query._id = { $ne: excludeUserId };

    const seatUsers = await User.find(query).populate("shiftId");

    const hasConflict = seatUsers.some(u => {
        const existingName = u.shiftId?.name?.toLowerCase().trim();
        const requestedName = requestedShift.name?.toLowerCase().trim();

        return (
            existingName === "full day" ||       // existing user Full Day hai → blocks all
            requestedName === "full day" ||      // naya user Full Day chahta hai → blocks all
            String(u.shiftId?._id) === String(shiftId)  // same shift
        );
    });

    return hasConflict
        ? { conflict: true, message: "Seat already booked for this shift" }
        : { conflict: false };
};

// ── Register ────────────────────────────────────────────────────────
export const registerUser = async (req, res) => {
    try {
        const { name, email, password, seatId, shiftId } = req.body;

        if (!name || !email || !password || !seatId || !shiftId) {
            return res.status(400).json({ message: "Required fields missing" });
        }

        const { conflict, message } = await checkSeatConflict(seatId, shiftId, req.admin.libraryId);
        if (conflict) {
            return res.status(400).json({ success: false, message });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({
            name, email,
            password: hashedPassword,
            seatId, shiftId,
            libraryId: req.admin.libraryId
        });

        const savedUser = await newUser.save();
        res.status(200).json({ message: "Register user success", success: true, user: savedUser });

    } catch (error) {
        console.error("Error in registerUser:", error);
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: "Email already registered" });
        }
        res.status(500).json({ message: "Server error", success: false, error: error.message });
    }
};

// ── Get All Users ────────────────────────────────────────────────────
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

// ── Update User ──────────────────────────────────────────────────────
export const updateUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const { name, email, seatId, shiftId, password } = req.body;

        // Conflict check (apne aap ko exclude karo)
        if (seatId && shiftId) {
            const { conflict, message } = await checkSeatConflict(
                seatId, shiftId, req.admin.libraryId, userId
            );
            if (conflict) {
                return res.status(400).json({ success: false, message });
            }
        }

        const updateFields = { name, email, seatId, shiftId };

        if (password && password.trim() !== "") {
            updateFields.password = await bcrypt.hash(password, 10);
        }

        const updatedUser = await User.findByIdAndUpdate(userId, updateFields, { new: true });

        if (!updatedUser) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        res.json({ success: true, message: "User updated successfully", user: updatedUser });

    } catch (error) {
        res.status(500).json({ success: false, message: "Error updating user", error: error.message });
    }
};

// ── Update Status ────────────────────────────────────────────────────
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