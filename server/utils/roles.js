function normalizeRole(role) {
  const value = String(role || '').toLowerCase();
  if (value === 'hr') return 'hr_admin';
  return value;
}

function isSuperAdmin(role) {
  return normalizeRole(role) === 'superadmin';
}

function isTeamAdmin(role) {
  return normalizeRole(role) === 'admin';
}

function isHrAdmin(role) {
  return normalizeRole(role) === 'hr_admin';
}

function isHrUser(role) {
  return normalizeRole(role) === 'hr_user';
}

function isHrRole(role) {
  const normalized = normalizeRole(role);
  return normalized === 'hr_admin' || normalized === 'hr_user';
}

function isOverallAdmin(role) {
  return normalizeRole(role) === 'overall_admin';
}

const OVERALL_ADMIN_TEAMS = ['Sales', 'Marketing', 'Production'];

module.exports = {
  normalizeRole,
  isSuperAdmin,
  isTeamAdmin,
  isHrAdmin,
  isHrUser,
  isHrRole,
  isOverallAdmin,
  OVERALL_ADMIN_TEAMS,
};
