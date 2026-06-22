import cron from "node-cron";
import Library from "../../models/Library.js";
import Admin from "../../models/Admin.js";
import { sendPushNotification } from "../Firebase/notification.js"; // Helper imported

const initExpiryCron = () => {
  // Har raat 12:00 AM baje chalega
  cron.schedule("0 0 * * *", async () => {
    console.log("⏰ --- Running Daily Library Expiry Check & Notifications ---");
    try {
      const today = new Date();
      
      // 🚨 FLOW A: RECENTLY EXPIRED LIBRARIES MANAGEMENT
      const expiredLibraries = await Library.find({
        status: { $ne: "Expired" }, 
        accessEndDate: { $lt: today, $ne: null } 
      });

      if (expiredLibraries.length > 0) {
        const expiredIds = expiredLibraries.map(lib => lib._id);

        // Fetch target admins before updating status so we can alert them
        const adminsToAlert = await Admin.find({ libraryId: { $in: expiredIds }, role: "admin" });

        await Library.updateMany({ _id: { $in: expiredIds } }, { $set: { status: "Expired" } });
        await Admin.updateMany({ libraryId: { $in: expiredIds }, role: "admin" }, { $set: { status: "Inactive" } });

        // Send notifications to expired admins
        for (const adminUser of adminsToAlert) {
            if (adminUser.fcmToken) {
                try {
                    await sendPushNotification(
                        adminUser.fcmToken,
                        "License Expired 🛑",
                        `Your library management access token has expired. Please submit a renewal request immediately.`,
                        { url: "/login" }
                    );
                } catch (err) {
                    console.error(`FCM failed for admin ${adminUser.email}:`, err.message);
                }
            }
        }
      }

      // ⏳ FLOW B: SOON TO EXPIRE WARNING (3 Days Left)
      const threeDaysFromNow = new Date();
      threeDaysFromNow.setDate(today.getDate() + 3);
      
      const warningLibraries = await Library.find({
         status: "Active",
         accessEndDate: { 
            $gte: today, 
            $lte: threeDaysFromNow 
         }
      });

      for (const lib of warningLibraries) {
          const linkedAdmins = await Admin.find({ libraryId: lib._id, role: "admin" });
          for (const adminUser of linkedAdmins) {
              if (adminUser.fcmToken) {
                  try {
                      await sendPushNotification(
                          adminUser.fcmToken,
                          "Subscription Expiring Soon! ⏳",
                          `Your system access for "${lib.name}" will expire on ${new Date(lib.accessEndDate).toDateString()}. Renew now to avoid interruption.`,
                          { url: "/dashboard" }
                      );
                  } catch (err) {
                      console.error("FCM warning failed:", err.message);
                  }
              }
          }
      }

    } catch (error) {
      console.error("❌ Error running expiry cron job:", error.message);
    }
  });
};

export default initExpiryCron;