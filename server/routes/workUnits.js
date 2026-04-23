const router = require('express').Router();
const ctrl = require('../controllers/workUnitController');
const verifyToken = require('../middleware/auth');
const { requireRole, teamScope } = require('../middleware/roleGuard');

router.use(verifyToken, teamScope);

router.get('/', ctrl.list);
router.post('/', requireRole('user', 'admin', 'hr_user', 'hr_admin', 'superadmin'), ctrl.create);
router.get('/:id', ctrl.getById);
router.patch('/:id', requireRole('user', 'admin', 'hr_user', 'hr_admin', 'superadmin'), ctrl.update);
router.delete('/:id', requireRole('admin', 'superadmin'), ctrl.remove);
router.post('/:id/comments', requireRole('user', 'admin', 'hr_user', 'hr_admin', 'superadmin'), ctrl.addComment);
router.post('/:id/timer/start', requireRole('user', 'admin', 'hr_user', 'hr_admin', 'superadmin'), ctrl.timerStart);
router.post('/:id/timer/stop', requireRole('user', 'admin', 'hr_user', 'hr_admin', 'superadmin'), ctrl.timerStop);

module.exports = router;
