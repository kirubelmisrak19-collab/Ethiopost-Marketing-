/**
 * Ethiopost Marketing Command Center
 * Unified Campaign & Advertising Operational Calendar (Prompt Section 7)
 */

import { api, state } from '../state.js';
import { icons, getChannelIcon, getChannelClass } from '../components/icons.js';

export async function renderCalendar(container) {
  container.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: center; height: 260px; color: var(--ep-muted);">
      Loading Operational Marketing Calendar...
    </div>
  `;

  try {
    const [campaigns, placements] = await Promise.all([
      api(`/api/campaigns?month=${state.activeMonth}`),
      api(`/api/advertisements`)
    ]);

    container.innerHTML = `
      <div style="margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
        <div>
          <h2 style="font-size: 18px; font-weight: 700; color: var(--ep-text); margin-bottom: 2px;">
            Campaign & Flight Operational Calendar
          </h2>
          <p style="font-size: 12.5px; color: var(--ep-muted);">
            Coordinated flight schedules, broadcast airtimes, and campaign activity milestones for ${state.activeMonth}
          </p>
        </div>
      </div>

      <!-- Linear Style Timeline Schedule -->
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">Active Campaign Flights Schedule (${campaigns.length})</div>
            <div class="card-subtitle">Scheduled campaign runs across the current operational month</div>
          </div>
        </div>
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Campaign Title & ID</th>
                <th>Service Portfolio</th>
                <th>Flight Window</th>
                <th>Status</th>
                <th>Responsible Lead</th>
              </tr>
            </thead>
            <tbody>
              ${campaigns.length === 0 ? `
                <tr><td colspan="5" class="empty-state">No campaigns scheduled for this month.</td></tr>
              ` : campaigns.map(c => `
                <tr>
                  <td>
                    <div style="font-weight: 600; color: var(--ep-text); margin-bottom: 2px;">
                      <a href="#/campaigns/${c.id}" style="color: var(--ep-text); text-decoration: none;" onmouseover="this.style.color='var(--ep-primary)'" onmouseout="this.style.color='var(--ep-text)'">
                        ${c.title}
                      </a>
                    </div>
                    <div><span class="code-tag primary">${c.id}</span></div>
                  </td>
                  <td>
                    <span class="pill" style="background: ${c.badge_bg || '#EEF2FF'}; color: ${c.badge_text || 'var(--ep-primary)'};">
                      <span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: ${c.portfolio_color || 'var(--ep-primary)'};"></span>
                      ${c.portfolio_name}
                    </span>
                  </td>
                  <td class="tabular-num" style="font-size: 12px; color: var(--ep-muted); white-space: nowrap;">
                    <div style="font-weight: 500; color: var(--ep-text-secondary);">${c.start_date} → ${c.end_date}</div>
                  </td>
                  <td>
                    <span class="pill pill-${(c.execution_status || 'draft').toLowerCase()}">
                      ${c.execution_status === 'Active' ? '<span class="dot-pulse-wrap"><span class="dot-pulse"></span>Active</span>' : c.execution_status}
                    </span>
                  </td>
                  <td>
                    <div style="display: flex; align-items: center; gap: 6px;">
                      <span style="color: var(--ep-text-secondary); font-weight: 500;">${c.owner}</span>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Media Flight Deadlines -->
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">Live Media Placement Flights & Expiry Radar (${placements.length})</div>
            <div class="card-subtitle">Broadcast spots, billboards, and transit advertising timelines</div>
          </div>
        </div>
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Category & Outlet</th>
                <th>Advertisement Creative</th>
                <th>Flight Schedule</th>
                <th>Remaining Airtime</th>
                <th>Delivery State</th>
              </tr>
            </thead>
            <tbody>
              ${placements.length === 0 ? `
                <tr><td colspan="5" class="empty-state">No media flights scheduled.</td></tr>
              ` : placements.map(p => {
                const channelClass = getChannelClass(p.media_category);
                return `
                  <tr>
                    <td>
                      <div class="channel-pill ${channelClass}">
                        <span>${getChannelIcon(p.media_category)}</span>
                        <span>${p.outlet_name}</span>
                      </div>
                    </td>
                    <td>
                      <div style="font-weight: 600; color: var(--ep-text); margin-bottom: 2px;">${p.ad_name}</div>
                      <div><span class="code-tag">Ref: ${p.contract_ref || p.id}</span></div>
                    </td>
                    <td class="tabular-num" style="font-size: 12px; color: var(--ep-muted); white-space: nowrap;">
                      <div style="font-weight: 500; color: var(--ep-text-secondary);">${p.start_date} → ${p.end_date}</div>
                    </td>
                    <td>
                      ${p.alertLevel === 'expires_today' ? `
                        <span class="pill pill-critical">⚠️ Ends Today</span>
                      ` : p.alertLevel === 'expires_3_days' ? `
                        <span class="pill pill-critical">⏳ ${p.daysRemaining} days left</span>
                      ` : p.alertLevel === 'expires_7_days' ? `
                        <span class="pill pill-warning">🔔 ${p.daysRemaining} days left</span>
                      ` : p.isExpired ? `
                        <span class="pill pill-draft">Concluded</span>
                      ` : `
                        <span class="pill pill-active"><span class="dot-pulse-wrap"><span class="dot-pulse"></span>Active flight</span></span>
                      `}
                    </td>
                    <td>
                      <span class="pill pill-${p.status ? p.status.toLowerCase() : 'active'}">
                        ${p.status === 'Active' ? '<span class="dot-pulse-wrap"><span class="dot-pulse"></span>Live Airing</span>' : p.status}
                      </span>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  } catch (err) {
    container.innerHTML = `<div class="empty-state" style="color: #DC2626;">Error: ${err.message}</div>`;
  }
}
