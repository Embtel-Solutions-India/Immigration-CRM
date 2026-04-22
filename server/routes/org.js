const router = require('express').Router();
const ctrl = require('../controllers/orgController');
const verifyToken = require('../middleware/auth');
const { requireRole } = require('../middleware/roleGuard');

router.use(verifyToken);

router.get('/settings', ctrl.getSettings);
router.patch('/settings', requireRole('superadmin'), ctrl.updateSettings);
router.post('/settings/visa-categories', requireRole('superadmin', 'admin'), ctrl.addVisaCategory);
router.post('/settings/reviewers', requireRole('superadmin', 'admin'), ctrl.addReviewer);

module.exports = router;
