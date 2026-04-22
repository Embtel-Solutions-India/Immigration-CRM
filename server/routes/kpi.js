const router = require('express').Router();
const ctrl = require('../controllers/kpiController');
const verifyToken = require('../middleware/auth');
const { requireRole } = require('../middleware/roleGuard');

router.use(verifyToken);

router.post('/set', requireRole('admin', 'superadmin'), ctrl.setTarget);
router.get('/user/:userId', ctrl.getUserTargets);
router.get('/team/:team', requireRole('admin', 'superadmin'), ctrl.getTeamTargets);
router.patch('/:id/progress', requireRole('admin', 'superadmin'), ctrl.updateProgress);
router.get('/ceo-summary', requireRole('superadmin'), ctrl.ceoSummary);

module.exports = router;
