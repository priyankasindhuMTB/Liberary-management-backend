import jwt from "jsonwebtoken";

export const verifyAdmin = (req, res, next) => {
  try {
    const token = req.headers.authorization;

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(token, "secretkey");

    req.admin = decoded;

    next();

  } catch (error) {
    return res.status(403).json({ message: "Invalid token" });
  }
};