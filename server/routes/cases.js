const router = require('express').Router();
const ctrl = require('../controllers/caseController');
const verifyToken = require('../middleware/auth');
const { requireRole } = require('../middleware/roleGuard');

router.use(verifyToken);

router.get('/', ctrl.list);
router.post('/', requireRole('admin', 'superadmin'), ctrl.create);
router.get('/:id', ctrl.getById);
router.patch('/:id', requireRole('admin', 'superadmin'), ctrl.update);
router.post('/:id/status-update', ctrl.addStatusUpdate);

module.exports = router;
