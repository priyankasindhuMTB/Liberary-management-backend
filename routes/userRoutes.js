import express from 'express';
import { registerUser, getAllUsers, updateUserStatus } from '../Controllers/userController.js';

const userRouter = express.Router();

userRouter.post("/register", registerUser);
userRouter.get("/all", getAllUsers);
userRouter.put("/status/:userId",updateUserStatus)

export default userRouter;