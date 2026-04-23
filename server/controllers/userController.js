const bcrypt = require('bcryptjs');
const User = require('../models/User');
const logActivity = require('../utils/activityLogger');
const { normalizeRole, isHrAdmin, isHrRole } = require('../utils/roles');

const TEAM_VALUES = ['Sales', 'Marketing', 'Production', 'HR'];
const HR_ADMIN_ALLOWED_ROLES = ['user', 'admin', 'hr_user'];

function isPrivilegedRole(role) {
  const normalized = normalizeRole(role);
  return normalized === 'superadmin' || normalized === 'hr_admin';
}

function canManageTarget(actorRole, targetRole) {
  const actor = normalizeRole(actorRole);
  const target = normalizeRole(targetRole);
  if (actor === 'superadmin') return true;
  if (actor === 'hr_admin') return !isPrivilegedRole(target);
  return false;
}

exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: 'Not found' });
    res.json(user.toSafeObject());
  } catch (e) { next(e); }
};

exports.updateMe = async (req, res, next) => {
  try {
    const { name, password } = req.body;
    const user = await User.findById(req.user._id);
    if (name) user.name = name;
    if (password) user.passwordHash = await bcrypt.hash(password, 12);
    await user.save();
    res.json(user.toSafeObject());
  } catch (e) { next(e); }
};

exports.createUser = async (req, res, next) => {
  try {
    const actorRole = normalizeRole(req.user.role);
    const { name, email, password, team, role = 'user' } = req.body;
    const nextRole = normalizeRole(role);

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'name, email, password are required' });
    }

    if (isHrAdmin(actorRole) && !HR_ADMIN_ALLOWED_ROLES.includes(nextRole)) {
      return res.status(403).json({ error: 'HR admin can only create user/admin/hr user accounts' });
    }

    if (nextRole !== 'superadmin' && !isHrRole(nextRole) && !team) {
      return res.status(400).json({ error: 'team is required for non-superadmin accounts' });
    }
    if (team && !TEAM_VALUES.includes(team)) {
      return res.status(400).json({ error: 'Invalid team' });
    }

    const exists = await User.findOne({ email: String(email).toLowerCase().trim() });
    if (exists) return res.status(409).json({ error: 'Email already registered' });

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({
      name,
      email,
      passwordHash,
      role: nextRole,
      team: nextRole === 'superadmin' ? undefined : isHrRole(nextRole) ? 'HR' : team,
    });

    await logActivity(req.user._id, req.user.team || 'HR', 'created_user', 'User', user._id, {
      role: user.role,
      team: user.team || null,
    });

    res.status(201).json(user.toSafeObject());
  } catch (e) { next(e); }
};

exports.getAll = async (req, res, next) => {
  try {
    const role = normalizeRole(req.user.role);
    const filter = role === 'admin' ? { team: req.user.team } : {};
    const users = await User.find(filter, '-passwordHash -refreshTokenHash').sort({ name: 1 });
    res.json(users);
  } catch (e) { next(e); }
};

exports.getById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id, '-passwordHash -refreshTokenHash');
    if (!user) return res.status(404).json({ error: 'Not found' });
    res.json(user);
  } catch (e) { next(e); }
};

exports.updateStatus = async (req, res, next) => {
  try {
    const actorRole = normalizeRole(req.user.role);
    const target = await User.findById(req.params.id, 'role team');
    if (!target) return res.status(404).json({ error: 'Not found' });
    if (!canManageTarget(actorRole, target.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { isActive } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { isActive }, { new: true });
    res.json(user.toSafeObject());
  } catch (e) { next(e); }
};

exports.updateUser = async (req, res, next) => {
  try {
    const actorRole = normalizeRole(req.user.role);
    const target = await User.findById(req.params.id, 'role team');
    if (!target) return res.status(404).json({ error: 'Not found' });
    if (!canManageTarget(actorRole, target.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { name, role, team, isActive, password } = req.body;
    const updates = {};
    const unsets = {};
    if (name !== undefined) updates.name = name;

    if (role !== undefined) {
      const nextRole = normalizeRole(role);
      if (isHrAdmin(actorRole) && !HR_ADMIN_ALLOWED_ROLES.includes(nextRole)) {
        return res.status(403).json({ error: 'HR admin can only assign user/admin/hr user roles' });
      }
      updates.role = nextRole;
    }

    if (team !== undefined) {
      if (team !== null && !TEAM_VALUES.includes(team)) {
        return res.status(400).json({ error: 'Invalid team' });
      }
      updates.team = team;
    }

    if (isActive !== undefined) updates.isActive = isActive;
    if (password !== undefined) {
      if (!String(password).trim()) {
        return res.status(400).json({ error: 'password cannot be empty' });
      }
      updates.passwordHash = await bcrypt.hash(String(password), 12);
    }

    const nextRole = normalizeRole(updates.role ?? target.role);
    if (nextRole !== 'superadmin' && !isHrRole(nextRole) && updates.team === undefined && target.team == null) {
      return res.status(400).json({ error: 'team is required for non-superadmin accounts' });
    }
    if (nextRole === 'superadmin') {
      delete updates.team;
      unsets.team = 1;
    } else if (isHrRole(nextRole)) {
      updates.team = 'HR';
    }

    const updateDoc = Object.keys(unsets).length
      ? { ...(Object.keys(updates).length ? { $set: updates } : {}), $unset: unsets }
      : updates;
    const user = await User.findByIdAndUpdate(req.params.id, updateDoc, { new: true, runValidators: true });
    if (!user) return res.status(404).json({ error: 'Not found' });
    res.json(user.toSafeObject());
  } catch (e) { next(e); }
};
