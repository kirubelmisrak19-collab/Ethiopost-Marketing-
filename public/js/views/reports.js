/**
 * Ethiopost Marketing Command Center
 * Executive Reports & Export Engine (Prompt Section 10)
 */

import { api, formatETB, state } from '../state.js';
import { icons } from '../components/icons.js';

export async function renderReports(container) {
  container.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: center; height: 260px; color: var(--ep-muted);">
      Generating Executive Reports...
    </div>
  `;

  try {
    const report = await api('/api/reports/monthly-ops');

    container.innerHTML = `
      <div style="margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
        <div>
          <h2 style="font-size: 18px; font-weight: 700; color: var(--ep-text); margin-bottom: 2px;">
            Executive Reports & Exports
          </h2>
          <p style="font-size: 12.5px; color: var(--ep-muted);">
            Executive marketing performance summaries, media accountability audits, and CSV datasets
          </p>
        </div>

        <div style="display: flex; align-items: center; gap: 10px;">
          <a href="/api/reports/monthly-ops?export=csv" class="btn btn-secondary btn-sm" style="text-decoration: none;" download>
            <span>${icons.download}</span> Export Operations CSV
          </a>
          <a href="/api/advertisements?export=csv" class="btn btn-primary btn-sm" style="text-decoration: none;" download>
            <span>${icons.download}</span> Export Media Inventory CSV
          </a>
        </div>
      </div>

      <div class="card" style="padding: 24px;">
        <div class="card-title" style="margin-bottom: 4px;">Monthly Marketing Operations Summary (${report.month})</div>
        <div class="card-subtitle" style="margin-bottom: 20px;">Key operational benchmarks aggregated from active campaign and placement records</div>

        <div class="kpi-grid" style="margin-bottom: 0;">
          <div class="kpi-card">
            <div class="kpi-top">
              <span class="kpi-label">Total Monthly Budget</span>
              <div class="kpi-icon-pill">
                ${icons.budget}
              </div>
            </div>
            <div class="kpi-value">${formatETB(report.totalBudget)}</div>
            <div class="kpi-sub">Authorized operational ceiling</div>
          </div>

          <div class="kpi-card">
            <div class="kpi-top">
              <span class="kpi-label">Actual Recognized Spend</span>
              <div class="kpi-icon-pill green">
                ${icons.check}
              </div>
            </div>
            <div class="kpi-value" style="color: var(--ep-primary);">${formatETB(report.actualSpend)}</div>
            <div class="kpi-sub">${report.totalBudget > 0 ? Math.round((report.actualSpend / report.totalBudget) * 100) : 0}% of budget spent</div>
          </div>

          <div class="kpi-card">
            <div class="kpi-top">
              <span class="kpi-label">Active Campaigns</span>
              <div class="kpi-icon-pill">
                ${icons.campaigns}
              </div>
            </div>
            <div class="kpi-value">${report.activeCampaigns}</div>
            <div class="kpi-sub">Strategic commercial initiatives</div>
          </div>

          <div class="kpi-card">
            <div class="kpi-top">
              <span class="kpi-label">Live Media Flights</span>
              <div class="kpi-icon-pill green">
                ${icons.advertisements}
              </div>
            </div>
            <div class="kpi-value">${report.livePlacements}</div>
            <div class="kpi-sub">Active across TV, radio, billboard, screens</div>
          </div>
        </div>
      </div>
    `;
  } catch (err) {
    container.innerHTML = `<div class="empty-state" style="color: #DC2626;">Error: ${err.message}</div>`;
  }
}
