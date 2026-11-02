/**
 * Ethiopost Marketing Command Center
 * Client Application Shell, Authentication Lifecycle & Router
 */

import { state, api, updateUserUI, setAuthSession, clearAuthSession, isLoggedIn, showToast } from './state.js';
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
    if (!isLoggedIn()) {
      window.showLoginGate();
      return;
    }

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
      if (primaryLabel) primaryLabel.textContent = '+ Provision Account';
      if (primaryBtn) primaryBtn.onclick = () => window.openProvisionUserModal();
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

// --------------------------------------------------------------------------
// GLOBAL AUTHENTICATION GATE & LOGIN CONTROLLER
// --------------------------------------------------------------------------

window.showLoginGate = function(alertMessage = null) {
  const loginGate = document.getElementById('login-gate');
  const appRoot = document.getElementById('app-root');
  const loginAlert = document.getElementById('login-alert');

  if (loginGate) loginGate.style.display = 'flex';
  if (appRoot) appRoot.style.display = 'none';

  if (loginAlert) {
    if (alertMessage) {
      loginAlert.textContent = alertMessage;
      loginAlert.style.display = 'flex';
    } else {
      loginAlert.style.display = 'none';
    }
  }

  // Pre-fill email with last known email or Super Admin default
  const emailInput = document.getElementById('login-email');
  if (emailInput && !emailInput.value) {
    emailInput.value = 'kirubel.misrak@ethiopost.et';
  }
  const passwordInput = document.getElementById('login-password');
  if (passwordInput) {
    passwordInput.value = '';
    passwordInput.focus();
  }
};

window.hideLoginGate = function() {
  const loginGate = document.getElementById('login-gate');
  const appRoot = document.getElementById('app-root');
  if (loginGate) loginGate.style.display = 'none';
  if (appRoot) appRoot.style.display = 'flex';
};

window.togglePasswordVisibility = function(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;
  if (input.type === 'password') {
    input.type = 'text';
    btn.textContent = 'Hide';
  } else {
    input.type = 'password';
    btn.textContent = 'Show';
  }
};

window.handleLoginFormSubmit = async function(e) {
  e.preventDefault();
  const email = (document.getElementById('login-email')?.value || '').trim();
  const password = document.getElementById('login-password')?.value || '';
  const submitBtn = document.getElementById('login-submit-btn');
  const loginAlert = document.getElementById('login-alert');

  if (!email || !password) {
    if (loginAlert) {
      loginAlert.textContent = 'Please provide both email address and password.';
      loginAlert.style.display = 'flex';
    }
    return;
  }

  const originalBtnHtml = submitBtn ? submitBtn.innerHTML : 'Sign In';
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span>Verifying credentials...</span>';
  }
  if (loginAlert) loginAlert.style.display = 'none';

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Authentication failed. Please verify credentials.');
    }

    // Save session
    setAuthSession(data.token, data.user);
    window.hideLoginGate();
    showToast(`Welcome back, ${data.user.name} (${data.user.role})!`, 'success');

    // Bootstrap workspace
    bootstrapWorkspace();

  } catch (err) {
    if (loginAlert) {
      loginAlert.textContent = err.message;
      loginAlert.style.display = 'flex';
    }
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnHtml;
    }
  }
};

window.logoutUser = function() {
  clearAuthSession();
  window.showLoginGate('You have been signed out successfully.');
  showToast('Signed out of Ethiopost Command Center.', 'info');
};

// --------------------------------------------------------------------------
// APPLICATION BOOTSTRAP
// --------------------------------------------------------------------------

function bootstrapWorkspace() {
  updateUserUI();

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

  // Initialize router
  if (!window.router) {
    window.router = new Router();
  }
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

  // Refresh user identity from server
  api('/api/auth/me').then(data => {
    if (data.user) {
      setAuthSession(state.authToken, data.user);
    }
  }).catch(() => {});
}

// Bootstrap Application Entry
function init() {
  if (isLoggedIn()) {
    window.hideLoginGate();
    bootstrapWorkspace();
  } else {
    window.showLoginGate();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
