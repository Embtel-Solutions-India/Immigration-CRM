const router = require('express').Router();
const ctrl = require('../controllers/reportController');
const verifyToken = require('../middleware/auth');
const { requireRole, teamScope } = require('../middleware/roleGuard');

router.use(verifyToken);

router.get('/user/:userId', ctrl.userReport);
router.get('/team/:team', requireRole('admin', 'hr_admin', 'superadmin'), ctrl.teamReport);
router.get('/org', requireRole('superadmin'), ctrl.orgReport);
router.get('/pipeline', requireRole('admin', 'hr_admin', 'superadmin'), ctrl.pipeline);
router.get('/activity', teamScope, ctrl.activity);

module.exports = router;
