import Room from "../models/Room.js";
import Seat from "../models/Seat.js";

// ── Create Room ──────────────────────────────
export const createRoom = async (req, res) => {
  try {
    const { name, description, amenities } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: "Room name required" });
    }

    const room = new Room({
      name,
      description,
      amenities:  amenities || [],
      libraryId:  req.admin.libraryId
    });

    await room.save();
    res.status(200).json({ success: true, room });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── Get All Rooms ────────────────────────────
export const getAllRooms = async (req, res) => {
  try {
    const rooms = await Room.find({ libraryId: req.admin.libraryId });

    const roomsWithCount = await Promise.all(
      rooms.map(async (room) => {
        const seatCount = await Seat.countDocuments({ roomId: room._id });
        return { ...room.toObject(), seatCount };
      })
    );

    res.status(200).json({ success: true, rooms: roomsWithCount });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── Update Room (name, description, amenities) ──
export const updateRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { name, description, amenities } = req.body;

    const updatedRoom = await Room.findOneAndUpdate(
      { _id: roomId, libraryId: req.admin.libraryId }, // ← library check bhi
      { name, description, amenities },
      { new: true }
    );

    if (!updatedRoom) {
      return res.status(404).json({ success: false, message: "Room not found" });
    }

    res.json({ success: true, room: updatedRoom });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── Toggle Room Status (Active ↔ Inactive) ── ← DELETE ki jagah yeh
export const toggleRoomStatus = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { status } = req.body; // "Active" or "Inactive"

    if (!["Active", "Inactive"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    const room = await Room.findOneAndUpdate(
      { _id: roomId, libraryId: req.admin.libraryId },
      { status },
      { new: true }
    );

    if (!room) {
      return res.status(404).json({ success: false, message: "Room not found" });
    }

    res.json({ success: true, message: `Room marked ${status}`, room });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};