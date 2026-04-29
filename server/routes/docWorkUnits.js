const router = require('express').Router();
const ctrl = require('../controllers/docWorkUnitController');
const verifyToken = require('../middleware/auth');
const { requireRole, requireDocTeam } = require('../middleware/roleGuard');

router.use(verifyToken, requireDocTeam);

router.get('/', requireRole('admin', 'user', 'superadmin'), ctrl.list);
router.post('/', requireRole('admin', 'user', 'superadmin'), ctrl.create);
router.get('/:id', requireRole('admin', 'user', 'superadmin'), ctrl.getById);
router.patch('/:id', requireRole('admin', 'user', 'superadmin'), ctrl.update);
router.delete('/:id', requireRole('admin', 'superadmin'), ctrl.remove);

module.exports = router;
