/**
 * Full demo-data seed for ImmigrationCRM
 * Run: node scripts/seed.js
 * Drops ALL existing data first, then inserts rich demo records.
 */

const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/crm-portal')
  .then(() => console.log('Connected'))
  .catch(e => { console.error(e.message); process.exit(1); });

// ── Models ────────────────────────────────────────────────────────────────────
const User        = require('../models/User');
const WorkUnit    = require('../models/WorkUnit');
const Case        = require('../models/Case');
const KpiTarget   = require('../models/KpiTarget');
const LeaveRequest= require('../models/LeaveRequest');
const EodReport   = require('../models/EodReport');
const Notification= require('../models/Notification');
const WebhookLog  = require('../models/WebhookLog');
const AuditLog    = require('../models/AuditLog');
const OrgSettings = require('../models/OrgSettings');

// ── Helpers ───────────────────────────────────────────────────────────────────
const pw = (plain) => bcrypt.hashSync(plain, 10);

const daysAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d; };
const dayStart = (n) => { const d = daysAgo(n); d.setHours(0,0,0,0); return d; };
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const rand = (lo, hi) => Math.floor(Math.random() * (hi - lo + 1)) + lo;

// ── Seed ──────────────────────────────────────────────────────────────────────
async function seed() {
  // Wipe
  await Promise.all([
    User.deleteMany({}), WorkUnit.deleteMany({}), Case.deleteMany({}),
    KpiTarget.deleteMany({}), LeaveRequest.deleteMany({}),
    EodReport.deleteMany({}), Notification.deleteMany({}),
    WebhookLog.deleteMany({}), AuditLog.deleteMany({}),
    OrgSettings.deleteMany({}),
  ]);
  console.log('Cleared existing data');

  // ── Org Settings ────────────────────────────────────────────────────────────
  await OrgSettings.create({
    ceoZoomLink: 'https://us02web.zoom.us/j/85012345678?pwd=demoLink',
    eodReportTime: '18:00',
    visaCategories: ['H-1B', 'H-4', 'L-1A', 'L-1B', 'EB-2 NIW', 'EB-3', 'O-1A', 'TN', 'DACA', 'Green Card', 'Citizenship'],
    internalReviewers: ['Bhavya', 'Akashdeep', 'Priya'],
    smtpConfig: { host: 'smtp.gmail.com', port: 587, user: 'demo@example.com', from: 'ImmigrationCRM <demo@example.com>' },
  });
  console.log('OrgSettings created');

  // ── Users ─────────────────────────────────────────────────────────────────
  const salesUsers = await User.insertMany([
    { name: 'Rahul Sharma',    email: 'rahul@newyorkareaimmigrationservices.com', passwordHash: pw('Admin@123'), role: 'superadmin', team: 'Sales' },
    { name: 'Amit Patel',      email: 'amit@nyais.com',    passwordHash: pw('Demo@123'), role: 'admin', team: 'Sales' },
    { name: 'Sarah Johnson',   email: 'sarah@nyais.com',   passwordHash: pw('Demo@123'), role: 'user',  team: 'Sales' },
    { name: 'Marcus Williams', email: 'marcus@nyais.com',  passwordHash: pw('Demo@123'), role: 'user',  team: 'Sales' },
    { name: 'Priya Singh',     email: 'priya@nyais.com',   passwordHash: pw('Demo@123'), role: 'user',  team: 'Sales' },
  ]);

  const mktUsers = await User.insertMany([
    { name: 'Lisa Chen',       email: 'lisa@nyais.com',    passwordHash: pw('Demo@123'), role: 'admin', team: 'Marketing' },
    { name: 'David Kim',       email: 'david@nyais.com',   passwordHash: pw('Demo@123'), role: 'user',  team: 'Marketing' },
    { name: 'Nina Rodriguez',  email: 'nina@nyais.com',    passwordHash: pw('Demo@123'), role: 'user',  team: 'Marketing' },
    { name: 'James Thompson',  email: 'james@nyais.com',   passwordHash: pw('Demo@123'), role: 'user',  team: 'Marketing' },
  ]);

  const prodUsers = await User.insertMany([
    { name: 'Akashdeep Kaur',  email: 'akash@nyais.com',   passwordHash: pw('Demo@123'), role: 'admin', team: 'Production' },
    { name: 'Bhavya Mehta',    email: 'bhavya@nyais.com',  passwordHash: pw('Demo@123'), role: 'user',  team: 'Production' },
    { name: 'Carlos Rivera',   email: 'carlos@nyais.com',  passwordHash: pw('Demo@123'), role: 'user',  team: 'Production' },
    { name: 'Aisha Mohammed',  email: 'aisha@nyais.com',   passwordHash: pw('Demo@123'), role: 'user',  team: 'Production' },
  ]);

  console.log(`Users created: ${salesUsers.length + mktUsers.length + prodUsers.length}`);

  const superAdmin = salesUsers[0];
  const salesAdmin = salesUsers[1];
  const mktAdmin   = mktUsers[0];
  const prodAdmin  = prodUsers[0];
  const allSales   = salesUsers;
  const allMkt     = mktUsers;
  const allProd    = prodUsers;
  const allUsers   = [...allSales, ...allMkt, ...allProd];

  // ── Cases ─────────────────────────────────────────────────────────────────
  const STAGES = [
    'Document Collection','Application Drafted','Internal Team Review',
    'Client Review','Petition Filed','Under Government Review','Approved',
  ];

  const caseData = [
    { clientName:'Ravi Subramanian',  visaCategory:'H-1B',      stage:'Document Collection',     priority:'High',   daysBack:2  },
    { clientName:'Mei Lin',           visaCategory:'EB-2 NIW',  stage:'Application Drafted',     priority:'Normal', daysBack:5  },
    { clientName:'Omar Farouk',       visaCategory:'L-1A',      stage:'Internal Team Review',    priority:'Urgent', daysBack:8  },
    { clientName:'Anna Kowalski',     visaCategory:'Green Card',stage:'Client Review',           priority:'Normal', daysBack:12 },
    { clientName:'Rohan Gupta',       visaCategory:'H-1B',      stage:'Petition Filed',          priority:'High',   daysBack:18 },
    { clientName:'Maria Santos',      visaCategory:'TN',        stage:'Under Government Review', priority:'Normal', daysBack:25 },
    { clientName:'Wei Zhang',         visaCategory:'O-1A',      stage:'Approved',                priority:'Normal', daysBack:35 },
    { clientName:'Fatima Al-Hassan',  visaCategory:'EB-3',      stage:'Document Collection',     priority:'Normal', daysBack:1  },
    { clientName:'Sven Eriksson',     visaCategory:'L-1A',      stage:'Application Drafted',     priority:'Low',    daysBack:6  },
    { clientName:'Preet Malhotra',    visaCategory:'H-1B',      stage:'Internal Team Review',    priority:'High',   daysBack:10 },
    { clientName:'Lucia Torres',      visaCategory:'DACA',      stage:'Client Review',           priority:'Urgent', daysBack:14 },
    { clientName:'Kenji Tanaka',      visaCategory:'H-1B',      stage:'Petition Filed',          priority:'Normal', daysBack:20 },
    { clientName:'Yusuf Ibrahim',     visaCategory:'EB-2 NIW',  stage:'Under Government Review', priority:'High',   daysBack:30 },
    { clientName:'Elena Popescu',     visaCategory:'Green Card',stage:'Approved',                priority:'Normal', daysBack:40 },
    { clientName:'Amara Diallo',      visaCategory:'TN',        stage:'Document Collection',     priority:'Normal', daysBack:3  },
    { clientName:'Nadia Volkov',      visaCategory:'O-1A',      stage:'Application Drafted',     priority:'High',   daysBack:7  },
    { clientName:'Tariq Mansoor',     visaCategory:'H-1B',      stage:'Internal Team Review',    priority:'Normal', daysBack:9  },
    { clientName:'Ines Ferreira',     visaCategory:'EB-3',      stage:'Under Government Review', priority:'Low',    daysBack:28 },
    { clientName:'Jakub Novak',       visaCategory:'L-1A',      stage:'Petition Filed',          priority:'Normal', daysBack:16 },
    { clientName:'Sunita Bose',       visaCategory:'H-1B',      stage:'Approved',                priority:'High',   daysBack:45 },
  ];

  const cases = [];
  for (const d of caseData) {
    const c = await Case.create({
      clientName: d.clientName,
      clientEmail: `${d.clientName.split(' ')[0].toLowerCase()}@example.com`,
      visaCategory: d.visaCategory,
      stage: d.stage,
      priority: d.priority,
      assignedManager: pick(allProd)._id,
      internalReviewer: pick(['Bhavya', 'Akashdeep', 'Priya']),
      stageEnteredAt: daysAgo(d.daysBack),
      slaDeadline: daysAgo(d.daysBack - rand(20, 60)),
      filingDeadline: daysAgo(d.daysBack - rand(30, 90)),
      source: Math.random() > 0.5 ? 'gohighlevel' : 'manual',
      notes: `Case opened via ${Math.random() > 0.5 ? 'referral' : 'website inquiry'}. Profile verified.`,
      stageHistory: STAGES.slice(0, STAGES.indexOf(d.stage) + 1).map((s, i) => ({
        stage: s,
        movedAt: daysAgo(d.daysBack - i * 3),
        movedBy: pick(allProd)._id,
        notes: `Moved to ${s}`,
      })),
    });
    cases.push(c);
  }
  console.log(`Cases created: ${cases.length}`);

  // ── Work Units ────────────────────────────────────────────────────────────
  const workUnits = [];
  const LEAD_STAGES = ['Hot','Hot','Warm','Warm','Cold','Won','Lost'];
  const CAMPAIGN_TYPES = ['Employer','Attorney','Individual','Bulk'];

  // Sales — 30 days
  for (let day = 0; day <= 29; day++) {
    for (const u of allSales) {
      const n = rand(2, 5);
      for (let k = 0; k < n; k++) {
        const rev = pick([0, 0, rand(2000,15000), rand(5000,45000), rand(10000,80000)]);
        const st = daysAgo(day); st.setHours(rand(8,11), rand(0,59), 0, 0);
        const et = new Date(st.getTime() + rand(20,120)*60000);
        workUnits.push({
          kind:'SalesUnit', userId:u._id, team:'Sales',
          workType:pick(['call','email','task','lead_update']),
          title:pick(['Follow-up with H-1B client','Cold outreach batch','LinkedIn prospecting','Pipeline review','Referral call','Demo meeting','Contract walkthrough','New lead intake']),
          status:pick(['Completed','Completed','Completed','In Progress','Pending']),
          startTime:st, endTime:et, date:dayStart(day),
          callsMade:rand(3,18), emailsSent:rand(5,25), leadsAdded:rand(0,3),
          leadStage:pick(LEAD_STAGES),
          dealValue:rev, dailyRevenue:rev,
          contactName:pick(['John Smith','Maria Garcia','Li Wei','Ahmed Hassan','Pita Havili','Ravi Kumar','Elena Volkov']),
          outputValue:rev,
        });
      }
    }
  }

  // Marketing — 30 days
  for (let day = 0; day <= 29; day++) {
    for (const u of allMkt) {
      const n = rand(1, 4);
      for (let k = 0; k < n; k++) {
        const emails = rand(50,500);
        const st = daysAgo(day); st.setHours(rand(8,11), rand(0,59), 0, 0);
        const et = new Date(st.getTime() + rand(30,180)*60000);
        workUnits.push({
          kind:'MarketingUnit', userId:u._id, team:'Marketing',
          workType:pick(['email','campaign','task']),
          title:pick(['Monthly newsletter blast','EB-2 employer outreach','LinkedIn ad campaign','Attorney referral email','Webinar follow-up','Re-engagement sequence','Google Ads review','Content calendar update']),
          status:pick(['Completed','Completed','In Progress','Pending']),
          startTime:st, endTime:et, date:dayStart(day),
          campaignType:pick(CAMPAIGN_TYPES),
          campaignName:pick(['Spring H1B Push','EB Employer Series','Green Card Q2','Attorney Network','Individual Visa Drive','April Nurture Seq']),
          emailsSent:emails, openRate:rand(18,42), clickRate:rand(3,15),
          leadsGenerated:rand(0,20), conversionsToSales:rand(0,5),
          campaignCost:rand(100,2000),
        });
      }
    }
  }

  // Production — 30 days
  for (let day = 0; day <= 29; day++) {
    for (const u of allProd) {
      const n = rand(2, 5);
      for (let k = 0; k < n; k++) {
        const caseRef = pick(cases);
        const st = daysAgo(day); st.setHours(rand(8,11), rand(0,59), 0, 0);
        const et = new Date(st.getTime() + rand(30,240)*60000);
        workUnits.push({
          kind:'ProductionUnit', userId:u._id, team:'Production',
          workType:pick(['case_update','task','email']),
          title:pick(['Document review','Client intake call','Form I-140 prep','RFE response draft','USCIS filing','Status update email','Case strategy meeting','Petition package review']),
          status:pick(['Completed','Completed','In Progress','Pending']),
          startTime:st, endTime:et, date:dayStart(day),
          caseId:caseRef._id, clientName:caseRef.clientName,
          caseType:caseRef.visaCategory,
          stage:pick(['Received','In Progress','Review','Submitted','Delivered']),
          assignedTo:u._id,
        });
      }
    }
  }

  await WorkUnit.insertMany(workUnits);
  console.log(`Work units created: ${workUnits.length}`);

  // ── KPI Targets ───────────────────────────────────────────────────────────
  const { getISOWeek } = require('date-fns');
  const now = new Date();
  const weekNum = getISOWeek(now);
  const month   = now.getMonth() + 1;
  const year    = now.getFullYear();

  const SALES_METRICS = [
    { metric:'callsMade',  target:100,    current:rand(45,120)       },
    { metric:'emailsSent', target:150,    current:rand(60,180)       },
    { metric:'leadsAdded', target:20,     current:rand(8,25)         },
    { metric:'dealValue',  target:100000, current:rand(30000,130000) },
    { metric:'dealsWon',   target:8,      current:rand(2,10)         },
  ];
  const MKT_METRICS = [
    { metric:'emailsSent',        target:2000, current:rand(800,2400)  },
    { metric:'leadsGenerated',    target:80,   current:rand(30,95)     },
    { metric:'openRate',          target:30,   current:rand(18,38)     },
    { metric:'campaignsLaunched', target:5,    current:rand(2,7)       },
  ];
  const PROD_METRICS = [
    { metric:'casesMoved',     target:15, current:rand(5,18) },
    { metric:'casesSubmitted', target:10, current:rand(3,14) },
    { metric:'casesDelivered', target:8,  current:rand(2,10) },
  ];

  const kpiDocs = [];
  const addKpis = (users, metrics, admin) => {
    for (const u of users) {
      for (const { metric, target } of metrics) {
        const cur = rand(Math.floor(target * 0.3), Math.floor(target * 1.3));
        kpiDocs.push({
          userId:u._id, setByAdmin:admin._id, team:u.team,
          metric, targetValue:target, currentValue:Math.min(cur, target + Math.floor(target*0.2)),
          period:'weekly', weekNumber:weekNum, year,
        });
        kpiDocs.push({
          userId:u._id, setByAdmin:admin._id, team:u.team,
          metric, targetValue:target*4,
          currentValue:Math.min(cur*3, target*4 + Math.floor(target*0.5)),
          period:'monthly', month, year,
        });
      }
    }
  };

  addKpis(allSales, SALES_METRICS, salesAdmin);
  addKpis(allMkt,   MKT_METRICS,   mktAdmin);
  addKpis(allProd,  PROD_METRICS,  prodAdmin);
  await KpiTarget.insertMany(kpiDocs);
  console.log(`KPI targets created: ${kpiDocs.length}`);

  // ── Leave Requests ────────────────────────────────────────────────────────
  const leaveScenarios = [
    { user:salesUsers[2], daysFromNow:-10, status:'Approved', type:'full_day', reason:'Medical appointment',    reviewer:salesAdmin, note:'Approved — coverage arranged.' },
    { user:salesUsers[3], daysFromNow:-5,  status:'Rejected', type:'full_day', reason:'Family event',           reviewer:salesAdmin, note:'Rejected — critical deadline that week.' },
    { user:salesUsers[4], daysFromNow:-15, status:'Approved', type:'full_day', reason:'Vacation (3 days)',       reviewer:salesAdmin, note:'Approved — pipeline updated before leave.' },
    { user:mktUsers[1],   daysFromNow:3,   status:'Pending',  type:'full_day', reason:'Personal travel' },
    { user:mktUsers[2],   daysFromNow:7,   status:'Pending',  type:'half_day', reason:'Doctor visit' },
    { user:mktUsers[3],   daysFromNow:10,  status:'Pending',  type:'full_day', reason:'Conference attendance' },
    { user:prodUsers[1],  daysFromNow:-3,  status:'Approved', type:'half_day', reason:'Child school event',     reviewer:prodAdmin,  note:'Approved.' },
    { user:prodUsers[2],  daysFromNow:1,   status:'Pending',  type:'full_day', reason:'Moving to new home' },
    { user:prodUsers[3],  daysFromNow:-2,  status:'Approved', type:'half_day', reason:'Errand',                 reviewer:prodAdmin,  note:'Approved.' },
    { user:salesUsers[1], daysFromNow:5,   status:'Pending',  type:'full_day', reason:'Offsite client meeting' },
  ];

  const leaveDocs = leaveScenarios.map(s => {
    const baseDate = new Date();
    baseDate.setDate(baseDate.getDate() + s.daysFromNow);
    baseDate.setHours(0,0,0,0);
    const dates = [baseDate];
    if (s.type === 'full_day' && s.reason.includes('3 days')) {
      dates.push(new Date(baseDate.getTime() + 86400000));
      dates.push(new Date(baseDate.getTime() + 2*86400000));
    }
    return {
      userId:s.user._id, dates, type:s.type, reason:s.reason, status:s.status,
      ...(s.reviewer ? { reviewedBy:s.reviewer._id, reviewNote:s.note } : {}),
    };
  });
  await LeaveRequest.insertMany(leaveDocs);
  console.log(`Leave requests created: ${leaveDocs.length}`);

  // ── EOD Reports ───────────────────────────────────────────────────────────
  const eodSummaries = [
    'Completed client follow-ups and updated pipeline. Good progress on H-1B cases.',
    'Sent outreach to 3 new leads. Two responded positively — scheduling demos.',
    'Finished petition draft for EB-2 NIW case. Sent to internal reviewer.',
    'Campaign reporting done. Open rates above target this week.',
    'RFE response finalized and submitted to USCIS. Client notified.',
    'Team meeting, pipeline review, and 2 new case intakes done.',
    'Email sequence launched. Early metrics look promising.',
    'Reviewed 4 I-140 filings. 2 approved, 1 needs revision, 1 pending signature.',
    'Attorney referral campaign — 12 new replies. 4 qualified leads handed to Sales.',
    'Completed 3 document collection checklists. Waiting on client for 2 more.',
  ];
  const eodDocs = [];
  for (let day = 1; day <= 14; day++) {
    for (const u of allUsers) {
      if (Math.random() < 0.12) continue;
      eodDocs.push({
        userId:u._id, date:dayStart(day),
        tasksCompleted:rand(3,12), totalTimeSpent:rand(240,480),
        emailsSent:u.team==='Marketing' ? rand(50,300) : rand(2,20),
        callsMade:u.team==='Sales' ? rand(5,20) : rand(0,3),
        leadsUpdated:u.team==='Sales' ? rand(1,8) : u.team==='Marketing' ? rand(5,20) : 0,
        casesMoved:u.team==='Production' ? rand(1,5) : 0,
        rawSummary:pick(eodSummaries),
      });
    }
  }
  await EodReport.insertMany(eodDocs);
  console.log(`EOD reports created: ${eodDocs.length}`);

  // ── Notifications ─────────────────────────────────────────────────────────
  const notifTemplates = [
    { type:'task_deadline',  title:'Task overdue',               message:'You have 2 tasks past their deadline. Please review your work units.',         linkTo:'/work-units' },
    { type:'lead_cold',      title:'Lead going cold',            message:'3 leads have not been contacted in over 7 days. Follow up soon.',              linkTo:'/work-units' },
    { type:'case_stuck',     title:'Case stuck in stage',        message:'H-1B case for Ravi Subramanian has been in Document Collection for 8+ days.', linkTo:'/cases'      },
    { type:'filing_deadline',title:'Filing deadline approaching',message:'Petition for Kenji Tanaka must be filed within 5 days.',                      linkTo:'/cases'      },
    { type:'inactivity',     title:'No activity logged',         message:'You have not logged any work units today. Please update your tracker.',       linkTo:'/'           },
    { type:'kpi_miss',       title:'KPI below target',           message:'Your Calls Made metric is at 42% of weekly target. Time to push!',            linkTo:'/kpi'        },
    { type:'leave_update',   title:'Leave request approved',     message:'Your leave request has been approved.',                                       linkTo:'/leave'      },
    { type:'general',        title:'All-hands meeting reminder', message:'All-hands meeting today at 3:00 PM EST. Check your calendar.',                linkTo:'/'           },
  ];

  const notifDocs = [];
  for (const u of allUsers) {
    const count = rand(4, 9);
    for (let i = 0; i < count; i++) {
      const tmpl = pick(notifTemplates);
      notifDocs.push({
        userId:u._id, ...tmpl,
        isRead:Math.random() > 0.4,
        createdAt:daysAgo(rand(0,7)),
      });
    }
  }
  await Notification.insertMany(notifDocs);
  console.log(`Notifications created: ${notifDocs.length}`);

  // ── Webhook Logs ──────────────────────────────────────────────────────────
  const GHL_EVENTS = [
    'contact.created','contact.updated','opportunity.statusChanged',
    'opportunity.stageChanged','email.sent','email.opened','email.clicked',
    'email.bounced','campaign.completed',
  ];
  const webhookDocs = [];
  for (let i = 0; i < 80; i++) {
    const evType = pick(GHL_EVENTS);
    const status = pick(['success','success','success','success','failed','retrying']);
    webhookDocs.push({
      platform:'gohighlevel', eventType:evType, status,
      retryCount:status==='retrying' ? rand(1,2) : status==='failed' ? rand(1,3) : 0,
      errorMessage:status==='failed' ? 'Timeout connecting to downstream service' : undefined,
      receivedAt:daysAgo(rand(0,14)),
      processedAt:status==='success' ? daysAgo(rand(0,14)) : undefined,
      rawPayload:{ type:evType, contactId:`ghl_${Math.random().toString(36).slice(2,10)}`, timestamp:new Date().toISOString() },
    });
  }
  await WebhookLog.insertMany(webhookDocs);
  console.log(`Webhook logs created: ${webhookDocs.length}`);

  // ── Audit Logs ────────────────────────────────────────────────────────────
  const AUDIT_ACTIONS  = ['CREATE','UPDATE','LOGIN','LOGOUT','EXPORT','REVIEW'];
  const AUDIT_ENTITIES = ['User','WorkUnit','Case','KpiTarget','LeaveRequest','OrgSettings'];
  const auditDocs = [];
  const admins = [superAdmin, salesAdmin, mktAdmin, prodAdmin];
  for (let i = 0; i < 120; i++) {
    const actor = pick(admins);
    auditDocs.push({
      performedBy:actor._id, role:actor.role,
      action:pick(AUDIT_ACTIONS), entity:pick(AUDIT_ENTITIES),
      entityId:new mongoose.Types.ObjectId(),
      ipAddress:`10.0.${rand(1,10)}.${rand(1,255)}`,
      userAgent:'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      timestamp:daysAgo(rand(0,60)),
    });
  }
  await AuditLog.insertMany(auditDocs);
  console.log(`Audit logs created: ${auditDocs.length}`);

  // ── Done ──────────────────────────────────────────────────────────────────
  console.log('\n=== SEED COMPLETE ===');
  console.log('\nLogin credentials:');
  console.log('\nSUPERADMIN (sees all teams, CEO dashboard):');
  console.log('  rahul@newyorkareaimmigrationservices.com  |  Admin@123');
  console.log('\nSALES team (password: Demo@123):');
  console.log('  Admin : amit@nyais.com');
  console.log('  Users : sarah@nyais.com | marcus@nyais.com | priya@nyais.com');
  console.log('\nMARKETING team (password: Demo@123):');
  console.log('  Admin : lisa@nyais.com');
  console.log('  Users : david@nyais.com | nina@nyais.com | james@nyais.com');
  console.log('\nPRODUCTION team (password: Demo@123):');
  console.log('  Admin : akash@nyais.com');
  console.log('  Users : bhavya@nyais.com | carlos@nyais.com | aisha@nyais.com');

  process.exit(0);
}

seed().catch(e => { console.error(e); process.exit(1); });
