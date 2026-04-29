const router = require('express').Router();
const ctrl = require('../controllers/docChecklistController');
const verifyToken = require('../middleware/auth');
const { requireRole, requireDocTeam } = require('../middleware/roleGuard');

router.use(verifyToken, requireDocTeam);

router.get('/client/:clientId', requireRole('admin', 'user', 'superadmin'), ctrl.getForClient);
router.patch('/:id/stage', requireRole('admin', 'superadmin'), ctrl.updateStage);
router.patch('/:id/items/:itemId/toggle', requireRole('admin', 'user', 'superadmin'), ctrl.toggleItem);
router.post('/:id/items', requireRole('admin', 'superadmin'), ctrl.addCustomItem);
router.delete('/:id/items/:itemId', requireRole('admin', 'superadmin'), ctrl.removeItem);

module.exports = router;
