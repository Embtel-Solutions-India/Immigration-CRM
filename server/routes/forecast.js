const router = require('express').Router();
const ctrl = require('../controllers/forecastController');
const verifyToken = require('../middleware/auth');
const { requireRole } = require('../middleware/roleGuard');

router.use(verifyToken, requireRole('admin', 'superadmin', 'overall_admin'));

router.get('/revenue', ctrl.getForecast);
router.get('/confidence', ctrl.getConfidence);
router.get('/history', ctrl.getHistory);

module.exports = router;
