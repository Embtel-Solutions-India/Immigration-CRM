const router = require('express').Router();
const ctrl = require('../controllers/chartsController');
const verifyToken = require('../middleware/auth');

router.use(verifyToken);

router.get('/sales/org', ctrl.salesOrg);
router.get('/sales/team/:teamId', ctrl.salesTeam);
router.get('/sales/user/:userId', ctrl.salesUser);
router.get('/marketing/org', ctrl.marketingOrg);
router.get('/marketing/team/:teamId', ctrl.marketingTeam);
router.get('/marketing/user/:userId', ctrl.marketingUser);

module.exports = router;
