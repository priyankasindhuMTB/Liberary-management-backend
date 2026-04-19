export const isSuperAdmin = (req, res, next) => {
  if (req.admin.role === "super_admin") return next();

  return res.status(403).json({ message: "Access denied: Super Admin only" });
};