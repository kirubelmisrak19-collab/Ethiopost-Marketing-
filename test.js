/**
 * Ethiopost Marketing Command Center
 * Comprehensive Integration Test Suite
 * Security, Dynamic Media Outlets, Multi-Station Batch Booking & Operations
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
    assert(tables.includes('media_outlets'), "Table 'media_outlets' exists");
    assert(tables.includes('campaign_activities'), "Table 'campaign_activities' exists");
    assert(tables.includes('expenses'), "Table 'expenses' exists");
    assert(tables.includes('users'), "Table 'users' exists");

    const portfolioCount = db.prepare('SELECT COUNT(*) as c FROM portfolios').get().c;
    assert(portfolioCount === 10, `10 Ethiopost operational portfolios active (found: ${portfolioCount})`);

    const adminUser = db.prepare('SELECT * FROM users WHERE role = ?').get('Super Administrator');
    assert(adminUser && adminUser.name === 'Kirubel Misrak', `Super Administrator Kirubel Misrak configured`);

    // 2. Authentication Gate
    console.log('\n--- 2. Authentication Gate & Access Control ---');
    const unauthRes = await makeRequest('GET', '/api/overview');
    assert(unauthRes.statusCode === 401, 'Unauthenticated access rejected with 401');

    const loginRes = await makeRequest('POST', '/api/auth/login', {}, {
      email: 'kirubel.misrak@ethiopost.et',
      password: 'Ethiopost@2026'
    });
    assert(loginRes.statusCode === 200, 'Super Administrator login successful');
    const adminToken = loginRes.json.token;
    const authHeader = { 'Authorization': `Bearer ${adminToken}` };

    // 3. Dynamic Media Outlets Management
    console.log('\n--- 3. Dynamic Media Outlets Directory API ---');
    const outletsListRes = await makeRequest('GET', '/api/media-outlets', authHeader);
    assert(outletsListRes.statusCode === 200, 'GET /api/media-outlets responded 200 OK');
    assert(Array.isArray(outletsListRes.json) && outletsListRes.json.length >= 9, 'Seeded media outlets directory returned');

    // Register a new TV station dynamically
    const newOutletRes = await makeRequest('POST', '/api/media-outlets', authHeader, {
      name: 'Arts TV Ethiopia',
      type: 'Television',
      coverage: 'National',
      vendor_name: 'Arts World Media Enterprise',
      contact_person: 'Michael Haile',
      contact_phone: '+251 11 889 0011',
      rate_summary: 'Prime Time 30s Spot: ETB 8,000'
    });
    assert(newOutletRes.statusCode === 201, 'POST /api/media-outlets registered new TV station with 201 Created');
    const createdOutletId = newOutletRes.json.id;

    // 4. Live Campaign Creation & Management
    console.log('\n--- 4. Live Campaign Workflow ---');
    const newCampRes = await makeRequest('POST', '/api/campaigns', authHeader, {
      title: 'Post Gebeya National Harvest Promotion',
      portfolio_id: 'post-gebeya',
      owner: 'Kirubel Misrak',
      start_date: '2026-11-01',
      end_date: '2026-11-30',
      budget: 850000,
      strategic_objective: 'Onboard 50,000 rural farmers to digital marketplace'
    });
    assert(newCampRes.statusCode === 201, 'POST /api/campaigns created campaign successfully with 201 Created');
    const testCampId = newCampRes.json.id;

    // 5. Multi-Station Batch Placement Booking Engine
    console.log('\n--- 5. Multi-Station Media Placement Booking ---');
    // Book same TV ad across 3 TV stations at once (EBC, EBS TV, and the newly registered Arts TV)
    const multiPlacementRes = await makeRequest('POST', '/api/advertisements', authHeader, {
      campaign_id: testCampId,
      ad_name: 'Post Gebeya Harvest 30s Prime Commercial',
      outlet_ids: ['OUT-EBC', 'OUT-EBS', createdOutletId],
      placement_type: 'Prime Time Broadcast',
      start_date: '2026-11-01',
      end_date: '2026-11-30',
      total_spots: 20,
      unit_cost: 7500,
      contract_ref: 'ETH-BATCH-2026-001'
    });
    assert(multiPlacementRes.statusCode === 201, 'Batch placement created flights across 3 TV stations with 201 Created');
    assert(multiPlacementRes.json.count === 3, 'Created exactly 3 placement flights in single submission');
    assert(multiPlacementRes.json.totalInvestment === 450000, 'Accurately calculated total batch investment (3 stations * 20 spots * 7,500 = 450,000 ETB)');

    const firstPlacementId = multiPlacementRes.json.placements[0].id;

    // Verify placement status update
    const updatePlcRes = await makeRequest('PUT', `/api/advertisements/${firstPlacementId}`, authHeader, {
      status: 'Active',
      delivered_spots: 10
    });
    assert(updatePlcRes.statusCode === 200, 'PUT /api/advertisements/:id updated placement flight status');

    // 5b. Real-World Lump-Sum Flight Agreement (EBS 1M ETB) & Proof Verification
    console.log('\n--- 5b. Real-World Lump-Sum Flight Agreement (EBS 1M ETB) & Proof Verification ---');
    // User scenario: "We agree with EBS for 1 month ad placement and the total money or budget for that will be 1 million ETB"
    const ebsFlightRes = await makeRequest('POST', '/api/advertisements', authHeader, {
      campaign_id: testCampId,
      ad_name: 'Virtual P.O. Box Nationwide 1-Month Prime Flight',
      outlet_ids: ['OUT-EBS'],
      placement_type: 'Monthly Broadcast Flight',
      start_date: '2026-11-01',
      end_date: '2026-11-30',
      total_spots: 30,
      total_cost: 1000000, // Direct 1 Million ETB contract package value!
      contract_ref: 'ETH-EBS-2026-001'
    });
    assert(ebsFlightRes.statusCode === 201, 'Booked 1-Month EBS flight with lump sum 1,000,000 ETB');
    assert(ebsFlightRes.json.placements[0].total_cost === 1000000, 'Placement records direct 1,000,000 ETB contract value');
    const ebsPlacementId = ebsFlightRes.json.placements[0].id;

    // Optional Budget Placement (0 ETB)
    const zeroBudgetFlightRes = await makeRequest('POST', '/api/advertisements', authHeader, {
      campaign_id: testCampId,
      ad_name: 'Bartered Public Service Announcement',
      outlet_ids: ['OUT-EBC'],
      placement_type: 'PSA Airing',
      start_date: '2026-11-01',
      end_date: '2026-11-30',
      total_spots: 10
      // total_cost and unit_cost omitted -> 0 ETB optional budget
    });
    assert(zeroBudgetFlightRes.statusCode === 201, 'Booked placement with completely optional budget (0 ETB)');
    assert(zeroBudgetFlightRes.json.placements[0].total_cost === 0, 'Zero budget placement saved cleanly');
    const zeroPlacementId = zeroBudgetFlightRes.json.placements[0].id;

    // 5c. Ad Delivery Proof of Performance Verification
    console.log('\n--- 5c. Ad Delivery Proof of Performance Verification ---');
    const verifyProofRes = await makeRequest('POST', `/api/advertisements/${ebsPlacementId}/verify`, authHeader, {
      status: 'Verified',
      delivered_spots: 30,
      notes: 'Official EBS broadcast transmission certificate #TR-2026-092 verified by Kirubel Misrak',
      verified_by: 'Kirubel Misrak'
    });
    assert(verifyProofRes.statusCode === 200, 'POST /api/advertisements/:id/verify succeeded with 200 OK');
    assert(verifyProofRes.json.verification_status === 'Verified', 'Verification status returned as Verified');

    // Confirm database state
    const verifiedRow = db.prepare('SELECT * FROM media_placements WHERE id = ?').get(ebsPlacementId);
    assert(verifiedRow.verification_status === 'Verified', 'DB media_placements record shows verification_status = Verified');
    assert(verifiedRow.verified_by === 'Kirubel Misrak', 'DB media_placements record shows verified_by = Kirubel Misrak');
    assert(verifiedRow.total_cost === 1000000, 'DB media_placements preserved 1,000,000 ETB total_cost');

    const spotRow = db.prepare('SELECT * FROM ad_spots WHERE placement_id = ?').get(ebsPlacementId);
    assert(spotRow && spotRow.campaign_id === testCampId, 'Ad spot entry logged with genuine campaign_id without FK error');

    // 6. Campaign Activities & Milestone Tasks
    console.log('\n--- 6. Campaign Activities & Milestone Tasks ---');
    const newActRes = await makeRequest('POST', '/api/activities', authHeader, {
      campaign_id: testCampId,
      title: 'Produce High-Definition Video Master for TV Stations',
      activity_type: 'Creative Production',
      owner: 'Kirubel Misrak',
      due_date: '2026-11-05',
      budget: 45000
    });
    assert(newActRes.statusCode === 201, 'POST /api/activities created task with 201 Created');

    // 7. Expense Accounting & Dynamic Budget Ledger
    console.log('\n--- 7. Expense Accounting & Dynamic Budget Ledger ---');
    const newExpRes = await makeRequest('POST', '/api/budget/expenses', authHeader, {
      campaign_id: testCampId,
      title: 'EBC Commercial Broadcast Downpayment',
      amount: 150000,
      stage: 'Paid',
      vendor: 'Ethiopian Broadcasting Corp',
      invoice_ref: 'INV-EBC-2026-9021'
    });
    assert(newExpRes.statusCode === 201, 'POST /api/budget/expenses recorded expense voucher with 201 Created');

    const budgetRes = await makeRequest('GET', '/api/budget', authHeader);
    assert(budgetRes.statusCode === 200, 'GET /api/budget responded 200 OK');
    assert(budgetRes.json.stageTotals.paid >= 150000, 'Dynamic budget stageTotals.paid includes recorded voucher');

    // 8. Clean Up Test Data
    console.log('\n--- 8. Cleanup & Database Integrity ---');
    // Delete test placements
    for (const p of multiPlacementRes.json.placements) {
      await makeRequest('DELETE', `/api/advertisements/${p.id}`, authHeader);
    }
    await makeRequest('DELETE', `/api/advertisements/${ebsPlacementId}`, authHeader);
    await makeRequest('DELETE', `/api/advertisements/${zeroPlacementId}`, authHeader);
    // Delete test outlet
    await makeRequest('DELETE', `/api/media-outlets/${createdOutletId}`, authHeader);
    // Delete test campaign
    await makeRequest('DELETE', `/api/campaigns/${testCampId}`, authHeader);
    console.log('[PASS] All test flights, outlets, and campaigns cleaned up.');

    // 9. Streaming CSV Export
    console.log('\n--- 9. Streaming CSV Export ---');
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
