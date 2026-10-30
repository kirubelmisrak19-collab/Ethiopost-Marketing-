/**
 * Ethiopost Marketing Command Center
 * Database Seeder - Authentic Ethiopost Marketing Operations Data
 */

import { db, initDatabase } from './db.js';

export function seedDatabase() {
  initDatabase();

  // Check if already seeded
  const existingCount = db.prepare('SELECT COUNT(*) as c FROM portfolios').get().c;
  if (existingCount > 0) return;

  const insertPortfolio = db.prepare(`
    INSERT INTO portfolios (id, name, code, color, badge_bg, badge_text, monthly_budget, annual_budget, description)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const portfolios = [
    ['vpb', 'Virtual P.O. Box', 'VPB', '#28387F', '#EEF2FF', '#28387F', 1200000, 14400000, 'Digital mailbox service for individuals and businesses across Ethiopia'],
    ['post-gebeya', 'Post Gebeya', 'PGB', '#059669', '#ECFDF5', '#047857', 950000, 11400000, 'National eCommerce marketplace & logistics for Ethiopian farmers and merchants'],
    ['post-finance', 'Post Finance', 'PFI', '#D97706', '#FEF3C7', '#B45309', 800000, 9600000, 'Financial agency, remittance, bill payments and agent banking'],
    ['ems', 'EMS Express', 'EMS', '#DC2626', '#FEF2F2', '#B91C1C', 600000, 7200000, 'Express Mail Service with global tracking and diaspora courier delivery'],
    ['parcel', 'Parcel Services', 'PCL', '#7C3AED', '#F5F3FF', '#6D28D9', 450000, 5400000, 'Domestic and cross-border commercial freight and package delivery'],
    ['mail', 'Letter Services', 'LTR', '#0284C7', '#F0F9FF', '#0369A1', 200000, 2400000, 'Traditional stamped mail, registered post, and corporate mail solutions'],
    ['agency', 'Agency Services', 'AGY', '#475569', '#F1F5F9', '#334155', 250000, 3000000, 'Government and commercial utility partnership agent network'],
    ['corporate', 'Corporate Branding', 'COR', '#EFA61F', '#FFFBEB', '#92400E', 750000, 9000000, 'Ethiopost enterprise brand awareness, modernization, and trust campaigns'],
    ['institutional', 'Institutional', 'INS', '#334155', '#F8FAFC', '#1E293B', 300000, 3600000, 'Civic partnerships, national heritage, and international postal union events'],
    ['other', 'Other Media', 'OTH', '#64748B', '#F1F5F9', '#475569', 150000, 1800000, 'Ad-hoc promotions, pilots, and localized branch campaigns']
  ];

  for (const p of portfolios) {
    insertPortfolio.run(...p);
  }

  // 2. Media Outlets Directory
  const insertOutlet = db.prepare(`
    INSERT INTO media_outlets (id, name, type, coverage, vendor_name, contact_person, contact_phone, rate_summary, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const outlets = [
    ['OUT-EBC', 'EBC (Ethiopian Broadcasting Corp)', 'Television', 'National', 'EBC Commercial Dept', 'Abebe Tilahun', '+251 11 551 0111', 'Prime 8PM News: ETB 7,500/spot', 'active'],
    ['OUT-EBS', 'EBS TV', 'Television', 'National & Diaspora', 'EBS Media Group', 'Selamawit Desta', '+251 11 662 4433', 'Sunday Live Prime: ETB 9,000/spot', 'active'],
    ['OUT-FANA-FM', 'Fana FM 98.1', 'Radio', 'National', 'Fana Broadcasting Corporate', 'Kassahun Bekele', '+251 11 550 5000', 'Drive Time Morning: ETB 1,800/spot', 'active'],
    ['OUT-SHEGER-FM', 'Sheger FM 102.1', 'Radio', 'Addis Ababa & Oromia', 'Sheger Radio Media', 'Meaza Birru', '+251 11 661 1021', 'Evening Commute: ETB 1,500/spot', 'active'],
    ['OUT-MESKEL-SCREEN', 'Meskel Square LED Mega-Screen', 'Digital Screen', 'Addis Ababa Metro', 'City Light Ad Network', 'Yared Hailu', '+251 91 120 4455', '15s Loop, 180x/day: ETB 180,000/mo', 'active'],
    ['OUT-BOLE-UNIPOLE', 'Bole Airport Road Unipole #4', 'Billboard', 'Addis Ababa', 'Horizon Outdoor Ads', 'Tewodros Assefa', '+251 91 140 7788', 'Illuminated Double-sided: ETB 120,000/mo', 'active'],
    ['OUT-ANBESSA-BUS', 'Anbessa City Bus Fleet #10', 'Transit', 'Greater Addis Ababa', 'Anbessa Transport Enterprise', 'Getachew Mengistu', '+251 11 442 1100', 'Full Back Wrap: ETB 25,000/bus/mo', 'active'],
    ['OUT-LRT-TRAIN', 'Addis Ababa Light Rail Transit', 'Transit', 'East-West & North-South Lines', 'ERC Transit Advertising', 'Solomon Tadesse', '+251 11 654 3210', 'Train Exterior Full Wrap: ETB 85,000/train', 'active'],
    ['OUT-SOCIAL-TG', 'Ethiopost Telegram & Social Media', 'Social', 'National & Diaspora', 'Digital Growth Partners', 'Kirubel Misrak', '+251 91 100 2233', 'Sponsored Reach Campaign', 'active']
  ];

  for (const o of outlets) {
    insertOutlet.run(...o);
  }

  // 3. Campaigns (October - November 2026 multi-month setup)
  const insertCampaign = db.prepare(`
    INSERT INTO campaigns (
      id, title, portfolio_id, strategic_objective, description, target_audience,
      geographic_coverage, start_date, end_date, fiscal_year, owner, budget, spent,
      channels, target_leads, actual_leads, target_reach, actual_reach, priority,
      approval_status, execution_status, progress_percent, notes
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
    )
  `);

  const campaigns = [
    [
      'CMP-2026-VPB-01',
      'Virtual P.O. Box Nationwide Expansion',
      'vpb',
      'Acquire 100,000 new digital postal address subscriptions across urban and regional centers',
      'Comprehensive media campaign launching Virtual P.O. Box self-service mobile registration',
      'Professionals, SMEs, e-commerce shoppers, and government employees',
      'National',
      '2026-10-01',
      '2026-11-30',
      'FY2026/27',
      'Kirubel Misrak',
      3500000,
      1450000,
      JSON.stringify(['Television', 'Radio', 'Digital Screen', 'Billboard', 'Transit', 'Social']),
      100000,
      42500,
      5000000,
      2800000,
      'High',
      'Approved',
      'Active',
      55,
      'Core strategic growth priority for Ethiopost digital transformation'
    ],
    [
      'CMP-2026-PGB-01',
      'Post Gebeya Harvest Festival Promotion',
      'post-gebeya',
      'Connect 5,000 rural farmers and handicraft producers with urban consumers through Post Gebeya logistics',
      'Harvest promotional campaign highlighting fresh regional coffee, honey, and textiles shipped via post',
      'Urban households, diaspora consumers, cooperative unions',
      'National & Diaspora',
      '2026-10-10',
      '2026-11-15',
      'FY2026/27',
      'Almaz Bekele',
      1800000,
      620000,
      JSON.stringify(['Television', 'Radio', 'Social']),
      25000,
      12800,
      2500000,
      1100000,
      'High',
      'Approved',
      'Active',
      45,
      'Co-branded with Ministry of Agriculture and regional trade bureaus'
    ],
    [
      'CMP-2026-EMS-01',
      'EMS Diaspora Courier Express Holiday Drive',
      'ems',
      'Drive outbound parcel volume to North America, Europe, and Middle East for upcoming holiday season',
      'Promote guaranteed 4-day delivery to major diaspora hubs with 20% discount on 5kg+ shipments',
      'Exporters, families with diaspora relatives, artisan businesses',
      'National & Major Cities',
      '2026-10-15',
      '2026-12-31',
      'FY2026/27',
      'Hanna Tadesse',
      1200000,
      480000,
      JSON.stringify(['Radio', 'Billboard', 'Digital Screen']),
      15000,
      6200,
      1800000,
      750000,
      'Medium',
      'Approved',
      'Active',
      35,
      'Special discounted rate cards active at all 1,200 post offices'
    ],
    [
      'CMP-2026-COR-01',
      'Modern Ethiopost Brand Modernization Campaign',
      'corporate',
      'Shift public perception towards a tech-enabled, reliable, 130-year modern logistics institution',
      'Corporate storytelling celebrating modernization, electric delivery vans, and branch refurbishments',
      'All Ethiopian citizens, enterprise logistics decision makers',
      'National',
      '2026-11-01',
      '2027-01-31',
      'FY2026/27',
      'Dawit Tadesse',
      2200000,
      0,
      JSON.stringify(['Television', 'Billboard', 'Transit']),
      50000,
      0,
      8000000,
      0,
      'High',
      'Approved',
      'Scheduled',
      10,
      'Hero TV commercial currently in final post-production'
    ],
    [
      'CMP-2026-PFI-01',
      'Post Finance Remittance & Bill Pay Rollout',
      'post-finance',
      'Grow utility bill payments and domestic remittances handled at post office counters by 35%',
      'Educational campaign explaining zero-fee utility payments and instant cash transfers',
      'Unbanked populations, pensioners, utility bill payers',
      'Regional & Urban',
      '2026-11-10',
      '2026-12-25',
      'FY2026/27',
      'Yonas Mulugeta',
      950000,
      0,
      JSON.stringify(['Radio', 'Transit']),
      30000,
      0,
      3000000,
      0,
      'Medium',
      'Submitted',
      'Draft',
      0,
      'Awaiting final executive budget sign-off'
    ]
  ];

  for (const c of campaigns) {
    insertCampaign.run(...c);
  }

  // 4. Media Placements (Advertisements)
  const insertPlacement = db.prepare(`
    INSERT INTO media_placements (
      id, campaign_id, outlet_id, ad_name, placement_type, contract_ref,
      start_date, end_date, schedule_time_description, total_spots, delivered_spots,
      unit_cost, total_cost, vendor, procurement_status, payment_status,
      responsible_officer, status, verification_status, proof_notes, verified_at, verified_by
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
    )
  `);

  // Today is simulated as 2026-10-28
  const placements = [
    [
      'PLC-2026-001',
      'CMP-2026-VPB-01',
      'OUT-EBC',
      'Virtual P.O. Box 45s TV Commercial Master',
      'Prime Time Spot',
      'ETH-EBC-2026-088',
      '2026-10-01',
      '2026-11-15',
      '8:00 PM News Bulletin & Prime Drama (2x Daily)',
      60,
      42,
      7500,
      450000,
      'Ethiopian Broadcasting Corp',
      'Approved',
      'Paid',
      'Kirubel Misrak',
      'Active',
      'Verified',
      'Verified through EBC official transmission log certificates',
      '2026-10-27 10:30',
      'Dawit Tadesse'
    ],
    [
      'PLC-2026-002',
      'CMP-2026-VPB-01',
      'OUT-FANA-FM',
      'VPB Self-Registration 30s Audio Spot',
      'Drive Time Morning',
      'ETH-FANA-2026-031',
      '2026-10-05',
      '2026-11-20',
      '7:30 AM & 8:15 AM Morning Commute Rush',
      90,
      64,
      1800,
      162000,
      'Fana Broadcasting Corporate',
      'Approved',
      'Paid',
      'Kirubel Misrak',
      'Active',
      'Verified',
      'Audio broadcast log verified by Fana sales rep',
      '2026-10-26 14:00',
      'Almaz Bekele'
    ],
    [
      'PLC-2026-003',
      'CMP-2026-VPB-01',
      'OUT-MESKEL-SCREEN',
      'VPB Animated QR Code LED Loop',
      '15s Screen Loop',
      'ETH-LED-2026-014',
      '2026-10-01',
      '2026-10-31',
      'Continuous 15s display every 6 minutes, 6AM-10PM',
      30,
      28,
      6000,
      180000,
      'City Light Ad Network',
      'Approved',
      'Invoiced',
      'Kirubel Misrak',
      'Active',
      'Verified',
      'Screen playback system automated log received',
      '2026-10-27 17:00',
      'Hanna Tadesse'
    ],
    [
      'PLC-2026-004',
      'CMP-2026-VPB-01',
      'OUT-BOLE-UNIPOLE',
      'Virtual P.O. Box Mega Unipole (Bole Airport)',
      'Illuminated Billboard',
      'ETH-OOH-2026-092',
      '2026-10-01',
      '2026-10-31',
      '24/7 Dual-sided illuminated display',
      1,
      1,
      120000,
      120000,
      'Horizon Outdoor Ads',
      'Approved',
      'Paid',
      'Kirubel Misrak',
      'Active',
      'Verified',
      'Site inspection photo evidence logged on file',
      '2026-10-02 09:15',
      'Tigist Haile'
    ],
    [
      'PLC-2026-005',
      'CMP-2026-PGB-01',
      'OUT-EBS',
      'Post Gebeya Harvest 30s Spotlight Spot',
      'Weekend Prime Time',
      'ETH-EBS-2026-044',
      '2026-10-12',
      '2026-11-12',
      'Sunday Afternoon Entertainment Segment',
      24,
      16,
      9000,
      216000,
      'EBS Media Group',
      'Approved',
      'Paid',
      'Almaz Bekele',
      'Active',
      'Verified',
      'Broadcast certificate submitted by EBS',
      '2026-10-25 18:00',
      'Dawit Tadesse'
    ],
    [
      'PLC-2026-006',
      'CMP-2026-PGB-01',
      'OUT-SHEGER-FM',
      'Post Gebeya Radio Sponsorship & Live Mentions',
      'Evening Commute',
      'ETH-SHG-2026-019',
      '2026-10-15',
      '2026-10-31', // 3 days left from 2026-10-28 (Critical expiry alert)
      '5:30 PM & 6:45 PM Drive Home Show',
      34,
      28,
      1500,
      51000,
      'Sheger Radio Media',
      'Approved',
      'Invoiced',
      'Almaz Bekele',
      'Active',
      'Pending',
      'Log for final week pending submission from station',
      null,
      null
    ],
    [
      'PLC-2026-007',
      'CMP-2026-EMS-01',
      'OUT-ANBESSA-BUS',
      'EMS Worldwide Delivery Bus Back Fleet (10 Buses)',
      'Transit Wrap',
      'ETH-BUS-2026-052',
      '2026-10-15',
      '2026-11-04', // 7 days left from 2026-10-28 (Warning expiry alert)
      'Full rear bus wrap across 10 high-density Addis Ababa routes',
      10,
      10,
      25000,
      250000,
      'Anbessa Transport Enterprise',
      'Approved',
      'Invoiced',
      'Hanna Tadesse',
      'Active',
      'Verified',
      'Fleet inspection photos verified at depot',
      '2026-10-16 11:00',
      'Tigist Haile'
    ],
    [
      'PLC-2026-008',
      'CMP-2026-EMS-01',
      'OUT-LRT-TRAIN',
      'EMS Diaspora Courier LRT Train Branding',
      'Train Exterior Wrap',
      'ETH-LRT-2026-011',
      '2026-10-20',
      '2026-12-20',
      'Exterior train branding along East-West corridor',
      1,
      1,
      85000,
      85000,
      'ERC Transit Advertising',
      'Approved',
      'Paid',
      'Hanna Tadesse',
      'Active',
      'Verified',
      'ERC completion certificate attached',
      '2026-10-21 16:30',
      'Dawit Tadesse'
    ],
    [
      'PLC-2026-009',
      'CMP-2026-VPB-01',
      'OUT-SOCIAL-TG',
      'Virtual P.O. Box Sponsored Digital Campaign',
      'Sponsored Placement',
      'ETH-DIG-2026-008',
      '2026-10-01',
      '2026-11-30',
      'Targeted feeds & Telegram channels nationwide',
      1,
      1,
      150000,
      150000,
      'Digital Growth Partners',
      'Approved',
      'Paid',
      'Kirubel Misrak',
      'Active',
      'Verified',
      'Digital analytics dashboard link verified',
      '2026-10-26 09:00',
      'Kirubel Misrak'
    ],
    [
      'PLC-2026-010',
      'CMP-2026-COR-01',
      'OUT-EBC',
      'Modern Ethiopost 60s Hero Commercial',
      'National Prime Time',
      'ETH-EBC-2026-104',
      '2026-11-01',
      '2026-12-15',
      'Prime News 8PM Bulletin (Mon, Wed, Fri)',
      36,
      0,
      7500,
      270000,
      'Ethiopian Broadcasting Corp',
      'Approved',
      'Unpaid',
      'Dawit Tadesse',
      'Scheduled',
      'Pending',
      'Creative tape booked with EBC library',
      null,
      null
    ],
    [
      'PLC-2026-011',
      'CMP-2026-COR-01',
      'OUT-BOLE-UNIPOLE',
      '130 Years of Trust Corporate Unipole',
      'Billboard',
      'ETH-OOH-2026-101',
      '2026-11-01',
      '2027-01-31',
      'Illuminated display outside Ethiopost Headquarters',
      1,
      0,
      120000,
      360000,
      'Horizon Outdoor Ads',
      'Approved',
      'Unpaid',
      'Dawit Tadesse',
      'Scheduled',
      'Pending',
      'Flex printing underway',
      null,
      null
    ]
  ];

  for (const p of placements) {
    insertPlacement.run(...p);
  }

  // 5. Ad Spots (Individual spots for verification tracking)
  const insertSpot = db.prepare(`
    INSERT INTO ad_spots (
      placement_id, campaign_id, spot_date, start_time, program_or_slot,
      verification_status, verified_by, verified_at, evidence_notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const sampleSpots = [
    ['PLC-2026-001', 'CMP-2026-VPB-01', '2026-10-26', '20:00', 'EBC 8PM News Bulletin', 'Verified as aired/displayed', 'Dawit Tadesse', '2026-10-27 09:00', 'Aired at 20:14 PM'],
    ['PLC-2026-001', 'CMP-2026-VPB-01', '2026-10-27', '20:00', 'EBC 8PM News Bulletin', 'Verified as aired/displayed', 'Dawit Tadesse', '2026-10-28 08:30', 'Aired at 20:18 PM'],
    ['PLC-2026-002', 'CMP-2026-VPB-01', '2026-10-27', '07:30', 'Fana Morning Commute', 'Verified as aired/displayed', 'Almaz Bekele', '2026-10-27 12:00', 'Audio clear'],
    ['PLC-2026-005', 'CMP-2026-PGB-01', '2026-10-25', '16:00', 'EBS Weekend Live', 'Verified as aired/displayed', 'Dawit Tadesse', '2026-10-26 10:00', 'Aired during prime break'],
    ['PLC-2026-006', 'CMP-2026-PGB-01', '2026-10-27', '17:30', 'Sheger Evening Commute', 'Scheduled', null, null, 'Awaiting confirmation']
  ];

  for (const s of sampleSpots) {
    insertSpot.run(...s);
  }

  // 6. Campaign Activities
  const insertActivity = db.prepare(`
    INSERT INTO campaign_activities (
      campaign_id, title, activity_type, owner, start_date, due_date,
      budget, spent, progress, status, milestone, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const activities = [
    ['CMP-2026-VPB-01', 'Launch Virtual P.O. Box registration portal update', 'Development', 'Kirubel Misrak', '2026-10-01', '2026-10-10', 80000, 75000, 100, 'Completed', 1, 'Live on ethiopost.et and mobile app'],
    ['CMP-2026-VPB-01', 'Coordinate branch staff Virtual P.O. Box sales kit', 'Operations', 'Tigist Haile', '2026-10-05', '2026-10-18', 45000, 42000, 100, 'Completed', 0, 'Distributed to 320 tier-1 branches'],
    ['CMP-2026-VPB-01', 'Audit outdoor billboard illumination in Addis', 'Inspection', 'Hanna Tadesse', '2026-10-15', '2026-10-25', 15000, 12000, 80, 'Pending', 0, 'Overdue task for attention panel check'],
    ['CMP-2026-VPB-01', 'Mid-campaign conversion & lead analytics review', 'Analytics', 'Bethlehem Girma', '2026-10-25', '2026-11-05', 20000, 0, 40, 'In Progress', 1, 'Data pulling from CRM and USSD'],
    ['CMP-2026-PGB-01', 'Distribute Post Gebeya packaging kits to farmers unions', 'Logistics', 'Almaz Bekele', '2026-10-10', '2026-10-30', 120000, 95000, 70, 'In Progress', 1, 'Jimma, Sidama, and Bahir Dar hubs'],
    ['CMP-2026-EMS-01', 'Deploy diaspora discount rate sheets to counters', 'Marketing', 'Hanna Tadesse', '2026-10-15', '2026-10-24', 25000, 24000, 100, 'Completed', 0, 'Completed on schedule'],
    ['CMP-2026-COR-01', 'Complete hero TV commercial voiceover and audio mastering', 'Creative', 'Dawit Tadesse', '2026-10-20', '2026-10-30', 95000, 80000, 90, 'In Progress', 1, 'Amharic and Afaan Oromoo masters']
  ];

  for (const a of activities) {
    insertActivity.run(...a);
  }

  // 7. Budget Allocations & Expenses
  const insertAlloc = db.prepare(`
    INSERT INTO budget_allocations (
      portfolio_id, fiscal_year, month, planned_budget, approved_budget,
      committed_budget, invoiced_budget, paid_budget
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertAlloc.run('vpb', 'FY2026/27', '2026-10', 1200000, 1200000, 912000, 180000, 732000);
  insertAlloc.run('post-gebeya', 'FY2026/27', '2026-10', 950000, 950000, 267000, 51000, 216000);
  insertAlloc.run('ems', 'FY2026/27', '2026-10', 600000, 600000, 335000, 250000, 85000);
  insertAlloc.run('corporate', 'FY2026/27', '2026-10', 750000, 750000, 630000, 0, 0);

  const insertExpense = db.prepare(`
    INSERT INTO expenses (
      campaign_id, placement_id, title, amount, category, stage,
      vendor, invoice_ref, payment_date, recorded_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const expenses = [
    ['CMP-2026-VPB-01', 'PLC-2026-001', 'EBC TV October Broadcast Flights', 450000, 'Media Placement', 'Paid', 'Ethiopian Broadcasting Corp', 'INV-EBC-8891', '2026-10-02', 'Kirubel Misrak'],
    ['CMP-2026-VPB-01', 'PLC-2026-002', 'Fana FM Radio Airtime Commitment', 162000, 'Media Placement', 'Paid', 'Fana Broadcasting Corp', 'INV-FBC-4412', '2026-10-06', 'Kirubel Misrak'],
    ['CMP-2026-VPB-01', 'PLC-2026-004', 'Bole Unipole October Rental', 120000, 'Outdoor', 'Paid', 'Horizon Outdoor Ads', 'INV-HOR-201', '2026-10-01', 'Tigist Haile'],
    ['CMP-2026-VPB-01', 'PLC-2026-003', 'Meskel Square LED October Airing', 180000, 'Digital Screens', 'Invoiced', 'City Light Ad Network', 'INV-CL-091', '2026-10-25', 'Kirubel Misrak'],
    ['CMP-2026-PGB-01', 'PLC-2026-005', 'EBS Sunday Spotlight Commercial', 216000, 'Media Placement', 'Paid', 'EBS Media Group', 'INV-EBS-102', '2026-10-14', 'Almaz Bekele'],
    ['CMP-2026-PGB-01', 'PLC-2026-006', 'Sheger FM Commute Placements', 51000, 'Media Placement', 'Invoiced', 'Sheger Radio Media', 'INV-SHG-078', '2026-10-26', 'Almaz Bekele'],
    ['CMP-2026-EMS-01', 'PLC-2026-007', 'Anbessa Bus Fleet Wraps (10 Buses)', 250000, 'Transit', 'Invoiced', 'Anbessa Transport', 'INV-BUS-1029', '2026-10-20', 'Hanna Tadesse'],
    ['CMP-2026-EMS-01', 'PLC-2026-008', 'Addis LRT Train Wrap Installation', 85000, 'Transit', 'Paid', 'ERC Transit Advertising', 'INV-ERC-004', '2026-10-21', 'Dawit Tadesse'],
    ['CMP-2026-VPB-01', 'PLC-2026-009', 'Telegram & Social Performance Marketing', 150000, 'Digital', 'Paid', 'Digital Growth Partners', 'INV-DGP-112', '2026-10-05', 'Kirubel Misrak']
  ];

  for (const exp of expenses) {
    insertExpense.run(...exp);
  }

  // 8. Users & Roles (All 10 required prompt roles)
  const insertUser = db.prepare(`
    INSERT INTO users (id, name, email, role, department, status, avatar)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const users = [
    ['USR-001', 'Dawit Tadesse', 'dawit.tadesse@ethiopost.et', 'Marketing & Communication Manager', 'Executive', 'Active', 'DT'],
    ['USR-002', 'Tigist Haile', 'tigist.haile@ethiopost.et', 'Marketing Operations Manager', 'Operations', 'Active', 'TH'],
    ['USR-003', 'Almaz Bekele', 'almaz.bekele@ethiopost.et', 'Campaign Supervisor', 'Campaigns', 'Active', 'AB'],
    ['USR-004', 'Kirubel Misrak', 'kirubel.misrak@ethiopost.et', 'Digital Marketing Supervisor', 'Digital Marketing', 'Active', 'KM'],
    ['USR-005', 'Yonas Mulugeta', 'yonas.mulugeta@ethiopost.et', 'Pricing Supervisor', 'Commercial', 'Active', 'YM'],
    ['USR-006', 'Bethlehem Girma', 'bethlehem.girma@ethiopost.et', 'Market Analyst', 'Analytics', 'Active', 'BG'],
    ['USR-007', 'Hanna Tadesse', 'hanna.tadesse@ethiopost.et', 'Marketing Officer', 'Field Operations', 'Active', 'HT'],
    ['USR-008', 'Ermias Sahle', 'ermias.sahle@ethiopost.et', 'Marketing Approver', 'Compliance', 'Active', 'ES'],
    ['USR-009', 'Dr. Sefere Alemu', 'sefere.alemu@ethiopost.et', 'Senior Management and Executives', 'Executive Board', 'Active', 'SA'],
    ['USR-010', 'Abebe Kebede', 'abebe.kebede@ethiopost.et', 'System Administrator', 'Information Technology', 'Active', 'AK']
  ];

  for (const u of users) {
    insertUser.run(...u);
  }

  // 9. Pending Approvals & Separation of Duties
  const insertApproval = db.prepare(`
    INSERT INTO approval_requests (
      id, entity_type, entity_id, title, requester, assigned_to, status, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertApproval.run(
    'APR-2026-001',
    'Campaign',
    'CMP-2026-PFI-01',
    'Post Finance Remittance Rollout Campaign Approval',
    'Tigist Haile',
    'Dawit Tadesse',
    'Pending',
    'Requires independent sign-off from Marketing & Communication Manager before budget release.'
  );

  // 10. System Settings
  const insertSetting = db.prepare(`INSERT INTO system_settings (key, value, description) VALUES (?, ?, ?)`);
  insertSetting.run('expiry_warning_days', '7', 'Number of days before flight expiration to trigger amber alert');
  insertSetting.run('expiry_critical_days', '3', 'Number of days before flight expiration to trigger critical alert');
  insertSetting.run('fiscal_year', 'FY2026/27', 'Current active fiscal year');
  insertSetting.run('currency_symbol', 'ETB', 'Primary operating currency code');

  console.log('Ethiopost Command Center database seeded successfully.');
}
