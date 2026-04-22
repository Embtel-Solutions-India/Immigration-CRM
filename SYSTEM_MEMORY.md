# CRM & Task Portal — System Memory Document
**New York Area Immigration Services | Internal Business Portal**
Version: 1.0 | Stack: MongoDB 8 · Express 4 · React 18 · Node.js 24 | Generated: 2026-04-22

---

## Table of Contents

1. [System Architecture Map](#1-system-architecture-map)
2. [Full File and Folder Map](#2-full-file-and-folder-map)
3. [Database Schema Reference](#3-database-schema-reference)
4. [API Route Reference](#4-api-route-reference)
5. [Component Tree](#5-component-tree)
6. [Data Flow Diagrams](#6-data-flow-diagrams)
7. [State Management Map](#7-state-management-map)
8. [Role Permission Matrix](#8-role-permission-matrix)
9. [Third-Party Integration Reference](#9-third-party-integration-reference)
10. [Cron Job Registry](#10-cron-job-registry)
11. [Environment Variables Reference](#11-environment-variables-reference)
12. [Known Patterns and Conventions](#12-known-patterns-and-conventions)
13. [AI Coding Assistant Quick Reference](#13-ai-coding-assistant-quick-reference)

---

## 1. System Architecture Map

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CLIENT (localhost:5173)                       │
│                    React 18 + Vite + Redux Toolkit                   │
│                                                                      │
│  ┌────────────┐  ┌──────────────┐  ┌───────────────────────────┐   │
│  │  Redux     │  │  React Router│  │  Tailwind CSS             │   │
│  │  authSlice │  │  v6 nested   │  │  + custom index.css       │   │
│  │  uiSlice   │  │  routes      │  │  .btn-primary .card etc.  │   │
│  └────────────┘  └──────────────┘  └───────────────────────────┘   │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  api/axios.js (Axios instance, baseURL=/api, JWT in header)  │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────┬───────────────────────────────────────┘
                              │ HTTP/JSON (REST)
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     SERVER (localhost:5000)                          │
│                   Express 4 + Node.js 24                             │
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │  verifyToken │  │  requireRole │  │  teamScope               │  │
│  │  (JWT auth)  │  │  (RBAC)      │  │  (sets req.scopeFilter)  │  │
│  └──────────────┘  └──────────────┘  └──────────────────────────┘  │
│                                                                      │
│  Routes (all prefixed /api/):                                        │
│  auth · users · work-units · cases · reports · kpi · leaderboard    │
│  notifications · leave · audit · eod · forecast · webhooks          │
│  analytics · charts · org                                            │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  node-cron  (3 scheduled jobs — see Section 10)             │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │  Nodemailer  │  │  date-fns    │  │  crypto (HMAC SHA-256)   │  │
│  │  (SMTP)      │  │  (ISO weeks) │  │  (GHL webhook verify)    │  │
│  └──────────────┘  └──────────────┘  └──────────────────────────┘  │
└─────────────────────────────┬───────────────────────────────────────┘
                              │ Mongoose ODM
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   MongoDB 8  (database: crm-portal)                  │
│                                                                      │
│  Collections:                                                        │
│  users · workunits (discriminator) · cases · kpitargets             │
│  notifications · leaverequests · activitylogs · eodreports          │
│  webhooklogs · orgSettings · auditlogs                              │
└─────────────────────────────────────────────────────────────────────┘
                              ▲
                              │ HTTP POST (webhooks)
┌─────────────────────────────┴───────────────────────────────────────┐
│                    GoHighLevel CRM                                    │
│  POST /api/webhooks/gohighlevel                                      │
│  HMAC-SHA256 signature in X-GHL-Signature header                     │
└─────────────────────────────────────────────────────────────────────┘
```

**Request lifecycle (happy path):**
```
Browser → Vite dev server (proxy /api → :5000)
  → Express app.js
  → verifyToken middleware (reads Bearer token, sets req.user)
  → requireRole / teamScope middleware (optional, per route)
  → Controller (queries MongoDB via Mongoose)
  → JSON response
```

---

## 2. Full File and Folder Map

```
CRM and Task/
├── server/
│   ├── app.js                        Main Express app, 16 route mounts
│   ├── .env                          All environment variables (see Section 11)
│   ├── package.json                  Server dependencies
│   │
│   ├── models/
│   │   ├── User.js                   User schema (name, email, role, team, password hash)
│   │   ├── WorkUnit.js               Base discriminator + SalesUnit/MarketingUnit/ProductionUnit
│   │   ├── Case.js                   9-stage immigration case with history + SLA
│   │   ├── KpiTarget.js              Weekly/monthly KPI targets per user
│   │   ├── Notification.js           User notification with type/title/message/isRead
│   │   ├── LeaveRequest.js           Leave request with status workflow
│   │   ├── ActivityLog.js            Append-only activity log (kind, action, entityType)
│   │   ├── EodReport.js              Generated daily performance summary per user
│   │   ├── WebhookLog.js             GHL webhook event log with retry tracking
│   │   ├── OrgSettings.js            Single-document org config (SMTP, Zoom, reviewers)
│   │   └── AuditLog.js               Admin action audit trail (IP, method, path, changes)
│   │
│   ├── controllers/
│   │   ├── authController.js         register, login (issues JWT pair), refresh, logout
│   │   ├── userController.js         getMe, updateMe, getAll, getById, updateUser, updateStatus
│   │   ├── workUnitController.js     CRUD for work units, score calc, team/user queries
│   │   ├── caseController.js         Cases CRUD, stage history, status updates
│   │   ├── reportController.js       Summary reports (team/user aggregations)
│   │   ├── kpiController.js          Set/get KPI targets, progress, CEO summary
│   │   ├── leaderboardController.js  Sales leaderboard, CEO top performers
│   │   ├── notificationController.js getForUser, markRead, markAllRead, create, createInternal
│   │   ├── leaveController.js        request, getPending, review, teamCalendar, userHistory
│   │   ├── eodController.js          generate (upsert+email), getForUser, getTeamDay, generateForAll
│   │   ├── forecastController.js     Revenue forecast (hot/warm/pipeline model), history
│   │   ├── analyticsController.js    Heatmap, task time averages, outlier detection
│   │   ├── chartsController.js       Sales/marketing multi-series daily chart data
│   │   ├── orgController.js          getSettings, updateSettings, addVisaCategory, addReviewer
│   │   └── webhookController.js      receive (GHL), getLogs, retry, integrationStatus
│   │
│   ├── routes/
│   │   ├── auth.js                   /api/auth/*
│   │   ├── users.js                  /api/users/*
│   │   ├── workUnits.js              /api/work-units/*
│   │   ├── cases.js                  /api/cases/*
│   │   ├── reports.js                /api/reports/*
│   │   ├── kpi.js                    /api/kpi/*
│   │   ├── leaderboard.js            /api/leaderboard/*
│   │   ├── notifications.js          /api/notifications/*
│   │   ├── leave.js                  /api/leave/*
│   │   ├── audit.js                  /api/audit/*
│   │   ├── eod.js                    /api/eod/*
│   │   ├── forecast.js               /api/forecast/*
│   │   ├── webhooks.js               /api/webhooks/*
│   │   ├── analytics.js              /api/analytics/*
│   │   ├── charts.js                 /api/charts/*
│   │   └── org.js                    /api/org/*
│   │
│   ├── middleware/
│   │   ├── auth.js                   verifyToken: decodes JWT, sets req.user {_id, role, team}
│   │   ├── roleGuard.js              requireRole factory + teamScope middleware
│   │   └── errorHandler.js           Global Express error handler (JSON error responses)
│   │
│   └── utils/
│       ├── cronJobs.js               3 scheduled jobs (EOD, hourly alerts, weekly KPI miss)
│       ├── emailService.js           Nodemailer; reads SMTP from OrgSettings at send time
│       ├── scoreCalculator.js        calcProductivityScore(workUnits, hoursTracked, targetHours)
│       ├── activityLogger.js         logActivity(userId, kind, action, entityType, entityId, meta)
│       └── auditLogger.js            logAudit(req, action, entityType, entityId, before, after)
│
├── server/scripts/
│   └── seed.js                       Full demo data seed (1225 work units, 20 cases, etc.)
│
└── client/
    ├── vite.config.js                Proxy /api → http://localhost:5000
    ├── tailwind.config.js            Theme: brand color, font, breakpoints
    ├── index.html                    SPA shell
    ├── package.json                  Client dependencies
    │
    └── src/
        ├── main.jsx                  ReactDOM.createRoot, Redux Provider, BrowserRouter
        ├── App.jsx                   All route definitions (nested under Layout)
        │
        ├── api/
        │   ├── axios.js              Axios instance: baseURL=/api, auto-attach Bearer token
        │   ├── authApi.js            login, logout, refreshToken calls
        │   ├── orgApi.js             getOrgSettings, getTopPerformers, etc.
        │   └── [other api files]     Per-domain API call wrappers
        │
        ├── store/
        │   ├── index.js              Redux store with authSlice + uiSlice
        │   ├── authSlice.js          refreshAuth (on mount), login, logout reducers
        │   └── uiSlice.js            sidebarOpen (bool), toast {message, type}
        │
        ├── hooks/
        │   └── useAuth.js            Reads authSlice, exposes user, isAdmin, isSuperAdmin, isCeo
        │
        ├── components/
        │   ├── layout/
        │   │   ├── Layout.jsx        Sidebar + Topbar + <Outlet /> shell
        │   │   ├── Sidebar.jsx       13-item nav (all Lucide icons, zero emojis)
        │   │   └── Topbar.jsx        Search bar, CEO Zoom button, notification bell, logout
        │   │
        │   ├── common/
        │   │   ├── KpiCard.jsx       Single metric stat card
        │   │   ├── KpiProgressRing.jsx SVG ring with color thresholds (red/amber/green/blue)
        │   │   ├── StatusBadge.jsx   Colored pill badge for status values
        │   │   ├── Toast.jsx         Auto-dismiss notification toast
        │   │   ├── WorkTimer.jsx     Start/stop timer component for work units
        │   │   ├── Modal.jsx         Generic modal dialog
        │   │   ├── FilterBar.jsx     Shared filter bar (search + dropdowns)
        │   │   ├── Spinner.jsx       Loading spinner (size prop: sm/md/lg)
        │   │   └── NotificationPanel.jsx Slide-in notification list with mark-read
        │   │
        │   └── charts/
        │       ├── PipelineBar.jsx         Recharts bar for pipeline stage counts
        │       ├── StageDonut.jsx           Recharts donut for case stages
        │       ├── TeamCompareBar.jsx       Team side-by-side bar chart
        │       ├── WeeklyLineChart.jsx      Week-over-week line chart
        │       ├── HeatmapChart.jsx         Day×Hour task completion heatmap
        │       ├── MultiSeriesSalesChart.jsx  Recharts ComposedChart (sales daily + targets)
        │       ├── MultiSeriesMarketingChart.jsx Recharts ComposedChart (marketing daily)
        │       └── ForecastCard.jsx         Revenue forecast display with confidence badge
        │
        └── pages/
            ├── Auth/
            │   └── Login.jsx               JWT login form, dispatches authSlice.login
            ├── Dashboard/
            │   ├── UserDashboard.jsx        Today's tasks + weekly KPI rings + timer
            │   ├── AdminDashboard.jsx       Team KPI rings + monthly chart + alerts
            │   └── CeoDashboard.jsx         All-org KPI, forecast card, heatmap, top performers
            ├── WorkUnits/
            │   ├── WorkUnitList.jsx         Filterable paginated list of work units
            │   ├── WorkUnitDetail.jsx       Single work unit view with timer controls
            │   └── WorkUnitForm.jsx         Create/edit form (kind-aware field switching)
            ├── Cases/
            │   ├── CaseBoard.jsx            7-column kanban (drag=stage change)
            │   └── CaseDetail.jsx           Full case detail + status update form
            ├── Reports/
            │   └── Reports.jsx              Team/user report aggregations + XLSX export
            ├── Kpi/
            │   └── KpiPage.jsx              KPI target management (set targets, view progress)
            ├── Leaderboard/
            │   └── Leaderboard.jsx          Sales leaderboard table (rank + score + metrics)
            ├── Leave/
            │   └── LeavePage.jsx            Request form + team calendar + admin review
            ├── Eod/
            │   └── EodReport.jsx            Week strip + generate button + team grid
            ├── Audit/
            │   └── AuditLog.jsx             Superadmin-only table + XLSX export
            ├── Settings/
            │   └── OrgSettings.jsx          SMTP, Zoom link, EOD time, visa categories
            ├── Webhooks/
            │   └── WebhookLogs.jsx          GHL log table + retry + integration status
            ├── Team/
            │   └── TeamView.jsx             Admin view of team members + status
            └── Admin/
                └── UserManagement.jsx       Superadmin user CRUD + role/status management
```

---

## 3. Database Schema Reference

**Database name:** `crm-portal` (from `MONGO_URI` in `.env`)

---

### 3.1 `users` Collection

```
Field         Type      Required  Notes
─────────────────────────────────────────────────────────────────
_id           ObjectId  auto
name          String    yes       Full name
email         String    yes       Unique, lowercased
password      String    yes       bcrypt hashed (rounds=10), never returned
role          String    yes       Enum: user | admin | superadmin
team          String    yes       Enum: Sales | Marketing | Production
isActive      Boolean   yes       Default: true
refreshToken  String    no        bcrypt-hashed refresh token (stored hashed)
createdAt     Date      auto      Mongoose timestamps
updatedAt     Date      auto
```

**Indexes:** `email` (unique)

**Seed accounts:**
```
superadmin@nyais.com     password123   superadmin   (no team)
admin.sales@nyais.com    password123   admin        Sales
admin.mkt@nyais.com      password123   admin        Marketing
admin.prod@nyais.com     password123   admin        Production
[9 regular users across all 3 teams — see seed.js for full list]
```

---

### 3.2 `workunits` Collection (Discriminator Pattern)

**Base schema fields:**
```
Field         Type      Notes
────────────────────────────────────────────────────────────────
_id           ObjectId
kind          String    Discriminator key: SalesUnit | MarketingUnit | ProductionUnit
userId        ObjectId  ref → users
title         String    Task title
description   String
workType      String    Enum: Call | Email | Meeting | Admin | Research | Other
status        String    Enum: Pending | In Progress | Completed | Cancelled
priority      String    Enum: High | Medium | Low
date          Date      Date of work
startTime     Date      Timer start
endTime       Date      Timer end
tags          [String]
team          String    Denormalized from user at creation time
createdAt     Date      timestamps
updatedAt     Date
```

**SalesUnit additional fields:**
```
callsMade       Number
emailsSent      Number
leadsAdded      Number
leadStage       String   Enum: Hot | Warm | Cold | Won | Lost
dealValue       Number   Dollar amount (used in forecast)
dailyRevenue    Number
contactName     String
contactPhone    String
contactEmail    String
weeklyForecast  Number
```

**MarketingUnit additional fields:**
```
campaignType        String   Enum: Email | Social | SEO | PPC | Content | Event | Other
emailsSent          Number
openRate            Number   Percentage 0-100
clickRate           Number   Percentage 0-100
leadsGenerated      Number
conversionsToSales  Number
campaignName        String
```

**ProductionUnit additional fields:**
```
caseId        ObjectId  ref → cases
clientName    String
caseType      String
stage         String    Old 5-stage enum (legacy field; use Case.stage for current)
statusUpdates [{ note, updatedAt, updatedBy }]
```

**Indexes:** `{ userId, date }`, `{ kind }`, `{ team }`

---

### 3.3 `cases` Collection

```
Field             Type       Notes
──────────────────────────────────────────────────────────────────────
_id               ObjectId
caseId            String     Auto-generated: IMM-YYYY-XXXX (unique)
clientName        String     Required
assignedManager   ObjectId   ref → users (populate with 'name')
internalReviewer  String     Reviewer name (from OrgSettings.internalReviewers)
caseType          String     Immigration category (from OrgSettings.visaCategories)
stage             String     Enum (9 stages — see below)
priority          String     Enum: High | Medium | Low
filingDeadline    Date
slaDeadline       Date       Used for overdue filter (`slaDeadline < now`)
stageEnteredAt    Date       When current stage was entered
stageHistory      Array      [{stage, movedAt, movedBy(ref user), notes}]
statusUpdates     Array      [{note, updatedAt, updatedBy(ref user)}]
notes             String
createdAt         Date
updatedAt         Date
```

**9-Stage Enum (order matters for kanban column order):**
1. Document Collection
2. Application Drafted
3. Internal Team Review
4. Client Review
5. Petition Filed
6. Under Government Review
7. Approved
8. Rejected
9. RFE Issued

**Virtuals:**
- `daysInCurrentStage` — `(now - stageEnteredAt) / 86400000`
- `isOverdue` — `slaDeadline < now && stage !== 'Approved'`

**Pre-save hook:** If `caseId` is empty, generates `IMM-${year}-${padded 4-digit random}`

**Indexes:** `caseId` (unique), `{ assignedManager }`, `{ stage }`, `{ slaDeadline }`

---

### 3.4 `kpitargets` Collection

```
Field         Type      Notes
────────────────────────────────────────────────────────────────
_id           ObjectId
userId        ObjectId  ref → users
team          String    Denormalized team
metric        String    e.g. callsMade | emailsSent | dealValue | leadsAdded
period        String    Enum: weekly | monthly
weekNumber    Number    ISO week number (1-53), only used when period=weekly
month         Number    1-12, only used when period=monthly
year          Number    Full year e.g. 2026
targetValue   Number    Target number
actualValue   Number    Current actual (updated by admin or cron)
createdAt     Date
```

**Indexes:** `{ userId, period, year, weekNumber }` (compound)

**Critical:** Week numbers are ISO week numbers via `date-fns getISOWeek()`. Never compute week numbers manually — always use this function for consistency between seed and controllers.

---

### 3.5 `notifications` Collection

```
Field       Type      Notes
──────────────────────────────────────────────────────────────
_id         ObjectId
userId      ObjectId  ref → users
type        String    Enum: task_reminder | case_alert | kpi_miss | leave | system
title       String
message     String
linkTo      String    Optional frontend route (e.g. /cases)
isRead      Boolean   Default: false
createdAt   Date
```

**Indexes:** `{ userId, isRead }`, `{ createdAt }`

---

### 3.6 `leaverequests` Collection

```
Field         Type      Notes
──────────────────────────────────────────────────────────────────
_id           ObjectId
userId        ObjectId  ref → users
leaveType     String    Enum: annual | sick | personal | emergency
startDate     Date
endDate       Date
reason        String
status        String    Enum: pending | approved | rejected
reviewedBy    ObjectId  ref → users (admin who acted)
reviewNote    String    Admin's response note
createdAt     Date
updatedAt     Date
```

**Indexes:** `{ userId }`, `{ status }`, `{ startDate, endDate }`

---

### 3.7 `activitylogs` Collection

```
Field         Type      Notes
──────────────────────────────────────────────────────────────────
_id           ObjectId
userId        ObjectId  Who performed the action
kind          String    Team: Sales | Marketing | Production
action        String    e.g. created_case | case_updated | case_stage_updated
entityType    String    e.g. Case | WorkUnit
entityId      ObjectId  The affected document's _id
meta          Object    Flexible additional context (caseId, stage, etc.)
createdAt     Date
```

**Indexes:** `{ userId }`, `{ entityType, entityId }`, `{ createdAt }`

---

### 3.8 `eodreports` Collection

```
Field           Type      Notes
──────────────────────────────────────────────────────────────────
_id             ObjectId
userId          ObjectId  ref → users
date            Date      Midnight UTC of the report date
tasksCompleted  Number    Count of status=Completed work units for the day
totalTimeSpent  Number    Minutes (sum of endTime - startTime)
emailsSent      Number    Sum across all units for the day
callsMade       Number    Sum across all units
leadsUpdated    Number    Count of units with a leadStage set
casesMoved      Number    Count of ProductionUnits with a stage value
rawSummary      Array     [{title, status, workType}] for each work unit
generatedAt     Date      When the report was last generated
```

**Upsert key:** `{ userId, date }` — one report per user per day, always upserted

---

### 3.9 `webhooklogs` Collection

```
Field         Type      Notes
──────────────────────────────────────────────────────────────────
_id           ObjectId
platform      String    e.g. GoHighLevel
eventType     String    GHL event type (contact.created, opportunity.updated, etc.)
payload       Object    Full raw webhook payload
status        String    Enum: pending | success | failed | retrying
retryCount    Number    Default: 0, max: 3
lastError     String    Error message from last failed attempt
processedAt   Date      When successfully processed
createdAt     Date
```

**Indexes:** `{ status }`, `{ createdAt }`, `{ platform }`

---

### 3.10 `orgsettings` Collection

**Single document collection** (always `findOne()`, created empty if missing).

```
Field               Type       Notes
──────────────────────────────────────────────────────────────────────
_id                 ObjectId
companyName         String     Default: New York Area Immigration Services
ceoZoomLink         String     Zoom meeting URL (shown in Topbar to all users)
eodReportTime       String     Cron time string e.g. "18:00"
emailNotifications  Boolean    Master switch for email sending
smtpHost            String     Only returned to superadmin
smtpPort            Number     Only returned to superadmin
smtpUser            String     Only returned to superadmin
smtpPass            String     Only returned to superadmin
ghlWebhookSecret    String     HMAC secret, only returned to superadmin
visaCategories      [String]   e.g. ["H-1B", "Green Card", "L-1"]
internalReviewers   [String]   List of reviewer names
updatedBy           ObjectId   ref → users
updatedAt           Date
```

---

### 3.11 `auditlogs` Collection

```
Field         Type      Notes
──────────────────────────────────────────────────────────────────
_id           ObjectId
userId        ObjectId  Who performed the action
action        String    e.g. org_settings_updated | user_role_changed
entityType    String    e.g. OrgSettings | User | Case
entityId      ObjectId
ip            String    Client IP from req.ip
method        String    HTTP method (GET/POST/PATCH/DELETE)
path          String    Request path
changes       Mixed     Field names changed or before/after diff
createdAt     Date
```

**Indexes:** `{ userId }`, `{ action }`, `{ createdAt }`

---

## 4. API Route Reference

**Base URL:** `http://localhost:5000/api`

All routes except `POST /auth/login`, `POST /auth/register`, `POST /auth/refresh`, and `POST /webhooks/gohighlevel` require a valid JWT in the `Authorization: Bearer <token>` header.

---

### Auth — `/api/auth`

| Method | Path        | Auth | Roles | Description |
|--------|-------------|------|-------|-------------|
| POST   | /register   | No   | any   | Create account |
| POST   | /login      | No   | any   | Returns `{ token, user }`, sets httpOnly refreshToken cookie |
| POST   | /refresh    | No   | any   | Reads cookie, issues new access token |
| POST   | /logout     | Yes  | any   | Clears refresh token from DB and cookie |

---

### Users — `/api/users`

| Method | Path         | Auth | Roles           | Description |
|--------|--------------|------|-----------------|-------------|
| GET    | /me          | Yes  | any             | Current user profile |
| PATCH  | /me          | Yes  | any             | Update own profile |
| GET    | /            | Yes  | admin,superadmin| All users |
| GET    | /:id         | Yes  | admin,superadmin| User by ID |
| PATCH  | /:id         | Yes  | superadmin      | Update any user |
| PATCH  | /:id/status  | Yes  | superadmin      | Activate/deactivate user |

---

### Work Units — `/api/work-units`

| Method | Path                | Auth | Roles           | Description |
|--------|---------------------|------|-----------------|-------------|
| GET    | /                   | Yes  | any             | List (filtered by teamScope) |
| POST   | /                   | Yes  | any             | Create work unit |
| GET    | /:id                | Yes  | any             | Get single unit |
| PATCH  | /:id                | Yes  | any             | Update unit |
| DELETE | /:id                | Yes  | any             | Delete unit |
| GET    | /user/:userId       | Yes  | any             | Units for a user |
| GET    | /team/:team         | Yes  | admin,superadmin| Team units |
| GET    | /score/:userId      | Yes  | any             | Productivity score |

---

### Cases — `/api/cases`

| Method | Path                    | Auth | Roles | Description |
|--------|-------------------------|------|-------|-------------|
| GET    | /                       | Yes  | any   | List (users see own, admins see all) |
| POST   | /                       | Yes  | any   | Create case |
| GET    | /:id                    | Yes  | any   | Case detail (populated) |
| PATCH  | /:id                    | Yes  | any   | Update case (auto-records stage history) |
| POST   | /:id/status-update      | Yes  | any   | Add status update + optional stage move |

**Query params for GET /:** `stage`, `assignedManager`, `overdue=true`, `priority`, `page`, `limit`

---

### KPI — `/api/kpi`

| Method | Path              | Auth | Roles           | Description |
|--------|-------------------|------|-----------------|-------------|
| POST   | /set              | Yes  | admin,superadmin| Create/update KPI target |
| GET    | /user/:userId     | Yes  | any             | User's targets (`?period=weekly&year=2026`) |
| GET    | /team/:team       | Yes  | admin,superadmin| Team targets |
| PATCH  | /:id/progress     | Yes  | admin,superadmin| Update actualValue |
| GET    | /ceo-summary      | Yes  | superadmin      | All-team KPI overview |

---

### Leaderboard — `/api/leaderboard`

| Method | Path                  | Auth | Roles | Description |
|--------|-----------------------|------|-------|-------------|
| GET    | /sales                | Yes  | any   | Sales team ranked by deal value |
| GET    | /ceo-top-performers   | Yes  | any   | Top performers across all teams |

---

### Reports — `/api/reports`

| Method | Path              | Auth | Roles           | Description |
|--------|-------------------|------|-----------------|-------------|
| GET    | /summary          | Yes  | any             | Team/user aggregated summary |
| GET    | /export           | Yes  | admin,superadmin| XLSX download |

---

### Notifications — `/api/notifications`

| Method | Path              | Auth | Roles | Description |
|--------|-------------------|------|-------|-------------|
| GET    | /user/:userId     | Yes  | any   | Last 50 + unread count |
| PATCH  | /:id/read         | Yes  | any   | Mark single as read |
| POST   | /mark-all-read    | Yes  | any   | Mark all for current user as read |
| POST   | /                 | Yes  | any   | Create notification (internal) |

---

### Leave — `/api/leave`

| Method | Path               | Auth | Roles           | Description |
|--------|--------------------|------|-----------------|-------------|
| POST   | /request           | Yes  | any             | Submit leave request |
| GET    | /pending           | Yes  | admin,superadmin| Pending requests |
| PATCH  | /:id/review        | Yes  | admin,superadmin| Approve or reject |
| GET    | /team/calendar     | Yes  | admin,superadmin| Team calendar view |
| GET    | /user/:userId      | Yes  | any             | Personal history |

---

### Audit — `/api/audit`

| Method | Path     | Auth | Roles      | Description |
|--------|----------|------|------------|-------------|
| GET    | /        | Yes  | superadmin | Filterable audit log |

**Query params:** `action`, `entity`, `search`, `page`, `limit`

---

### EOD Reports — `/api/eod`

| Method | Path              | Auth | Roles           | Description |
|--------|-------------------|------|-----------------|-------------|
| POST   | /generate/:userId | Yes  | any             | Build + upsert + email EOD report |
| GET    | /team             | Yes  | admin,superadmin| Team day summary |
| GET    | /user/:userId     | Yes  | any             | User's reports (last 30, `?date=YYYY-MM-DD`) |
| GET    | /:userId          | Yes  | any             | Alias for above |

**Response shape for GET:** `{ reports: [...] }` (wrapped object, not bare array)

---

### Forecast — `/api/forecast`

| Method | Path         | Auth | Roles           | Description |
|--------|--------------|------|-----------------|-------------|
| GET    | /revenue     | Yes  | admin,superadmin| Multi-period forecast (`?period=30`) |
| GET    | /confidence  | Yes  | admin,superadmin| Data quality confidence level |
| GET    | /history     | Yes  | admin,superadmin| Last 6 months actual revenue |

---

### Analytics — `/api/analytics`

| Method | Path                    | Auth | Roles | Description |
|--------|-------------------------|------|-------|-------------|
| GET    | /heatmap/:userId        | Yes  | any   | Day×Hour completion grid (`?week=0`) |
| GET    | /task-time-avg/:team    | Yes  | any   | Avg minutes per work type |
| GET    | /outliers/:team         | Yes  | any   | Tasks taking >2.5x average |

---

### Charts — `/api/charts`

| Method | Path                       | Auth | Roles | Description |
|--------|----------------------------|------|-------|-------------|
| GET    | /sales/org                 | Yes  | any   | Org-level daily sales data |
| GET    | /sales/team/:teamId        | Yes  | any   | Per-member daily sales series |
| GET    | /sales/user/:userId        | Yes  | any   | User daily sales + week targets |
| GET    | /marketing/org             | Yes  | any   | Org-level daily marketing data |
| GET    | /marketing/team/:teamId    | Yes  | any   | Per-member daily marketing series |
| GET    | /marketing/user/:userId    | Yes  | any   | User daily marketing |

**Query params:** `month` (1-12), `year`, `metric` (dealValue/callsMade/emailsSent/leadsGenerated)

---

### Org Settings — `/api/org`

| Method | Path                        | Auth | Roles                 | Description |
|--------|-----------------------------|------|-----------------------|-------------|
| GET    | /settings                   | Yes  | any                   | Get settings (SMTP fields hidden unless superadmin) |
| PATCH  | /settings                   | Yes  | superadmin            | Update settings |
| POST   | /settings/visa-categories   | Yes  | superadmin,admin      | Add visa category |
| POST   | /settings/reviewers         | Yes  | superadmin,admin      | Add reviewer name |

---

### Webhooks — `/api/webhooks`

| Method | Path                     | Auth | Roles           | Description |
|--------|--------------------------|------|-----------------|-------------|
| POST   | /gohighlevel             | No   | public          | GHL webhook receiver (HMAC verified) |
| GET    | /logs                    | Yes  | admin,superadmin| Paginated log list (`?status=failed&page=1&limit=30`) |
| POST   | /retry/:logId            | Yes  | admin,superadmin| Queue retry for failed log |
| GET    | /integrations/status     | Yes  | admin,superadmin| Counts: total/success/failed + avgLatency |

---

## 5. Component Tree

```
main.jsx
└── Provider (Redux store)
    └── BrowserRouter
        └── App.jsx
            ├── /login → Login.jsx
            └── / → Layout.jsx
                ├── Sidebar.jsx (always rendered)
                │   └── 13 NavLink items with Lucide icons
                ├── Topbar.jsx (always rendered)
                │   ├── CEO Zoom button (conditional: only if ceoZoomLink exists)
                │   ├── Notification bell → NotificationPanel.jsx
                │   │   └── list of notification items + mark-read buttons
                │   └── Logout button (LogOut icon)
                └── <Outlet /> — page content:
                    │
                    ├── / → Dashboard (role-switched)
                    │   ├── UserDashboard.jsx
                    │   │   ├── KpiProgressRing.jsx (×3 weekly metrics)
                    │   │   ├── WorkTimer.jsx
                    │   │   └── WorkUnitList.jsx (today's tasks)
                    │   ├── AdminDashboard.jsx
                    │   │   ├── KpiProgressRing.jsx (team members, max 3 each)
                    │   │   ├── MultiSeriesSalesChart.jsx OR MultiSeriesMarketingChart.jsx
                    │   │   └── AlertTriangle icons for overdue cases
                    │   └── CeoDashboard.jsx
                    │       ├── KpiCard.jsx (org-wide metrics)
                    │       ├── ForecastCard.jsx
                    │       ├── HeatmapChart.jsx
                    │       ├── MultiSeriesSalesChart.jsx (view="org")
                    │       ├── MultiSeriesMarketingChart.jsx (view="org")
                    │       └── top performers grid
                    │
                    ├── /work-units → WorkUnitList.jsx
                    │   ├── FilterBar.jsx
                    │   ├── WorkUnitForm.jsx (modal)
                    │   └── WorkUnitDetail.jsx (modal/page)
                    │       └── WorkTimer.jsx
                    │
                    ├── /cases → CaseBoard.jsx (7-column kanban)
                    │   └── CaseDetail.jsx (modal/page)
                    │
                    ├── /reports → Reports.jsx
                    │   ├── TeamCompareBar.jsx
                    │   └── WeeklyLineChart.jsx
                    │
                    ├── /kpi → KpiPage.jsx
                    │   └── KpiProgressRing.jsx (×n)
                    │
                    ├── /leaderboard → Leaderboard.jsx
                    │   └── PipelineBar.jsx
                    │
                    ├── /leave → LeavePage.jsx
                    │
                    ├── /eod → EodReport.jsx
                    │
                    ├── /team → [admin,superadmin] TeamView.jsx
                    │
                    ├── /webhooks → [admin,superadmin] WebhookLogs.jsx
                    │
                    ├── /settings → [admin,superadmin] OrgSettings.jsx
                    │
                    ├── /audit → [superadmin] AuditLog.jsx
                    │
                    └── /users → [superadmin] UserManagement.jsx
```

**KpiProgressRing props:**
```
label: string        — metric name displayed below ring
value: number        — actual value
target: number       — target value
unit?: string        — suffix (e.g. "$", "calls")
```

**Color thresholds (pct = value/target * 100):**
- pct < 40%: red stroke
- 40% ≤ pct < 70%: amber stroke
- 70% ≤ pct < 100%: green stroke
- pct ≥ 100%: blue stroke

**ForecastCard props:**
```
forecast: { days, forecast, confidence, hotForecast, warmForecast, pipelineForecast }
```

---

## 6. Data Flow Diagrams

### 6.1 User Logs a Work Task

```
User (browser)
  │ Fill WorkUnitForm → click Submit
  ▼
WorkUnitForm.jsx
  │ POST /api/work-units { kind, title, workType, ... }
  ▼
verifyToken middleware
  │ Validates Bearer token → sets req.user
  ▼
workUnitController.create
  │ WorkUnit.create(req.body)  [discriminator creates correct subtype]
  │ logActivity(userId, kind, 'created_task', 'WorkUnit', id, {})
  ▼
MongoDB (workunits collection)
  │ Stores document with __t = kind discriminator field
  ▼
Response: 201 { workUnit }
  ▼
WorkUnitList.jsx re-fetches → renders updated list
```

---

### 6.2 GHL Webhook Received

```
GoHighLevel CRM
  │ POST /api/webhooks/gohighlevel
  │ Headers: X-GHL-Signature: <HMAC-SHA256>
  │ Body: { type, data, ... }
  ▼
webhookController.receive
  │ 1. IMMEDIATELY return 200 (GHL requires fast ack)
  │ 2. setImmediate(async () => {
  │      a. Verify HMAC signature (crypto.createHmac)
  │         → if invalid: save log with status=failed, return
  │      b. WebhookLog.create({ platform, eventType, payload, status: 'pending' })
  │      c. processWebhook(log) — update contacts/leads as needed
  │      d. log.status = 'success'; log.processedAt = now; log.save()
  │      e. On error: log.status = 'failed'; log.lastError = e.message; log.save()
  │         → schedule retry with exponential backoff (up to 3 attempts)
  │    })
  ▼
MongoDB (webhooklogs collection)
```

**Retry flow:**
```
Admin clicks Retry in WebhookLogs.jsx
  │ POST /api/webhooks/retry/:logId
  ▼
webhookController.retry
  │ log.status = 'retrying'; log.retryCount++; log.save()
  │ setImmediate(() => processWebhook(log))
  ▼
Success → log.status = 'success'
Failure → log.status = 'failed', log.lastError updated
```

---

### 6.3 Admin Sets KPI Target

```
Admin (KpiPage.jsx)
  │ Fill target form → click Set
  ▼
POST /api/kpi/set { userId, metric, period, weekNumber/month, year, targetValue }
  ▼
kpiController.setTarget
  │ KpiTarget.findOneAndUpdate(
  │   { userId, metric, period, year, weekNumber },
  │   { targetValue },
  │   { upsert: true, new: true }
  │ )
  ▼
MongoDB (kpitargets collection)
  ▼
Response: updated KpiTarget document
  ▼
KpiPage.jsx re-fetches user targets → KpiProgressRing components re-render
  (UserDashboard also re-fetches on next load)
```

---

### 6.4 Case Moves to New Stage

```
User/Admin (CaseBoard.jsx or CaseDetail.jsx)
  │ Drag card to new column OR submit stage update form
  ▼
POST /api/cases/:id/status-update { stage: "Petition Filed", note: "..." }
  ▼
caseController.addStatusUpdate
  │ c = Case.findById(id)
  │ if (stage !== c.stage):
  │   c.stage = stage
  │   c.stageEnteredAt = now
  │   c.stageHistory.push({ stage, movedAt: now, movedBy: req.user._id, notes: note })
  │ c.statusUpdates.push({ note, updatedAt: now, updatedBy: req.user._id })
  │ c.save()
  │ logActivity(userId, 'Production', 'case_stage_updated', 'Case', c._id, { stage, note })
  ▼
MongoDB (cases collection — stageHistory array grows)
  ▼
Response: updated Case document
  ▼
CaseBoard.jsx re-renders kanban with card in new column
```

---

### 6.5 EOD Report Auto-Generation (Cron)

```
node-cron: "0 18 * * 1-5" fires at 6PM Mon-Fri
  ▼
eodController.generateForAll(todayDate)
  │ User.find({ isActive: true }, '_id')
  │ For each user:
  │   buildEodReport(userId, date)
  │     WorkUnit.find({ userId, date: { $gte: midnight, $lte: 23:59 } })
  │     Compute: tasksCompleted, totalTimeSpent, emailsSent, callsMade,
  │              leadsUpdated, casesMoved, rawSummary
  │   EodReport.findOneAndUpdate(
  │     { userId, date: midnight },
  │     data,
  │     { upsert: true }
  │   )
  │   (No email sent by cron — email only sent via manual generate endpoint)
  ▼
MongoDB (eodreports collection — one doc per user per day, upserted)
```

**Manual trigger flow:**
```
User clicks "Generate Report" in EodReport.jsx
  │ POST /api/eod/generate/:userId { date }
  ▼
eodController.generate
  │ buildEodReport(userId, date)
  │ EodReport.findOneAndUpdate(..., { upsert: true, new: true })
  │ sendEodEmail(user, report)   ← email IS sent on manual generate
  ▼
Response: EodReport document
```

---

### 6.6 CEO Views Revenue Forecast

```
CeoDashboard.jsx mounts
  │ GET /api/forecast/revenue?period=30
  ▼
forecastController.getForecast
  │ computeForecast(7), computeForecast(14), computeForecast(30) [in parallel]
  │ Each:
  │   SalesUnit.find({ date: last 90 days })
  │   hotLeads = units where leadStage=Hot
  │   warmLeads = units where leadStage=Warm
  │   recentLeads = units from last 7 days
  │   avgDeal = mean of dealValue (fallback $3000)
  │   hotWinRate = Won/(Won+Lost) historical ratio
  │   hotForecast = hotLeads.length × avgDeal × hotWinRate × (days/30)
  │   warmForecast = warmLeads.length × avgDeal × warmWinRate × (days/30)
  │   pipelineForecast = dailyConversionRate × days × avgDeal × 0.15
  │   confidence = 'high' if dataPoints≥50, 'medium' if ≥20, else 'low'
  ▼
Response: { requested, precomputed: { days7, days14, days30 } }
  ▼
ForecastCard.jsx renders dollar amounts + confidence badge
```

---

## 7. State Management Map

### Redux Store (global, persists across navigation)

```
store/
├── authSlice
│   State:
│     user: { _id, name, email, role, team } | null
│     token: string | null
│     loading: boolean
│   Actions:
│     login(user, token)      — sets user+token after POST /auth/login
│     logout()                 — clears user+token
│     refreshAuth()            — async thunk: POST /auth/refresh → updates state
│   How token is used:
│     api/axios.js reads from store.getState().auth.token on each request
│
└── uiSlice
    State:
      sidebarOpen: boolean
      toast: { message: string, type: 'success'|'error' } | null
    Actions:
      toggleSidebar()
      showToast({ message, type })
      clearToast()
```

### Local Component State (useState)

```
WorkUnitList.jsx    units[], loading, filter, page, total
WorkUnitForm.jsx    formData{}, submitting
CaseBoard.jsx       cases[], loading, dragging
KpiPage.jsx         targets[], formData{}, loading
LeavePage.jsx       requests[], form{}, loading, activeTab
EodReport.jsx       reports[], selectedDate, loading
WebhookLogs.jsx     logs[], status{}, filter, page, loading, retrying(id)
AuditLog.jsx        logs[], filter, page, loading
OrgSettings.jsx     settings{}, saving
Topbar.jsx          notifications[], unreadCount, panelOpen
```

### Custom Hook: `useAuth`

```javascript
// hooks/useAuth.js
const user = useSelector(state => state.auth.user);
const isAdmin = user?.role === 'admin';
const isSuperAdmin = user?.role === 'superadmin';
const isCeo = user?.role === 'superadmin';  // same check
return { user, isAdmin, isSuperAdmin, isCeo };
```

### What is NOT in Redux (intentional)

- Notification panel open/close state → local in Topbar.jsx
- Form data → local in each form component
- API data (cases, work units, etc.) → fetched fresh per page load (no caching layer)
- Timer state → local in WorkTimer.jsx with startTime stored in component

---

## 8. Role Permission Matrix

| Feature / Action                 | user | admin | superadmin |
|----------------------------------|------|-------|------------|
| Login / Logout                   | Yes  | Yes   | Yes        |
| View own dashboard               | Yes  | Yes   | Yes        |
| View admin dashboard             | No   | Yes   | Yes        |
| View CEO dashboard               | No   | No    | Yes        |
| Create/edit own work units       | Yes  | Yes   | Yes        |
| View other users' work units     | No   | Yes (same team) | Yes |
| Delete work units                | Yes (own) | Yes | Yes    |
| View cases                       | Own cases only | All cases | All cases |
| Create/update cases              | Yes  | Yes   | Yes        |
| View team KPI targets            | Own only | Team | All    |
| Set KPI targets                  | No   | Yes   | Yes        |
| Update KPI progress              | No   | Yes   | Yes        |
| View CEO KPI summary             | No   | No    | Yes        |
| View leaderboard                 | No   | Yes   | Yes        |
| Submit leave request             | Yes  | Yes   | Yes        |
| Approve/reject leave             | No   | Yes   | No         |
| View team leave calendar         | No   | Yes   | No         |
| View all leave requests          | No   | No    | Yes        |
| View own EOD reports             | Yes  | Yes   | Yes        |
| Generate own EOD report          | Yes  | Yes   | Yes        |
| View team EOD reports            | No   | No    | No         |
| View revenue forecast            | No   | Yes   | Yes        |
| View sales charts                | Yes  | Yes   | Yes        |
| View webhook logs                | No   | Yes   | Yes        |
| Retry failed webhooks            | No   | Yes   | Yes        |
| View org settings                | Partial* | Partial* | Full |
| Update org settings              | No   | No    | Yes        |
| Add visa categories              | No   | Yes   | Yes        |
| Add internal reviewers           | No   | Yes   | Yes        |
| View audit log                   | No   | No    | Yes        |
| Manage users (create/edit/role)  | No   | No    | Yes        |
| Activate/deactivate users        | No   | No    | Yes        |

*Partial: SMTP credentials and GHL webhook secret are hidden from non-superadmin users even though they can fetch `/api/org/settings`.

---

## 9. Third-Party Integration Reference

### 9.1 GoHighLevel (GHL) CRM

**Purpose:** Receive lead/contact/opportunity events from GHL, store for processing.

**How it works:**
- GHL sends `POST /api/webhooks/gohighlevel`
- Header: `X-GHL-Signature: <HMAC-SHA256(secret, JSON.stringify(body))>`
- Secret stored in `OrgSettings.ghlWebhookSecret`
- Verification: `crypto.createHmac('sha256', secret).update(rawBody).digest('hex')`
- Responds `200` immediately (GHL requires response within 5 seconds)
- Async processing via `setImmediate`
- Failed events stored in WebhookLog collection with `status: 'failed'`
- Manual retry via admin UI (WebhookLogs.jsx → POST /api/webhooks/retry/:id)
- Max 3 retry attempts with exponential backoff

**Events handled:** contact.created, contact.updated, opportunity.created, opportunity.status_changed (and others stored as-is in `payload.type`)

**Configuration:** Set `ghlWebhookSecret` via OrgSettings page (superadmin only)

---

### 9.2 Zoom (CEO Quick-Join)

**Purpose:** One-click meeting access for all users from the Topbar.

**How it works:**
- CEO Zoom meeting link stored in `OrgSettings.ceoZoomLink`
- Topbar.jsx fetches `/api/org/settings` on mount
- If `ceoZoomLink` is truthy, renders a button with `Video` Lucide icon
- Clicking button opens link in new tab (`window.open(link, '_blank')`)
- No Zoom API integration — just a URL shortcut

**Configuration:** Set via OrgSettings page (superadmin only)

---

### 9.3 Nodemailer (Email)

**Purpose:** Send EOD report emails when reports are manually generated.

**How it works:**
- `server/utils/emailService.js` exports `sendEodEmail(user, report)`
- On each call: fetches current `OrgSettings` from MongoDB (not cached)
- If SMTP not configured (`!settings.smtpHost`): silently returns null (no error)
- Creates transporter with: `host, port, auth: { user, pass }`
- Sends HTML email with EOD summary
- Called by `eodController.generate` (manual trigger only — cron does NOT send email)

**Configuration:** Set `smtpHost`, `smtpPort`, `smtpUser`, `smtpPass` via OrgSettings page

**Failure handling:** `eodController.generate` wraps email send in try/catch:
```javascript
try { await sendEodEmail(user, report); }
catch (e) { console.error('EOD email failed:', e.message); }
```
Email failure does not prevent the report from being returned to the client.

---

### 9.4 node-cron

**Purpose:** Scheduled automation — EOD reports, notification triggers, KPI miss alerts.

**Configuration:** No external service — runs inside the Node process, starts when server starts.

**See Section 10 for full cron job registry.**

---

## 10. Cron Job Registry

All jobs defined in `server/utils/cronJobs.js`. Jobs start automatically when `app.js` loads.

| Job | Schedule | Human Readable | Description |
|-----|----------|----------------|-------------|
| EOD Auto-Generate | `0 18 * * 1-5` | 6:00 PM, Mon–Fri | Calls `generateForAll(today)` — upserts EOD reports for all active users. Does NOT send email. |
| Hourly Notification Scan | `0 * * * *` | Every hour | Checks 4 conditions and creates notifications for each match |
| Weekly KPI Miss Alert | `0 23 * * 0` | 11:00 PM, Sunday | Finds users whose weekly KPI actualValue < 80% of targetValue, creates kpi_miss notifications |

**Hourly Notification Scan — 4 checks:**

1. **Task due soon:** WorkUnits with `status ≠ Completed` and `date` within next 24 hours → notification type `task_reminder`
2. **Case stuck:** Cases where `stageEnteredAt < 5 days ago` → notification type `case_alert`
3. **Filing deadline:** Cases where `filingDeadline` within next 7 days → notification type `case_alert`
4. **User inactivity:** Users with no WorkUnit in last 3 days → notification type `system`

---

## 11. Environment Variables Reference

File location: `server/.env`

| Variable | Example Value | Required | Description |
|----------|--------------|----------|-------------|
| `MONGO_URI` | `mongodb://127.0.0.1:27017/crm-portal` | Yes | MongoDB connection string. Database name MUST be `crm-portal`. Do not use `localhost` — use `127.0.0.1` for reliability on Windows. |
| `JWT_SECRET` | `your-secret-key` | Yes | Secret for signing access tokens (15-minute expiry) |
| `JWT_REFRESH_SECRET` | `your-refresh-secret` | Yes | Secret for signing refresh tokens (7-day expiry, stored as httpOnly cookie) |
| `PORT` | `5000` | No | Express server port (default 5000) |
| `CLIENT_URL` | `http://localhost:5173` | Yes | Used for CORS origin header |

**Client environment (`client/.env`):**

| Variable | Example Value | Description |
|----------|--------------|-------------|
| `VITE_API_URL` | (not needed) | Vite proxy handles `/api` → `:5000`, no explicit API URL needed in dev |

**Note:** SMTP credentials and GHL webhook secret are stored in MongoDB (`OrgSettings` collection), not in `.env`. They are configurable via the admin UI without server restart.

---

## 12. Known Patterns and Conventions

### 12.1 Discriminator Pattern for WorkUnit

```javascript
// Always check `kind` field when querying for team-specific units
WorkUnit.find({ kind: 'SalesUnit', ... })     // Sales team units
WorkUnit.find({ kind: 'MarketingUnit', ... }) // Marketing team units
WorkUnit.find({ kind: 'ProductionUnit', ... }) // Production team units

// When creating, pass `kind` in the body — Mongoose routes to correct subtype
WorkUnit.create({ kind: 'SalesUnit', ...salesFields })
```

### 12.2 ISO Week Numbers

```javascript
// ALWAYS use date-fns getISOWeek() — never compute manually
const { getISOWeek } = require('date-fns');
const weekNum = getISOWeek(new Date()); // e.g. 17

// This must be consistent between:
// - seed.js (creates KPI targets)
// - kpiController.js (queries KPI targets)
// - chartsController.js (builds week target dots)
```

### 12.3 EOD Response Shape

All EOD list endpoints return `{ reports: [...] }` (wrapped), not a bare array:
```javascript
// Correct client usage:
const { data } = await api.get(`/eod/user/${userId}`);
const reports = data.reports; // NOT data directly
```

### 12.4 Case Field Names (Critical)

The Case model uses specific field names — always use these, not alternatives:
- `assignedManager` (not `assignedTo`, not `manager`)
- `slaDeadline` (not `deadline`, not `dueDate`)
- `stageHistory` (array, not `history`)
- `statusUpdates` (array)
- `caseId` (the human-readable IMM-YYYY-XXXX string, not `_id` or `caseNumber`)

### 12.5 Authentication Flow

```javascript
// Access token: 15-minute JWT in Authorization header
headers: { Authorization: `Bearer ${token}` }

// Refresh token: 7-day JWT in httpOnly cookie
// Browser sends cookie automatically on POST /api/auth/refresh

// On 401: client should call POST /api/auth/refresh → get new access token
// Refresh token is stored hashed in users.refreshToken (bcrypt)
// Logout: clears DB token + cookie
```

### 12.6 Productivity Score Formula

```javascript
// server/utils/scoreCalculator.js
function calcProductivityScore(workUnits, hoursTracked, targetHours = 8) {
  const completed = workUnits.filter(u => u.status === 'Completed').length;
  const completionRate = completed / Math.max(workUnits.length, 1);

  const timeScore = Math.min(hoursTracked / targetHours, 1);

  const totalOutput = workUnits.reduce((s, u) => {
    return s + (u.callsMade || 0) + (u.emailsSent || 0) + (u.leadsAdded || 0);
  }, 0);
  const outputScore = Math.min(totalOutput / 10, 1);

  return Math.round((completionRate * 0.45 + timeScore * 0.35 + outputScore * 0.20) * 100);
}
```

### 12.7 No Emoji Rule

**Critical design constraint:** Zero emojis anywhere in the UI. All visual indicators must use Lucide React SVG icons. This applies to:
- Sidebar navigation items
- Dashboard cards and labels
- Status indicators
- Alert/warning messages
- Button labels
- Page headers

When adding new UI features, always import from `lucide-react`, never use Unicode emoji characters.

### 12.8 teamScope Middleware

```javascript
// middleware/roleGuard.js
// Sets req.scopeFilter for multi-user queries
// user role:        req.scopeFilter = { userId: req.user._id }
// admin role:       req.scopeFilter = { team: req.user.team }
// superadmin role:  req.scopeFilter = {}  (no filter = all records)

// Usage in controllers:
const units = await WorkUnit.find({ ...req.scopeFilter, ...otherFilters });
```

### 12.9 OrgSettings Singleton

```javascript
// Always use this pattern — never assume the doc exists
async function getOrCreate() {
  let settings = await OrgSettings.findOne();
  if (!settings) settings = await OrgSettings.create({});
  return settings;
}
```

### 12.10 Seeding the Database

```bash
# From the server/ directory:
cd server
node scripts/seed.js

# The seed script:
# - Uses MONGO_URI from server/.env (not hardcoded)
# - Drops all collections before re-seeding
# - Creates 13 users, 20 cases, 1225 work units, 106 KPI targets
# - Uses getISOWeek() from date-fns for week numbers
# - Creates 1 OrgSettings doc with ceoZoomLink set
```

### 12.11 Tailwind Custom Classes

Defined in `client/src/index.css`:
```css
.btn-primary    — brand color filled button
.btn-secondary  — gray outlined button
.card           — white rounded shadow container
.input          — styled text input
.label          — form label
```

Always use these classes for consistency. Do not write raw Tailwind on interactive elements.

### 12.12 Mongoose Strict Populate (v8.x)

Mongoose 8.x throws if you populate a field that doesn't exist in the schema. Always match populate field names exactly:
```javascript
// Correct:
.populate('assignedManager', 'name')
.populate('stageHistory.movedBy', 'name')
.populate('statusUpdates.updatedBy', 'name')
.populate('userId', 'name team')

// Wrong (will throw in Mongoose 8.x):
.populate('assignedTo', 'name')   // field doesn't exist
.populate('manager', 'name')      // field doesn't exist
```

---

## 13. AI Coding Assistant Quick Reference

**20 things to know before editing this codebase:**

1. **Database name is `crm-portal`** — not `immigration_crm`, not `crm`. It's in `MONGO_URI` in `server/.env`. The seed script reads this via dotenv.

2. **WorkUnit is a discriminator model** — one `workunits` collection, three subtypes (`SalesUnit`, `MarketingUnit`, `ProductionUnit`). Always filter with `{ kind: 'SalesUnit' }` etc. when querying team-specific data.

3. **Week numbers are ISO via date-fns** — `getISOWeek(date)` from the `date-fns` package. Never compute weeks manually. KPI targets are indexed by this week number; a mismatch causes "0 KPIs found" bugs.

4. **Case fields: `assignedManager`, `slaDeadline`, `caseId`** — not `assignedTo`, `deadline`, or `caseNumber`. Mongoose 8 strict populate will throw if you use wrong names.

5. **EOD endpoints return `{ reports: [] }`** — wrapped, not a bare array. Client code must destructure: `const { reports } = data`.

6. **Zero emojis, Lucide icons only** — this is a hard design constraint. Import from `lucide-react`. No Unicode emojis in JSX or template literals.

7. **JWT access token = 15 min, refresh token = 7 days httpOnly cookie** — access token in `Authorization: Bearer` header. Refresh via `POST /api/auth/refresh` which reads cookie automatically.

8. **Refresh tokens are bcrypt-hashed before storage** — `User.refreshToken` is a hash, not the token itself. Verification requires `bcrypt.compare()`.

9. **GHL webhook endpoint is unauthenticated** — `POST /api/webhooks/gohighlevel` has no `verifyToken`. Security is via HMAC-SHA256 signature check against `OrgSettings.ghlWebhookSecret`.

10. **SMTP config lives in MongoDB, not `.env`** — `emailService.js` fetches `OrgSettings` from the DB every time it sends. Change SMTP settings via OrgSettings UI, no server restart needed.

11. **`teamScope` sets `req.scopeFilter`** — use this in controllers for multi-tenant queries: users see own data, admins see team data, superadmin sees all. Spread into find filters: `WorkUnit.find({ ...req.scopeFilter })`.

12. **OrgSettings is a singleton** — always call `getOrCreate()` pattern, not `findById()`. There is always exactly one document or zero (created on first access).

13. **Productivity score weights: 45% completion, 35% time, 20% output** — formula is in `server/utils/scoreCalculator.js`. Output score sums callsMade + emailsSent + leadsAdded, normalized to 10.

14. **Cron jobs start automatically** — `server/utils/cronJobs.js` is `require()`d in `app.js`. Three jobs: EOD at 6PM weekdays, hourly notification scan, Sunday 11PM KPI miss check.

15. **EOD cron does NOT send email** — only `eodController.generate` (the manual endpoint) sends email. The cron only upserts the report to MongoDB.

16. **Revenue forecast uses 90-day lookback** — `forecastController.js` queries last 90 days of SalesUnits. Confidence is `high` if ≥50 data points, `medium` if ≥20, `low` otherwise.

17. **Case kanban has 9 stages** (not 5 or 7) — Document Collection → Application Drafted → Internal Team Review → Client Review → Petition Filed → Under Government Review → Approved/Rejected/RFE Issued. `isOverdue` checks `stage !== 'Approved'` (not `!== 'Delivered'`).

18. **`api/axios.js` auto-attaches Bearer token** — reads from Redux store `state.auth.token` on each request. No manual header setting needed in API call files.

19. **All custom UI classes are in `client/src/index.css`** — `.btn-primary`, `.btn-secondary`, `.card`, `.input`, `.label`. Use these, don't write raw Tailwind on interactive elements.

20. **Kill old Node processes before testing server changes** — on Windows, new route registrations won't appear until the old process is killed. Use PowerShell: `Get-NetTCPConnection -LocalPort 5000 | Select-Object -ExpandProperty OwningProcess | ForEach-Object { Stop-Process $_ }` then restart the server.

---

*End of System Memory Document*
*For questions about this system, contact: rahul@newyorkareaimmigrationservices.com*
