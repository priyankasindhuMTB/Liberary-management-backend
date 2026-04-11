import Shift from "../models/Shift.js";

// GET all shifts
export const getShifts = async (req, res) => {
  try {
     console.log("REQ.ADMIN >>>", req.admin);
    // const shifts = await Shift.find();
    const shifts = await Shift.find({libraryId:req.admin.libraryId});
    res.status(200).json(shifts);
  } catch (error) {
     console.log("CREATE SHIFT ERROR >>>", error); // 👈 ADD THIS
    res.status(500).json({ message: "Error fetching shifts", error });
  }
};

// ADD new shift (optional but useful)
export const createShift = async (req, res) => {
  try {
    const { name, startTime, endTime,libraryId } = req.body;

    const shift = new Shift({ name, startTime, endTime,libraryId:req.admin.libraryId });
    await shift.save();

    res.status(201).json({ success: true, shift });
  } catch (error) {
    res.status(500).json({ message: "Error creating shift", error });
  }
};