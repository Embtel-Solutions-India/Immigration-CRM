const router = require('express').Router();
const ctrl = require('../controllers/leaderboardController');
const verifyToken = require('../middleware/auth');
const { requireRole } = require('../middleware/roleGuard');

router.use(verifyToken);

router.get('/sales', requireRole('admin', 'superadmin'), ctrl.salesLeaderboard);
router.get('/ceo-top-performers', requireRole('admin', 'superadmin'), ctrl.ceoTopPerformers);

module.exports = router;
