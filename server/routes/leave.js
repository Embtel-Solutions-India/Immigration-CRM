const router = require('express').Router();
const ctrl = require('../controllers/leaveController');
const verifyToken = require('../middleware/auth');
const { requireRole } = require('../middleware/roleGuard');

router.use(verifyToken);

router.post('/request', ctrl.request);
router.get('/pending', requireRole('hr_admin', 'superadmin'), ctrl.getPending);
router.patch('/:id/review', requireRole('hr_admin', 'superadmin'), ctrl.review);
router.get('/team/calendar', requireRole('admin', 'hr_admin', 'hr_user', 'superadmin'), ctrl.teamCalendar);
router.get('/team', requireRole('admin', 'hr_admin', 'hr_user', 'superadmin'), ctrl.getTeamAll);
router.get('/all', requireRole('hr_admin', 'superadmin'), ctrl.getAll);
router.get('/user/:userId', ctrl.userHistory);

module.exports = router;
