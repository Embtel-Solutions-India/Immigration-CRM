const router = require('express').Router();
const ctrl = require('../controllers/webhookController');
const verifyToken = require('../middleware/auth');
const { requireRole } = require('../middleware/roleGuard');

// Public endpoint — GHL posts here without auth token
router.post('/gohighlevel', ctrl.receive);

// Admin-only management endpoints
router.get('/logs', verifyToken, requireRole('admin', 'superadmin'), ctrl.getLogs);
router.post('/retry/:logId', verifyToken, requireRole('admin', 'superadmin'), ctrl.retry);
router.get('/integrations/status', verifyToken, requireRole('admin', 'superadmin'), ctrl.integrationStatus);

module.exports = router;
