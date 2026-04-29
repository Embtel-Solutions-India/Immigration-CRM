const DocWorkUnit = require('../models/DocWorkUnit');
const { normalizeRole } = require('../utils/roles');

function buildScope(req) {
  const role = normalizeRole(req.user.role);
  if (role === 'superadmin' || role === 'admin') return {};
  return { assignedTo: req.user._id };
}

exports.list = async (req, res, next) => {
  try {
    const filter = buildScope(req);
    const { clientId, caseId, status, assignedTo } = req.query;
    if (clientId) filter.clientId = clientId;
    if (caseId) filter.caseId = caseId;
    if (status) filter.status = status;
    if (assignedTo) filter.assignedTo = assignedTo;

    const units = await DocWorkUnit.find(filter)
      .populate('clientId', 'name serviceType')
      .populate('caseId', 'title')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 });
    res.json(units);
  } catch (e) { next(e); }
};

exports.create = async (req, res, next) => {
  try {
    const { title, description, clientId, caseId, assignedTo, status, value, dueDate, completionPct } = req.body;
    if (!title || !clientId) {
      return res.status(400).json({ error: 'title and clientId are required' });
    }
    const unit = await DocWorkUnit.create({
      title, description, clientId, caseId,
      assignedTo: assignedTo || req.user._id,
      status: status || 'Pending',
      value: value || 0,
      dueDate, completionPct: completionPct || 0,
      createdBy: req.user._id,
    });
    await unit.populate([
      { path: 'clientId', select: 'name' },
      { path: 'caseId', select: 'title' },
      { path: 'assignedTo', select: 'name email' },
    ]);
    res.status(201).json(unit);
  } catch (e) { next(e); }
};

exports.getById = async (req, res, next) => {
  try {
    const unit = await DocWorkUnit.findById(req.params.id)
      .populate('clientId', 'name email')
      .populate('caseId', 'title')
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name');
    if (!unit) return res.status(404).json({ error: 'Work unit not found' });
    res.json(unit);
  } catch (e) { next(e); }
};

exports.update = async (req, res, next) => {
  try {
    const unit = await DocWorkUnit.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    ).populate('assignedTo', 'name email').populate('clientId', 'name');
    if (!unit) return res.status(404).json({ error: 'Work unit not found' });
    res.json(unit);
  } catch (e) { next(e); }
};

exports.remove = async (req, res, next) => {
  try {
    const unit = await DocWorkUnit.findByIdAndDelete(req.params.id);
    if (!unit) return res.status(404).json({ error: 'Work unit not found' });
    res.json({ success: true });
  } catch (e) { next(e); }
};
