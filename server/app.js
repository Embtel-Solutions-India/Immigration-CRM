const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const errorHandler = require('./middleware/errorHandler');

const authRoutes         = require('./routes/auth');
const userRoutes         = require('./routes/users');
const workUnitRoutes     = require('./routes/workUnits');
const caseRoutes         = require('./routes/cases');
const reportRoutes       = require('./routes/reports');
const kpiRoutes          = require('./routes/kpi');
const leaderboardRoutes  = require('./routes/leaderboard');
const notifRoutes        = require('./routes/notifications');
const leaveRoutes        = require('./routes/leave');
const auditRoutes        = require('./routes/audit');
const eodRoutes          = require('./routes/eod');
const forecastRoutes     = require('./routes/forecast');
const webhookRoutes      = require('./routes/webhooks');
const analyticsRoutes    = require('./routes/analytics');
const chartsRoutes       = require('./routes/charts');
const orgRoutes          = require('./routes/org');
const docClientsRoutes   = require('./routes/docClients');
const docCasesRoutes     = require('./routes/docCases');
const docDocumentsRoutes = require('./routes/docDocuments');
const docWorkUnitsRoutes = require('./routes/docWorkUnits');
const docChecklistRoutes = require('./routes/docChecklist');
const docDashboardRoutes = require('./routes/docDashboard');
const docLeaderboardRoutes = require('./routes/docLeaderboard');

const app = express();

app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 1000 }));
app.use(express.json());
app.use(cookieParser());

app.use('/api/auth',         authRoutes);
app.use('/api/users',        userRoutes);
app.use('/api/work-units',   workUnitRoutes);
app.use('/api/cases',        caseRoutes);
app.use('/api/reports',      reportRoutes);
app.use('/api/kpi',          kpiRoutes);
app.use('/api/leaderboard',  leaderboardRoutes);
app.use('/api/notifications',notifRoutes);
app.use('/api/leave',        leaveRoutes);
app.use('/api/audit',        auditRoutes);
app.use('/api/eod',          eodRoutes);
app.use('/api/forecast',     forecastRoutes);
app.use('/api/webhooks',     webhookRoutes);
app.use('/api/analytics',    analyticsRoutes);
app.use('/api/charts',       chartsRoutes);
app.use('/api/org',          orgRoutes);
app.use('/api/doc-clients',    docClientsRoutes);
app.use('/api/doc-cases',      docCasesRoutes);
app.use('/api/doc-documents',  docDocumentsRoutes);
app.use('/api/doc-work-units', docWorkUnitsRoutes);
app.use('/api/doc-checklist',  docChecklistRoutes);
app.use('/api/doc-dashboard',  docDashboardRoutes);
app.use('/api/doc-leaderboard', docLeaderboardRoutes);

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

app.use(errorHandler);

module.exports = app;
