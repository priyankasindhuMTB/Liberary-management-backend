/**
 * Creates the first super_admin (and a small "HQ" library) in MongoDB.
 * Usage from backend folder:
 *   node scripts/seedSuperAdmin.js [email] [password]
 * Defaults: superadmin@example.com / ChangeMe123!
 * Requires MONGO_URI in .env (same as server).
 */
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import Library from "../models/Library.js";
import Admin from "../models/Admin.js";
import { emailExactMatch, normalizeEmail } from "../utils/email.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const email = normalizeEmail(process.argv[2] || "superadmin@example.com");
const plainPassword = process.argv[3] || "ChangeMe123!";

async function main() {
  if (!process.env.MONGO_URI) {
    console.error("Set MONGO_URI in backend/.env");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);

  const existing = await Admin.findOne({ email: emailExactMatch(email) });
  if (existing) {
    console.log("Admin already exists for email:", email);
    await mongoose.disconnect();
    process.exit(0);
  }

  const library = await Library.create({
    name: "HQ",
    ownerName: "Super Admin",
  });

  const password = await bcrypt.hash(plainPassword, 10);
  await Admin.create({
    name: "Super Admin",
    email,
    password,
    libraryId: library._id,
    role: "super_admin",
  });

  console.log("Super admin created.");
  console.log("  Email:", email);
  console.log("  Password:", plainPassword);
  console.log("Log in at the app, then open /super-admin to approve library requests.");

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
