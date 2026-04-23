const router = require('express').Router();
const ctrl = require('../controllers/leaderboardController');
const verifyToken = require('../middleware/auth');
const { requireRole } = require('../middleware/roleGuard');

router.use(verifyToken);

router.get('/sales', requireRole('admin', 'superadmin'), ctrl.salesLeaderboard);
router.get('/marketing', requireRole('admin', 'superadmin'), ctrl.marketingLeaderboard);
router.get('/ceo-top-performers', requireRole('superadmin'), ctrl.ceoTopPerformers);

module.exports = router;
