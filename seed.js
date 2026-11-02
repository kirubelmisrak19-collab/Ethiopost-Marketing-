/**
 * Ethiopost Marketing Command Center
 * Clean Production Seeder - Super Admin Initial Setup
 * Zero Mock Data - Ready for Live Operational Use
 */

import { db, initDatabase } from './db.js';

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
  const existingOutlets = db.prepare('SELECT COUNT(*) as c FROM media_outlets').get().c;
  if (existingOutlets === 0) {
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
  }

  // 3. Super Administrator User
  const existingUsers = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
  if (existingUsers === 0) {
    const insertUser = db.prepare(`
      INSERT INTO users (id, name, email, role, department, status, avatar)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    insertUser.run(
      'USR-ADMIN',
      'Kirubel Misrak',
      'kirubel.misrak@ethiopost.et',
      'Super Administrator',
      'Marketing & Digital Communications',
      'Active',
      'KM'
    );
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

  console.log('Clean database initialized with Super Administrator Kirubel Misrak.');
}
