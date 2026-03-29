import Shift from "../models/Shift.js";

// GET all shifts
export const getShifts = async (req, res) => {
  try {
    const shifts = await Shift.find();
    res.status(200).json(shifts);
  } catch (error) {
    res.status(500).json({ message: "Error fetching shifts", error });
  }
};

// ADD new shift (optional but useful)
export const createShift = async (req, res) => {
  try {
    const { name, startTime, endTime } = req.body;

    const shift = new Shift({ name, startTime, endTime });
    await shift.save();

    res.status(201).json({ success: true, shift });
  } catch (error) {
    res.status(500).json({ message: "Error creating shift", error });
  }
};