import cron from "node-cron";
import Library from "../../models/Library.js";
import Admin from "../../models/Admin.js";

// Cron Job setup: Har raat 12:00 AM (00:00) baje automatically chalega
const initExpiryCron = () => {
  cron.schedule("0 0 * * *", async () => {
    console.log("⏰ --- Running Daily Library Expiry Check Cron Job ---");
    try {
      const today = new Date();

      // 1. Un Library branches ko dhoondo jo Active hain par expire ho chuki hain
      const expiredLibraries = await Library.find({
        status: { $ne: "Expired" }, // Jo abhi tak Expired nahi hain
        accessEndDate: { $lt: today, $ne: null } // Jinki accessEndDate aaj se kam (past date) hai
      });

      if (expiredLibraries.length > 0) {
        const expiredIds = expiredLibraries.map(lib => lib._id);

        // 2. Library collection mein status "Expired" update karein
        await Library.updateMany(
          { _id: { $in: expiredIds } },
          { $set: { status: "Expired" } }
        );

        // 3. Corresponding Regular Admins ko bhi "Inactive" mark karein 
        // taaki unka session immediate drop ho sake aur sidebar block ho jaye
        await Admin.updateMany(
          { libraryId: { $in: expiredIds }, role: "admin" },
          { $set: { status: "Inactive" } }
        );

        console.log(`✅ Success: ${expiredLibraries.length} libraries marked as Expired & linked Admins set to Inactive.`);
      } else {
        console.log("ℹ️ No libraries found to be expired today.");
      }

    } catch (error) {
      console.error("❌ Error running expiry cron job:", error.message);
    }
  });
};

export default initExpiryCron;