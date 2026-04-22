const router = require('express').Router();
const ctrl = require('../controllers/leaveController');
const verifyToken = require('../middleware/auth');
const { requireRole } = require('../middleware/roleGuard');

router.use(verifyToken);

router.post('/request', ctrl.request);
router.get('/pending', requireRole('admin'), ctrl.getPending);
router.patch('/:id/review', requireRole('admin'), ctrl.review);
router.get('/team/calendar', requireRole('admin'), ctrl.teamCalendar);
router.get('/team', requireRole('admin'), ctrl.getTeamAll);
router.get('/all', requireRole('superadmin'), ctrl.getAll);
router.get('/user/:userId', ctrl.userHistory);

module.exports = router;
