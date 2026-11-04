/**
 * Ethiopost Marketing Command Center
 * Clean Production Seeder - Super Admin Initial Setup
 * Zero Mock Data - Ready for Live Operational Use
 */

import { db, initDatabase } from './db.js';
import { hashPassword } from './auth.js';

export function seedDatabase() {
  initDatabase();

  // 1. Service Portfolios (10 Core Operational Portfolios)
  const existingPortfolios = db.prepare('SELECT COUNT(*) as c FROM portfolios').get().c;
  if (existingPortfolios === 0) {
    const insertPortfolio = db.prepare(`
      INSERT INTO portfolios (id, name, code, color, badge_bg, badge_text, monthly_budget, annual_budget, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const portfolios = [
      ['vpb', 'Virtual P.O. Box', 'VPB', '#28387F', '#EEF2FF', '#28387F', 0, 0, 'Digital mailbox service for individuals and businesses across Ethiopia'],
      ['post-gebeya', 'Post Gebeya', 'PGB', '#059669', '#ECFDF5', '#047857', 0, 0, 'National eCommerce marketplace & logistics for Ethiopian farmers and merchants'],
      ['post-finance', 'Post Finance', 'PFI', '#D97706', '#FEF3C7', '#B45309', 0, 0, 'Financial agency, remittance, bill payments and agent banking'],
      ['ems', 'EMS Express', 'EMS', '#DC2626', '#FEF2F2', '#B91C1C', 0, 0, 'Express Mail Service with global tracking and diaspora courier delivery'],
      ['parcel', 'Parcel Services', 'PCL', '#7C3AED', '#F5F3FF', '#6D28D9', 0, 0, 'Domestic and cross-border commercial freight and package delivery'],
      ['mail', 'Letter Services', 'LTR', '#0284C7', '#F0F9FF', '#0369A1', 0, 0, 'Traditional stamped mail, registered post, and corporate mail solutions'],
      ['agency', 'Agency Services', 'AGY', '#475569', '#F1F5F9', '#334155', 0, 0, 'Government and commercial utility partnership agent network'],
      ['corporate', 'Corporate Branding', 'COR', '#EFA61F', '#FFFBEB', '#92400E', 0, 0, 'Ethiopost enterprise brand awareness, modernization, and trust campaigns'],
      ['institutional', 'Institutional', 'INS', '#334155', '#F8FAFC', '#1E293B', 0, 0, 'Civic partnerships, national heritage, and international postal union events'],
      ['other', 'Other Media', 'OTH', '#64748B', '#F1F5F9', '#475569', 0, 0, 'Ad-hoc promotions, pilots, and localized branch campaigns']
    ];

    for (const p of portfolios) {
      insertPortfolio.run(...p);
    }
  }

  // 2. Media Outlets Directory
  const insertOutlet = db.prepare(`
    INSERT OR IGNORE INTO media_outlets (id, name, type, coverage, vendor_name, contact_person, contact_phone, rate_summary, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const outlets = [
    ['OUT-EBC', 'EBC (Ethiopian Broadcasting Corp)', 'Television', 'National', 'EBC Commercial Dept', 'Abebe Tilahun', '+251 11 551 0111', 'Prime 8PM News: ETB 7,500/spot', 'active'],
    ['OUT-EBS', 'EBS TV', 'Television', 'National & Diaspora', 'EBS Media Group', 'Selamawit Desta', '+251 11 662 4433', 'Sunday Live Prime: ETB 9,000/spot', 'active'],
    ['OUT-FANA-TV', 'Fana TV', 'Television', 'National', 'Fana Broadcasting Corporate', 'Yohannes Girma', '+251 11 550 5000', 'Evening Prime 8PM Flight Agreement', 'active'],
    ['OUT-ABAY-TV', 'Abay TV', 'Television', 'National & Regional', 'Abay Media Network', 'Alemayehu Negash', '+251 11 667 8900', 'Broadcast Flight Agreement', 'active'],
    ['OUT-HAGERE-TV', 'Hagere TV', 'Television', 'National', 'Hagere Television Network', 'Dawit Kebede', '+251 11 629 1122', 'Broadcast Flight Agreement', 'active'],
    ['OUT-ADDIS-TV', 'Addis TV', 'Television', 'Addis Ababa Metro & National', 'Addis Media Network (AMN)', 'Tigist Assefa', '+251 11 155 7788', 'Prime Time News & Info Flight', 'active'],
    ['OUT-FANA-FM', 'Fana FM 98.1', 'Radio', 'National', 'Fana Broadcasting Corporate', 'Kassahun Bekele', '+251 11 550 5000', 'Drive Time Morning: ETB 1,800/spot', 'active'],
    ['OUT-REGIONAL-RADIO', 'Fana Regional FM & Partner Stations', 'Radio', 'Regional Multi-Language (7 Languages)', 'FBC Regional Network', 'Kassahun Bekele', '+251 11 550 5000', 'Multi-Language 7-Dialect Broadcast Network', 'active'],
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

  // 3. Super Administrator User (Kirubel Misrak)
  const defaultAdminEmail = 'kirubel.misrak@ethiopost.et';
  const adminUser = db.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)').get(defaultAdminEmail);
  const defaultPassword = 'Ethiopost@2026';
  const { hash, salt } = hashPassword(defaultPassword);

  if (!adminUser) {
    db.prepare(`
      INSERT INTO users (id, name, email, role, department, status, avatar, password_hash, salt, created_by, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).run(
      'USR-ADMIN',
      'Kirubel Misrak',
      defaultAdminEmail,
      'Super Administrator',
      'Marketing & Digital Communications',
      'Active',
      'KM',
      hash,
      salt,
      'SYSTEM'
    );
    console.log(`Seeded Super Administrator Kirubel Misrak with password: ${defaultPassword}`);
  } else if (!adminUser.password_hash) {
    db.prepare(`
      UPDATE users SET
        password_hash = ?,
        salt = ?,
        role = 'Super Administrator',
        status = 'Active'
      WHERE id = ?
    `).run(hash, salt, adminUser.id);
    console.log(`Updated credentials for Super Administrator Kirubel Misrak.`);
  }

  // 4. System Settings
  const existingSettings = db.prepare('SELECT COUNT(*) as c FROM system_settings').get().c;
  if (existingSettings === 0) {
    const insertSetting = db.prepare(`INSERT INTO system_settings (key, value, description) VALUES (?, ?, ?)`);
    insertSetting.run('expiry_warning_days', '7', 'Number of days before flight expiration to trigger amber alert');
    insertSetting.run('expiry_critical_days', '3', 'Number of days before flight expiration to trigger critical alert');
    insertSetting.run('fiscal_year', 'FY2026/27', 'Current active fiscal year');
    insertSetting.run('currency_symbol', 'ETB', 'Primary operating currency code');
  }

  // 5. Official Campaigns Seeding (Virtual P.O. Box & DFS)
  const vpbCampId = 'CMP-2026-VPB-01';
  db.prepare(`
    INSERT OR IGNORE INTO campaigns (
      id, title, portfolio_id, strategic_objective, description, target_audience,
      geographic_coverage, start_date, end_date, fiscal_year, owner, budget, spent,
      channels, target_leads, actual_leads, target_reach, actual_reach, priority,
      approval_status, execution_status, progress_percent, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    vpbCampId,
    'Virtual P.O. Box Nationwide Launch & Adoption Campaign',
    'vpb',
    'Nationwide registration and onboarding of citizens and businesses to digital Virtual P.O. Box mailboxes.',
    'Multi-channel promotional campaign integrating nationwide outdoor branch activations, prime TV & radio commercial flights, and targeted social media marketing.',
    'All Ethiopian citizens, SMEs, corporates, and diaspora community',
    'National',
    '2026-10-01',
    '2026-11-30',
    'FY2026/27',
    'Kirubel Misrak',
    0,
    0,
    JSON.stringify(['Television', 'Radio', 'Billboard', 'Social']),
    250000,
    184500,
    15000000,
    12400000,
    'High',
    'Approved',
    'Active',
    65,
    'Live active flight across national TV, radio, and regional postal branches.'
  );

  const dfsCampId = 'CMP-2026-DFS-01';
  db.prepare(`
    INSERT OR IGNORE INTO campaigns (
      id, title, portfolio_id, strategic_objective, description, target_audience,
      geographic_coverage, start_date, end_date, fiscal_year, owner, budget, spent,
      channels, target_leads, actual_leads, target_reach, actual_reach, priority,
      approval_status, execution_status, progress_percent, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    dfsCampId,
    'DFS Multi-Lingual Radio Campaign (7 Languages)',
    'post-finance',
    'Nationwide public education and adoption of Ethiopost Digital Financial Services across 7 languages.',
    'Multi-lingual radio advertising flight broadcasting in 7 languages (Amharic, Afaan Oromoo, Tigrinya, Somali, Sidama, Wolaytta, Afar) on Fana FM Addis Ababa and regional radio partner stations.',
    'Citizens, merchants, and rural communities across Ethiopia',
    'National & Regional Multi-Language',
    '2026-11-03',
    '2026-12-03',
    'FY2026/27',
    'Kirubel Misrak',
    0,
    0,
    JSON.stringify(['Radio']),
    100000,
    14500,
    8500000,
    1200000,
    'High',
    'Approved',
    'Active',
    15,
    'Broadcast flight live in 7 languages across Addis Ababa and regional stations.'
  );

  // 6. Campaign Activities
  const existingActivities = db.prepare('SELECT COUNT(*) as c FROM campaign_activities WHERE campaign_id = ?').get(vpbCampId).c;
  if (existingActivities === 0) {
    const insertAct = db.prepare(`
      INSERT INTO campaign_activities (campaign_id, title, activity_type, status, owner, due_date, budget, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertAct.run(vpbCampId, 'Nationwide Outdoor & Branch Activations', 'Field Activation', 'In Progress', 'Kirubel Misrak', '2026-11-30', 0, 'Ground marketing roadshows and registration kiosks at major post offices.');
    insertAct.run(vpbCampId, 'TV & Radio 56s Commercial Broadcast Flights', 'Media Booking', 'Completed', 'Kirubel Misrak', '2026-11-20', 0, '1-month flights secured on Fana TV, Fana FM, Abay TV, Hagere TV, and Addis TV.');
    insertAct.run(vpbCampId, 'Digital & Social Media Acquisition Campaign', 'Creative Production', 'In Progress', 'Kirubel Misrak', '2026-11-30', 0, 'Sponsored Telegram promotions, social media video ads, and online tutorials.');
    insertAct.run(vpbCampId, 'Broadcast Compliance & Proof Verification Audit', 'Compliance & Audit', 'In Progress', 'Kirubel Misrak', '2026-11-25', 0, 'Transmission certificate audits and proof verification with broadcasters.');
  }

  // 7. Official Placements
  const insertPlacement = db.prepare(`
    INSERT OR IGNORE INTO media_placements (
      id, campaign_id, outlet_id, ad_name, placement_type, contract_ref,
      start_date, end_date, total_spots, delivered_spots, unit_cost, total_cost,
      status, verification_status, verified_by, verified_at, proof_notes,
      payment_status, schedule_time_description, responsible_officer
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), ?, 'Contract Package', ?, 'Kirubel Misrak'
    )
  `);

  // Virtual P.O. Box 56s Flights
  insertPlacement.run('PLC-2026-VPB-FANA-TV', vpbCampId, 'OUT-FANA-TV', 'Virtual P.O. Box 56s TV Commercial', 'Prime Time Broadcast Flight', 'ETH-VPB-FANA-TV-2026', '2026-10-24', '2026-11-20', 30, 12, 0, 0, 'Active', 'Verified', 'Kirubel Misrak', 'Fana TV prime broadcast transmission certificate verified.', 'Evening Prime Rotations');
  insertPlacement.run('PLC-2026-VPB-FANA-FM', vpbCampId, 'OUT-FANA-FM', 'Virtual P.O. Box 56s Radio Commercial', 'Drive Time Radio Flight', 'ETH-VPB-FANA-FM-2026', '2026-10-24', '2026-11-20', 30, 12, 0, 0, 'Active', 'Verified', 'Kirubel Misrak', 'Fana FM 98.1 transmission log and daily airtimes certified.', 'Drive Time Morning & Evening');
  insertPlacement.run('PLC-2026-VPB-ABAY-TV', vpbCampId, 'OUT-ABAY-TV', 'Virtual P.O. Box 56s TV Commercial', 'Broadcast Flight', 'ETH-VPB-ABAY-2026', '2026-10-25', '2026-11-24', 30, 11, 0, 0, 'Active', 'Verified', 'Kirubel Misrak', 'Abay TV 1-month flight agreement active and verified.', 'Daily Broadcast Rotations');
  insertPlacement.run('PLC-2026-VPB-HAGERE-TV', vpbCampId, 'OUT-HAGERE-TV', 'Virtual P.O. Box 56s TV Commercial', 'Broadcast Flight', 'ETH-VPB-HAGERE-2026', '2026-10-25', '2026-11-24', 30, 11, 0, 0, 'Active', 'Verified', 'Kirubel Misrak', 'Hagere TV flight transmission certificate certified.', 'Daily Broadcast Rotations');
  insertPlacement.run('PLC-2026-VPB-ADDIS-TV', vpbCampId, 'OUT-ADDIS-TV', 'Virtual P.O. Box 56s TV Commercial', 'Prime Time Broadcast Flight', 'ETH-VPB-ADDIS-2026', '2026-10-25', '2026-11-24', 30, 11, 0, 0, 'Active', 'Verified', 'Kirubel Misrak', 'Addis TV broadcast proof and airing log certified.', 'Prime Time News & Info Slots');

  // DFS 7-Languages Radio Flights
  insertPlacement.run('PLC-2026-DFS-FANA-AA', dfsCampId, 'OUT-FANA-FM', 'DFS Radio Ad - 7 Languages (Addis Ababa)', 'Drive Time Radio Flight', 'ETH-DFS-FANAFM-2026', '2026-11-03', '2026-12-03', 60, 6, 0, 0, 'Active', 'Verified', 'Kirubel Misrak', 'Fana FM 98.1 broadcast flight active in multi-language rotations.', 'Daily Morning & Evening Drive Rotations');
  insertPlacement.run('PLC-2026-DFS-REGIONAL', dfsCampId, 'OUT-REGIONAL-RADIO', 'DFS Radio Ad - 7 Regional Languages Flight', 'Regional Network Radio Flight', 'ETH-DFS-REG-2026', '2026-11-03', '2026-12-03', 120, 14, 0, 0, 'Active', 'Verified', 'Kirubel Misrak', 'Broadcast active across 7 language regional feeds (Oromia, Amhara, Tigray, Somali, Sidama, Wolaytta, Afar).', 'Regional Multi-Language Rotations');

  console.log('Clean database initialized with Super Administrator Kirubel Misrak.');
}
