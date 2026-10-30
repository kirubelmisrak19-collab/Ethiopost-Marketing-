/**
 * Ethiopost Marketing Command Center
 * Campaign Management Module (Prompt Section 5)
 * Linear / Stripe minimalist aesthetic with high clarity & polished tabular UX
 */

import { api, formatETB, formatCompactETB, showToast, state } from '../state.js';
import { icons, getChannelIcon, getChannelClass } from '../components/icons.js';

let activeCategory = 'all';
let activeStatus = 'all';
let searchQuery = '';

function getFlightElapsedPercent(startDate, endDate) {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  const now = new Date('2026-10-30').getTime();
  if (isNaN(start) || isNaN(end) || end <= start) return 0;
  if (now <= start) return 0;
  if (now >= end) return 100;
  return Math.round(((now - start) / (end - start)) * 100);
}

export async function renderCampaigns(container, campaignId = null) {
  if (campaignId) {
    return renderCampaignDetail(container, campaignId);
  }

  container.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: center; height: 260px; color: var(--ep-muted);">
      Loading Ethiopost Campaigns...
    </div>
  `;

  try {
    let url = `/api/campaigns?month=${state.activeMonth}&`;
    if (activeCategory !== 'all') url += `portfolio=${activeCategory}&`;
    if (activeStatus !== 'all') url += `status=${activeStatus}&`;
    if (searchQuery) url += `search=${encodeURIComponent(searchQuery)}&`;

    const campaigns = await api(url);

    const categories = [
      { id: 'all', name: 'All Services' },
      { id: 'vpb', name: 'Virtual P.O. Box' },
      { id: 'post-gebeya', name: 'Post Gebeya' },
      { id: 'post-finance', name: 'Post Finance' },
      { id: 'ems', name: 'EMS Express' },
      { id: 'parcel', name: 'Parcel Services' },
      { id: 'mail', name: 'Letter Services' },
      { id: 'corporate', name: 'Corporate Branding' },
      { id: 'institutional', name: 'Institutional' }
    ];

    // Compute summary metrics for top ribbon
    const totalCampaigns = campaigns.length;
    const activeCount = campaigns.filter(c => c.execution_status === 'Active').length;
    const totalBudget = campaigns.reduce((s, c) => s + (c.budget || 0), 0);
    const totalSpent = campaigns.reduce((s, c) => s + (c.spent || 0), 0);
    const avgProgress = totalCampaigns > 0 ? Math.round(campaigns.reduce((s, c) => s + (c.activityPercent || 0), 0) / totalCampaigns) : 0;

    container.innerHTML = `
      <!-- Toolbar & Category Filter Bar -->
      <div style="margin-bottom: 20px; display: flex; flex-direction: column; gap: 14px;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
          <div>
            <h2 style="font-size: 18px; font-weight: 700; color: var(--ep-text); margin-bottom: 2px;">
              Campaign Management
            </h2>
            <p style="font-size: 12.5px; color: var(--ep-muted);">
              Multi-month campaign schedules, service portfolios, and accountability tracking across Ethiopia
            </p>
          </div>

          <button class="btn btn-primary" onclick="openModal('campaign-modal')">
            <span>${icons.plus}</span> New Campaign
          </button>
        </div>

        <!-- Top Quick Metrics Strip -->
        <div class="metrics-ribbon">
          <div class="metric-strip-card">
            <span class="metric-strip-label">Filtered Campaigns</span>
            <span class="metric-strip-val">${totalCampaigns} Campaigns</span>
            <span class="metric-strip-sub">${activeCount} actively running</span>
          </div>
          <div class="metric-strip-card">
            <span class="metric-strip-label">Committed Portfolio Budget</span>
            <span class="metric-strip-val">${formatCompactETB(totalBudget)}</span>
            <span class="metric-strip-sub">Total allocated funds</span>
          </div>
          <div class="metric-strip-card">
            <span class="metric-strip-label">Disbursed Spend</span>
            <span class="metric-strip-val">${formatCompactETB(totalSpent)}</span>
            <span class="metric-strip-sub">${totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0}% budget consumed</span>
          </div>
          <div class="metric-strip-card">
            <span class="metric-strip-label">Avg Deliverables Execution</span>
            <span class="metric-strip-val">${avgProgress}% Completed</span>
            <span class="metric-strip-sub">Across all campaign activities</span>
          </div>
        </div>

        <!-- Service Category Chips -->
        <div class="filter-chips">
          ${categories.map(c => `
            <button class="chip-btn ${activeCategory === c.id ? 'active' : ''}" data-cat="${c.id}">
              ${c.name}
            </button>
          `).join('')}
        </div>

        <!-- Filter Bar -->
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; background: #fff; padding: 10px 14px; border: 1px solid var(--ep-border); border-radius: var(--radius-sm); box-shadow: var(--shadow-subtle);">
          <div style="width: 320px;">
            <input type="text" id="camp-search-input" class="form-input" placeholder="Search by title, code, or owner..." value="${searchQuery}" style="height: 32px; font-size: 12.5px;">
          </div>

          <div style="display: flex; align-items: center; gap: 6px;">
            <span style="font-size: 11.5px; font-weight: 600; color: var(--ep-muted); text-transform: uppercase;">Status:</span>
            ${['all', 'Active', 'Scheduled', 'Draft', 'Completed'].map(st => `
              <button class="chip-btn ${activeStatus === st ? 'active' : ''}" data-status="${st}" style="padding: 3px 10px; font-size: 11.5px;">
                ${st === 'all' ? 'All' : st}
              </button>
            `).join('')}
          </div>
        </div>
      </div>

      <!-- Campaigns High-Density Table -->
      <div class="card">
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Campaign Title & Code</th>
                <th>Service Portfolio</th>
                <th>Flight Schedule</th>
                <th>Owner</th>
                <th>Budget & Spend</th>
                <th>Deliverables</th>
                <th>Lifecycle Status</th>
                <th style="text-align: right;">Workspace</th>
              </tr>
            </thead>
            <tbody>
              ${campaigns.length === 0 ? `
                <tr><td colspan="8" class="empty-state">No campaigns found matching selected filters.</td></tr>
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
                    <span class="pill" style="background: ${c.badge_bg || '#EEF2FF'}; color: ${c.badge_text || 'var(--ep-primary)'}; border-color: ${c.portfolio_color || '#C7D2FE'}33;">
                      <span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: ${c.portfolio_color || 'var(--ep-primary)'};"></span>
                      ${c.portfolio_name}
                    </span>
                  </td>
                  <td class="tabular-num" style="font-size: 12px; color: var(--ep-muted); white-space: nowrap;">
                    <div style="font-weight: 500; color: var(--ep-text-secondary);">${c.start_date} → ${c.end_date}</div>
                  </td>
                  <td>
                    <div style="display: flex; align-items: center; gap: 7px;">
                      <div class="user-avatar" style="width: 22px; height: 22px; font-size: 10px; background: #EEF2FF; color: var(--ep-primary); font-weight: 700;">
                        ${c.owner ? c.owner.split(' ').map(n => n[0]).join('').substring(0, 2) : 'EP'}
                      </div>
                      <span style="color: var(--ep-text-secondary); font-weight: 500;">${c.owner}</span>
                    </div>
                  </td>
                  <td>
                    <div class="tabular-num" style="font-weight: 700; color: var(--ep-text);">${formatCompactETB(c.budget)}</div>
                    <div class="tabular-num" style="font-size: 11px; color: var(--ep-muted);">Spent: ${formatCompactETB(c.spent)}</div>
                    <div class="micro-progress-wrap">
                      <div class="micro-progress-fill ${c.spent > c.budget ? 'gold' : ''}" style="width: ${c.budget > 0 ? Math.min(100, Math.round((c.spent / c.budget) * 100)) : 0}%;"></div>
                    </div>
                  </td>
                  <td style="min-width: 100px;">
                    <div class="tabular-num" style="font-size: 11.5px; font-weight: 600; margin-bottom: 2px; color: var(--ep-text-secondary);">
                      ${c.activityPercent || 0}% Done
                    </div>
                    <div class="progress-bar-wrap">
                      <div class="progress-bar-fill" style="width: ${c.activityPercent || 0}%;"></div>
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
    `;

    // Event Bindings
    container.querySelectorAll('.filter-chips .chip-btn').forEach(btn => {
      btn.onclick = () => {
        activeCategory = btn.dataset.cat;
        renderCampaigns(container);
      };
    });

    container.querySelectorAll('[data-status]').forEach(btn => {
      btn.onclick = () => {
        activeStatus = btn.dataset.status;
        renderCampaigns(container);
      };
    });

    const searchInput = container.querySelector('#camp-search-input');
    if (searchInput) {
      searchInput.oninput = (e) => {
        searchQuery = e.target.value.trim();
        clearTimeout(window._cTimer);
        window._cTimer = setTimeout(() => renderCampaigns(container), 250);
      };
    }
  } catch (err) {
    container.innerHTML = `<div class="empty-state" style="color: #DC2626;">Error: ${err.message}</div>`;
  }
}

