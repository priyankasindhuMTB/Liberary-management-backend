/** Trim + lowercase for storage and comparisons. */
export function normalizeEmail(email) {
  if (typeof email !== "string") return "";
  return email.trim().toLowerCase();
}

/** Case-insensitive exact match for Mongo string field (email). */
export function emailExactMatch(email) {
  const trimmed = typeof email === "string" ? email.trim() : "";
  if (!trimmed) return null;
  const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`^${escaped}$`, "i");
}
