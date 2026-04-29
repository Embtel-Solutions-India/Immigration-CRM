const DocCase = require('../models/DocCase');
const { normalizeRole } = require('../utils/roles');

function buildScope(req) {
  const role = normalizeRole(req.user.role);
  if (role === 'superadmin' || role === 'admin') return {};
  return { assignedTo: req.user._id };
}

exports.list = async (req, res, next) => {
  try {
    const filter = buildScope(req);
    const { clientId, status, serviceType, assignedTo, search } = req.query;
    if (clientId) filter.clientId = clientId;
    if (status) filter.status = status;
    if (serviceType) filter.serviceType = serviceType;
    if (assignedTo) filter.assignedTo = assignedTo;
    if (search) filter.title = { $regex: search, $options: 'i' };

    const cases = await DocCase.find(filter)
      .populate('clientId', 'name email serviceType')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 });
    res.json(cases);
  } catch (e) { next(e); }
};

exports.create = async (req, res, next) => {
  try {
    const { clientId, title, serviceType, status, workflowStage, assignedTo, deadline, payment, workValue, notes } = req.body;
    if (!clientId || !title) {
      return res.status(400).json({ error: 'clientId and title are required' });
    }
    const docCase = await DocCase.create({
      clientId, title, serviceType, status, workflowStage, assignedTo,
      deadline, payment, workValue, notes,
      createdBy: req.user._id,
    });
    await docCase.populate([
      { path: 'clientId', select: 'name email' },
      { path: 'assignedTo', select: 'name email' },
    ]);
    res.status(201).json(docCase);
  } catch (e) { next(e); }
};

exports.getById = async (req, res, next) => {
  try {
    const docCase = await DocCase.findById(req.params.id)
      .populate('clientId', 'name email mobile address serviceType')
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name');
    if (!docCase) return res.status(404).json({ error: 'Case not found' });
    res.json(docCase);
  } catch (e) { next(e); }
};

exports.update = async (req, res, next) => {
  try {
    const docCase = await DocCase.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    ).populate('clientId', 'name email').populate('assignedTo', 'name email');
    if (!docCase) return res.status(404).json({ error: 'Case not found' });
    res.json(docCase);
  } catch (e) { next(e); }
};

exports.remove = async (req, res, next) => {
  try {
    const docCase = await DocCase.findByIdAndDelete(req.params.id);
    if (!docCase) return res.status(404).json({ error: 'Case not found' });
    res.json({ success: true });
  } catch (e) { next(e); }
};
