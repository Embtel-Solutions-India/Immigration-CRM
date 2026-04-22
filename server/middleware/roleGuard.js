const requireRole = (...roles) => (req, res, next) => {
  const role = (req.user.role || '').toLowerCase();
  const allowed = roles.map(r => r.toLowerCase());
  if (!allowed.includes(role)) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }
  next();
};

const teamScope = (req, _res, next) => {
  const role = (req.user.role || '').toLowerCase();
  if (role === 'user') {
    req.scopeFilter = { userId: req.user._id };
  } else if (role === 'admin') {
    req.scopeFilter = { team: req.user.team };
  } else {
    req.scopeFilter = {};
  }
  next();
};

module.exports = { requireRole, teamScope };
