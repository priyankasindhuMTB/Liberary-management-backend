import Seat from '../models/Seat.js'
export const getSeats = async (req, res) => {
    console.log("!!! API REQUEST RECEIVED !!!");

  try {
    // const seats = await Seat.find().populate("occupiedBy");
    const seats = await Seat.find({libraryId:req.admin.libraryId}).populate("occupiedBy")

    console.log("Seats found:", seats.length);

    res.status(200).json(seats);

  } catch (error) {
    console.log("error", error);
    res.status(500).json({ message: "server error", error: error.message });
  }
};


export const insertSeat = async (req, res) => {
  try {
    const { seatNumber, price } = req.body;

    const seatNum = Number(seatNumber);

    if (!seatNum) {
      return res.status(400).json({
        success: false,
        message: "Invalid seat number"
      });
    }

    // 🔥 check only inside SAME library
    const existingSeat = await Seat.findOne({
      seatNumber: seatNum,
      libraryId: req.admin.libraryId
    });

    if (existingSeat) {
      return res.status(400).json({
        success: false,
        message: "Seat already exists in this library"
      });
    }

    const newSeat = new Seat({
      seatNumber: seatNum,
      price: Array.isArray(price) ? price : [],
      libraryId: req.admin.libraryId   // 🔥 MAIN POINT
    });

    await newSeat.save();

    res.status(201).json({
      success: true,
      message: "Seat created successfully"
    });

  } catch (error) {
    console.error("Error:", error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Duplicate seat in same library"
      });
    }

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


export const updateSeat = async (req, res) => {
  try {
    const { seatId } = req.params;
    const { price } = req.body;
 
    const seat = await Seat.findOne({ _id: seatId, libraryId: req.admin.libraryId });
 
    if (!seat) {
      return res.status(404).json({ success: false, message: "Seat not found" });
    }
 
    // Existing price array mein merge karo
    const updatedPrice = [...seat.price];
 
    (price || []).forEach(newEntry => {
      const idx = updatedPrice.findIndex(
        p => String(p.shiftId) === String(newEntry.shiftId)
      );
      if (idx !== -1) {
        updatedPrice[idx].amount = Number(newEntry.amount); // existing update
      } else {
        updatedPrice.push({ shiftId: newEntry.shiftId, amount: Number(newEntry.amount) }); // naya add
      }
    });
 
    seat.price = updatedPrice;
    await seat.save();
 
    res.json({ success: true, message: "Seat updated successfully", seat });
 
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
 