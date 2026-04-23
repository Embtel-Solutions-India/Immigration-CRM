export function normalizeRole(role) {
  const value = String(role || "").toLowerCase();
  return value === "hr" ? "hr_admin" : value;
}

export function isSuperAdminRole(role) {
  return normalizeRole(role) === "superadmin";
}

export function isAdminRole(role) {
  return normalizeRole(role) === "admin";
}

export function isHrAdminRole(role) {
  return normalizeRole(role) === "hr_admin";
}

export function isHrUserRole(role) {
  return normalizeRole(role) === "hr_user";
}

export function isHrRole(role) {
  const normalized = normalizeRole(role);
  return normalized === "hr_admin" || normalized === "hr_user";
}
