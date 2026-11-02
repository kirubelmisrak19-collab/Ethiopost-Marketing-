/**
 * Ethiopost Marketing Command Center
 * Integration Test Suite - Clean Production Verification
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
  assert(portfolioCount === 10, `10 Ethiopost operational portfolios active (found: ${portfolioCount})`);

  const adminUser = db.prepare('SELECT * FROM users WHERE role = ?').get('Super Administrator');
  assert(adminUser && adminUser.name === 'Kirubel Misrak', `Super Administrator Kirubel Misrak configured (found: ${adminUser ? adminUser.name : 'none'})`);

  // 2. Executive Overview API
  console.log('\n--- 2. Executive Overview API ---');
  const ovRes = await makeRequest('GET', '/api/overview');
  assert(ovRes.statusCode === 200, 'GET /api/overview returned 200 OK');
  assert(ovRes.json && ovRes.json.kpis, 'Overview contains kpis object');
  assert(ovRes.json.kpis.activeCampaigns === 0, 'Clean zero active campaigns in fresh state');
  assert(ovRes.json.kpis.liveAdvertisements === 0, 'Clean zero live advertisements in fresh state');
  assert(Array.isArray(ovRes.json.monthlyCampaigns), 'monthlyCampaigns is array');
  assert(Array.isArray(ovRes.json.liveAdsSnapshot), 'liveAdsSnapshot is array');
  assert(Array.isArray(ovRes.json.attentionRequired), 'attentionRequired is array');

  // 3. Team Management API
  console.log('\n--- 3. Team & Super Admin Access ---');
  const teamRes = await makeRequest('GET', '/api/team');
  assert(teamRes.statusCode === 200, 'GET /api/team returned 200 OK');
  assert(teamRes.json.users.some(u => u.name === 'Kirubel Misrak'), 'Kirubel Misrak is in team directory');

  // 4. Clean Campaign Creation Workflow
  console.log('\n--- 4. Live Campaign Workflow ---');
  const newCampRes = await makeRequest('POST', '/api/campaigns', {}, {
    title: 'Automated Test Flight',
    portfolio_id: 'vpb',
    owner: 'Kirubel Misrak',
    start_date: '2026-11-01',
    end_date: '2026-11-30',
    budget: 100000,
    strategic_objective: 'Verification'
  });
  assert(newCampRes.statusCode === 201, 'POST /api/campaigns created campaign successfully with 201 Created');
  const testCampId = newCampRes.json.id;

  const detailRes = await makeRequest('GET', `/api/campaigns/${testCampId}`);
  assert(detailRes.statusCode === 200, 'Campaign workspace loaded with 200 OK');

  // Cleanup test campaign
  db.prepare('DELETE FROM campaigns WHERE id = ?').run(testCampId);
  console.log('[PASS] Test campaign cleaned up from database');

  // 5. CSV Streaming Export
  console.log('\n--- 5. Streaming CSV Exports ---');
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
