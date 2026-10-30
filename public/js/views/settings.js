/**
 * Ethiopost Marketing Command Center
 * System Settings & Portfolios Catalog (Prompt Section 11)
 */

import { api, formatETB } from '../state.js';

export async function renderSettings(container) {
  container.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: center; height: 260px; color: var(--ep-muted);">
      Loading Platform Settings...
    </div>
  `;

  try {
    const data = await api('/api/settings');
    const { settings, portfolios } = data;

    container.innerHTML = `
      <div style="margin-bottom: 20px;">
        <h2 style="font-size: 18px; font-weight: 700; color: var(--ep-text); margin-bottom: 2px;">
          Platform Administration & Operational Thresholds
        </h2>
        <p style="font-size: 12.5px; color: var(--ep-muted);">
          System-wide media expiration alert thresholds, fiscal year parameters, and service catalog
        </p>
      </div>

      <!-- Configurable Alert Thresholds -->
      <div class="card" style="padding: 20px; max-width: 640px; margin-bottom: 20px;">
        <div class="card-title" style="margin-bottom: 4px;">Dynamic Ad Expiration Thresholds</div>
        <div class="card-subtitle" style="margin-bottom: 16px;">Automated flags triggered before placement contract end date</div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
          <div>
            <label class="form-label">Warning Alert Window (Days)</label>
            <input type="number" class="form-input" value="${settings.expiryWarningDays}" readonly style="background: #F8FAFC; font-weight: 600;">
            <span style="font-size: 11px; color: var(--ep-muted); margin-top: 4px; display: block;">Amber notification triggered</span>
          </div>
          <div>
            <label class="form-label">Critical Alert Window (Days)</label>
            <input type="number" class="form-input" value="${settings.expiryCriticalDays}" readonly style="background: #F8FAFC; font-weight: 600;">
            <span style="font-size: 11px; color: var(--ep-muted); margin-top: 4px; display: block;">Red alert & executive attention panel</span>
          </div>
        </div>
      </div>

      <!-- Service Categories Catalog -->
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">Ethiopost Core Service Portfolios (${portfolios.length})</div>
            <div class="card-subtitle">Active commercial portfolios, branding color palettes, and monthly budget ceilings</div>
          </div>
        </div>
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Service Name & Code</th>
                <th>Brand Color</th>
                <th>Description</th>
                <th style="text-align: right;">Monthly Ceiling</th>
              </tr>
            </thead>
            <tbody>
              ${portfolios.map(p => `
                <tr>
                  <td>
                    <div style="font-weight: 600; color: var(--ep-text); margin-bottom: 2px;">${p.name}</div>
                    <div><span class="code-tag primary">${p.code}</span></div>
                  </td>
                  <td>
                    <div style="display: flex; align-items: center; gap: 8px;">
                      <span style="display: inline-block; width: 14px; height: 14px; border-radius: 4px; background: ${p.color}; box-shadow: 0 1px 2px rgba(0,0,0,0.15);"></span>
                      <span class="code-tag">${p.color}</span>
                    </div>
                  </td>
                  <td style="color: var(--ep-text-secondary); max-width: 320px; font-size: 12.5px;">${p.description}</td>
                  <td class="tabular-num" style="text-align: right; font-weight: 700; color: var(--ep-text);">${formatETB(p.monthly_budget)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  } catch (err) {
    container.innerHTML = `<div class="empty-state" style="color: #DC2626;">Error: ${err.message}</div>`;
  }
}
