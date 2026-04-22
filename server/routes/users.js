const router = require('express').Router();
const ctrl = require('../controllers/userController');
const verifyToken = require('../middleware/auth');
const { requireRole } = require('../middleware/roleGuard');

router.use(verifyToken);

router.get('/me', ctrl.getMe);
router.patch('/me', ctrl.updateMe);
router.get('/', requireRole('admin', 'superadmin'), ctrl.getAll);
router.get('/:id', requireRole('admin', 'superadmin'), ctrl.getById);
router.patch('/:id', requireRole('superadmin'), ctrl.updateUser);
router.patch('/:id/status', requireRole('superadmin'), ctrl.updateStatus);

module.exports = router;
