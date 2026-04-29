const { normalizeRole, OVERALL_ADMIN_TEAMS } = require('../utils/roles');

const requireRole = (...roles) => (req, res, next) => {
  const role = normalizeRole(req.user.role);
  const allowed = roles.map(r => normalizeRole(r));
  if (!allowed.includes(role)) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }
  next();
};

const teamScope = (req, _res, next) => {
  const role = normalizeRole(req.user.role);
  if (role === 'user' || role === 'hr_user') {
    req.scopeFilter = { userId: req.user._id };
  } else if (role === 'admin') {
    req.scopeFilter = { team: req.user.team };
  } else if (role === 'overall_admin') {
    req.scopeFilter = {
      $or: [
        { userId: req.user._id },
        { team: { $in: OVERALL_ADMIN_TEAMS } },
      ],
    };
  } else {
    req.scopeFilter = {};
  }
  next();
};

const requireDocTeam = (req, res, next) => {
  const role = normalizeRole(req.user.role);
  if (role === 'superadmin') return next();
  if (req.user.team === 'Documentation') return next();
  return res.status(403).json({ error: 'Access restricted to Documentation team' });
};

module.exports = { requireRole, teamScope, requireDocTeam };
