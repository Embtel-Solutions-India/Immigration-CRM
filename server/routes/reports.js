const router = require('express').Router();
const ctrl = require('../controllers/reportController');
const verifyToken = require('../middleware/auth');
const { requireRole, teamScope } = require('../middleware/roleGuard');

router.use(verifyToken);

router.get('/user/:userId', ctrl.userReport);
router.get('/team/:team', requireRole('admin', 'hr_admin', 'superadmin', 'overall_admin'), ctrl.teamReport);
router.get('/org', requireRole('superadmin'), ctrl.orgReport);
router.get('/overall', requireRole('overall_admin', 'superadmin'), ctrl.overallReport);
router.get('/pipeline', requireRole('admin', 'hr_admin', 'superadmin', 'overall_admin'), ctrl.pipeline);
router.get('/activity', teamScope, ctrl.activity);

module.exports = router;
