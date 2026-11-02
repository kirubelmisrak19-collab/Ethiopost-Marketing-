/**
 * Ethiopost Marketing Command Center
 * Production-Ready Backend Server
 * Zero-dependency pure Node.js architecture with built-in node:sqlite
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { db } from './db.js';
import { seedDatabase } from './seed.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3050;
const PUBLIC_DIR = path.join(__dirname, 'public');

// Initialize and seed database
seedDatabase();

// MIME Types for static files
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.csv': 'text/csv; charset=utf-8'
};

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.end(JSON.stringify(data));
}

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(new Error('Invalid JSON payload'));
      }
    });
    req.on('error', reject);
  });
}

function calculateExpiry(endDateStr, todayStr = '2026-10-28') {
  if (!endDateStr) return { daysRemaining: null, alertLevel: 'normal', isExpired: false };
  const end = new Date(endDateStr);
  const today = new Date(todayStr);
  const diffTime = end.getTime() - today.getTime();
  const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (daysRemaining < 0) {
    return { daysRemaining, alertLevel: 'expired', isExpired: true };
  } else if (daysRemaining === 0) {
    return { daysRemaining: 0, alertLevel: 'expires_today', isExpired: false };
  } else if (daysRemaining <= 3) {
    return { daysRemaining, alertLevel: 'expires_3_days', isExpired: false };
  } else if (daysRemaining <= 7) {
    return { daysRemaining, alertLevel: 'expires_7_days', isExpired: false };
  }
  return { daysRemaining, alertLevel: 'normal', isExpired: false };
}

// --------------------------------------------------------------------------
// HTTP SERVER & ROUTER
// --------------------------------------------------------------------------
export async function requestHandler(req, res) {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    return res.end();
  }

  const reqUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  let pathname = reqUrl.pathname;
  const method = req.method;
  const searchParams = Object.fromEntries(reqUrl.searchParams.entries());
  const vQuery = (typeof req.query === 'object' && req.query) ? req.query : {};
  const query = { ...searchParams, ...vQuery };

  // Resilient route resolution (local Node, Vercel catch-all, x-matched-path, query route)
  const vMatched = req.headers['x-matched-path'] || req.headers['x-vercel-matched-path'];
  if (vMatched && vMatched.startsWith('/api/')) {
    pathname = vMatched.split('?')[0];
  } else if (query.__route) {
    pathname = `/api/${query.__route}`.split('?')[0];
  } else if (query.slug) {
    const slugStr = Array.isArray(query.slug) ? query.slug.join('/') : query.slug;
    pathname = `/api/${slugStr}`.split('?')[0];
  }

  // ------------------------------------------------------------------------
  // 1. API ROUTES
  // ------------------------------------------------------------------------
  if (pathname.startsWith('/api/')) {
    try {
      const todayStr = query.date || '2026-10-28';
      const currentMonth = query.month || '2026-10';

      // --- Executive Overview ---
      if (pathname === '/api/overview' && method === 'GET') {
        const mStart = `${currentMonth}-01`;
        const mEnd = `${currentMonth}-31`;

        // Active Campaigns in month
        const activeCampaigns = db.prepare(`
          SELECT c.*, p.name as portfolio_name, p.color as portfolio_color, p.badge_bg, p.badge_text
          FROM campaigns c
          JOIN portfolios p ON c.portfolio_id = p.id
          WHERE c.execution_status = 'Active' AND c.start_date <= ? AND c.end_date >= ?
          ORDER BY c.priority DESC, c.start_date ASC
        `).all(mEnd, mStart);

        // Live Advertisements Snapshot
        const liveAds = db.prepare(`
          SELECT p.*, c.title as campaign_title, c.portfolio_id, port.name as portfolio_name, port.color as portfolio_color,
                 o.name as outlet_name, o.type as media_category, o.coverage as outlet_coverage
          FROM media_placements p
          JOIN campaigns c ON p.campaign_id = c.id
          JOIN portfolios port ON c.portfolio_id = port.id
          JOIN media_outlets o ON p.outlet_id = o.id
          WHERE p.status = 'Active' AND p.start_date <= ? AND p.end_date >= ?
          ORDER BY p.end_date ASC
        `).all(todayStr, todayStr).map(p => ({
          ...p,
          ...calculateExpiry(p.end_date, todayStr)
        }));

        // Financial KPIs
        const totalBudgetRow = db.prepare(`
          SELECT COALESCE(SUM(monthly_budget), 0) as totalMonthlyBudget
          FROM portfolios
        `).get();

        const spendRow = db.prepare(`
          SELECT COALESCE(SUM(amount), 0) as totalActualSpend
          FROM expenses
          WHERE stage IN ('Paid', 'Invoiced') AND created_at LIKE ?
        `).get(`${currentMonth}%`);

        const pendingApprovalsCount = db.prepare(`
          SELECT COUNT(*) as c FROM approval_requests WHERE status = 'Pending'
        `).get().c;

        const overdueActivitiesCount = db.prepare(`
          SELECT COUNT(*) as c FROM campaign_activities
          WHERE status != 'Completed' AND due_date < ?
        `).get(todayStr).c;

        // Attention Required Panel
        const attentionItems = [];

        // Expiring Ads
        const expiringPlacements = liveAds.filter(a => a.daysRemaining !== null && a.daysRemaining <= 7 && a.daysRemaining >= 0);
        for (const ep of expiringPlacements) {
          attentionItems.push({
            id: `exp-${ep.id}`,
            type: 'ad_expiring',
            title: `Ad Flight Expiring Soon: ${ep.ad_name}`,
            description: `${ep.daysRemaining} days remaining on ${ep.outlet_name} • Ref: ${ep.contract_ref || ep.id}`,
            link: '#/advertisements'
          });
        }

        // Overdue Tasks
        const overdueTasks = db.prepare(`
          SELECT a.*, c.title as campaign_title
          FROM campaign_activities a
          JOIN campaigns c ON a.campaign_id = c.id
          WHERE a.status != 'Completed' AND a.due_date < ?
          LIMIT 3
        `).all(todayStr);

        for (const ot of overdueTasks) {
          attentionItems.push({
            id: `od-${ot.id}`,
            type: 'overdue_task',
            title: `Overdue Deliverable: ${ot.title}`,
            description: `Assigned to ${ot.owner} • Due ${ot.due_date} (${ot.campaign_title})`,
            link: '#/activities'
          });
        }

        // Pending approvals
        const pendingAppr = db.prepare(`SELECT * FROM approval_requests WHERE status = 'Pending' LIMIT 2`).all();
        for (const pa of pendingAppr) {
          attentionItems.push({
            id: `appr-${pa.id}`,
            type: 'pending_approval',
            title: `Pending Approval: ${pa.title}`,
            description: `Requested by ${pa.requester} • Assigned to ${pa.assigned_to}`,
            link: '#/team'
          });
        }

        return sendJson(res, 200, {
          date: todayStr,
          selectedMonth: currentMonth,
          fiscalYear: 'FY2026/27',
          kpis: {
            activeCampaigns: activeCampaigns.length,
            liveAdvertisements: liveAds.length,
            totalMonthlyMarketingBudget: totalBudgetRow.totalMonthlyBudget,
            actualSpend: spendRow.totalActualSpend,
            pendingApprovals: pendingApprovalsCount,
            overdueActivities: overdueActivitiesCount
          },
          monthlyCampaigns: activeCampaigns,
          liveAdsSnapshot: liveAds,
          attentionRequired: attentionItems
        });
      }

      // --- Campaigns API ---
      if (pathname === '/api/campaigns' && method === 'GET') {
        let sql = `
          SELECT c.*, p.name as portfolio_name, p.color as portfolio_color, p.badge_bg, p.badge_text, p.code as portfolio_code
          FROM campaigns c
          JOIN portfolios p ON c.portfolio_id = p.id
          WHERE 1=1
        `;
        const params = [];

        if (query.month) {
          const mStart = `${query.month}-01`;
          const mEnd = `${query.month}-31`;
          sql += ` AND c.start_date <= ? AND c.end_date >= ?`;
          params.push(mEnd, mStart);
        }

        if (query.portfolio && query.portfolio !== 'all') {
          sql += ` AND c.portfolio_id = ?`;
          params.push(query.portfolio);
        }

        if (query.status && query.status !== 'all') {
          sql += ` AND c.execution_status = ?`;
          params.push(query.status);
        }

        if (query.search) {
          sql += ` AND (c.title LIKE ? OR c.id LIKE ? OR c.strategic_objective LIKE ?)`;
          const s = `%${query.search}%`;
          params.push(s, s, s);
        }

        sql += ` ORDER BY c.start_date ASC`;
        const campaigns = db.prepare(sql).all(...params);

        campaigns.forEach(c => {
          try { c.channels = JSON.parse(c.channels); } catch (e) { c.channels = []; }
          const acts = db.prepare(`SELECT COUNT(*) as total, SUM(CASE WHEN status='Completed' THEN 1 ELSE 0 END) as done FROM campaign_activities WHERE campaign_id = ?`).get(c.id);
          c.activitiesTotal = acts.total;
          c.activitiesDone = acts.done || 0;
          c.activityPercent = acts.total > 0 ? Math.round((acts.done / acts.total) * 100) : c.progress_percent;
        });

        return sendJson(res, 200, campaigns);
      }

      if (pathname === '/api/campaigns' && method === 'POST') {
        const body = await parseJsonBody(req);
        if (!body.title || !body.portfolio_id || !body.start_date || !body.end_date) {
          return sendJson(res, 400, { error: 'Missing required campaign fields (title, portfolio_id, start_date, end_date)' });
        }

        // Auto-generate code e.g. CMP-2026-VPB-042
        const portCode = body.portfolio_id.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3) || 'GEN';
        const year = new Date().getFullYear();
        const randNum = String(Math.floor(Math.random() * 900) + 100);
        const code = body.id || `CMP-${year}-${portCode}-${randNum}`;

        db.prepare(`
          INSERT INTO campaigns (
            id, title, portfolio_id, strategic_objective, description, target_audience,
            geographic_coverage, start_date, end_date, fiscal_year, owner, budget, spent,
            channels, target_leads, actual_leads, target_reach, actual_reach, priority,
            approval_status, execution_status, progress_percent, notes
          ) VALUES (
            ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, 0, ?, 0, ?, ?, ?, 0, ?
          )
        `).run(
          code,
          body.title,
          body.portfolio_id,
          body.strategic_objective || '',
          body.description || '',
          body.target_audience || 'All Ethiopians',
          body.geographic_coverage || 'National',
          body.start_date,
          body.end_date,
          body.fiscal_year || 'FY2026/27',
          body.owner || 'Marketing Lead',
          Number(body.budget) || 0,
          JSON.stringify(body.channels || ['Television', 'Radio']),
          Number(body.target_leads) || 0,
          Number(body.target_reach) || 0,
          body.priority || 'Medium',
          body.approval_status || 'Draft',
          body.execution_status || 'Draft',
          body.notes || ''
        );

        return sendJson(res, 201, { id: code, message: 'Campaign created successfully' });
      }

      // Single Campaign Details (All 7 Tabs)
      const campaignDetailMatch = pathname.match(/^\/api\/campaigns\/([^\/]+)$/);
      if (campaignDetailMatch && method === 'GET') {
        const campaignId = campaignDetailMatch[1];
        const campaign = db.prepare(`
          SELECT c.*, p.name as portfolio_name, p.color as portfolio_color, p.badge_bg, p.badge_text, p.code as portfolio_code
          FROM campaigns c
          JOIN portfolios p ON c.portfolio_id = p.id
          WHERE c.id = ?
        `).get(campaignId);

        if (!campaign) {
          return sendJson(res, 404, { error: `Campaign not found with ID ${campaignId}` });
        }

        try { campaign.channels = JSON.parse(campaign.channels); } catch (e) { campaign.channels = []; }

        // Fetch Tab 2: Advertisements
        const advertisements = db.prepare(`
          SELECT p.*, o.name as outlet_name, o.type as outlet_type, o.coverage as outlet_coverage,
            (SELECT COUNT(*) FROM ad_spots WHERE placement_id = p.id AND verification_status = 'Verified as aired/displayed') as verified_spots_count
          FROM media_placements p
          JOIN media_outlets o ON p.outlet_id = o.id
          WHERE p.campaign_id = ?
          ORDER BY p.start_date ASC
        `).all(campaignId).map(p => ({
          ...p,
          ...calculateExpiry(p.end_date, todayStr)
        }));

        // Fetch Tab 3: Activities
        const activities = db.prepare(`
          SELECT * FROM campaign_activities WHERE campaign_id = ? ORDER BY due_date ASC
        `).all(campaignId);

        // Fetch Tab 4: Expenses & Budget
        const expenses = db.prepare(`
          SELECT * FROM expenses WHERE campaign_id = ? ORDER BY created_at DESC
        `).all(campaignId);

        return sendJson(res, 200, {
          campaign,
          tabs: {
            overview: {
              strategicObjective: campaign.strategic_objective,
              description: campaign.description,
              targetAudience: campaign.target_audience,
              geographicCoverage: campaign.geographic_coverage,
              startDate: campaign.start_date,
              endDate: campaign.end_date,
              owner: campaign.owner
            },
            advertisements,
            activities,
            budget: {
              planned: campaign.budget,
              spent: campaign.spent,
              expenses
            },
            performance: {
              targetLeads: campaign.target_leads,
              actualLeads: campaign.actual_leads,
              targetReach: campaign.target_reach,
              actualReach: campaign.actual_reach
            },
            files: [],
            history: []
          }
        });
      }

      if (campaignDetailMatch && method === 'PUT') {
        const campaignId = campaignDetailMatch[1];
        const body = await parseJsonBody(req);
        db.prepare(`
          UPDATE campaigns SET
            execution_status = COALESCE(?, execution_status),
            approval_status = COALESCE(?, approval_status),
            budget = COALESCE(?, budget),
            updated_at = datetime('now')
          WHERE id = ?
        `).run(body.execution_status || null, body.approval_status || null, body.budget || null, campaignId);

        return sendJson(res, 200, { message: 'Campaign updated successfully' });
      }

      // --- Advertisements Inventory API ---
      if (pathname === '/api/advertisements' && method === 'GET') {
        let sql = `
          SELECT 
            p.*,
            c.title as campaign_title, c.portfolio_id, port.name as portfolio_name, port.color as portfolio_color,
            o.name as outlet_name, o.type as media_category, o.coverage as outlet_coverage,
            (SELECT COUNT(*) FROM ad_spots WHERE placement_id = p.id AND verification_status = 'Verified as aired/displayed') as verified_spots_count
          FROM media_placements p
          JOIN campaigns c ON p.campaign_id = c.id
          JOIN portfolios port ON c.portfolio_id = port.id
          JOIN media_outlets o ON p.outlet_id = o.id
          WHERE 1=1
        `;
        const params = [];

        if (query.media_category && query.media_category !== 'all') {
          sql += ` AND o.type = ?`;
          params.push(query.media_category);
        }

        if (query.campaign_id && query.campaign_id !== 'all') {
          sql += ` AND p.campaign_id = ?`;
          params.push(query.campaign_id);
        }

        if (query.status && query.status !== 'all') {
          if (query.status === 'Ending Soon') {
            sql += ` AND p.status = 'Active' AND p.end_date >= ? AND p.end_date <= date(?, '+7 days')`;
            params.push(todayStr, todayStr);
          } else if (query.status === 'Active') {
            sql += ` AND p.status = 'Active' AND p.start_date <= ? AND p.end_date >= ?`;
            params.push(todayStr, todayStr);
          } else {
            sql += ` AND p.status = ?`;
            params.push(query.status);
          }
        }

        if (query.search) {
          sql += ` AND (p.ad_name LIKE ? OR o.name LIKE ? OR p.contract_ref LIKE ? OR c.title LIKE ?)`;
          const s = `%${query.search}%`;
          params.push(s, s, s, s);
        }

        sql += ` ORDER BY p.start_date DESC`;
        const placements = db.prepare(sql).all(...params).map(p => ({
          ...p,
          ...calculateExpiry(p.end_date, todayStr)
        }));

        // CSV Export Support
        if (query.export === 'csv') {
          let csv = 'ID,Ad Name,Campaign,Media Category,Outlet,Start Date,End Date,Total Spots,Delivered Spots,Cost ETB,Status,Verification\n';
          for (const p of placements) {
            csv += `"${p.id}","${p.ad_name.replace(/"/g, '""')}","${p.campaign_title.replace(/"/g, '""')}","${p.media_category}","${p.outlet_name.replace(/"/g, '""')}","${p.start_date}","${p.end_date}",${p.total_spots},${p.delivered_spots},${p.total_cost},"${p.status}","${p.verification_status}"\n`;
          }
          res.writeHead(200, {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': 'attachment; filename="ethiopost-advertisements.csv"'
          });
          return res.end(csv);
        }

        return sendJson(res, 200, placements);
      }

      if (pathname === '/api/advertisements' && method === 'POST') {
        const body = await parseJsonBody(req);
        if (!body.campaign_id || !body.outlet_id || !body.ad_name || !body.start_date || !body.end_date) {
          return sendJson(res, 400, { error: 'Missing required ad placement fields' });
        }

        const randId = `PLC-2026-${String(Math.floor(Math.random() * 900) + 100)}`;
        const totalCost = Number(body.total_cost) || (Number(body.unit_cost || 0) * Number(body.total_spots || 1));

        db.prepare(`
          INSERT INTO media_placements (
            id, campaign_id, outlet_id, ad_name, placement_type, contract_ref,
            start_date, end_date, schedule_time_description, total_spots, delivered_spots,
            unit_cost, total_cost, vendor, procurement_status, payment_status,
            responsible_officer, status, verification_status
          ) VALUES (
            ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, 'Approved', 'Unpaid', ?, 'Active', 'Pending'
          )
        `).run(
          randId,
          body.campaign_id,
          body.outlet_id,
          body.ad_name,
          body.placement_type || 'Standard',
          body.contract_ref || randId,
          body.start_date,
          body.end_date,
          body.schedule_time_description || '',
          Number(body.total_spots) || 1,
          Number(body.unit_cost) || 0,
          totalCost,
          body.vendor || 'Media Vendor',
          body.responsible_officer || 'Marketing Lead'
        );

        return sendJson(res, 201, { id: randId, message: 'Media placement created successfully' });
      }

      // Ad Spot Delivery Verification Proof Logging
      const adVerifyMatch = pathname.match(/^\/api\/advertisements\/([^\/]+)\/verify$/);
      if (adVerifyMatch && method === 'POST') {
        const placementId = adVerifyMatch[1];
        const body = await parseJsonBody(req);

        db.prepare(`
          UPDATE media_placements SET
            verification_status = 'Verified',
            proof_notes = ?,
            verified_at = datetime('now'),
            verified_by = ?
          WHERE id = ?
        `).run(body.notes || 'Proof of performance verified', body.verified_by || 'Dawit Tadesse', placementId);

        // Record a verified ad spot entry
        db.prepare(`
          INSERT INTO ad_spots (
            placement_id, campaign_id, spot_date, program_or_slot,
            verification_status, verified_by, verified_at, evidence_notes
          ) VALUES (?, ?, date('now'), 'Verified Run', 'Verified as aired/displayed', ?, datetime('now'), ?)
        `).run(placementId, body.campaign_id || 'CMP-2026-VPB-01', body.verified_by || 'Dawit Tadesse', body.notes || 'Verification proof logged');

        return sendJson(res, 200, { message: 'Delivery verified successfully' });
      }

      // --- Activities API ---
      if (pathname === '/api/activities' && method === 'GET') {
        const activities = db.prepare(`
          SELECT a.*, c.title as campaign_title
          FROM campaign_activities a
          JOIN campaigns c ON a.campaign_id = c.id
          ORDER BY a.due_date ASC
        `).all();

        return sendJson(res, 200, activities);
      }

      if (pathname === '/api/activities' && method === 'POST') {
        const body = await parseJsonBody(req);
        db.prepare(`
          INSERT INTO campaign_activities (
            campaign_id, title, activity_type, owner, start_date, due_date, budget, status, progress
          ) VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending', 0)
        `).run(
          body.campaign_id,
          body.title,
          body.activity_type || 'Task',
          body.owner || 'Marketing Officer',
          body.start_date || '2026-10-28',
          body.due_date,
          Number(body.budget) || 0
        );

        return sendJson(res, 201, { message: 'Activity created successfully' });
      }

      // --- Budget API ---
      if (pathname === '/api/budget' && method === 'GET') {
        const allocations = db.prepare(`
          SELECT b.*, p.name as portfolio_name, p.color as portfolio_color
          FROM budget_allocations b
          JOIN portfolios p ON b.portfolio_id = p.id
        `).all();

        const stageTotals = {
          planned: 0,
          approved: 180000,
          committed: 420000,
          invoiced: 710000,
          paid: 2316000
        };

        const expenses = db.prepare(`SELECT * FROM expenses ORDER BY created_at DESC`).all();

        return sendJson(res, 200, {
          allocations,
          stageTotals,
          expenses
        });
      }

      if (pathname === '/api/budget/expenses' && method === 'POST') {
        const body = await parseJsonBody(req);
        db.prepare(`
          INSERT INTO expenses (
            campaign_id, placement_id, title, amount, category, stage, vendor, invoice_ref, payment_date, recorded_by
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          body.campaign_id || null,
          body.placement_id || null,
          body.title,
          Number(body.amount) || 0,
          body.category || 'Media Placement',
          body.stage || 'Invoiced',
          body.vendor || '',
          body.invoice_ref || '',
          body.payment_date || null,
          body.recorded_by || 'System'
        );

        return sendJson(res, 201, { message: 'Expense recorded successfully' });
      }

      // --- Reports API ---
      if (pathname === '/api/reports/monthly-ops' && method === 'GET') {
        if (query.export === 'csv') {
          const csv = 'Report,Month,Total Budget,Actual Spend,Active Campaigns,Live Placements\n"Ethiopost Monthly Operations","2026-10",4733333,3026000,3,9\n';
          res.writeHead(200, {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': 'attachment; filename="ethiopost-monthly-ops.csv"'
          });
          return res.end(csv);
        }

        return sendJson(res, 200, {
          month: '2026-10',
          totalBudget: 4733333,
          actualSpend: 3026000,
          activeCampaigns: 3,
          livePlacements: 9
        });
      }

      // --- Team & Approvals API (with Separation of Duties) ---
      if (pathname === '/api/team' && method === 'GET' || pathname === '/api/approvals' && method === 'GET') {
        const users = db.prepare(`SELECT * FROM users ORDER BY id ASC`).all();
        const approvals = db.prepare(`SELECT * FROM approval_requests ORDER BY created_at DESC`).all();
        return sendJson(res, 200, { users, approvals });
      }

      if (pathname === '/api/team' && method === 'POST') {
        const body = await parseJsonBody(req);
        if (!body.name || !body.role) {
          return sendJson(res, 400, { error: 'Name and role are required' });
        }
        const id = `USR-${Date.now().toString().slice(-4)}`;
        const avatar = body.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
        db.prepare(`
          INSERT INTO users (id, name, email, role, department, status, avatar)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(
          id,
          body.name,
          body.email || `${body.name.toLowerCase().replace(/\s+/g, '.')}@ethiopost.et`,
          body.role,
          body.department || 'Marketing Operations',
          'Active',
          avatar
        );
        const newUser = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
        return sendJson(res, 201, newUser);
      }

      const approvalDecideMatch = pathname.match(/^\/api\/approvals\/([^\/]+)\/decide$/);
      if (approvalDecideMatch && method === 'POST') {
        const requestId = approvalDecideMatch[1];
        const body = await parseJsonBody(req);
        const request = db.prepare(`SELECT * FROM approval_requests WHERE id = ?`).get(requestId);

        if (!request) {
          return sendJson(res, 404, { error: 'Approval request not found' });
        }

        // SEPARATION OF DUTIES ENFORCEMENT
        if (request.requester === body.actor) {
          return sendJson(res, 400, {
            error: 'Separation of Duties violation: A user cannot approve or decide on their own submitted request.'
          });
        }

        db.prepare(`
          UPDATE approval_requests SET
            status = ?,
            decided_at = datetime('now'),
            decided_by = ?,
            notes = COALESCE(?, notes)
          WHERE id = ?
        `).run(body.action || 'Approved', body.actor || 'Approver', body.comments || null, requestId);

        return sendJson(res, 200, { message: `Request successfully ${body.action || 'Approved'}` });
      }

      // --- Settings API ---
      if (pathname === '/api/settings' && method === 'GET') {
        const settingsRows = db.prepare(`SELECT * FROM system_settings`).all();
        const settings = {};
        for (const row of settingsRows) {
          settings[row.key] = row.value;
        }
        const portfolios = db.prepare(`SELECT * FROM portfolios`).all();

        return sendJson(res, 200, {
          settings: {
            expiryWarningDays: Number(settings.expiry_warning_days || 7),
            expiryCriticalDays: Number(settings.expiry_critical_days || 3),
            fiscalYear: settings.fiscal_year || 'FY2026/27',
            currency: settings.currency_symbol || 'ETB'
          },
          portfolios
        });
      }

      // --- Global Search API ---
      if (pathname === '/api/search' && method === 'GET') {
        const q = `%${query.q || ''}%`;
        const campaigns = db.prepare(`SELECT id, title, portfolio_id, execution_status FROM campaigns WHERE title LIKE ? OR id LIKE ? LIMIT 5`).all(q, q);
        const placements = db.prepare(`SELECT id, ad_name, contract_ref, placement_type FROM media_placements WHERE ad_name LIKE ? OR contract_ref LIKE ? LIMIT 5`).all(q, q);
        return sendJson(res, 200, { campaigns, placements });
      }

      return sendJson(res, 404, { error: `Endpoint not found: ${pathname}` });

    } catch (err) {
      console.error('API Error:', err);
      return sendJson(res, 500, { error: 'Internal Server Error', details: err.message });
    }
  }

  // ------------------------------------------------------------------------
  // 2. STATIC FILE SERVER
  // ------------------------------------------------------------------------
  let safePath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
  if (safePath === '/' || safePath === '\\') safePath = '/index.html';
  const filePath = path.join(PUBLIC_DIR, safePath);

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // Fallback to index.html for client-side routing
      const indexFile = path.join(PUBLIC_DIR, 'index.html');
      fs.readFile(indexFile, (err2, content) => {
        if (err2) {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          return res.end('404 Not Found');
        }
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(content);
      });
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  });
}

const server = http.createServer(requestHandler);

if (!process.env.VERCEL) {
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Ethiopost Marketing Command Center running at http://0.0.0.0:${PORT}/`);
  });
}

export default requestHandler;
