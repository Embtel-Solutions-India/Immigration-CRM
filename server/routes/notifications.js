const router = require('express').Router();
const ctrl = require('../controllers/notificationController');
const verifyToken = require('../middleware/auth');

router.use(verifyToken);

router.get('/me', ctrl.getMine);
router.get('/:userId', ctrl.getForUser);
router.patch('/mark-all-read', ctrl.markAllRead);
router.patch('/:id/read', ctrl.markRead);
router.patch('/:id/unread', ctrl.markUnread);
router.post('/trigger', ctrl.create);

module.exports = router;
