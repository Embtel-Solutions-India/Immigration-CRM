const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logActivity = require('../utils/activityLogger');

const signAccess = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '15m' });

const signRefresh = (payload) =>
  jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });

function setCookie(res, token) {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

exports.register = async (req, res, next) => {
  try {
    const { name, email, password, team, role } = req.body;
    if (!name || !email || !password || !team) {
      return res.status(400).json({ error: 'name, email, password, team are required' });
    }
    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ error: 'Email already registered' });

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, passwordHash, team, role: role || 'user' });
    await logActivity(user._id, team, 'registered', 'User', user._id);

    const payload = { _id: user._id, role: user.role, team: user.team };
    const accessToken = signAccess(payload);
    const refreshToken = signRefresh(payload);
    user.refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    await user.save();
    setCookie(res, refreshToken);

    res.status(201).json({ accessToken, user: user.toSafeObject() });
  } catch (e) { next(e); }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email, isActive: true });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const payload = { _id: user._id, role: user.role, team: user.team };
    const accessToken = signAccess(payload);
    const refreshToken = signRefresh(payload);
    user.refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    await user.save();
    setCookie(res, refreshToken);
    await logActivity(user._id, user.team, 'login', 'User', user._id);

    res.json({ accessToken, user: user.toSafeObject() });
  } catch (e) { next(e); }
};

exports.refresh = async (req, res, next) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) return res.status(401).json({ error: 'No refresh token' });

    let decoded;
    try { decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET); }
    catch { return res.status(401).json({ error: 'Invalid refresh token' }); }

    const user = await User.findById(decoded._id);
    if (!user || !user.refreshTokenHash) return res.status(401).json({ error: 'Session expired' });

    const valid = await bcrypt.compare(token, user.refreshTokenHash);
    if (!valid) return res.status(401).json({ error: 'Token mismatch' });

    const payload = { _id: user._id, role: user.role, team: user.team };
    const accessToken = signAccess(payload);
    const refreshToken = signRefresh(payload);
    user.refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    await user.save();
    setCookie(res, refreshToken);

    res.json({ accessToken, user: user.toSafeObject() });
  } catch (e) { next(e); }
};

exports.logout = async (req, res, next) => {
  try {
    if (req.user) {
      await User.findByIdAndUpdate(req.user._id, { refreshTokenHash: null });
    }
    res.clearCookie('refreshToken');
    res.json({ message: 'Logged out' });
  } catch (e) { next(e); }
};
