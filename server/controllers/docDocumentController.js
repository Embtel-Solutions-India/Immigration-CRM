const DocDocument = require('../models/DocDocument');
const { normalizeRole } = require('../utils/roles');

function buildScope(req) {
  const role = normalizeRole(req.user.role);
  if (role === 'superadmin' || role === 'admin') return {};
  return {};
}

exports.list = async (req, res, next) => {
  try {
    const filter = buildScope(req);
    const { clientId, caseId, status, isRequired, isCustom } = req.query;
    if (clientId) filter.clientId = clientId;
    if (caseId) filter.caseId = caseId;
    if (status) filter.status = status;
    if (isRequired !== undefined) filter.isRequired = isRequired === 'true';
    if (isCustom !== undefined) filter.isCustom = isCustom === 'true';

    const docs = await DocDocument.find(filter)
      .populate('clientId', 'name')
      .populate('caseId', 'title')
      .populate('uploadedBy', 'name')
      .sort({ createdAt: -1 });
    res.json(docs);
  } catch (e) { next(e); }
};

exports.create = async (req, res, next) => {
  try {
    const { clientId, caseId, name, docType, isRequired, status, notes, fileName, fileUrl, isCustom } = req.body;
    if (!clientId || !name) {
      return res.status(400).json({ error: 'clientId and name are required' });
    }
    const doc = await DocDocument.create({
      clientId, caseId, name, docType: docType || 'Other',
      isRequired: isRequired || false,
      status: status || 'Pending',
      notes, fileName, fileUrl,
      isCustom: isCustom || false,
      uploadedBy: req.user._id,
      uploadDate: new Date(),
    });
    await doc.populate([
      { path: 'clientId', select: 'name' },
      { path: 'caseId', select: 'title' },
      { path: 'uploadedBy', select: 'name' },
    ]);
    res.status(201).json(doc);
  } catch (e) { next(e); }
};

exports.getById = async (req, res, next) => {
  try {
    const doc = await DocDocument.findById(req.params.id)
      .populate('clientId', 'name email')
      .populate('caseId', 'title')
      .populate('uploadedBy', 'name');
    if (!doc) return res.status(404).json({ error: 'Document not found' });
    res.json(doc);
  } catch (e) { next(e); }
};

exports.update = async (req, res, next) => {
  try {
    const updates = { ...req.body };
    if (updates.status === 'Submitted' && !updates.uploadDate) {
      updates.uploadDate = new Date();
      updates.uploadedBy = req.user._id;
    }
    const doc = await DocDocument.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).populate('uploadedBy', 'name');
    if (!doc) return res.status(404).json({ error: 'Document not found' });
    res.json(doc);
  } catch (e) { next(e); }
};

exports.remove = async (req, res, next) => {
  try {
    const doc = await DocDocument.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Document not found' });
    res.json({ success: true });
  } catch (e) { next(e); }
};

exports.getStats = async (req, res, next) => {
  try {
    const { clientId, caseId } = req.query;
    const filter = {};
    if (clientId) filter.clientId = clientId;
    if (caseId) filter.caseId = caseId;

    const [total, submitted, pending, missing, approved] = await Promise.all([
      DocDocument.countDocuments(filter),
      DocDocument.countDocuments({ ...filter, status: 'Submitted' }),
      DocDocument.countDocuments({ ...filter, status: 'Pending' }),
      DocDocument.countDocuments({ ...filter, status: 'Missing' }),
      DocDocument.countDocuments({ ...filter, status: 'Approved' }),
    ]);
    res.json({ total, submitted, pending, missing, approved, remaining: total - submitted - approved });
  } catch (e) { next(e); }
};
