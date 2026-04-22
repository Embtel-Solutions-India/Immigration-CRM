const router = require('express').Router();
const ctrl = require('../controllers/authController');
const verifyToken = require('../middleware/auth');

router.post('/register', ctrl.register);
router.post('/login', ctrl.login);
router.post('/refresh', ctrl.refresh);
router.post('/logout', verifyToken, ctrl.logout);

module.exports = router;
