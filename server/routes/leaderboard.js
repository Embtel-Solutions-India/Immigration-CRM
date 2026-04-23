const router = require('express').Router();
const ctrl = require('../controllers/leaderboardController');
const verifyToken = require('../middleware/auth');
const { requireRole } = require('../middleware/roleGuard');

router.use(verifyToken);

router.get('/sales', requireRole('admin', 'hr_admin', 'hr_user', 'superadmin'), ctrl.salesLeaderboard);
router.get('/marketing', requireRole('admin', 'hr_admin', 'hr_user', 'superadmin'), ctrl.marketingLeaderboard);
router.get('/production', requireRole('admin', 'hr_admin', 'hr_user', 'superadmin'), ctrl.productionLeaderboard);
router.get('/ceo-top-performers', requireRole('hr_admin', 'superadmin'), ctrl.ceoTopPerformers);

module.exports = router;
