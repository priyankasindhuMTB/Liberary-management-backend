import Library from "../models/Library.js";

export const verifySubscriptionActive = async (req, res, next) => {
  try {
    // Agar super_admin login hai toh pure structural blocks skip karo
    if (req.admin && req.admin.role === "super_admin") {
      return next();
    }

    const libraryId = req.admin?.libraryId;

    if (!libraryId) {
      return res.status(400).json({ message: "Tenant branch isolation token missing." });
    }

    const library = await Library.findById(libraryId);
    if (!library) {
      return res.status(404).json({ message: "Library branch registration missing inside system files." });
    }

    // Real-time Expiry validation check
    if (library.accessEndDate && new Date() > new Date(library.accessEndDate)) {
      if (library.status !== "Expired") {
        library.status = "Expired";
        await library.save();
      }

      return res.status(403).json({
        success: false,
        code: "SUBSCRIPTION_EXPIRED",
        message: `Your system license for "${library.name}" expired on ${new Date(library.accessEndDate).toDateString()}. Please request an extension.`
      });
    }

    next();
  } catch (error) {
    res.status(500).json({ message: "Security framework validation failure", error: error.message });
  }
};