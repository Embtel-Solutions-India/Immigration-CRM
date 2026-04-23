const router = require('express').Router();
const ctrl = require('../controllers/auditController');
const verifyToken = require('../middleware/auth');
const { requireRole } = require('../middleware/roleGuard');

router.use(verifyToken, requireRole('hr_admin', 'superadmin'));

router.get('/', ctrl.getLogs);
router.get('/export', ctrl.exportCsv);

module.exports = router;
