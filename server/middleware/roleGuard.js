const { normalizeRole } = require('../utils/roles');

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
  } else {
    req.scopeFilter = {};
  }
  next();
};

module.exports = { requireRole, teamScope };
