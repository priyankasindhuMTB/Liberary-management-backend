import Seat from '../models/Seat.js'
export const getSeats = async (req, res) => {
  //   console.log("!!! API REQUEST RECEIVED !!!");

  try {
    const seats = await Seat.find().populate("occupiedBy");

    console.log("Seats found:", seats.length);

    res.status(200).json(seats);

  } catch (error) {
    console.log("error", error);
    res.status(500).json({ message: "server error", error: error.message });
  }
};


export const insertSeat = async (req, res) => {
  try {
    const { seatNumber, isOccupied, occupiedBy, price } = req.body

    if (!seatNumber) {
      return res.status(400).json({
        success: false,
        message: "seat number is required"
      })

    }
    const existingSeat = await Seat.findOne({ seatNumber })
    if (existingSeat) {
      return res.status(400).json({
        success: false,
        message: "Seat already exists"
      });
    }
    const newSeat = new Seat({
      seatNumber,
      occupiedBy,
       price: price || []
    });
    const saveSeat = await newSeat.save()
    res.status(200).json({ success: true, message: "seat insert successfully", saveSeat })

  } catch (error) {
    console.error("Error in create seat:", error);
    res.status(500).json({ message: "Server error", success: false, error: error.message });

  }

}