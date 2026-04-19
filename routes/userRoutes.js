import express from 'express';
import { registerUser, getAllUsers, updateUserStatus, updateUser } from '../Controllers/userController.js';
import { verifyAdmin } from '../middleware/authMiddleware.js';

const userRouter = express.Router();

userRouter.post("/register",verifyAdmin, registerUser);
userRouter.get("/all", verifyAdmin,getAllUsers);
userRouter.put("/status/:userId",verifyAdmin,updateUserStatus)
userRouter.put("/update/:userId", verifyAdmin, updateUser);

export default userRouter;