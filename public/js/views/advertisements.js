/**
 * Ethiopost Marketing Command Center
 * Advertisement & Media Placement Tracker (Prompt Section 6)
 * "Where are Ethiopost advertisements currently running?"
 * Linear / Stripe minimalist tabular design + Visual Flight Cards & Detail Inspector
 */

import { api, formatETB, showToast, state } from '../state.js';
import { icons, getChannelIcon, getChannelClass, getChannelColor } from '../components/icons.js';

let activeCategory = 'all';
let activeFilter = 'all'; // 'all', 'Active', 'Ending Soon', 'Scheduled'
let activeCampaign = 'all';
let searchQuery = '';
let currentViewMode = 'table'; // 'table' or 'grid'

// Cache of loaded placements for quick inspection drawer
let placementsCache = [];

function getFlightElapsedPercent(startDate, endDate) {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  const now = new Date('2026-10-30').getTime();
  if (isNaN(start) || isNaN(end) || end <= start) return 0;
  if (now <= start) return 0;
  if (now >= end) return 100;
  return Math.round(((now - start) / (end - start)) * 100);
}

export async function renderAdvertisements(container) {
  container.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: center; height: 260px; color: var(--ep-muted);">
      Loading Ethiopost Central Advertising Inventory...
    </div>
  `;

  try {
    let url = `/api/advertisements?`;
    if (activeCategory !== 'all') url += `media_category=${encodeURIComponent(activeCategory)}&`;
    if (activeFilter !== 'all') url += `status=${encodeURIComponent(activeFilter)}&`;
    if (activeCampaign !== 'all') url += `campaign_id=${encodeURIComponent(activeCampaign)}&`;
    if (searchQuery) url += `search=${encodeURIComponent(searchQuery)}&`;

    const [placements, campaigns, allPlacements] = await Promise.all([
      api(url),
      api('/api/campaigns'),
      api('/api/advertisements')
    ]);

    placementsCache = allPlacements;

    const categories = [
      { id: 'all', name: 'All Media Outlets' },
      { id: 'Television', name: 'Television (EBC, EBS)' },
      { id: 'Radio', name: 'Radio (Fana, Sheger)' },
      { id: 'Digital Screen', name: 'Digital Screens (Meskel Sq)' },
      { id: 'Billboard', name: 'Outdoor Billboards' },
      { id: 'Transit', name: 'Transit (Anbessa Bus, LRT)' },
      { id: 'Social', name: 'Social & Digital' }
    ];

    // Compute metrics
    const totalPlacements = placements.length;
    const activeAirings = placements.filter(p => p.status === 'Active').length;
    const expiringSoon = placements.filter(p => p.alertLevel === 'expires_today' || p.alertLevel === 'expires_3_days' || p.alertLevel === 'expires_7_days').length;
    const totalCommittedSpend = placements.reduce((s, p) => s + (p.total_cost || 0), 0);
    const verifiedPlacements = placements.filter(p => p.verification_status === 'Verified').length;
    const verificationRate = totalPlacements > 0 ? Math.round((verifiedPlacements / totalPlacements) * 100) : 0;

    // Compute category spend breakdown for visual progress bar
    const categoryTotals = {};
    let overallSpend = 0;
    allPlacements.forEach(p => {
      const cat = p.media_category || 'Other';
      categoryTotals[cat] = (categoryTotals[cat] || 0) + (p.total_cost || 0);
      overallSpend += (p.total_cost || 0);
    });

    const categoryEntries = Object.entries(categoryTotals).map(([cat, cost]) => ({
      category: cat,
      cost,
      percent: overallSpend > 0 ? Math.round((cost / overallSpend) * 100) : 0,
      color: getChannelColor(cat)
    })).sort((a, b) => b.cost - a.cost);

    container.innerHTML = `
      <!-- Toolbar & Header -->
      <div style="margin-bottom: 20px; display: flex; flex-direction: column; gap: 14px;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
          <div>
            <h2 style="font-size: 18px; font-weight: 700; color: var(--ep-text); margin-bottom: 2px;">
              Advertisement & Media Placement Inventory
            </h2>
            <p style="font-size: 12.5px; color: var(--ep-muted);">
              Where Ethiopost advertisements are currently running nationwide across TV, radio, digital screens, and transit
            </p>
          </div>

          <div style="display: flex; align-items: center; gap: 10px;">
            <!-- View Mode Switcher -->
            <div class="view-toggle-wrap">
              <button class="view-toggle-btn ${currentViewMode === 'table' ? 'active' : ''}" id="view-mode-table" title="High-Density Tabular View">
                <span>${icons.table}</span> Table
              </button>
              <button class="view-toggle-btn ${currentViewMode === 'grid' ? 'active' : ''}" id="view-mode-grid" title="Visual Media Flight Cards">
                <span>${icons.grid}</span> Cards
              </button>
            </div>

            <button class="btn btn-secondary btn-sm" onclick="window.openOutletsDirectoryModal()">
              <span>📺</span> Media Directory
            </button>
            <a href="/api/advertisements?export=csv" class="btn btn-secondary btn-sm" style="text-decoration: none;" download>
              <span>${icons.download}</span> Export CSV
            </a>
            <button class="btn btn-primary" onclick="openModal('placement-modal')">
              <span>${icons.plus}</span> Book Media Placement
            </button>
          </div>
        </div>

        <!-- Top Placement Metrics Ribbon -->
        <div class="metrics-ribbon">
          <div class="metric-strip-card">
            <span class="metric-strip-label">Tracked Placements</span>
            <span class="metric-strip-val">${totalPlacements} Flights</span>
            <span class="metric-strip-sub">Nationwide media inventory</span>
          </div>
          <div class="metric-strip-card">
            <span class="metric-strip-label">Live Airings Right Now</span>
            <span class="metric-strip-val">
              <span class="dot-pulse-wrap"><span class="dot-pulse"></span>${activeAirings} Live Flights</span>
            </span>
            <span class="metric-strip-sub">Currently on-air & in circulation</span>
          </div>
          <div class="metric-strip-card">
            <span class="metric-strip-label">Expiring Within 7 Days</span>
            <span class="metric-strip-val" style="color: ${expiringSoon > 0 ? '#B45309' : 'inherit'};">
              ${expiringSoon > 0 ? `⏳ ${expiringSoon} Flights` : '0 Flights'}
            </span>
            <span class="metric-strip-sub">Requires contract review</span>
          </div>
          <div class="metric-strip-card">
            <span class="metric-strip-label">Committed Airtime Budget</span>
            <span class="metric-strip-val">${formatETB(totalCommittedSpend)}</span>
            <span class="metric-strip-sub">${verifiedPlacements} of ${totalPlacements} verified (${verificationRate}%)</span>
          </div>
        </div>

        <!-- Visual Media Channel Spend Breakdown Strip -->
        <div class="channel-breakdown-card">
          <div class="channel-breakdown-header">
            <span class="channel-breakdown-title">
              <span>${icons.budget}</span> Media Channel Budget Allocation
            </span>
            <span style="font-size: 11.5px; font-weight: 600; color: var(--ep-text); font-variant-numeric: tabular-nums;">
              Total Airtime Commitment: ${formatETB(overallSpend)}
            </span>
          </div>

          <!-- Segmented Multi-Color Progress Bar -->
          <div class="segmented-bar" title="Click any channel below to filter">
            ${categoryEntries.map(e => `
              <div class="segment-bar-item" style="width: ${e.percent}%; background-color: ${e.color};" title="${e.category}: ${formatETB(e.cost)} (${e.percent}%)" onclick="window.filterByMediaCategory('${e.category}')"></div>
            `).join('')}
          </div>

          <!-- Channel Allocation Legend with Interactive Filter Jumps -->
          <div class="channel-legend">
            ${categoryEntries.map(e => `
              <div class="channel-legend-item" onclick="window.filterByMediaCategory('${e.category}')">
                <span class="channel-legend-dot" style="background-color: ${e.color};"></span>
                <strong>${e.category}</strong>
                <span class="tabular-num" style="color: var(--ep-muted); font-size: 11px;">${formatETB(e.cost)} (${e.percent}%)</span>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Media Category Filter Chips -->
        <div class="filter-chips">
          ${categories.map(cat => {
            const count = cat.id === 'all' 
              ? allPlacements.length 
              : allPlacements.filter(p => p.media_category === cat.id).length;
            return `
              <button class="chip-btn ${activeCategory === cat.id ? 'active' : ''}" data-cat="${cat.id}">
                ${cat.name} <span style="opacity: 0.75; font-size: 11px; margin-left: 2px;">(${count})</span>
              </button>
            `;
          }).join('')}
        </div>

        <!-- Filter Controls Bar -->
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; background: #fff; padding: 10px 14px; border: 1px solid var(--ep-border); border-radius: var(--radius-sm); box-shadow: var(--shadow-subtle);">
          <div style="width: 280px; position: relative;">
            <input type="text" id="ad-search-input" class="form-input" placeholder="Search by creative, outlet, contract..." value="${searchQuery}" style="height: 32px; font-size: 12.5px; padding-right: 28px;">
            ${searchQuery ? `<button id="clear-search-btn" style="position: absolute; right: 8px; top: 50%; transform: translateY(-50%); background: none; border: none; color: var(--ep-muted); cursor: pointer; font-size: 12px;">✕</button>` : ''}
          </div>

          <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
            <!-- Linked Campaign Dropdown -->
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="font-size: 11.5px; font-weight: 600; color: var(--ep-muted); text-transform: uppercase;">Campaign:</span>
              <select id="ad-campaign-select" class="form-select" style="height: 32px; font-size: 12px; max-width: 220px;">
                <option value="all">All Linked Campaigns (${campaigns.length})</option>
                ${campaigns.map(c => `
                  <option value="${c.id}" ${activeCampaign === c.id ? 'selected' : ''}>
                    ${c.id} • ${c.title}
                  </option>
                `).join('')}
              </select>
            </div>

            <!-- Flight Status Filter Chips -->
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="font-size: 11.5px; font-weight: 600; color: var(--ep-muted); text-transform: uppercase;">Status:</span>
              ${['all', 'Active', 'Ending Soon', 'Scheduled'].map(st => `
                <button class="chip-btn ${activeFilter === st ? 'active' : ''}" data-status="${st}" style="padding: 3px 10px; font-size: 11.5px;">
                  ${st === 'all' ? 'All' : st === 'Ending Soon' ? '⏳ Ending Soon' : st}
                </button>
              `).join('')}
            </div>
          </div>
        </div>
      </div>

      <!-- Content Container (Table View vs Flight Cards View) -->
      ${placements.length === 0 ? `
        <div class="card">
          <div class="empty-state">
            <p>No media placements match the current filter selection.</p>
            <button class="btn btn-primary btn-sm" onclick="openModal('placement-modal')">
              <span>${icons.plus}</span> Book First Placement
            </button>
          </div>
        </div>
      ` : currentViewMode === 'table' ? `
        <!-- High-Density Tabular Media Placements Table -->
        <div class="card">
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Ad Creative & Contract Ref</th>
                  <th>Category & Outlet</th>
                  <th>Linked Campaign</th>
                  <th>Flight Dates & Elapsed</th>
                  <th>Spot Delivery Rate</th>
                  <th>Cost (ETB)</th>
                  <th>Delivery Status</th>
                  <th style="text-align: right;">Actions</th>
                </tr>
              </thead>
              <tbody>
                ${placements.map(p => {
                  const channelClass = getChannelClass(p.media_category);
                  const spotPercent = p.total_spots > 0 ? Math.min(100, Math.round(((p.delivered_spots || 0) / p.total_spots) * 100)) : 0;
                  const elapsedPercent = getFlightElapsedPercent(p.start_date, p.end_date);
                  return `
                    <tr class="clickable-row" onclick="window.inspectPlacement('${p.id}')">
                      <td>
                        <div style="font-weight: 600; color: var(--ep-text); margin-bottom: 2px;">${p.ad_name}</div>
                        <div style="display: flex; align-items: center; gap: 6px;">
                          <span class="code-tag">Ref: ${p.contract_ref || p.id}</span>
                          ${p.responsible_officer ? `<span style="font-size: 11px; color: var(--ep-muted);">• ${p.responsible_officer}</span>` : ''}
                        </div>
                      </td>
                      <td>
                        <div class="channel-pill ${channelClass}">
                          <span>${getChannelIcon(p.media_category)}</span>
                          <span>${p.outlet_name}</span>
                        </div>
                        <div style="font-size: 11px; color: var(--ep-muted); margin-top: 3px; padding-left: 2px;">${p.placement_type}</div>
                      </td>
                      <td>
                        <a href="#/campaigns/${p.campaign_id}" style="color: var(--ep-text); text-decoration: none;" onclick="event.stopPropagation();" onmouseover="this.style.color='var(--ep-primary)'" onmouseout="this.style.color='var(--ep-text)'">
                          <div style="display: flex; align-items: center; gap: 5px; margin-bottom: 2px;">
                            <span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: ${p.portfolio_color || 'var(--ep-primary)'};"></span>
                            <span class="code-tag primary">${p.campaign_id}</span>
                          </div>
                          <div style="font-size: 12px; font-weight: 500; color: var(--ep-text); max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${p.campaign_title}">${p.campaign_title}</div>
                        </a>
                      </td>
                      <td class="tabular-num" style="font-size: 12px; color: var(--ep-muted); white-space: nowrap;">
                        <div style="font-weight: 500; color: var(--ep-text-secondary);">${p.start_date} → ${p.end_date}</div>
                        <div class="micro-progress-wrap" title="Flight duration elapsed: ${elapsedPercent}%">
                          <div class="micro-progress-fill ${elapsedPercent >= 100 ? 'green' : ''}" style="width: ${elapsedPercent}%;"></div>
                        </div>
                        <div style="margin-top: 4px;">
                          ${p.alertLevel === 'expires_today' ? `
                            <span class="pill pill-critical">⚠️ Ends Today</span>
                          ` : p.alertLevel === 'expires_3_days' ? `
                            <span class="pill pill-critical">⏳ ${p.daysRemaining} days left</span>
                          ` : p.alertLevel === 'expires_7_days' ? `
                            <span class="pill pill-warning">🔔 ${p.daysRemaining} days left</span>
                          ` : p.isExpired ? `
                            <span class="pill pill-draft">Flight Concluded</span>
                          ` : `
                            <span class="pill pill-active"><span class="dot-pulse-wrap"><span class="dot-pulse"></span>Active flight</span></span>
                          `}
                        </div>
                      </td>
                      <td>
                        <div class="tabular-num" style="font-size: 12px; font-weight: 600; color: var(--ep-text);">
                          ${p.delivered_spots || 0} / ${p.total_spots || 0} spots
                          <span style="font-size: 11px; color: var(--ep-muted); font-weight: normal;">(${spotPercent}%)</span>
                        </div>
                        <div class="micro-progress-wrap">
                          <div class="micro-progress-fill ${spotPercent >= 100 ? 'green' : ''}" style="width: ${spotPercent}%;"></div>
                        </div>
                        ${p.schedule_time_description ? `<div style="font-size: 10.5px; color: var(--ep-muted); margin-top: 2px; max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${p.schedule_time_description}">${p.schedule_time_description}</div>` : ''}
                      </td>
                      <td class="tabular-num" style="font-weight: 700; color: var(--ep-text); font-size: 13px;">
                        ${formatETB(p.total_cost)}
                        ${p.unit_cost ? `<div style="font-size: 10.5px; color: var(--ep-muted); font-weight: normal;">@ ${formatETB(p.unit_cost)}/spot</div>` : ''}
                      </td>
                      <td>
                        <span class="pill pill-${p.status ? p.status.toLowerCase() : 'active'}">
                          ${p.status === 'Active' ? '<span class="dot-pulse-wrap"><span class="dot-pulse"></span>Live Airing</span>' : p.status}
                        </span>
                      </td>
                      <td style="text-align: right;" onclick="event.stopPropagation();">
                        <div style="display: flex; align-items: center; justify-content: flex-end; gap: 6px;">
                          <button class="quick-action-btn" title="Inspect Complete Specs" onclick="window.inspectPlacement('${p.id}')">
                            ${icons.eye}
                          </button>
                          ${p.verification_status === 'Verified' ? `
                            <span class="pill pill-active" title="Verified by ${p.verified_by || 'Staff'}">${icons.check} Verified</span>
                          ` : `
                            <button class="btn btn-secondary btn-sm" onclick="openVerifyModal('${p.id}', '${p.ad_name.replace(/'/g, "\\'")}', '${p.outlet_name.replace(/'/g, "\\'")}')">
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
      ` : `
        <!-- Visual Media Flight Cards Grid -->
        <div class="ad-grid">
          ${placements.map(p => {
            const channelClass = getChannelClass(p.media_category);
            const spotPercent = p.total_spots > 0 ? Math.min(100, Math.round(((p.delivered_spots || 0) / p.total_spots) * 100)) : 0;
            const elapsedPercent = getFlightElapsedPercent(p.start_date, p.end_date);
            return `
              <div class="ad-card" onclick="window.inspectPlacement('${p.id}')" style="cursor: pointer;">
                <div class="ad-card-top">
                  <div class="ad-card-channel-row">
                    <div class="channel-pill ${channelClass}">
                      <span>${getChannelIcon(p.media_category)}</span>
                      <span>${p.outlet_name}</span>
                    </div>
                    <span class="pill pill-${p.status ? p.status.toLowerCase() : 'active'}">
                      ${p.status === 'Active' ? '<span class="dot-pulse-wrap"><span class="dot-pulse"></span>Live</span>' : p.status}
                    </span>
                  </div>
                  <div class="ad-card-title">${p.ad_name}</div>
                  <div class="ad-card-meta">
                    <span class="code-tag">Ref: ${p.contract_ref || p.id}</span>
                    <span>• ${p.placement_type}</span>
                  </div>
                </div>

                <div class="ad-card-body">
                  <div class="ad-card-campaign">
                    <span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: ${p.portfolio_color || 'var(--ep-primary)'};"></span>
                    <a href="#/campaigns/${p.campaign_id}" style="color: var(--ep-text); text-decoration: none; font-weight: 500;" onclick="event.stopPropagation();" onmouseover="this.style.color='var(--ep-primary)'" onmouseout="this.style.color='var(--ep-text)'">
                      ${p.campaign_title}
                    </a>
                  </div>

                  <div class="ad-card-timeline">
                    <div class="ad-timeline-header">
                      <span>Flight Schedule</span>
                      <span>${p.start_date} → ${p.end_date}</span>
                    </div>
                    <div class="micro-progress-wrap" style="max-width: 100%;">
                      <div class="micro-progress-fill ${elapsedPercent >= 100 ? 'green' : ''}" style="width: ${elapsedPercent}%;"></div>
                    </div>
                    <div style="margin-top: 2px;">
                      ${p.alertLevel === 'expires_today' ? `
                        <span class="pill pill-critical">⚠️ Ends Today</span>
                      ` : p.alertLevel === 'expires_3_days' ? `
                        <span class="pill pill-critical">⏳ ${p.daysRemaining} days left</span>
                      ` : p.alertLevel === 'expires_7_days' ? `
                        <span class="pill pill-warning">🔔 ${p.daysRemaining} days left</span>
                      ` : p.isExpired ? `
                        <span class="pill pill-draft">Flight Concluded</span>
                      ` : `
                        <span class="pill pill-active"><span class="dot-pulse-wrap"><span class="dot-pulse"></span>Active flight</span></span>
                      `}
                    </div>
                  </div>

                  <div class="ad-card-spots">
                    <div class="ad-spots-header">
                      <span style="font-weight: 600; color: var(--ep-text);">Spots Execution</span>
                      <span class="tabular-num" style="font-weight: 700; color: var(--ep-text);">${p.delivered_spots || 0} / ${p.total_spots || 0} (${spotPercent}%)</span>
                    </div>
                    <div class="micro-progress-wrap" style="max-width: 100%;">
                      <div class="micro-progress-fill ${spotPercent >= 100 ? 'green' : ''}" style="width: ${spotPercent}%;"></div>
                    </div>
                    ${p.schedule_time_description ? `<div style="font-size: 11px; color: var(--ep-muted); margin-top: 2px;">${p.schedule_time_description}</div>` : ''}
                  </div>
                </div>

                <div class="ad-card-footer" onclick="event.stopPropagation();">
                  <div class="ad-card-cost">
                    <span class="ad-cost-label">Committed Spend</span>
                    <span class="ad-cost-val">${formatETB(p.total_cost)}</span>
                  </div>
                  <div style="display: flex; align-items: center; gap: 6px;">
                    <button class="btn btn-secondary btn-sm" onclick="window.inspectPlacement('${p.id}')">
                      Specs
                    </button>
                    ${p.verification_status === 'Verified' ? `
                      <span class="pill pill-active">${icons.check} Verified</span>
                    ` : `
                      <button class="btn btn-primary btn-sm" onclick="openVerifyModal('${p.id}', '${p.ad_name.replace(/'/g, "\\'")}', '${p.outlet_name.replace(/'/g, "\\'")}')">
                        Verify
                      </button>
                    `}
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `}

      <!-- Slide-Over Inspection Drawer Modal -->
      <div id="placement-drawer-backdrop" class="drawer-backdrop">
        <div class="drawer-panel" id="placement-drawer-panel">
          <div class="drawer-header">
            <div>
              <div style="font-size: 15px; font-weight: 700; color: var(--ep-text);">Media Flight Specifications</div>
              <div style="font-size: 11.5px; color: var(--ep-muted);" id="drawer-subtitle">Contract & Airtime Details</div>
            </div>
            <button class="modal-close" onclick="window.closePlacementDrawer()">${icons.close}</button>
          </div>
          <div class="drawer-body" id="drawer-content">
            <!-- Injected dynamically via window.inspectPlacement -->
          </div>
          <div class="drawer-footer" id="drawer-footer">
            <button class="btn btn-secondary" onclick="window.closePlacementDrawer()">Close</button>
            <div id="drawer-action-slot"></div>
          </div>
        </div>
      </div>
    `;

    // Event Bindings

    // View switcher toggles
    const tableBtn = container.querySelector('#view-mode-table');
    const gridBtn = container.querySelector('#view-mode-grid');

    if (tableBtn && gridBtn) {
      tableBtn.onclick = () => {
        currentViewMode = 'table';
        renderAdvertisements(container);
      };
      gridBtn.onclick = () => {
        currentViewMode = 'grid';
        renderAdvertisements(container);
      };
    }

    // Category chips
    container.querySelectorAll('.filter-chips .chip-btn').forEach(btn => {
      btn.onclick = () => {
        activeCategory = btn.dataset.cat;
        renderAdvertisements(container);
      };
    });

    // Status filter chips
    container.querySelectorAll('[data-status]').forEach(btn => {
      btn.onclick = () => {
        activeFilter = btn.dataset.status;
        renderAdvertisements(container);
      };
    });

    // Campaign select
    const campSelect = container.querySelector('#ad-campaign-select');
    if (campSelect) {
      campSelect.onchange = (e) => {
        activeCampaign = e.target.value;
        renderAdvertisements(container);
      };
    }

    // Search input
    const searchInput = container.querySelector('#ad-search-input');
    if (searchInput) {
      searchInput.oninput = (e) => {
        searchQuery = e.target.value.trim();
        clearTimeout(window._adTimer);
        window._adTimer = setTimeout(() => renderAdvertisements(container), 250);
      };
    }

    const clearSearchBtn = container.querySelector('#clear-search-btn');
    if (clearSearchBtn) {
      clearSearchBtn.onclick = () => {
        searchQuery = '';
        renderAdvertisements(container);
      };
    }

  } catch (err) {
    container.innerHTML = `<div class="empty-state" style="color: #DC2626;">Error: ${err.message}</div>`;
  }
}

// Global Category Filter Jump
window.filterByMediaCategory = function(cat) {
  activeCategory = cat;
  const container = document.getElementById('view-container');
  if (container) renderAdvertisements(container);
};

// Global Inspector Drawer Open
window.inspectPlacement = function(placementId) {
  const p = placementsCache.find(x => x.id === placementId);
  if (!p) return;

  const backdrop = document.getElementById('placement-drawer-backdrop');
  const content = document.getElementById('drawer-content');
  const subtitle = document.getElementById('drawer-subtitle');
  const actionSlot = document.getElementById('drawer-action-slot');

  if (!backdrop || !content) return;

  const channelClass = getChannelClass(p.media_category);
  const spotPercent = p.total_spots > 0 ? Math.min(100, Math.round(((p.delivered_spots || 0) / p.total_spots) * 100)) : 0;
  const elapsedPercent = getFlightElapsedPercent(p.start_date, p.end_date);

  subtitle.textContent = `${p.id} • ${p.outlet_name}`;

  content.innerHTML = `
    <!-- Top Identity Card -->
    <div style="background: #FAFBFD; border: 1px solid var(--ep-border); border-radius: var(--radius-sm); padding: 14px 16px;">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
        <div class="channel-pill ${channelClass}">
          <span>${getChannelIcon(p.media_category)}</span>
          <span>${p.outlet_name}</span>
        </div>
        <span class="pill pill-${p.status ? p.status.toLowerCase() : 'active'}">
          ${p.status === 'Active' ? '<span class="dot-pulse-wrap"><span class="dot-pulse"></span>Live Airing</span>' : p.status}
        </span>
      </div>
      <div style="font-size: 15px; font-weight: 700; color: var(--ep-text); margin-bottom: 4px;">${p.ad_name}</div>
      <div style="display: flex; align-items: center; gap: 8px; font-size: 11.5px; color: var(--ep-muted);">
        <span class="code-tag">Ref: ${p.contract_ref || p.id}</span>
        <span>• ${p.placement_type}</span>
      </div>
    </div>

    <!-- Linked Campaign -->
    <div class="drawer-section">
      <div class="drawer-section-title">Linked Campaign Portfolio</div>
      <div style="display: flex; align-items: center; justify-content: space-between; background: #FFFFFF; border: 1px solid var(--ep-border); padding: 10px 14px; border-radius: var(--radius-sm);">
        <div>
          <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 2px;">
            <span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: ${p.portfolio_color || 'var(--ep-primary)'};"></span>
            <span class="code-tag primary">${p.campaign_id}</span>
          </div>
          <div style="font-size: 13px; font-weight: 600; color: var(--ep-text);">${p.campaign_title}</div>
        </div>
        <a href="#/campaigns/${p.campaign_id}" class="btn btn-secondary btn-sm" onclick="window.closePlacementDrawer()">
          Open Workspace →
        </a>
      </div>
    </div>

    <!-- Flight Execution Timeline -->
    <div class="drawer-section">
      <div class="drawer-section-title">Flight Window & Timeline</div>
      <div class="spec-grid-2">
        <div class="spec-item">
          <span class="spec-label">Start Airing Date</span>
          <span class="spec-val">📅 ${p.start_date}</span>
        </div>
        <div class="spec-item">
          <span class="spec-label">Contract End Date</span>
          <span class="spec-val">📅 ${p.end_date}</span>
        </div>
      </div>

      <div style="margin-top: 6px;">
        <div style="display: flex; justify-content: space-between; font-size: 11.5px; margin-bottom: 4px;">
          <span style="color: var(--ep-muted);">Flight Duration Elapsed:</span>
          <strong style="color: var(--ep-text);">${elapsedPercent}%</strong>
        </div>
        <div class="micro-progress-wrap" style="max-width: 100%; height: 6px;">
          <div class="micro-progress-fill ${elapsedPercent >= 100 ? 'green' : ''}" style="width: ${elapsedPercent}%;"></div>
        </div>
        <div style="margin-top: 6px;">
          ${p.alertLevel === 'expires_today' ? `
            <span class="pill pill-critical">⚠️ Ends Today</span>
          ` : p.alertLevel === 'expires_3_days' ? `
            <span class="pill pill-critical">⏳ ${p.daysRemaining} days left</span>
          ` : p.alertLevel === 'expires_7_days' ? `
            <span class="pill pill-warning">🔔 ${p.daysRemaining} days left</span>
          ` : p.isExpired ? `
            <span class="pill pill-draft">Flight Concluded</span>
          ` : `
            <span class="pill pill-active"><span class="dot-pulse-wrap"><span class="dot-pulse"></span>Active flight</span></span>
          `}
        </div>
      </div>
    </div>

    <!-- Spot Execution & Airtime Schedule -->
    <div class="drawer-section">
      <div class="drawer-section-title">Spot Delivery & Airtime Window</div>
      <div style="background: #FAFBFD; border: 1px solid var(--ep-border); padding: 12px 14px; border-radius: var(--radius-sm); display: flex; flex-direction: column; gap: 8px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 12px; color: var(--ep-muted);">Contracted Spots</span>
          <strong style="font-size: 14px; color: var(--ep-text);">${p.total_spots || 0} spots</strong>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 12px; color: var(--ep-muted);">Delivered Airings</span>
          <strong style="font-size: 14px; color: ${spotPercent >= 100 ? '#10B981' : 'var(--ep-primary)'};">${p.delivered_spots || 0} spots (${spotPercent}%)</strong>
        </div>
        <div class="micro-progress-wrap" style="max-width: 100%;">
          <div class="micro-progress-fill ${spotPercent >= 100 ? 'green' : ''}" style="width: ${spotPercent}%;"></div>
        </div>
        ${p.schedule_time_description ? `
          <div style="font-size: 11.5px; color: var(--ep-text-secondary); margin-top: 4px; border-top: 1px dashed var(--ep-border); padding-top: 6px;">
            ⏰ <strong>Airing Schedule:</strong> ${p.schedule_time_description}
          </div>
        ` : ''}
      </div>
    </div>

    <!-- Commercials & Financials -->
    <div class="drawer-section">
      <div class="drawer-section-title">Commercial Terms & Procurement</div>
      <div class="spec-grid-2">
        <div class="spec-item">
          <span class="spec-label">Unit Spot Cost</span>
          <span class="spec-val">${formatETB(p.unit_cost || 0)}</span>
        </div>
        <div class="spec-item">
          <span class="spec-label">Total Contract Value</span>
          <span class="spec-val" style="color: var(--ep-primary); font-size: 14px;">${formatETB(p.total_cost || 0)}</span>
        </div>
        <div class="spec-item">
          <span class="spec-label">Partner / Vendor</span>
          <span class="spec-val">${p.vendor || 'Ethiopost Media Partner'}</span>
        </div>
        <div class="spec-item">
          <span class="spec-label">Payment Status</span>
          <span class="pill pill-${(p.payment_status || 'unpaid').toLowerCase()}">${p.payment_status || 'Unpaid'}</span>
        </div>
      </div>
    </div>

    <!-- Verification Proof & Audit Trail -->
    <div class="drawer-section">
      <div class="drawer-section-title">Delivery Proof & Audit Certification</div>
      <div style="background: ${p.verification_status === 'Verified' ? '#ECFDF5' : '#FFFBEB'}; border: 1px solid ${p.verification_status === 'Verified' ? '#A7F3D0' : '#FDE68A'}; border-radius: var(--radius-sm); padding: 12px 14px;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
          <span style="font-weight: 700; font-size: 12px; color: ${p.verification_status === 'Verified' ? '#065F46' : '#92400E'};">
            ${p.verification_status === 'Verified' ? '✓ Proof Verified & Approved' : '⏳ Pending Independent Verification'}
          </span>
          ${p.verified_at ? `<span style="font-size: 11px; color: var(--ep-muted); font-family: monospace;">${p.verified_at}</span>` : ''}
        </div>
        <div style="font-size: 12px; color: var(--ep-text); line-height: 1.5;">
          ${p.proof_notes || 'No broadcast verification certificate or photos attached yet.'}
        </div>
        ${p.verified_by ? `
          <div style="font-size: 11px; color: var(--ep-muted); margin-top: 6px;">
            Verified by: <strong>${p.verified_by}</strong>
          </div>
        ` : ''}
      </div>
    </div>
    <!-- Flight Lifecycle Management Controls -->
    <div class="drawer-section">
      <div class="drawer-section-title">Flight Operational Status</div>
      <div style="display: flex; gap: 8px; align-items: center; background: #FFFFFF; border: 1px solid var(--ep-border); padding: 10px 14px; border-radius: var(--radius-sm);">
        <span style="font-size: 12px; color: var(--ep-muted);">Current Status:</span>
        <select class="form-select" style="height: 32px; font-size: 12px; width: 140px;" onchange="window.updatePlacementStatus('${p.id}', this.value)">
          <option value="Active" ${p.status === 'Active' ? 'selected' : ''}>Active (Live)</option>
          <option value="Paused" ${p.status === 'Paused' ? 'selected' : ''}>Paused</option>
          <option value="Completed" ${p.status === 'Completed' ? 'selected' : ''}>Completed</option>
          <option value="Scheduled" ${p.status === 'Scheduled' ? 'selected' : ''}>Scheduled</option>
        </select>
        <button class="btn btn-sm" style="margin-left: auto; background: #FEE2E2; color: #DC2626; border: 1px solid #FECACA;" onclick="window.deletePlacementFlight('${p.id}', '${p.ad_name.replace(/'/g, "\\'")}')">
          Delete Flight
        </button>
      </div>
    </div>
  `;

  if (p.verification_status === 'Verified') {
    actionSlot.innerHTML = `<span class="pill pill-active" style="padding: 6px 12px;">${icons.check} Delivery Verified</span>`;
  } else {
    actionSlot.innerHTML = `
      <button class="btn btn-primary" onclick="window.closePlacementDrawer(); openVerifyModal('${p.id}', '${p.ad_name.replace(/'/g, "\\'")}', '${p.outlet_name.replace(/'/g, "\\'")}')">
        <span>${icons.shieldCheck}</span> Verify Proof Evidence
      </button>
    `;
  }

  backdrop.classList.add('active');
};

window.updatePlacementStatus = async function(placementId, status) {
  try {
    await api(`/api/advertisements/${placementId}`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
    showToast(`Flight status updated to ${status}`, 'success');
    window.closePlacementDrawer();
    const container = document.getElementById('view-container');
    if (container) renderAdvertisements(container);
  } catch (err) {
    showToast(err.message, 'error');
  }
};

window.deletePlacementFlight = async function(placementId, adName) {
  const confirmMsg = `Are you sure you want to cancel and remove placement flight "${adName}"?\nCampaign budget figures will be automatically adjusted.`;
  if (!confirm(confirmMsg)) return;

  try {
    await api(`/api/advertisements/${placementId}`, {
      method: 'DELETE'
    });
    showToast(`Placement flight "${adName}" removed successfully.`, 'info');
    window.closePlacementDrawer();
    const container = document.getElementById('view-container');
    if (container) renderAdvertisements(container);
  } catch (err) {
    showToast(err.message, 'error');
  }
};

window.openOutletsDirectoryModal = async function() {
  const modalContainer = document.getElementById('modal-container');
  if (!modalContainer) return;

  modalContainer.innerHTML = `
    <div class="modal active" id="outlets-directory-modal">
      <div class="modal-backdrop" onclick="window.closeModal('outlets-directory-modal')"></div>
      <div class="modal-dialog" style="max-width: 720px; max-height: 85vh;">
        <div class="modal-header">
          <div>
            <div class="modal-title">Ethiopost Media Outlets & Station Directory</div>
            <div class="modal-subtitle">Registered television stations, radio networks, billboards, transit and digital publishers</div>
          </div>
          <button class="modal-close" onclick="window.closeModal('outlets-directory-modal')">&times;</button>
        </div>
        <div class="modal-body" style="padding: 18px 24px; max-height: calc(85vh - 140px); overflow-y: auto;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
            <input type="text" id="dir-search-input" class="form-input" placeholder="Search station, vendor, or contact..." style="max-width: 280px;" oninput="window.filterDirectoryRows(this.value)">
            <button class="btn btn-primary btn-sm" onclick="window.closeModal('outlets-directory-modal'); window.openAddOutletModal();">
              + Add New Media Outlet
            </button>
          </div>
          <div id="directory-table-wrap">
            <div style="text-align: center; padding: 20px; color: var(--ep-muted);">Loading Media Directory...</div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" onclick="window.closeModal('outlets-directory-modal')">Close</button>
        </div>
      </div>
    </div>
  `;

  try {
    const outlets = await api('/api/media-outlets');
    window._cachedDirectoryOutlets = outlets;
    window.renderDirectoryTable(outlets);
  } catch (err) {
    document.getElementById('directory-table-wrap').innerHTML = `<div class="empty-state" style="color: #DC2626;">Error loading directory: ${err.message}</div>`;
  }
};

window.renderDirectoryTable = function(outlets) {
  const wrap = document.getElementById('directory-table-wrap');
  if (!wrap) return;

  if (outlets.length === 0) {
    wrap.innerHTML = `<div class="empty-state">No media outlets found.</div>`;
    return;
  }

  wrap.innerHTML = `
    <table class="data-table" style="font-size: 12px;">
      <thead>
        <tr>
          <th>Outlet / Station</th>
          <th>Type</th>
          <th>Coverage</th>
          <th>Contact & Phone</th>
          <th>Rate Summary</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${outlets.map(o => `
          <tr>
            <td>
              <div style="font-weight: 600; color: var(--ep-text);">${o.name}</div>
              <div style="font-size: 10.5px; color: var(--ep-muted);">${o.vendor_name || o.name}</div>
            </td>
            <td><span class="pill pill-draft" style="font-size: 10px;">${o.type}</span></td>
            <td>${o.coverage || 'National'}</td>
            <td>
              <div>${o.contact_person || 'Commercial Desk'}</div>
              <div style="font-size: 11px; color: var(--ep-primary); font-family: monospace;">${o.contact_phone || '—'}</div>
            </td>
            <td style="font-family: monospace; color: var(--ep-text-secondary);">${o.rate_summary || 'Standard Commercial Rate'}</td>
            <td>
              <span class="pill ${o.status === 'active' ? 'pill-active' : 'pill-draft'}" style="font-size: 10px;">
                ${o.status || 'active'}
              </span>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
};

window.filterDirectoryRows = function(query) {
  if (!window._cachedDirectoryOutlets) return;
  const q = (query || '').toLowerCase().trim();
  const filtered = window._cachedDirectoryOutlets.filter(o => 
    o.name.toLowerCase().includes(q) ||
    o.type.toLowerCase().includes(q) ||
    (o.vendor_name && o.vendor_name.toLowerCase().includes(q)) ||
    (o.contact_person && o.contact_person.toLowerCase().includes(q)) ||
    (o.contact_phone && o.contact_phone.toLowerCase().includes(q))
  );
  window.renderDirectoryTable(filtered);
};

window.closePlacementDrawer = function() {
  const backdrop = document.getElementById('placement-drawer-backdrop');
  if (backdrop) backdrop.classList.remove('active');
};

// Close drawer on backdrop click
document.addEventListener('click', (e) => {
  if (e.target && e.target.id === 'placement-drawer-backdrop') {
    window.closePlacementDrawer();
  }
});
