/** Set ALLOW_LIBRARY_ADMIN_APPROVE=true in backend .env for local dev only (any logged-in admin can approve requests). */
export const isSuperAdmin = (req, res, next) => {
  if (req.admin.role === "super_admin") return next();
  if (process.env.ALLOW_LIBRARY_ADMIN_APPROVE === "true") return next();
  return res.status(403).json({ message: "Access denied" });
};