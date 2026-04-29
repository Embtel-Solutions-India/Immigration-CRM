const DocClient = require('../models/DocClient');
const { normalizeRole } = require('../utils/roles');

function buildScope(req) {
  const role = normalizeRole(req.user.role);
  if (role === 'superadmin') return {};
  if (role === 'admin') return {};
  return { assignedTo: req.user._id };
}

exports.list = async (req, res, next) => {
  try {
    const filter = buildScope(req);
    const { search, status, serviceType, assignedTo } = req.query;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } },
      ];
    }
    if (status) filter.status = status;
    if (serviceType) filter.serviceType = serviceType;
    if (assignedTo) filter.assignedTo = assignedTo;

    const clients = await DocClient.find(filter)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });
    res.json(clients);
  } catch (e) { next(e); }
};

exports.create = async (req, res, next) => {
  try {
    const { name, email, mobile, address, serviceType, assignedTo, amountPaid, totalWorkValue, notes, customFields } = req.body;
    if (!name || !email || !mobile || !address) {
      return res.status(400).json({ error: 'name, email, mobile, and address are required' });
    }
    const client = await DocClient.create({
      name, email, mobile, address, serviceType, assignedTo,
      amountPaid: amountPaid || 0,
      totalWorkValue: totalWorkValue || 0,
      notes, customFields,
      createdBy: req.user._id,
    });
    await client.populate('assignedTo', 'name email');
    res.status(201).json(client);
  } catch (e) { next(e); }
};

exports.getById = async (req, res, next) => {
  try {
    const client = await DocClient.findById(req.params.id)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name');
    if (!client) return res.status(404).json({ error: 'Client not found' });
    res.json(client);
  } catch (e) { next(e); }
};

exports.update = async (req, res, next) => {
  try {
    const client = await DocClient.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    ).populate('assignedTo', 'name email');
    if (!client) return res.status(404).json({ error: 'Client not found' });
    res.json(client);
  } catch (e) { next(e); }
};

exports.remove = async (req, res, next) => {
  try {
    const client = await DocClient.findByIdAndDelete(req.params.id);
    if (!client) return res.status(404).json({ error: 'Client not found' });
    res.json({ success: true });
  } catch (e) { next(e); }
};
