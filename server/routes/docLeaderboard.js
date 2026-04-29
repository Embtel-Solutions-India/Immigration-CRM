const router = require('express').Router();
const ctrl = require('../controllers/docLeaderboardController');
const verifyToken = require('../middleware/auth');
const { requireRole, requireDocTeam } = require('../middleware/roleGuard');

router.use(verifyToken, requireDocTeam);

router.get('/', requireRole('admin', 'superadmin'), ctrl.getLeaderboard);

module.exports = router;
