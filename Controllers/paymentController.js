import Payment from "../models/Payment.js";
import Seat from "../models/Seat.js";
import User from "../models/User.js";


export const addPayment = async (req, res) => {
  try {
    const { userId, seatId, amount } = req.body;

    if (!userId || !amount) {
      return res.status(400).json({
        success: false,
        message: "User and amount required"
      });
    }

    const payment = new Payment({
      userId,
      seatId,
      amount,
      libraryId: req.admin.libraryId
    });

    await payment.save();

    res.json({
      success: true,
      message: "Payment saved"
    });

  } catch (error) {
    res.status(500).json({ message: "Error", error });
  }
};

export const getUserPayment = async (req, res) => {
  try {
    const { userId } = req.params;

    // 1️⃣ Get payments
    const payments = await Payment.find({
      userId,
      libraryId: req.admin.libraryId
    });

    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

    // 2️⃣ Get user
    const user = await User.findById(userId)
      .populate("seatId")
      .populate("shiftId");

    if (!user || !user.seatId) {
      return res.status(404).json({
        success: false,
        message: "User or Seat not found"
      });
    }

    const seat = user.seatId;

    // 3️⃣ Safety checks
    if (!user.shiftId || !user.shiftId._id) {
      return res.json({
        success: true,
        totalPaid,
        pending: 0,
        seatPrice: 0
      });
    }

    if (!Array.isArray(seat.price) || seat.price.length === 0) {
      return res.json({
        success: true,
        totalPaid,
        pending: 0,
        seatPrice: 0
      });
    }

    // 4️⃣ Find shift price
    const shiftPriceObj = seat.price.find(
      p => String(p.shiftId) === String(user.shiftId._id)
    );

    const seatPrice = shiftPriceObj?.amount || 0;

    // 5️⃣ Calculate pending
    let pending = seatPrice - totalPaid;
    if (pending < 0) pending = 0;

    // 6️⃣ Final response
    res.json({
      success: true,
      seatPrice,
      totalPaid,
      pending
    });

  } catch (error) {
    console.error("🔥 GET PAYMENT ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching payment",
      error: error.message
    });
  }
};