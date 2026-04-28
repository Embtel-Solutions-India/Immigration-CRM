const router = require('express').Router();
const ctrl = require('../controllers/analyticsController');
const verifyToken = require('../middleware/auth');

router.use(verifyToken);

router.get('/heatmap/org', ctrl.orgHeatmap);
router.get('/heatmap/:userId', ctrl.heatmap);
router.get('/task-time-avg/:team', ctrl.taskTimeAvg);
router.get('/outliers/:team', ctrl.outliers);

module.exports = router;
