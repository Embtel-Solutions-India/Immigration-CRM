const router = require('express').Router();
const ctrl = require('../controllers/workUnitController');
const verifyToken = require('../middleware/auth');
const { requireRole, teamScope } = require('../middleware/roleGuard');

router.use(verifyToken, teamScope);

router.get('/', ctrl.list);
router.post('/', ctrl.create);
router.get('/:id', ctrl.getById);
router.patch('/:id', ctrl.update);
router.delete('/:id', requireRole('admin', 'superadmin'), ctrl.remove);
router.post('/:id/comments', ctrl.addComment);
router.post('/:id/timer/start', ctrl.timerStart);
router.post('/:id/timer/stop', ctrl.timerStop);

module.exports = router;
