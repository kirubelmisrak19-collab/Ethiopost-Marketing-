/**
 * Ethiopost Marketing Command Center
 * Executive Overview Dashboard (Prompt Section 4)
 * Linear / Stripe minimalist aesthetic with high clarity & polished micro-interactions
 */

import { api, formatETB, formatCompactETB, state } from '../state.js';
import { icons, getChannelIcon, getChannelClass } from '../components/icons.js';

export async function renderOverview(container) {
  container.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: center; height: 260px; color: var(--ep-muted);">
      Loading Ethiopost Marketing Command Overview...
    </div>
  `;

  try {
    const data = await api(`/api/overview?month=${state.activeMonth}&date=2026-10-28`);
    const { kpis, monthlyCampaigns, liveAdsSnapshot, attentionRequired } = data;

    container.innerHTML = `
      <!-- Top Minimalist KPI Cards Grid -->
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-top">
            <span class="kpi-label">Active Campaigns</span>
            <div class="kpi-icon-pill">
              ${icons.campaigns}
            </div>
          </div>
          <div class="kpi-value">${kpis.activeCampaigns}</div>
          <div class="kpi-sub">
            <span class="dot-pulse-wrap"><span class="dot-pulse"></span>Running in ${state.activeMonth}</span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-top">
            <span class="kpi-label">Live Ad Placements</span>
            <div class="kpi-icon-pill green">
              ${icons.advertisements}
            </div>
          </div>
          <div class="kpi-value">${kpis.liveAdvertisements}</div>
          <div class="kpi-sub">
            <span>Across TV, Radio, Outdoor & Transit</span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-top">
            <span class="kpi-label">Monthly Marketing Budget</span>
            <div class="kpi-icon-pill gold">
              ${icons.budget}
            </div>
          </div>
          <div class="kpi-value">${formatCompactETB(kpis.actualSpend)}</div>
          <div class="kpi-sub">
            <span>of ${formatCompactETB(kpis.totalMonthlyMarketingBudget)} monthly cap</span>
          </div>
          <div class="micro-progress-wrap" style="max-width: 100%; margin-top: 8px;">
            <div class="micro-progress-fill gold" style="width: ${kpis.totalMonthlyMarketingBudget > 0 ? Math.min(100, Math.round((kpis.actualSpend / kpis.totalMonthlyMarketingBudget) * 100)) : 0}%;"></div>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-top">
            <span class="kpi-label">Attention Items</span>
            <div class="kpi-icon-pill ${attentionRequired.length > 0 ? 'red' : 'green'}">
              ${attentionRequired.length > 0 ? icons.alert : icons.check}
            </div>
          </div>
          <div class="kpi-value" style="color: ${attentionRequired.length > 0 ? '#DC2626' : 'inherit'};">
            ${attentionRequired.length}
          </div>
          <div class="kpi-sub">
            <span>${kpis.pendingApprovals} pending approvals • ${kpis.overdueActivities} overdue</span>
          </div>
        </div>
      </div>

      <!-- Attention Required List (If any items need review) -->
      ${attentionRequired.length > 0 ? `
        <div class="card" style="border-left: 3px solid #DC2626; box-shadow: var(--shadow-card);">
          <div class="card-header">
            <div>
              <div class="card-title" style="color: #DC2626; display: flex; align-items: center; gap: 6px;">
                ${icons.alert} Operational Attention Required (${attentionRequired.length})
              </div>
              <div class="card-subtitle">Critical ad expirations, overdue deliverables, and pending compliance approvals</div>
            </div>
          </div>
          <div style="padding: 12px 16px; display: flex; flex-direction: column; gap: 8px;">
            ${attentionRequired.map(item => `
              <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; background: #FAFBFD; border: 1px solid var(--ep-border); border-radius: var(--radius-sm); font-size: 13px;">
                <div style="display: flex; align-items: center; gap: 10px;">
                  <span class="pill pill-critical">Action</span>
                  <div>
                    <span style="font-weight: 600; color: var(--ep-text);">${item.title}</span>
                    <span style="color: var(--ep-muted); font-size: 12px; margin-left: 8px;">${item.description}</span>
                  </div>
                </div>
                <a href="${item.link}" class="btn btn-secondary btn-sm" style="text-decoration: none;">
                  Review ${icons.arrowRight}
                </a>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <!-- Active Strategic Campaigns Section -->
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">Active Strategic Campaigns</div>
            <div class="card-subtitle">Major initiatives scheduled and running in ${state.activeMonth}</div>
          </div>
          <a href="#/campaigns" class="btn btn-secondary btn-sm" style="text-decoration: none;">All Campaigns →</a>
        </div>

        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Campaign Title & Code</th>
                <th>Service Portfolio</th>
                <th>Flight Window</th>
                <th>Owner</th>
                <th>Budget & Spend</th>
                <th>Deliverables</th>
                <th>Status</th>
                <th style="text-align: right;">Workspace</th>
              </tr>
            </thead>
            <tbody>
              ${monthlyCampaigns.length === 0 ? `
                <tr><td colspan="8" class="empty-state">No active campaigns scheduled for this month.</td></tr>
              ` : monthlyCampaigns.map(c => `
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
                    <div style="display: flex; align-items: center; gap: 6px;">
                      <span style="color: var(--ep-text-secondary); font-weight: 500;">${c.owner}</span>
                    </div>
                  </td>
                  <td>
                    <div class="tabular-num" style="font-weight: 700; color: var(--ep-text);">${formatCompactETB(c.budget)}</div>
                    <div class="tabular-num" style="font-size: 11px; color: var(--ep-muted);">Spent: ${formatCompactETB(c.spent)}</div>
                    <div class="micro-progress-wrap">
                      <div class="micro-progress-fill" style="width: ${c.budget > 0 ? Math.min(100, Math.round((c.spent / c.budget) * 100)) : 0}%;"></div>
                    </div>
                  </td>
                  <td style="min-width: 100px;">
                    <div class="tabular-num" style="font-size: 11.5px; font-weight: 600; margin-bottom: 2px; color: var(--ep-text-secondary);">
                      ${c.progress_percent}% Done
                    </div>
                    <div class="progress-bar-wrap">
                      <div class="progress-bar-fill" style="width: ${c.progress_percent}%;"></div>
                    </div>
                  </td>
                  <td>
                    <span class="pill pill-${(c.execution_status || 'draft').toLowerCase()}">
                      ${c.execution_status === 'Active' ? '<span class="dot-pulse-wrap"><span class="dot-pulse"></span>Active</span>' : c.execution_status}
                    </span>
                  </td>
                  <td style="text-align: right;">
                    <a href="#/campaigns/${c.id}" class="btn btn-secondary btn-sm" style="text-decoration: none;">
                      Workspace ${icons.arrowRight}
                    </a>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Live Advertising Inventory Snapshot -->
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">Live Advertising Placements</div>
            <div class="card-subtitle">Active broadcast spots, billboards, and transit media currently airing nationwide</div>
          </div>
          <a href="#/advertisements" class="btn btn-secondary btn-sm" style="text-decoration: none;">Full Ad Inventory →</a>
        </div>

        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Ad Creative & Contract Ref</th>
                <th>Category & Outlet</th>
                <th>Linked Campaign</th>
                <th>Flight Schedule</th>
                <th>Airtime Spots</th>
                <th>Committed Cost</th>
                <th>Delivery Status</th>
                <th style="text-align: right;">Verification</th>
              </tr>
            </thead>
            <tbody>
              ${liveAdsSnapshot.length === 0 ? `
                <tr><td colspan="8" class="empty-state">No live advertising flights running right now.</td></tr>
              ` : liveAdsSnapshot.map(ad => {
                const channelClass = getChannelClass(ad.media_category);
                const spotPercent = ad.total_spots > 0 ? Math.min(100, Math.round(((ad.delivered_spots || 0) / ad.total_spots) * 100)) : 0;
                return `
                  <tr class="clickable-row" onclick="window.inspectPlacement('${ad.id}')">
                    <td>
                      <div style="font-weight: 600; color: var(--ep-text); margin-bottom: 2px;">${ad.ad_name}</div>
                      <div><span class="code-tag">Ref: ${ad.contract_ref || ad.id}</span></div>
                    </td>
                    <td>
                      <div class="channel-pill ${channelClass}">
                        <span>${getChannelIcon(ad.media_category)}</span>
                        <span>${ad.outlet_name}</span>
                      </div>
                      <div style="font-size: 11px; color: var(--ep-muted); margin-top: 3px; padding-left: 2px;">${ad.placement_type}</div>
                    </td>
                    <td>
                      <a href="#/campaigns/${ad.campaign_id}" style="color: var(--ep-text); text-decoration: none;" onclick="event.stopPropagation();" onmouseover="this.style.color='var(--ep-primary)'" onmouseout="this.style.color='var(--ep-text)'">
                        <div style="margin-bottom: 2px;"><span class="code-tag primary">${ad.campaign_id}</span></div>
                        <div style="font-size: 12px; font-weight: 500;">${ad.campaign_title}</div>
                      </a>
                    </td>
                    <td class="tabular-num" style="font-size: 12px; color: var(--ep-muted); white-space: nowrap;">
                      <div style="font-weight: 500; color: var(--ep-text-secondary);">${ad.start_date} → ${ad.end_date}</div>
                      <div style="margin-top: 4px;">
                        ${ad.alertLevel === 'expires_3_days' ? `
                          <span class="pill pill-critical">⏳ ${ad.daysRemaining} days left</span>
                        ` : ad.alertLevel === 'expires_7_days' ? `
                          <span class="pill pill-warning">🔔 ${ad.daysRemaining} days left</span>
                        ` : `
                          <span class="pill pill-active"><span class="dot-pulse-wrap"><span class="dot-pulse"></span>Active flight</span></span>
                        `}
                      </div>
                    </td>
                    <td>
                      <div class="tabular-num" style="font-size: 12px; font-weight: 600;">
                        ${ad.delivered_spots || 0} / ${ad.total_spots || 0}
                      </div>
                      <div class="micro-progress-wrap">
                        <div class="micro-progress-fill" style="width: ${spotPercent}%;"></div>
                      </div>
                    </td>
                    <td class="tabular-num" style="font-weight: 700; color: var(--ep-text);">
                      ${formatETB(ad.total_cost)}
                    </td>
                    <td>
                      <span class="pill pill-active">
                        <span class="dot-pulse-wrap"><span class="dot-pulse"></span>Live Airing</span>
                      </span>
                    </td>
                    <td style="text-align: right;" onclick="event.stopPropagation();">
                      <div style="display: flex; align-items: center; justify-content: flex-end; gap: 6px;">
                        <button class="quick-action-btn" title="Inspect Specs" onclick="window.inspectPlacement('${ad.id}')">
                          ${icons.eye}
                        </button>
                        ${ad.verification_status === 'Verified' ? `
                          <span class="pill pill-active">${icons.check} Verified</span>
                        ` : `
                          <button class="btn btn-secondary btn-sm" onclick="openVerifyModal('${ad.id}', '${ad.ad_name.replace(/'/g, "\\'")}', '${ad.outlet_name.replace(/'/g, "\\'")}')">
                            Verify Proof
                          </button>
                        `}
                      </div>
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
    container.innerHTML = `<div class="empty-state" style="color: #DC2626;">Failed to load overview: ${err.message}</div>`;
  }
}
