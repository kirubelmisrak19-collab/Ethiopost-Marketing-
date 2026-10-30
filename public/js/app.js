/**
 * Ethiopost Marketing Command Center
 * Client Application Shell & Router
 */

import { state, api, updateUserUI, setCurrentUser } from './state.js';
import { icons } from './components/icons.js';
import { initModals } from './components/modals.js';

import { renderOverview } from './views/overview.js';
import { renderCampaigns, renderCampaignDetail } from './views/campaigns.js';
import { renderAdvertisements } from './views/advertisements.js';
import { renderCalendar } from './views/calendar.js';
import { renderActivities } from './views/activities.js';
import { renderBudget } from './views/budget.js';
import { renderReports } from './views/reports.js';
import { renderTeamAccess } from './views/teamAccess.js';
import { renderSettings } from './views/settings.js';

class Router {
  constructor() {
    this.container = document.getElementById('view-container');
    window.addEventListener('hashchange', () => this.handleRoute());
  }

  navigate(path) {
    window.location.hash = path;
  }

  async handleRoute() {
    let hash = window.location.hash.slice(1) || '/overview';
    if (!hash.startsWith('/')) hash = '/' + hash;

    // Update active nav link in sidebar
    document.querySelectorAll('.sidebar-nav .nav-link').forEach(link => {
      const route = link.dataset.route;
      if (hash.startsWith('/' + route)) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    // Update Header Breadcrumb
    const pageTitle = document.getElementById('page-title');
    const primaryBtn = document.getElementById('primary-action-btn');
    const primaryLabel = document.getElementById('primary-action-label');

    // Route matching
    const campaignDetailMatch = hash.match(/^\/campaigns\/([^\/]+)$/);

    if (campaignDetailMatch) {
      const campId = campaignDetailMatch[1];
      if (pageTitle) pageTitle.textContent = `Campaign Workspace: ${campId}`;
      if (primaryLabel) primaryLabel.textContent = '+ Book Media Placement';
      if (primaryBtn) primaryBtn.onclick = () => window.openPlacementForCampaign(campId);
      return renderCampaignDetail(this.container, campId);
    }

    if (hash === '/overview') {
      if (pageTitle) pageTitle.textContent = 'Operational Overview';
      if (primaryLabel) primaryLabel.textContent = '+ New Campaign';
      if (primaryBtn) primaryBtn.onclick = () => window.openModal('campaign-modal');
      return renderOverview(this.container);
    }

    if (hash === '/campaigns') {
      if (pageTitle) pageTitle.textContent = 'Campaign Management';
      if (primaryLabel) primaryLabel.textContent = '+ New Campaign';
      if (primaryBtn) primaryBtn.onclick = () => window.openModal('campaign-modal');
      return renderCampaigns(this.container);
    }

    if (hash === '/advertisements') {
      if (pageTitle) pageTitle.textContent = 'Central Media Placement Tracker';
      if (primaryLabel) primaryLabel.textContent = '+ Book Placement';
      if (primaryBtn) primaryBtn.onclick = () => window.openModal('placement-modal');
      return renderAdvertisements(this.container);
    }

    if (hash === '/calendar') {
      if (pageTitle) pageTitle.textContent = 'Flight Operational Calendar';
      if (primaryLabel) primaryLabel.textContent = '+ New Campaign';
      if (primaryBtn) primaryBtn.onclick = () => window.openModal('campaign-modal');
      return renderCalendar(this.container);
    }

    if (hash === '/activities') {
      if (pageTitle) pageTitle.textContent = 'Campaign Activities & Tasks';
      if (primaryLabel) primaryLabel.textContent = '+ Add Task';
      if (primaryBtn) primaryBtn.onclick = () => window.openModal('campaign-modal');
      return renderActivities(this.container);
    }

    if (hash === '/budget') {
      if (pageTitle) pageTitle.textContent = 'Marketing Budget & Ledger';
      if (primaryLabel) primaryLabel.textContent = '+ Record Expense';
      if (primaryBtn) primaryBtn.onclick = () => window.openModal('placement-modal');
      return renderBudget(this.container);
    }

    if (hash === '/reports') {
      if (pageTitle) pageTitle.textContent = 'Executive Reports & Analytics';
      if (primaryLabel) primaryLabel.textContent = '+ New Campaign';
      if (primaryBtn) primaryBtn.onclick = () => window.openModal('campaign-modal');
      return renderReports(this.container);
    }

    if (hash === '/team') {
      if (pageTitle) pageTitle.textContent = 'Team Directory & Governance';
      if (primaryLabel) primaryLabel.textContent = '+ New Campaign';
      if (primaryBtn) primaryBtn.onclick = () => window.openModal('campaign-modal');
      return renderTeamAccess(this.container);
    }

    if (hash === '/settings') {
      if (pageTitle) pageTitle.textContent = 'System Settings';
      if (primaryLabel) primaryLabel.textContent = '+ New Campaign';
      if (primaryBtn) primaryBtn.onclick = () => window.openModal('campaign-modal');
      return renderSettings(this.container);
    }

    // Default fallback
    this.navigate('/overview');
  }
}

// Bootstrap Application
async function bootstrapApp() {
  // Inject Sidebar and Header icons safely
  const iconMap = {
    'icon-overview': icons.overview,
    'icon-campaigns': icons.campaigns,
    'icon-advertisements': icons.advertisements,
    'icon-calendar': icons.calendar,
    'icon-activities': icons.activities,
    'icon-budget': icons.budget,
    'icon-reports': icons.reports,
    'icon-team': icons.team,
    'icon-settings': icons.settings,
    'icon-search': icons.search,
    'icon-plus': icons.plus
  };

  for (const [id, svg] of Object.entries(iconMap)) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = svg;
  }

  // User Profile Switcher setup
  updateUserUI();
  const userChipBtn = document.getElementById('user-chip-btn');
  const userDropdown = document.getElementById('user-switch-dropdown');

  if (userChipBtn && userDropdown) {
    userChipBtn.onclick = (e) => {
      e.stopPropagation();
      userDropdown.classList.toggle('active');
    };

    api('/api/team').then(teamData => {
      const users = teamData.users || [];
      userDropdown.innerHTML = `
        <div class="user-switch-header">Switch Team Member</div>
        ${users.map(u => `
          <div class="user-switch-item ${u.name === state.currentUser.name ? 'current' : ''}" data-uid="${u.id}">
            <div class="user-avatar" style="width: 24px; height: 24px; font-size: 10px;">${u.avatar}</div>
            <div style="display: flex; flex-direction: column; overflow: hidden;">
              <span style="font-size: 11.5px; font-weight: 600;">${u.name}</span>
              <span style="font-size: 10px; color: var(--ep-muted);">${u.role}</span>
            </div>
          </div>
        `).join('')}
      `;

      userDropdown.querySelectorAll('.user-switch-item').forEach(item => {
        item.onclick = (e) => {
          e.stopPropagation();
          const uid = item.dataset.uid;
          const selected = users.find(x => x.id === uid);
          if (selected) {
            setCurrentUser(selected);
            userDropdown.classList.remove('active');
            userDropdown.querySelectorAll('.user-switch-item').forEach(i => i.classList.remove('current'));
            item.classList.add('current');
          }
        };
      });
    }).catch(() => {});

    document.addEventListener('click', (e) => {
      if (!userChipBtn.contains(e.target) && !userDropdown.contains(e.target)) {
        userDropdown.classList.remove('active');
      }
    });
  }

  // Initialize router and trigger immediate route execution
  window.router = new Router();
  window.router.handleRoute();

  // Initialize modal dialogs concurrently in background
  initModals().catch(err => console.warn('Modal init warning:', err));

  // Month selector listener
  const monthSelect = document.getElementById('global-month-select');
  if (monthSelect) {
    monthSelect.value = state.activeMonth;
    monthSelect.onchange = (e) => {
      state.activeMonth = e.target.value;
      window.router.handleRoute();
    };
  }

  // Global search input handling
  const searchInput = document.getElementById('global-search-input');
  const searchDropdown = document.getElementById('search-dropdown');

  if (searchInput && searchDropdown) {
    let searchDebounce;
    searchInput.oninput = (e) => {
      clearTimeout(searchDebounce);
      const query = e.target.value.trim();
      if (!query) {
        searchDropdown.classList.remove('active');
        return;
      }

      searchDebounce = setTimeout(async () => {
        try {
          const res = await api(`/api/search?q=${encodeURIComponent(query)}`);
          if ((!res.campaigns || res.campaigns.length === 0) && (!res.placements || res.placements.length === 0)) {
            searchDropdown.innerHTML = `<div style="padding: 10px; font-size: 12px; color: var(--ep-muted); text-align: center;">No matches found</div>`;
          } else {
            let html = '';
            if (res.campaigns && res.campaigns.length > 0) {
              html += `<div style="font-size: 10.5px; font-weight: 700; color: var(--ep-muted); text-transform: uppercase; padding: 4px 8px;">Campaigns</div>`;
              html += res.campaigns.map(c => `
                <div class="search-item" onclick="window.router.navigate('/campaigns/${c.id}'); document.getElementById('search-dropdown').classList.remove('active'); document.getElementById('global-search-input').value='';">
                  <div class="search-item-title">${c.title}</div>
                  <div class="search-item-meta">${c.id} • ${c.execution_status}</div>
                </div>
              `).join('');
            }
            if (res.placements && res.placements.length > 0) {
              html += `<div style="font-size: 10.5px; font-weight: 700; color: var(--ep-muted); text-transform: uppercase; padding: 4px 8px; margin-top: 4px;">Placements</div>`;
              html += res.placements.map(p => `
                <div class="search-item" onclick="window.router.navigate('/advertisements'); document.getElementById('search-dropdown').classList.remove('active'); document.getElementById('global-search-input').value='';">
                  <div class="search-item-title">${p.ad_name}</div>
                  <div class="search-item-meta">${p.id} • ${p.placement_type}</div>
                </div>
              `).join('');
            }
            searchDropdown.innerHTML = html;
          }
          searchDropdown.classList.add('active');
        } catch (err) {}
      }, 200);
    };

    // Close search dropdown on click outside
    document.addEventListener('click', (e) => {
      if (!searchInput.contains(e.target) && !searchDropdown.contains(e.target)) {
        searchDropdown.classList.remove('active');
      }
    });

    // Keyboard shortcut (Ctrl+K or Cmd+K)
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInput.focus();
      }
    });
  }
}

// Ensure execution regardless of document state
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrapApp);
} else {
  bootstrapApp();
}
