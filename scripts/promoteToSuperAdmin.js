/**
 * Set an existing admin's role to super_admin (so they can approve /api/admin-request).
 * Usage: node scripts/promoteToSuperAdmin.js <email>
 * After running: log out in the app and log in again (JWT must be reissued with new role).
 */
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import Admin from "../models/Admin.js";
import { emailExactMatch, normalizeEmail } from "../utils/email.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const emailArg = process.argv[2];

async function main() {
  if (!process.env.MONGO_URI) {
    console.error("Set MONGO_URI in backend/.env");
    process.exit(1);
  }
  if (!emailArg) {
    console.error("Usage: node scripts/promoteToSuperAdmin.js <admin-email>");
    process.exit(1);
  }

  const email = normalizeEmail(emailArg);
  const pattern = emailExactMatch(email);
  if (!pattern) {
    console.error("Invalid email");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  const admin = await Admin.findOneAndUpdate(
    { email: pattern },
    { role: "super_admin" },
    { new: true }
  );

  if (!admin) {
    console.error("No admin found with email:", email);
    await mongoose.disconnect();
    process.exit(1);
  }

  console.log("Updated:", admin.email, "→ role: super_admin");
  console.log("Log out in the browser and log in again so your token includes the new role.");

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
