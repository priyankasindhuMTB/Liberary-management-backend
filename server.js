import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import seatRouter from "./routes/seatRoutes.js";
import userRouter from './routes/userRoutes.js';
import paymentRouter from "./routes/paymentRoutes.js";
import shiftRouter from "./routes/shiftRoutes.js";
import adminRouter from "./routes/adminRoutes.js";
import adminRequestRouter from "./routes/adminRequestRoutes.js";

dotenv.config();

const app = express();
app.use(cors({
  origin: ["http://localhost:5173"],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json());

// ✅ ADD THIS
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "http://localhost:5173");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
});

app.get("/", (req, res) => {
  res.send("Library Management System API is running...");
  console.log("wwwwwwwwwwwwwwwwwww",res)
});

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected successfully");
    console.log("👉 DB NAME:", mongoose.connection.name); // ⭐ ADD THIS
  })
  .catch((err) => console.log("MongoDB connection error:", err));
// Use the router
app.use("/api/seats", seatRouter); 
app.use("/api/users", userRouter);
app.use("/api/payment",paymentRouter)
app.use("/api/shifts",shiftRouter)
app.use("/api/admin",adminRouter)
app.use("/api/admin-request",adminRequestRouter)
app.listen(process.env.PORT || 5001, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});   