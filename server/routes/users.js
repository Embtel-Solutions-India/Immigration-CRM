const router = require('express').Router();
const ctrl = require('../controllers/userController');
const verifyToken = require('../middleware/auth');
const { requireRole } = require('../middleware/roleGuard');

router.use(verifyToken);

router.get('/me', ctrl.getMe);
router.patch('/me', ctrl.updateMe);
router.post('/', requireRole('hr_admin', 'superadmin'), ctrl.createUser);
router.get('/', requireRole('admin', 'hr_admin', 'superadmin'), ctrl.getAll);
router.get('/:id', requireRole('admin', 'hr_admin', 'superadmin'), ctrl.getById);
router.patch('/:id', requireRole('hr_admin', 'superadmin'), ctrl.updateUser);
router.patch('/:id/status', requireRole('hr_admin', 'superadmin'), ctrl.updateStatus);

module.exports = router;
