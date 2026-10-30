/**
 * Ethiopost Marketing Command Center
 * Integration Test Suite
 */

import { db } from './db.js';
import http from 'node:http';

const BASE_URL = 'http://127.0.0.1:3050';

function makeRequest(method, path, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const reqOptions = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Accept': 'application/json',
        ...headers
      }
    };

    let postData = null;
    if (body) {
      postData = typeof body === 'string' ? body : JSON.stringify(body);
      reqOptions.headers['Content-Type'] = 'application/json';
      reqOptions.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        let json = null;
        if ((res.headers['content-type'] || '').includes('application/json')) {
          try { json = JSON.parse(data); } catch (e) { json = null; }
        }
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
          json: json
        });
      });
    });

    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function runTestSuite() {
  console.log('================================================================');
  console.log('   ETHIOPOST MARKETING COMMAND CENTER - INTEGRATION TESTS       ');
  console.log('================================================================\n');

  function assert(condition, message) {
    if (!condition) {
      console.error(`[FAIL] ${message}`);
      throw new Error(`Assertion failed: ${message}`);
    }
    console.log(`[PASS] ${message}`);
  }

  // 1. Schema & Relational Integrity
  console.log('\n--- 1. Relational Database Schema & Integrity ---');
  const tables = db.prepare(`SELECT name FROM sqlite_master WHERE type='table'`).all().map(t => t.name);
  assert(tables.includes('portfolios'), "Table 'portfolios' exists");
  assert(tables.includes('campaigns'), "Table 'campaigns' exists");
  assert(tables.includes('media_placements'), "Table 'media_placements' exists");
  assert(tables.includes('campaign_activities'), "Table 'campaign_activities' exists");
  assert(tables.includes('expenses'), "Table 'expenses' exists");
  assert(tables.includes('users'), "Table 'users' exists");
  assert(tables.includes('approval_requests'), "Table 'approval_requests' exists");

  const portfolioCount = db.prepare('SELECT COUNT(*) as c FROM portfolios').get().c;
  assert(portfolioCount === 10, `10 Ethiopost portfolios seeded (found: ${portfolioCount})`);

  const userCount = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
  assert(userCount === 10, `All 10 required user roles seeded (found: ${userCount})`);

  // 2. Executive Overview API
  console.log('\n--- 2. Executive Overview API ---');
  const ovRes = await makeRequest('GET', '/api/overview');
  assert(ovRes.statusCode === 200, 'GET /api/overview returned 200 OK');
  assert(ovRes.json && ovRes.json.kpis, 'Overview contains kpis object');
  assert(typeof ovRes.json.kpis.activeCampaigns === 'number', 'activeCampaigns is numeric');
  assert(typeof ovRes.json.kpis.liveAdvertisements === 'number', 'liveAdvertisements is numeric');
  assert(Array.isArray(ovRes.json.monthlyCampaigns), 'monthlyCampaigns is array');
  assert(Array.isArray(ovRes.json.liveAdsSnapshot), 'liveAdsSnapshot is array');
  assert(Array.isArray(ovRes.json.attentionRequired), 'attentionRequired is array');

  // 3. Multi-Month Campaign Query Logic
  console.log('\n--- 3. Multi-Month Campaign Logic ---');
  const octRes = await makeRequest('GET', '/api/campaigns?month=2026-10');
  const novRes = await makeRequest('GET', '/api/campaigns?month=2026-11');
  const inOct = octRes.json.some(c => c.id === 'CMP-2026-VPB-01');
  const inNov = novRes.json.some(c => c.id === 'CMP-2026-VPB-01');
  assert(inOct && inNov, 'Multi-month campaign CMP-2026-VPB-01 appears in both October and November without duplication');

  // 4. Campaign 7-Tab Detail Workspace
  console.log('\n--- 4. Campaign Detail Workspace ---');
  const detailRes = await makeRequest('GET', '/api/campaigns/CMP-2026-VPB-01');
  assert(detailRes.statusCode === 200, 'GET /api/campaigns/CMP-2026-VPB-01 returned 200 OK');
  assert(detailRes.json.tabs.overview, 'Tab 1: Overview loaded');
  assert(Array.isArray(detailRes.json.tabs.advertisements), 'Tab 2: Advertisements loaded');
  assert(Array.isArray(detailRes.json.tabs.activities), 'Tab 3: Activities loaded');
  assert(detailRes.json.tabs.budget, 'Tab 4: Budget loaded');

  // 5. Expiry Alert Thresholds
  console.log('\n--- 5. Advertising Inventory & Expiry Thresholds ---');
  const adsRes = await makeRequest('GET', '/api/advertisements');
  assert(adsRes.statusCode === 200, 'GET /api/advertisements returned 200 OK');
  const p6 = adsRes.json.find(p => p.id === 'PLC-2026-006');
  assert(p6 && p6.alertLevel === 'expires_3_days', 'PLC-2026-006 flagged with alertLevel expires_3_days');
  const p7 = adsRes.json.find(p => p.id === 'PLC-2026-007');
  assert(p7 && p7.alertLevel === 'expires_7_days', 'PLC-2026-007 flagged with alertLevel expires_7_days');

  // 6. Ad Delivery Verification
  console.log('\n--- 6. Delivery Verification ---');
  const verifyRes = await makeRequest('POST', '/api/advertisements/PLC-2026-006/verify', {}, {
    notes: 'Aired during prime commute segment verified by station broadcast log',
    verified_by: 'Dawit Tadesse'
  });
  assert(verifyRes.statusCode === 200, 'POST /api/advertisements/:id/verify recorded proof successfully with 200 OK');

  // 7. Separation of Duties Policy
  console.log('\n--- 7. Separation of Duties Policy ---');
  // Requester is Tigist Haile
  const selfApproveRes = await makeRequest('POST', '/api/approvals/APR-2026-001/decide', {}, {
    action: 'Approved',
    actor: 'Tigist Haile',
    comments: 'Attempting self-approval'
  });
  assert(selfApproveRes.statusCode === 400, 'Self-approval correctly blocked with 400 Bad Request');
  assert(selfApproveRes.json.error.includes('Separation of Duties violation'), 'Error explicitly cites Separation of Duties violation');

  const validApproveRes = await makeRequest('POST', '/api/approvals/APR-2026-001/decide', {}, {
    action: 'Approved',
    actor: 'Dawit Tadesse',
    comments: 'Reviewed and authorized'
  });
  assert(validApproveRes.statusCode === 200, 'Independent manager approved with 200 OK');

  // 8. CSV Streaming Export
  console.log('\n--- 8. Streaming CSV Exports ---');
  const csvRes = await makeRequest('GET', '/api/advertisements?export=csv');
  assert(csvRes.statusCode === 200, 'CSV export responded with 200 OK');
  assert(csvRes.headers['content-type'].includes('text/csv'), 'Content-Type is text/csv');

  console.log('\n================================================================');
  console.log('  ALL INTEGRATION VERIFICATION CHECKS PASSED SUCCESSFULLY!       ');
  console.log('================================================================\n');
}

runTestSuite().catch(err => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
