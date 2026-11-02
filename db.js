/**
 * Ethiopost Marketing Command Center
 * Database Engine & Schema Definition
 * Zero-dependency native SQLite using node:sqlite
 */

import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isVercel = Boolean(process.env.VERCEL);
const dataDir = isVercel ? '/tmp' : path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'ethiopost.sqlite');
export const db = new DatabaseSync(dbPath);

// Enable WAL mode and foreign key constraints for production reliability
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

export function initDatabase() {
  db.exec(`
    -- 1. Service Portfolios (10 Core Ethiopost Portfolios)
    CREATE TABLE IF NOT EXISTS portfolios (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT NOT NULL,
      color TEXT NOT NULL,
      badge_bg TEXT,
      badge_text TEXT,
      monthly_budget REAL DEFAULT 0,
      annual_budget REAL DEFAULT 0,
      description TEXT
    );

    -- 2. Campaigns
    CREATE TABLE IF NOT EXISTS campaigns (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      portfolio_id TEXT NOT NULL REFERENCES portfolios(id),
      strategic_objective TEXT,
      description TEXT,
      target_audience TEXT,
      geographic_coverage TEXT DEFAULT 'National',
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      fiscal_year TEXT DEFAULT 'FY2026/27',
      owner TEXT NOT NULL,
      budget REAL DEFAULT 0,
      spent REAL DEFAULT 0,
      channels TEXT DEFAULT '[]',
      target_leads INTEGER DEFAULT 0,
      actual_leads INTEGER DEFAULT 0,
      target_reach INTEGER DEFAULT 0,
      actual_reach INTEGER DEFAULT 0,
      priority TEXT DEFAULT 'Medium',
      approval_status TEXT DEFAULT 'Draft',
      execution_status TEXT DEFAULT 'Draft',
      progress_percent INTEGER DEFAULT 0,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    -- 3. Media Outlets Directory
    CREATE TABLE IF NOT EXISTS media_outlets (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      coverage TEXT NOT NULL,
      vendor_name TEXT,
      contact_person TEXT,
      contact_phone TEXT,
      rate_summary TEXT,
      status TEXT DEFAULT 'active'
    );

    -- 4. Media Placements (Advertisements Inventory)
    CREATE TABLE IF NOT EXISTS media_placements (
      id TEXT PRIMARY KEY,
      campaign_id TEXT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
      outlet_id TEXT NOT NULL REFERENCES media_outlets(id),
      ad_name TEXT NOT NULL,
      placement_type TEXT NOT NULL,
      contract_ref TEXT,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      schedule_time_description TEXT,
      total_spots INTEGER DEFAULT 0,
      delivered_spots INTEGER DEFAULT 0,
      unit_cost REAL DEFAULT 0,
      total_cost REAL DEFAULT 0,
      vendor TEXT,
      procurement_status TEXT DEFAULT 'Approved',
      payment_status TEXT DEFAULT 'Unpaid',
      responsible_officer TEXT,
      status TEXT DEFAULT 'Scheduled',
      verification_status TEXT DEFAULT 'Pending',
      proof_notes TEXT,
      verified_at TEXT,
      verified_by TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- 5. Ad Spots (Individual scheduled & verified broadcast spots / display slots)
    CREATE TABLE IF NOT EXISTS ad_spots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      placement_id TEXT REFERENCES media_placements(id) ON DELETE CASCADE,
      campaign_id TEXT REFERENCES campaigns(id) ON DELETE CASCADE,
      spot_date TEXT NOT NULL,
      start_time TEXT,
      program_or_slot TEXT,
      verification_status TEXT DEFAULT 'Scheduled',
      verified_by TEXT,
      verified_at TEXT,
      evidence_notes TEXT
    );

    -- 6. Campaign Activities & Tasks
    CREATE TABLE IF NOT EXISTS campaign_activities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      campaign_id TEXT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      activity_type TEXT NOT NULL,
      owner TEXT,
      start_date TEXT,
      due_date TEXT,
      budget REAL DEFAULT 0,
      spent REAL DEFAULT 0,
      progress INTEGER DEFAULT 0,
      status TEXT DEFAULT 'Pending',
      milestone INTEGER DEFAULT 0,
      notes TEXT
    );

    -- 7. Budget Allocations
    CREATE TABLE IF NOT EXISTS budget_allocations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      portfolio_id TEXT REFERENCES portfolios(id),
      fiscal_year TEXT DEFAULT 'FY2026/27',
      month TEXT,
      planned_budget REAL DEFAULT 0,
      approved_budget REAL DEFAULT 0,
      committed_budget REAL DEFAULT 0,
      invoiced_budget REAL DEFAULT 0,
      paid_budget REAL DEFAULT 0
    );

    -- 8. Expense Ledger
    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      campaign_id TEXT REFERENCES campaigns(id),
      placement_id TEXT REFERENCES media_placements(id),
      title TEXT NOT NULL,
      amount REAL NOT NULL,
      category TEXT NOT NULL,
      stage TEXT NOT NULL,
      vendor TEXT,
      invoice_ref TEXT,
      payment_date TEXT,
      recorded_by TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- 9. Approval Requests & Workflow
    CREATE TABLE IF NOT EXISTS approval_requests (
      id TEXT PRIMARY KEY,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      title TEXT NOT NULL,
      requester TEXT NOT NULL,
      assigned_to TEXT NOT NULL,
      status TEXT DEFAULT 'Pending',
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      decided_at TEXT,
      decided_by TEXT
    );

    -- 10. Approval Actions Audit
    CREATE TABLE IF NOT EXISTS approval_actions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      request_id TEXT REFERENCES approval_requests(id),
      action TEXT NOT NULL,
      actor TEXT NOT NULL,
      comments TEXT,
      timestamp TEXT DEFAULT (datetime('now'))
    );

    -- 11. User Directory & Roles
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      role TEXT NOT NULL,
      department TEXT DEFAULT 'Marketing & Communication',
      status TEXT DEFAULT 'Active',
      avatar TEXT,
      password_hash TEXT,
      salt TEXT,
      created_by TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      last_login TEXT
    );

    -- 12. System Settings & Dynamic Thresholds
    CREATE TABLE IF NOT EXISTS system_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      description TEXT
    );

    -- 13. Audit Log
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action TEXT NOT NULL,
      entity TEXT NOT NULL,
      entity_id TEXT,
      details TEXT,
      user TEXT,
      timestamp TEXT DEFAULT (datetime('now'))
    );
  `);

  // Safe schema migrations for existing databases
  const userMigrations = [
    'ALTER TABLE users ADD COLUMN password_hash TEXT;',
    'ALTER TABLE users ADD COLUMN salt TEXT;',
    'ALTER TABLE users ADD COLUMN created_by TEXT;',
    'ALTER TABLE users ADD COLUMN created_at TEXT;',
    'ALTER TABLE users ADD COLUMN last_login TEXT;'
  ];

  for (const m of userMigrations) {
    try {
      db.exec(m);
    } catch (e) {
      // Column already exists
    }
  }
}

initDatabase();
