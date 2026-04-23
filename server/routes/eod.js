const router = require('express').Router();
const ctrl = require('../controllers/eodController');
const verifyToken = require('../middleware/auth');
const { requireRole } = require('../middleware/roleGuard');

router.use(verifyToken);

router.post('/generate/:userId', requireRole('user', 'admin', 'hr_user', 'hr_admin', 'superadmin'), ctrl.generate);
router.get('/team', requireRole('admin', 'hr_admin', 'superadmin'), ctrl.getTeamDay);
router.get('/teams/summary', requireRole('hr_admin', 'superadmin'), ctrl.getTeamSummary);
router.get('/user/:userId', ctrl.getForUser);
router.get('/:userId', ctrl.getForUser);

module.exports = router;
