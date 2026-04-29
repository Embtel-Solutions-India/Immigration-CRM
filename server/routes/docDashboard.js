const router = require('express').Router();
const ctrl = require('../controllers/docDashboardController');
const verifyToken = require('../middleware/auth');
const { requireRole, requireDocTeam } = require('../middleware/roleGuard');

router.use(verifyToken, requireDocTeam);

router.get('/stats', requireRole('admin', 'user', 'superadmin'), ctrl.getStats);
router.get('/monthly-trend', requireRole('admin', 'user', 'superadmin'), ctrl.getMonthlyTrend);
router.get('/client-progress', requireRole('admin', 'user', 'superadmin'), ctrl.getClientProgress);

module.exports = router;