// --------------------------------------------------------------------------
// DEDICATED CAMPAIGN DETAIL WORKSPACE (All 7 Tabs Cleanly Structured)
// --------------------------------------------------------------------------
export async function renderCampaignDetail(container, campaignId, activeTab = 'overview') {
  container.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: center; height: 260px; color: var(--ep-muted);">
      Loading Campaign: ${campaignId}...
    </div>
  `;

  try {
    const data = await api(`/api/campaigns/${campaignId}`);
    const { campaign, tabs } = data;

    container.innerHTML = `
      <!-- Breadcrumb & Campaign Header -->
      <div style="margin-bottom: 20px;">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
          <a href="#/campaigns" style="font-size: 13px; font-weight: 600; color: var(--ep-primary); text-decoration: none; display: flex; align-items: center; gap: 4px;">
            ← Back to Campaigns
          </a>
          <span style="color: var(--ep-border);">/</span>
          <span style="font-size: 13px; color: var(--ep-muted);">${campaign.portfolio_name}</span>
          <span style="color: var(--ep-border);">/</span>
          <span class="code-tag primary">${campaign.id}</span>
        </div>

        <div class="card" style="padding: 20px 24px; border-left: 4px solid ${campaign.portfolio_color || 'var(--ep-primary)'}; box-shadow: var(--shadow-card);">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 16px;">
            <div>
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                <span class="pill" style="background: ${campaign.badge_bg || '#EEF2FF'}; color: ${campaign.badge_text || 'var(--ep-primary)'};">
                  ${campaign.portfolio_name}
                </span>
                <span class="code-tag">${campaign.id}</span>
              </div>
              <h1 style="font-size: 20px; font-weight: 700; color: var(--ep-text); margin-bottom: 8px; letter-spacing: -0.01em;">
                ${campaign.title}
              </h1>
              <div style="display: flex; align-items: center; gap: 16px; font-size: 12.5px; color: var(--ep-muted); flex-wrap: wrap;">
                <span style="display: flex; align-items: center; gap: 4px;">
                  ${icons.calendar} <strong>${campaign.start_date}</strong> to <strong>${campaign.end_date}</strong>
                </span>
                <span style="display: flex; align-items: center; gap: 4px;">
                  👤 Lead: <strong style="color: var(--ep-text);">${campaign.owner}</strong>
                </span>
                <span style="display: flex; align-items: center; gap: 4px;">
                  🌍 Scope: <strong style="color: var(--ep-text);">${campaign.geographic_coverage || 'National'}</strong>
                </span>
              </div>
            </div>

            <!-- Status & Quick Action -->
            <div style="display: flex; align-items: center; gap: 10px;">
              <select id="update-camp-status" class="form-select" style="height: 32px; font-size: 12px; font-weight: 600;">
                ${['Draft', 'Submitted', 'Approved', 'Scheduled', 'Active', 'Paused', 'Completed'].map(st => `
                  <option value="${st}" ${campaign.execution_status === st ? 'selected' : ''}>Status: ${st}</option>
                `).join('')}
              </select>
              <button class="btn btn-primary btn-sm" onclick="openPlacementForCampaign('${campaign.id}')">
                <span>${icons.plus}</span> Book Media Ad
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Tab Navigation Bar -->
      <div style="display: flex; gap: 6px; border-bottom: 1px solid var(--ep-border); margin-bottom: 20px;">
        ${[
          { id: 'overview', label: 'Overview' },
          { id: 'advertisements', label: `Advertisements (${tabs.advertisements.length})` },
          { id: 'activities', label: `Activities (${tabs.activities.length})` },
          { id: 'budget', label: `Budget Ledger (${formatCompactETB(campaign.budget)})` }
        ].map(t => `
          <button class="chip-btn ${activeTab === t.id ? 'active' : ''}" data-tab="${t.id}" style="border-radius: 6px 6px 0 0; border-bottom: none; padding: 8px 16px; font-size: 12.5px;">
            ${t.label}
          </button>
        `).join('')}
      </div>

      <!-- Tab Content Area -->
      <div id="tab-content">
        ${renderWorkspaceTab(campaign, tabs, activeTab)}
      </div>
    `;

    // Status change listener
    const statusSelect = container.querySelector('#update-camp-status');
    if (statusSelect) {
      statusSelect.onchange = async (e) => {
        const newStatus = e.target.value;
        try {
          await api(`/api/campaigns/${campaignId}`, {
            method: 'PUT',
            body: JSON.stringify({ execution_status: newStatus })
          });
          showToast(`Campaign status updated to ${newStatus}`, 'success');
          renderCampaignDetail(container, campaignId, activeTab);
        } catch (err) {}
      };
    }

    // Tab buttons
    container.querySelectorAll('[data-tab]').forEach(btn => {
      btn.onclick = () => {
        renderCampaignDetail(container, campaignId, btn.dataset.tab);
      };
    });

  } catch (err) {
    container.innerHTML = `<div class="empty-state" style="color: #DC2626;">Error: ${err.message}</div>`;
  }
}

// --------------------------------------------------------------------------
// RENDER SPECIFIC WORKSPACE TAB
// --------------------------------------------------------------------------
function renderWorkspaceTab(campaign, tabs, tabKey) {
  switch (tabKey) {
    case 'overview':
      return `
        <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 16px;">
          <div class="card" style="padding: 20px;">
            <div class="card-title" style="margin-bottom: 8px;">Strategic Objective</div>
            <p style="font-size: 13.5px; line-height: 1.6; color: var(--ep-text); margin-bottom: 20px;">
              ${tabs.overview.strategicObjective || 'No objective specified.'}
            </p>

            <div class="card-title" style="margin-bottom: 8px;">Campaign Scope & Rationale</div>
            <p style="font-size: 13px; line-height: 1.6; color: var(--ep-muted); margin-bottom: 20px;">
              ${tabs.overview.description || 'Promotional campaign spanning Ethiopian national channels.'}
            </p>

            <div class="card-title" style="margin-bottom: 8px;">Primary KPI & Target</div>
            <div style="display: flex; align-items: center; gap: 12px; background: #FAFBFD; padding: 12px 14px; border: 1px solid var(--ep-border); border-radius: var(--radius-sm);">
              <span class="pill pill-gold">${campaign.primary_kpi || 'Engagement'}</span>
              <span style="font-weight: 700; font-size: 14px; color: var(--ep-text);">${campaign.kpi_target || 'Target specified in brief'}</span>
            </div>
          </div>

          <div class="card" style="padding: 20px;">
            <div class="card-title" style="margin-bottom: 14px;">Operational Parameters</div>
            <div style="display: flex; flex-direction: column; gap: 14px; font-size: 13px;">
              <div>
                <div style="color: var(--ep-muted); font-size: 11px; font-weight: 600; text-transform: uppercase;">Target Audience</div>
                <div style="font-weight: 600; margin-top: 3px; color: var(--ep-text);">${tabs.overview.targetAudience}</div>
              </div>
              <div>
                <div style="color: var(--ep-muted); font-size: 11px; font-weight: 600; text-transform: uppercase;">Approved Budget</div>
                <div class="tabular-num" style="font-weight: 700; color: var(--ep-primary); font-size: 16px; margin-top: 3px;">
                  ${formatETB(campaign.budget)}
                </div>
              </div>
              <div>
                <div style="color: var(--ep-muted); font-size: 11px; font-weight: 600; text-transform: uppercase;">Actual Disbursed Spend</div>
                <div class="tabular-num" style="font-weight: 600; font-size: 14px; margin-top: 3px; color: var(--ep-text);">
                  ${formatETB(campaign.spent)} <span style="font-size: 11.5px; color: var(--ep-muted); font-weight: normal;">(${campaign.budget > 0 ? Math.round((campaign.spent / campaign.budget) * 100) : 0}%)</span>
                </div>
                <div class="micro-progress-wrap" style="max-width: 100%; margin-top: 6px;">
                  <div class="micro-progress-fill" style="width: ${campaign.budget > 0 ? Math.min(100, Math.round((campaign.spent / campaign.budget) * 100)) : 0}%;"></div>
                </div>
              </div>
              <div>
                <div style="color: var(--ep-muted); font-size: 11px; font-weight: 600; text-transform: uppercase;">Geographic Footprint</div>
                <div style="font-weight: 500; margin-top: 3px; color: var(--ep-text-secondary);">${campaign.geographic_coverage || 'National Coverage'}</div>
              </div>
            </div>
          </div>
        </div>
      `;

    case 'advertisements': {
      const ads = tabs.advertisements || [];
      const totalCost = ads.reduce((sum, a) => sum + (a.total_cost || 0), 0);
      const totalContracted = ads.reduce((sum, a) => sum + (a.total_spots || 0), 0);
      const totalDelivered = ads.reduce((sum, a) => sum + (a.delivered_spots || 0), 0);
      const deliveryRate = totalContracted > 0 ? Math.round((totalDelivered / totalContracted) * 100) : 0;
      const verifiedCount = ads.filter(a => a.verification_status === 'Verified').length;

      return `
        <!-- Top Media Placement Metrics Strip -->
        <div class="metrics-ribbon">
          <div class="metric-strip-card">
            <span class="metric-strip-label">Booked Flights</span>
            <span class="metric-strip-val">${ads.length} Placements</span>
            <span class="metric-strip-sub">${ads.filter(a => a.status === 'Active').length} currently active flights</span>
          </div>
          <div class="metric-strip-card">
            <span class="metric-strip-label">Committed Airtime Spend</span>
            <span class="metric-strip-val">${formatETB(totalCost)}</span>
            <span class="metric-strip-sub">${campaign.budget > 0 ? Math.round((totalCost / campaign.budget) * 100) : 0}% of campaign budget</span>
          </div>
          <div class="metric-strip-card">
            <span class="metric-strip-label">Spot Delivery Execution</span>
            <span class="metric-strip-val">${deliveryRate}% Airing Rate</span>
            <span class="metric-strip-sub">${totalDelivered} of ${totalContracted} contracted spots</span>
          </div>
          <div class="metric-strip-card">
            <span class="metric-strip-label">Verification Rate</span>
            <span class="metric-strip-val">${verifiedCount} / ${ads.length} Verified</span>
            <span class="metric-strip-sub">${ads.length - verifiedCount} awaiting proof review</span>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <div>
              <div class="card-title">Linked Media Placements (${ads.length})</div>
              <div class="card-subtitle">Broadcast airtimes, billboards, digital screens, and transit ads dedicated to this campaign</div>
            </div>
            <button class="btn btn-primary btn-sm" onclick="openPlacementForCampaign('${campaign.id}')">
              <span>${icons.plus}</span> Book Media Placement
            </button>
          </div>

          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Ad Creative & Contract Ref</th>
                  <th>Media Channel & Outlet</th>
                  <th>Flight Dates & Elapsed</th>
                  <th>Spot Execution Rate</th>
                  <th>Committed Cost</th>
                  <th>Delivery Status</th>
                  <th style="text-align: right;">Actions</th>
                </tr>
              </thead>
              <tbody>
                ${ads.length === 0 ? `
                  <tr>
                    <td colspan="7" class="empty-state">
                      <p>No media placements booked for this campaign yet.</p>
                      <button class="btn btn-primary btn-sm" onclick="openPlacementForCampaign('${campaign.id}')">
                        <span>${icons.plus}</span> Book First Placement
                      </button>
                    </td>
                  </tr>
                ` : ads.map(ad => {
                  const channelClass = getChannelClass(ad.outlet_type || ad.media_category);
                  const spotPercent = ad.total_spots > 0 ? Math.min(100, Math.round(((ad.delivered_spots || 0) / ad.total_spots) * 100)) : 0;
                  const elapsedPercent = getFlightElapsedPercent(ad.start_date, ad.end_date);
                  return `
                    <tr class="clickable-row" onclick="window.inspectPlacement('${ad.id}')">
                      <td>
                        <div style="font-weight: 600; color: var(--ep-text); margin-bottom: 2px;">${ad.ad_name}</div>
                        <div><span class="code-tag">Ref: ${ad.contract_ref || ad.id}</span></div>
                      </td>
                      <td>
                        <div class="channel-pill ${channelClass}">
                          <span>${getChannelIcon(ad.outlet_type || ad.media_category)}</span>
                          <span>${ad.outlet_name}</span>
                        </div>
                        <div style="font-size: 11px; color: var(--ep-muted); margin-top: 3px; padding-left: 2px;">${ad.placement_type}</div>
                      </td>
                      <td class="tabular-num" style="font-size: 12px; color: var(--ep-muted); white-space: nowrap;">
                        <div style="font-weight: 500; color: var(--ep-text-secondary);">${ad.start_date} → ${ad.end_date}</div>
                        <div class="micro-progress-wrap" title="Flight duration elapsed: ${elapsedPercent}%">
                          <div class="micro-progress-fill ${elapsedPercent >= 100 ? 'green' : ''}" style="width: ${elapsedPercent}%;"></div>
                        </div>
                        <div style="margin-top: 4px;">
                          ${ad.alertLevel === 'expires_today' ? `
                            <span class="pill pill-critical">⚠️ Ends Today</span>
                          ` : ad.alertLevel === 'expires_3_days' ? `
                            <span class="pill pill-critical">⏳ ${ad.daysRemaining} days left</span>
                          ` : ad.alertLevel === 'expires_7_days' ? `
                            <span class="pill pill-warning">🔔 ${ad.daysRemaining} days left</span>
                          ` : ad.isExpired ? `
                            <span class="pill pill-draft">Flight Concluded</span>
                          ` : `
                            <span class="pill pill-active"><span class="dot-pulse-wrap"><span class="dot-pulse"></span>Active flight</span></span>
                          `}
                        </div>
                      </td>
                      <td>
                        <div class="tabular-num" style="font-size: 12px; font-weight: 600; color: var(--ep-text);">
                          ${ad.delivered_spots || 0} / ${ad.total_spots || 0} spots
                          <span style="font-size: 11px; color: var(--ep-muted); font-weight: normal;">(${spotPercent}%)</span>
                        </div>
                        <div class="micro-progress-wrap">
                          <div class="micro-progress-fill ${spotPercent >= 100 ? 'green' : ''}" style="width: ${spotPercent}%;"></div>
                        </div>
                        ${ad.schedule_time_description ? `<div style="font-size: 10.5px; color: var(--ep-muted); margin-top: 2px;">${ad.schedule_time_description}</div>` : ''}
                      </td>
                      <td class="tabular-num" style="font-weight: 700; color: var(--ep-text); font-size: 13px;">
                        ${formatETB(ad.total_cost)}
                        ${ad.unit_cost ? `<div style="font-size: 10.5px; color: var(--ep-muted); font-weight: normal;">@ ${formatETB(ad.unit_cost)}/spot</div>` : ''}
                      </td>
                      <td>
                        <span class="pill pill-${(ad.status || 'scheduled').toLowerCase()}">
                          ${ad.status === 'Active' ? '<span class="dot-pulse-wrap"><span class="dot-pulse"></span>Live Airing</span>' : ad.status}
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
                            <button class="btn btn-secondary btn-sm" onclick="openVerifyModal('${ad.id}', '${(ad.ad_name || '').replace(/'/g, "\\'")}', '${(ad.outlet_name || '').replace(/'/g, "\\'")}')">
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
    }

    case 'activities':
      return `
        <div class="card">
          <div class="card-header">
            <div>
              <div class="card-title">Campaign Deliverables & Tasks (${tabs.activities.length})</div>
              <div class="card-subtitle">Accountability checklist and operational milestones</div>
            </div>
            <button class="btn btn-primary btn-sm" onclick="openModal('activity-modal')">
              <span>${icons.plus}</span> Add Task
            </button>
          </div>
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Task Title</th>
                  <th>Type</th>
                  <th>Owner</th>
                  <th>Due Date</th>
                  <th>Progress</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${tabs.activities.length === 0 ? `
                  <tr><td colspan="6" class="empty-state">No activities recorded yet.</td></tr>
                ` : tabs.activities.map(a => `
                  <tr>
                    <td style="font-weight: 600; color: var(--ep-text);">${a.title}</td>
                    <td><span class="pill pill-draft">${a.activity_type}</span></td>
                    <td>
                      <div style="display: flex; align-items: center; gap: 6px;">
                        <span style="color: var(--ep-text-secondary);">${a.owner}</span>
                      </div>
                    </td>
                    <td class="tabular-num" style="font-size: 12px; color: var(--ep-muted);">${a.due_date}</td>
                    <td style="min-width: 100px;">
                      <div class="tabular-num" style="font-size: 11px; font-weight: 600; margin-bottom: 2px;">${a.progress}%</div>
                      <div class="progress-bar-wrap">
                        <div class="progress-bar-fill" style="width: ${a.progress}%;"></div>
                      </div>
                    </td>
                    <td><span class="pill pill-${(a.status || 'pending').toLowerCase()}">${a.status}</span></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;

    case 'budget':
      return `
        <div class="card">
          <div class="card-header">
            <div>
              <div class="card-title">Campaign Expense Ledger</div>
              <div class="card-subtitle">Invoiced and disbursed allocations for this campaign</div>
            </div>
          </div>
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Expense Description</th>
                  <th>Category</th>
                  <th>Vendor</th>
                  <th>Invoice Ref</th>
                  <th>Stage</th>
                  <th style="text-align: right;">Amount (ETB)</th>
                </tr>
              </thead>
              <tbody>
                ${tabs.budget.expenses.length === 0 ? `
                  <tr><td colspan="6" class="empty-state">No expense disbursements recorded yet.</td></tr>
                ` : tabs.budget.expenses.map(e => `
                  <tr>
                    <td style="font-weight: 600; color: var(--ep-text);">${e.title}</td>
                    <td><span class="pill pill-draft">${e.category}</span></td>
                    <td style="color: var(--ep-text-secondary);">${e.vendor || '—'}</td>
                    <td><span class="code-tag">${e.invoice_ref || '—'}</span></td>
                    <td><span class="pill pill-${(e.stage || 'planned').toLowerCase()}">${e.stage}</span></td>
                    <td class="tabular-num" style="text-align: right; font-weight: 700; color: var(--ep-text);">${formatETB(e.amount)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;

    default:
      return `<div class="empty-state">Tab not found</div>`;
  }
}

window.openPlacementForCampaign = function(campId) {
  const sel = document.getElementById('plc-campaign');
  if (sel) sel.value = campId;
  window.openModal('placement-modal');
};
