/**
 * Ethiopost Marketing Command Center
 * Clean Minimalist Modal Dialogs
 */

import { api, showToast, closeModal, state } from '../state.js';
import { icons } from './icons.js';

export async function initModals() {
  const container = document.getElementById('modal-container');
  if (!container) return;

  // Fetch portfolios and outlets for dropdowns
  let portfolios = [];
  let outlets = [];
  let campaigns = [];

  try {
    const [ports, outs, camps] = await Promise.all([
      api('/api/settings').then(s => s.portfolios || []),
      api('/api/advertisements').then(ads => {
        const map = new Map();
        ads.forEach(a => map.set(a.outlet_id, { id: a.outlet_id, name: a.outlet_name, type: a.media_category }));
        return Array.from(map.values());
      }),
      api('/api/campaigns')
    ]);
    portfolios = ports;
    outlets = outs;
    campaigns = camps;
  } catch (e) {
    // Fallback if initial fetch has an issue
  }

  container.innerHTML = `
    <!-- 1. New Campaign Modal -->
    <div id="campaign-modal" class="modal-backdrop">
      <div class="modal-dialog">
        <div class="modal-header">
          <div class="modal-title">Create Marketing Campaign</div>
          <button class="modal-close" onclick="closeModal('campaign-modal')">${icons.close}</button>
        </div>
        <form id="campaign-form">
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">Campaign Title *</label>
              <input type="text" id="cmp-title" class="form-input" placeholder="e.g. Post Gebeya Regional Harvest Expansion" required>
            </div>
            <div class="form-grid-2">
              <div class="form-group">
                <label class="form-label">Service Portfolio *</label>
                <select id="cmp-portfolio" class="form-select" required>
                  ${portfolios.map(p => `<option value="${p.id}">${p.name}</option>`).join('')}
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Campaign Owner</label>
                <input type="text" id="cmp-owner" class="form-input" value="${state.currentUser ? state.currentUser.name : 'Kirubel Misrak'}" required>
              </div>
            </div>
            <div class="form-grid-2">
              <div class="form-group">
                <label class="form-label">Flight Start Date *</label>
                <input type="date" id="cmp-start" class="form-input" value="2026-11-01" required>
              </div>
              <div class="form-group">
                <label class="form-label">Flight End Date *</label>
                <input type="date" id="cmp-end" class="form-input" value="2026-12-31" required>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Planned Budget (ETB) *</label>
              <input type="number" id="cmp-budget" class="form-input" placeholder="e.g. 1500000" min="0" required>
            </div>
            <div class="form-group">
              <label class="form-label">Strategic Objective</label>
              <textarea id="cmp-objective" class="form-textarea" placeholder="Key goals, subscriber acquisition target, or reach milestones..."></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" onclick="closeModal('campaign-modal')">Cancel</button>
            <button type="submit" class="btn btn-primary">Create Campaign</button>
          </div>
        </form>
      </div>
    </div>

    <!-- 2. Book Media Placement Modal -->
    <div id="placement-modal" class="modal-backdrop">
      <div class="modal-dialog">
        <div class="modal-header">
          <div class="modal-title">Book Media Placement</div>
          <button class="modal-close" onclick="closeModal('placement-modal')">${icons.close}</button>
        </div>
        <form id="placement-form">
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">Linked Campaign *</label>
              <select id="plc-campaign" class="form-select" required>
                ${campaigns.map(c => `<option value="${c.id}">${c.id} • ${c.title}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Advertisement Creative Title *</label>
              <input type="text" id="plc-name" class="form-input" placeholder="e.g. EMS 4-Day Diaspora Courier 30s Spot" required>
            </div>
            <div class="form-grid-2">
              <div class="form-group">
                <label class="form-label">Media Outlet / Network *</label>
                <select id="plc-outlet" class="form-select" required>
                  <option value="OUT-EBC">EBC (Television)</option>
                  <option value="OUT-EBS">EBS TV (Television)</option>
                  <option value="OUT-FANA-FM">Fana FM 98.1 (Radio)</option>
                  <option value="OUT-SHEGER-FM">Sheger FM 102.1 (Radio)</option>
                  <option value="OUT-MESKEL-SCREEN">Meskel Square LED (Digital Screen)</option>
                  <option value="OUT-BOLE-UNIPOLE">Bole Airport Unipole (Billboard)</option>
                  <option value="OUT-ANBESSA-BUS">Anbessa Bus Fleet (Transit)</option>
                  <option value="OUT-LRT-TRAIN">Addis LRT Train Wrap (Transit)</option>
                  <option value="OUT-SOCIAL-TG">Telegram & Digital (Social)</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Placement Type</label>
                <input type="text" id="plc-type" class="form-input" placeholder="Prime Time Spot, Billboard, etc.">
              </div>
            </div>
            <div class="form-grid-2">
              <div class="form-group">
                <label class="form-label">Flight Start Date *</label>
                <input type="date" id="plc-start" class="form-input" value="2026-11-01" required>
              </div>
              <div class="form-group">
                <label class="form-label">Flight End Date *</label>
                <input type="date" id="plc-end" class="form-input" value="2026-11-30" required>
              </div>
            </div>
            <div class="form-grid-2">
              <div class="form-group">
                <label class="form-label">Total Spots / Displays</label>
                <input type="number" id="plc-spots" class="form-input" value="30" min="1">
              </div>
              <div class="form-group">
                <label class="form-label">Unit Cost (ETB)</label>
                <input type="number" id="plc-unit-cost" class="form-input" value="5000" min="0">
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Contract or PO Reference</label>
              <input type="text" id="plc-contract" class="form-input" placeholder="e.g. ETH-PO-2026-088">
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" onclick="closeModal('placement-modal')">Cancel</button>
            <button type="submit" class="btn btn-primary">Book Placement</button>
          </div>
        </form>
      </div>
    </div>

    <!-- 3. Verify Ad Delivery Modal -->
    <div id="verify-modal" class="modal-backdrop">
      <div class="modal-dialog">
        <div class="modal-header">
          <div class="modal-title">Verify Ad Delivery & Proof</div>
          <button class="modal-close" onclick="closeModal('verify-modal')">${icons.close}</button>
        </div>
        <form id="verify-form">
          <input type="hidden" id="vf-placement-id">
          <div class="modal-body">
            <div id="verify-ad-meta" style="margin-bottom: 14px; font-weight: 600; font-size: 13.5px; color: var(--ep-primary);"></div>
            <div class="form-group">
              <label class="form-label">Verification Source & Evidence</label>
              <textarea id="vf-notes" class="form-textarea" placeholder="Confirm station broadcast transmission certificate, photo proof of billboard, or analytics screenshot verified..." required></textarea>
            </div>
            <div class="form-group">
              <label class="form-label">Verified By</label>
              <input type="text" id="vf-user" class="form-input" value="${state.currentUser ? state.currentUser.name : 'Kirubel Misrak'}" required>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" onclick="closeModal('verify-modal')">Cancel</button>
            <button type="submit" class="btn btn-primary">Confirm Verification</button>
          </div>
        </form>
      </div>
    </div>
  `;

  // Bind Form Submissions
  const campForm = document.getElementById('campaign-form');
  if (campForm) {
    campForm.onsubmit = async (e) => {
      e.preventDefault();
      try {
        const payload = {
          title: document.getElementById('cmp-title').value.trim(),
          portfolio_id: document.getElementById('cmp-portfolio').value,
          owner: document.getElementById('cmp-owner').value.trim(),
          start_date: document.getElementById('cmp-start').value,
          end_date: document.getElementById('cmp-end').value,
          budget: Number(document.getElementById('cmp-budget').value) || 0,
          strategic_objective: document.getElementById('cmp-objective').value.trim()
        };
        const res = await api('/api/campaigns', { method: 'POST', body: JSON.stringify(payload) });
        showToast('Campaign created successfully', 'success');
        closeModal('campaign-modal');
        campForm.reset();
        window.router.navigate(`/campaigns/${res.id}`);
      } catch (err) {
        // Handled by api helper
      }
    };
  }

  const plcForm = document.getElementById('placement-form');
  if (plcForm) {
    plcForm.onsubmit = async (e) => {
      e.preventDefault();
      try {
        const spots = Number(document.getElementById('plc-spots').value) || 1;
        const unitCost = Number(document.getElementById('plc-unit-cost').value) || 0;
        const payload = {
          campaign_id: document.getElementById('plc-campaign').value,
          ad_name: document.getElementById('plc-name').value.trim(),
          outlet_id: document.getElementById('plc-outlet').value,
          placement_type: document.getElementById('plc-type').value.trim() || 'Standard Flight',
          start_date: document.getElementById('plc-start').value,
          end_date: document.getElementById('plc-end').value,
          total_spots: spots,
          unit_cost: unitCost,
          total_cost: spots * unitCost,
          contract_ref: document.getElementById('plc-contract').value.trim()
        };
        await api('/api/advertisements', { method: 'POST', body: JSON.stringify(payload) });
        showToast('Media placement booked successfully', 'success');
        closeModal('placement-modal');
        plcForm.reset();
        window.router.handleRoute();
      } catch (err) {
        // Handled
      }
    };
  }

  const vfForm = document.getElementById('verify-form');
  if (vfForm) {
    vfForm.onsubmit = async (e) => {
      e.preventDefault();
      const id = document.getElementById('vf-placement-id').value;
      const notes = document.getElementById('vf-notes').value.trim();
      const verified_by = document.getElementById('vf-user').value.trim();
      try {
        await api(`/api/advertisements/${id}/verify`, {
          method: 'POST',
          body: JSON.stringify({ notes, verified_by })
        });
        showToast('Ad delivery verified and logged', 'success');
        closeModal('verify-modal');
        vfForm.reset();
        window.router.handleRoute();
      } catch (err) {
        // Handled
      }
    };
  }
}

// Global modal helpers
window.closeModal = closeModal;
window.openModal = function(id) {
  const el = document.getElementById(id);
  if (el) {
    if (id === 'campaign-modal') {
      const ownerInput = document.getElementById('cmp-owner');
      if (ownerInput && state.currentUser) ownerInput.value = state.currentUser.name;
    }
    el.classList.add('active');
  }
};

window.openVerifyModal = function(id, adName, outletName) {
  const input = document.getElementById('vf-placement-id');
  if (input) input.value = id;
  const userInput = document.getElementById('vf-user');
  if (userInput && state.currentUser) userInput.value = state.currentUser.name;
  const meta = document.getElementById('verify-ad-meta');
  if (meta) {
    meta.textContent = `${adName} • ${outletName} (${id})`;
  }
  window.openModal('verify-modal');
};

// Close modals on backdrop click
document.addEventListener('click', (e) => {
  if (e.target && e.target.classList && e.target.classList.contains('modal-backdrop')) {
    e.target.classList.remove('active');
  }
});

// Close modals on Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-backdrop.active').forEach(m => m.classList.remove('active'));
  }
});
