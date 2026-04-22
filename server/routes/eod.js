const router = require('express').Router();
const ctrl = require('../controllers/eodController');
const verifyToken = require('../middleware/auth');
const { requireRole } = require('../middleware/roleGuard');

router.use(verifyToken);

router.post('/generate/:userId', ctrl.generate);
router.get('/team', requireRole('admin', 'superadmin'), ctrl.getTeamDay);
router.get('/teams/summary', requireRole('superadmin'), ctrl.getTeamSummary);
router.get('/user/:userId', ctrl.getForUser);
router.get('/:userId', ctrl.getForUser);

module.exports = router;
