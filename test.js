/**
 * Ethiopost Marketing Command Center
 * Integration Test Suite - Authentication, Security & Clean Operations
 */

import http from 'node:http';
import { db } from './db.js';
import requestHandler from './server.js';

let server;
let baseUrl;

function makeRequest(method, path, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
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

  // Start in-memory server
  server = http.createServer(requestHandler);
  await new Promise(resolve => server.listen(0, resolve));
  const port = server.address().port;
  baseUrl = `http://127.0.0.1:${port}`;
  console.log(`Local test server running on port ${port}`);

  try {
    // 1. Relational Database Schema & Integrity
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
    assert(Boolean(adminUser.password_hash && adminUser.salt), 'Super Administrator has secure password hash & salt');

    // 2. Authentication Gate & Access Control
    console.log('\n--- 2. Authentication Gate & Access Control ---');
    const unauthRes = await makeRequest('GET', '/api/overview');
    assert(unauthRes.statusCode === 401, 'Unauthenticated request to /api/overview rejected with 401 Unauthorized');

    const badLoginRes = await makeRequest('POST', '/api/auth/login', {}, {
      email: 'kirubel.misrak@ethiopost.et',
      password: 'IncorrectPassword'
    });
    assert(badLoginRes.statusCode === 401, 'Invalid password rejected with 401');

    const goodLoginRes = await makeRequest('POST', '/api/auth/login', {}, {
      email: 'kirubel.misrak@ethiopost.et',
      password: 'Ethiopost@2026'
    });
    assert(goodLoginRes.statusCode === 200, 'Super Administrator login successful with 200 OK');
    assert(Boolean(goodLoginRes.json.token), 'Login response contains signed HMAC-SHA256 JWT token');
    assert(goodLoginRes.json.user.name === 'Kirubel Misrak', 'User is Kirubel Misrak');
    assert(goodLoginRes.json.user.role === 'Super Administrator', 'Role is Super Administrator');
    const adminToken = goodLoginRes.json.token;
    const authHeader = { 'Authorization': `Bearer ${adminToken}` };

    // 3. Executive Overview with Auth Token
    console.log('\n--- 3. Executive Overview API ---');
    const ovRes = await makeRequest('GET', '/api/overview', authHeader);
    assert(ovRes.statusCode === 200, 'GET /api/overview with token returned 200 OK');
    assert(ovRes.json && ovRes.json.kpis, 'Overview contains kpis object');
    assert(ovRes.json.kpis.activeCampaigns === 0, 'Clean zero active campaigns in fresh state');
    assert(ovRes.json.kpis.liveAdvertisements === 0, 'Clean zero live advertisements in fresh state');

    // 4. Super Admin User Provisioning
    console.log('\n--- 4. Super Admin Team Provisioning ---');
    const createRes = await makeRequest('POST', '/api/users', authHeader, {
      name: 'Selamawit Desta',
      role: 'Campaign Officer',
      email: 'selamawit.desta@ethiopost.et',
      department: 'Marketing Operations',
      password: 'TempPassword@2026'
    });
    assert(createRes.statusCode === 201, 'Super Admin created team account with 201 Created');
    assert(createRes.json.user.email === 'selamawit.desta@ethiopost.et', 'New user has correct email');
    const newUserId = createRes.json.user.id;

    // Login as new user
    const newUserLoginRes = await makeRequest('POST', '/api/auth/login', {}, {
      email: 'selamawit.desta@ethiopost.et',
      password: 'TempPassword@2026'
    });
    assert(newUserLoginRes.statusCode === 200, 'New team member logged in successfully');
    const regularToken = newUserLoginRes.json.token;
    const regularHeader = { 'Authorization': `Bearer ${regularToken}` };

    // Regular user cannot create users (Super Admin only)
    const unauthorizedCreate = await makeRequest('POST', '/api/users', regularHeader, {
      name: 'Unauthorized User',
      role: 'Super Administrator',
      email: 'unauth@ethiopost.et'
    });
    assert(unauthorizedCreate.statusCode === 403, 'Regular user blocked from creating accounts with 403 Forbidden');

    // Super Admin resets password for user
    const resetRes = await makeRequest('POST', `/api/users/${newUserId}/reset-password`, authHeader, {
      newPassword: 'UpdatedSecret@2026'
    });
    assert(resetRes.statusCode === 200, 'Super Admin reset user password successfully');

    // Clean up created user
    const deleteRes = await makeRequest('DELETE', `/api/users/${newUserId}`, authHeader);
    assert(deleteRes.statusCode === 200, 'Super Admin deleted test user with 200 OK');

    // 5. Clean Campaign Creation Workflow
    console.log('\n--- 5. Live Campaign Workflow ---');
    const newCampRes = await makeRequest('POST', '/api/campaigns', authHeader, {
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

    const detailRes = await makeRequest('GET', `/api/campaigns/${testCampId}`, authHeader);
    assert(detailRes.statusCode === 200, 'Campaign workspace loaded with 200 OK');

    // Cleanup test campaign
    db.prepare('DELETE FROM campaigns WHERE id = ?').run(testCampId);
    console.log('[PASS] Test campaign cleaned up from database');

    // 6. CSV Streaming Export
    console.log('\n--- 6. Streaming CSV Exports ---');
    const csvRes = await makeRequest('GET', `/api/advertisements?export=csv&token=${adminToken}`);
    assert(csvRes.statusCode === 200, 'CSV export responded with 200 OK');
    assert(csvRes.headers['content-type'].includes('text/csv'), 'Content-Type is text/csv');

    console.log('\n================================================================');
    console.log('  ALL INTEGRATION VERIFICATION CHECKS PASSED SUCCESSFULLY!       ');
    console.log('================================================================\n');

  } finally {
    if (server) {
      server.close();
    }
  }
}

runTestSuite().catch(err => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
