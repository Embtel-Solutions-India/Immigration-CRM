const DocChecklist = require('../models/DocChecklist');
const { WORKFLOW_STAGES } = require('../models/DocChecklist');

const DEFAULT_ITEMS = [
  { label: 'Engagement letter signed', required: true, order: 0 },
  { label: 'Client information form completed', required: true, order: 1 },
  { label: 'Prior year returns / statements received', required: false, order: 2 },
  { label: 'Bank statements received', required: true, order: 3 },
  { label: 'Supporting documents collected', required: true, order: 4 },
  { label: 'Work in progress', required: false, order: 5 },
  { label: 'Review completed', required: false, order: 6 },
  { label: 'Final deliverable sent to client', required: false, order: 7 },
];

exports.getForClient = async (req, res, next) => {
  try {
    const { clientId } = req.params;
    const { caseId } = req.query;
    const filter = { clientId };
    if (caseId) filter.caseId = caseId;

    let checklist = await DocChecklist.findOne(filter);
    if (!checklist) {
      checklist = await DocChecklist.create({
        clientId,
        caseId: caseId || undefined,
        items: DEFAULT_ITEMS,
        stage: 'Checklist Sent',
      });
    }
    res.json(checklist);
  } catch (e) { next(e); }
};

exports.updateStage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { stage } = req.body;
    if (!WORKFLOW_STAGES.includes(stage)) {
      return res.status(400).json({ error: 'Invalid stage' });
    }
    const checklist = await DocChecklist.findByIdAndUpdate(id, { stage }, { new: true });
    if (!checklist) return res.status(404).json({ error: 'Checklist not found' });
    res.json(checklist);
  } catch (e) { next(e); }
};

exports.toggleItem = async (req, res, next) => {
  try {
    const { id, itemId } = req.params;
    const checklist = await DocChecklist.findById(id);
    if (!checklist) return res.status(404).json({ error: 'Checklist not found' });

    const item = checklist.items.id(itemId);
    if (!item) return res.status(404).json({ error: 'Item not found' });
    item.completed = !item.completed;
    await checklist.save();
    res.json(checklist);
  } catch (e) { next(e); }
};

exports.addCustomItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { label, required } = req.body;
    if (!label) return res.status(400).json({ error: 'label is required' });

    const checklist = await DocChecklist.findById(id);
    if (!checklist) return res.status(404).json({ error: 'Checklist not found' });

    const maxOrder = checklist.items.reduce((m, i) => Math.max(m, i.order), 0);
    checklist.items.push({ label, required: required || false, isCustom: true, order: maxOrder + 1 });
    await checklist.save();
    res.json(checklist);
  } catch (e) { next(e); }
};

exports.removeItem = async (req, res, next) => {
  try {
    const { id, itemId } = req.params;
    const checklist = await DocChecklist.findById(id);
    if (!checklist) return res.status(404).json({ error: 'Checklist not found' });

    const item = checklist.items.id(itemId);
    if (!item) return res.status(404).json({ error: 'Item not found' });
    if (!item.isCustom) return res.status(400).json({ error: 'Only custom items can be removed' });
    item.deleteOne();
    await checklist.save();
    res.json(checklist);
  } catch (e) { next(e); }
};
