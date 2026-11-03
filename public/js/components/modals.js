/**
 * Ethiopost Marketing Command Center
 * Comprehensive Enterprise Modal Engine
 * Supports Multi-Station Booking, Dynamic Media Outlet Management,
 * Activity Deliverables, and Expense Accounting
 */

import { api, showToast, closeModal, state, formatETB } from '../state.js';
import { icons } from './icons.js';

let cachedPortfolios = [];
let cachedOutlets = [];
let cachedCampaigns = [];
let selectedOutletIds = new Set();
let activeOutletFilter = 'all';

export async function refreshModalData() {
  try {
    const [ports, outs, camps] = await Promise.all([
      api('/api/settings').then(s => s.portfolios || []).catch(() => []),
      api('/api/media-outlets').catch(() => []),
      api('/api/campaigns').catch(() => [])
    ]);
    cachedPortfolios = ports;
    cachedOutlets = outs;
    cachedCampaigns = camps;
    renderOutletPicker();
    updateCampaignDropdowns();
  } catch (e) {
    console.warn('Error refreshing modal data:', e);
  }
}

export async function initModals() {
  const container = document.getElementById('modal-container');
  if (!container) return;

  // Initial fetch
  try {
    const [ports, outs, camps] = await Promise.all([
      api('/api/settings').then(s => s.portfolios || []).catch(() => []),
      api('/api/media-outlets').catch(() => []),
      api('/api/campaigns').catch(() => [])
    ]);
    cachedPortfolios = ports;
    cachedOutlets = outs;
    cachedCampaigns = camps;
  } catch (e) {}

  container.innerHTML = `
    <!-- 1. Create Marketing Campaign Modal -->
    <div id="campaign-modal" class="modal-backdrop">
      <div class="modal-dialog" style="max-width: 580px;">
        <div class="modal-header">
          <div>
            <div class="modal-title">Create Marketing Campaign</div>
            <div class="modal-subtitle">Launch a strategic campaign across Ethiopost service portfolios</div>
          </div>
          <button class="modal-close" onclick="closeModal('campaign-modal')">${icons.close}</button>
        </div>
        <form id="campaign-form">
          <div class="modal-body" style="display: flex; flex-direction: column; gap: 14px;">
            <div class="form-group">
              <label class="form-label">Campaign Title *</label>
              <input type="text" id="cmp-title" class="form-input" placeholder="e.g. Post Gebeya Regional Harvest Expansion" required>
            </div>

            <div class="form-grid-2">
              <div class="form-group">
                <label class="form-label">Service Portfolio *</label>
                <select id="cmp-portfolio" class="form-select" required>
                  ${cachedPortfolios.map(p => `<option value="${p.id}">${p.name} (${p.code})</option>`).join('')}
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
                <input type="date" id="cmp-start" class="form-input" value="${new Date().toISOString().split('T')[0]}" required>
              </div>
              <div class="form-group">
                <label class="form-label">Flight End Date *</label>
                <input type="date" id="cmp-end" class="form-input" value="2026-12-31" required>
              </div>
            </div>

            <div class="form-grid-2">
              <div class="form-group">
                <label class="form-label">Planned Budget (ETB) <span style="font-weight: normal; color: var(--ep-muted);">(Optional)</span></label>
                <input type="number" id="cmp-budget" class="form-input" placeholder="e.g. 1000000 (Optional - leave blank if not set)" min="0">
              </div>
              <div class="form-group">
                <label class="form-label">Execution Priority</label>
                <select id="cmp-priority" class="form-select">
                  <option value="High" selected>High Priority</option>
                  <option value="Medium">Medium Priority</option>
                  <option value="Low">Low Priority</option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Strategic Objective & KPIs</label>
              <textarea id="cmp-objective" class="form-textarea" placeholder="Key goals, subscriber acquisition target, or broadcast reach milestones..."></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" onclick="closeModal('campaign-modal')">Cancel</button>
            <button type="submit" id="cmp-submit-btn" class="btn btn-primary">Launch Campaign</button>
          </div>
        </form>
      </div>
    </div>

    <!-- 2. Multi-Station Book Media Placement Modal -->
    <div id="placement-modal" class="modal-backdrop">
      <div class="modal-dialog" style="max-width: 680px; max-height: 90vh;">
        <div class="modal-header">
          <div>
            <div class="modal-title">Book Media Placement Flight</div>
            <div class="modal-subtitle">Schedule broadcast ad spots or outdoor displays across single or multiple media stations</div>
          </div>
          <button class="modal-close" onclick="closeModal('placement-modal')">${icons.close}</button>
        </div>
        <form id="placement-form">
          <div class="modal-body" style="display: flex; flex-direction: column; gap: 14px; overflow-y: auto; max-height: calc(90vh - 140px);">
            <div class="form-group">
              <label class="form-label">Linked Campaign *</label>
              <select id="plc-campaign" class="form-select" required>
                ${cachedCampaigns.map(c => `<option value="${c.id}">${c.id} • ${c.title}</option>`).join('')}
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Advertisement Creative Title *</label>
              <input type="text" id="plc-name" class="form-input" placeholder="e.g. Virtual P.O. Box Nationwide TV & Radio 30s Prime Flight" required>
            </div>

            <!-- Media Stations Multi-Selection Picker -->
            <div class="form-group">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                <label class="form-label" style="margin-bottom: 0;">
                  Media Outlets & Stations *
                  <span id="plc-selected-count" class="pill pill-active" style="margin-left: 6px; font-size: 11px;">0 selected</span>
                </label>
                <button type="button" class="btn btn-secondary btn-sm" onclick="window.openAddOutletModal()" style="font-size: 11px; padding: 2px 8px;">
                  + Add New Media Outlet
                </button>
              </div>

              <!-- Outlet Category Filter Tabs -->
              <div class="outlet-filter-tabs" style="display: flex; gap: 6px; overflow-x: auto; padding-bottom: 6px; margin-bottom: 8px;">
                <button type="button" class="chip-btn active" data-ocat="all" onclick="window.filterModalOutlets('all')">All Outlets</button>
                <button type="button" class="chip-btn" data-ocat="Television" onclick="window.filterModalOutlets('Television')">📺 Television</button>
                <button type="button" class="chip-btn" data-ocat="Radio" onclick="window.filterModalOutlets('Radio')">📻 Radio</button>
                <button type="button" class="chip-btn" data-ocat="Digital Screen" onclick="window.filterModalOutlets('Digital Screen')">🏙️ Digital Screens</button>
                <button type="button" class="chip-btn" data-ocat="Billboard" onclick="window.filterModalOutlets('Billboard')">🪧 Billboards</button>
                <button type="button" class="chip-btn" data-ocat="Transit" onclick="window.filterModalOutlets('Transit')">🚌 Transit</button>
                <button type="button" class="chip-btn" data-ocat="Social" onclick="window.filterModalOutlets('Social')">📱 Digital & Social</button>
              </div>

              <!-- Multi-Station Selection Box -->
              <div id="outlet-picker-grid" class="outlet-picker-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; max-height: 180px; overflow-y: auto; padding: 8px; border: 1px solid var(--ep-border); border-radius: var(--radius-md); background: #FAFBFD;">
                <!-- Injected via renderOutletPicker() -->
              </div>

              <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 6px; font-size: 11.5px; color: var(--ep-muted);">
                <span>Tip: Select multiple TV stations or radio channels to book a nationwide flight in one step.</span>
                <div style="display: flex; gap: 8px;">
                  <button type="button" style="background: none; border: none; color: var(--ep-primary); cursor: pointer; text-decoration: underline;" onclick="window.selectAllVisibleOutlets()">Select All</button>
                  <button type="button" style="background: none; border: none; color: var(--ep-muted); cursor: pointer;" onclick="window.clearSelectedOutlets()">Clear</button>
                </div>
              </div>
            </div>

            <div class="form-grid-2">
              <div class="form-group">
                <label class="form-label">Placement / Slot Type</label>
                <input type="text" id="plc-type" class="form-input" placeholder="e.g. Prime 8PM News, Drive Time, 15s Loop">
              </div>
              <div class="form-group">
                <label class="form-label">Contract / Purchase Order Ref</label>
                <input type="text" id="plc-contract" class="form-input" placeholder="e.g. ETH-PO-2026-088">
              </div>
            </div>

            <div class="form-grid-2">
              <div class="form-group">
                <label class="form-label">Flight Start Date *</label>
                <input type="date" id="plc-start" class="form-input" value="${new Date().toISOString().split('T')[0]}" required>
              </div>
              <div class="form-group">
                <label class="form-label">Flight End Date *</label>
                <input type="date" id="plc-end" class="form-input" value="2026-11-30" required>
              </div>
            </div>

            <!-- Lump-Sum Contract Package Value (100% Optional - Real-World Broadcast Model) -->
            <div style="background: #F8FAFC; border: 1px solid var(--ep-border); border-radius: var(--radius-sm); padding: 12px 14px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                <label class="form-label" style="margin-bottom: 0; font-weight: 700; color: var(--ep-primary);">
                  Total Contract Package Value (ETB) <span style="font-weight: normal; color: var(--ep-muted); font-size: 11.5px;">(Optional)</span>
                </label>
                <span class="pill pill-gold" style="font-size: 10px;">Lump-Sum Flight Agreement</span>
              </div>
              <input type="number" id="plc-total-cost" class="form-input" placeholder="e.g. 1000000 (e.g. 1-Month Placement on EBS - Optional)" min="0" oninput="window.calculatePlacementTotalCost()">
              <div style="font-size: 11.5px; color: var(--ep-muted); margin-top: 5px;">
                Enter the direct lump-sum contract amount (e.g. <strong>1,000,000 ETB</strong>). Leave blank if budget is optional or untracked.
              </div>
            </div>

            <div class="form-grid-2">
              <div class="form-group">
                <label class="form-label">Estimated Spots / Airings <span style="font-weight: normal; color: var(--ep-muted);">(Optional)</span></label>
                <input type="number" id="plc-spots" class="form-input" placeholder="e.g. 30 (Optional)" min="0" oninput="window.calculatePlacementTotalCost()">
              </div>
              <div class="form-group">
                <label class="form-label">Unit Spot Cost (ETB) <span style="font-weight: normal; color: var(--ep-muted);">(Optional)</span></label>
                <input type="number" id="plc-unit-cost" class="form-input" placeholder="e.g. 7500 (Optional)" min="0" oninput="window.calculatePlacementTotalCost()">
              </div>
            </div>

            <!-- Real-time Investment Calculation Banner -->
            <div id="plc-cost-banner" style="background: linear-gradient(90deg, #EEF2FF 0%, #FAF5FF 100%); border: 1px solid #C7D2FE; border-radius: var(--radius-sm); padding: 10px 14px; display: flex; justify-content: space-between; align-items: center;">
              <div>
                <div style="font-size: 11px; font-weight: 700; color: var(--ep-muted); text-transform: uppercase;">Flight Contract Summary</div>
                <div id="plc-calc-details" style="font-size: 11.5px; color: var(--ep-text-secondary);">Select media station(s) above • Budget is completely optional</div>
              </div>
              <div id="plc-calc-total" style="font-size: 15px; font-weight: 800; color: var(--ep-primary);">ETB 0 (Optional)</div>
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" onclick="closeModal('placement-modal')">Cancel</button>
            <button type="submit" id="plc-submit-btn" class="btn btn-primary">Book Placement Flights</button>
          </div>
        </form>
      </div>
    </div>

    <!-- 3. Add New Media Outlet Modal -->
    <div id="add-outlet-modal" class="modal-backdrop">
      <div class="modal-dialog" style="max-width: 500px;">
        <div class="modal-header">
          <div>
            <div class="modal-title">Register New Media Outlet</div>
            <div class="modal-subtitle">Add a TV station, radio network, billboard, or digital publisher to Ethiopost directory</div>
          </div>
          <button class="modal-close" onclick="closeModal('add-outlet-modal')">&times;</button>
        </div>
        <form id="add-outlet-form" onsubmit="window.handleCreateOutletSubmit(event)">
          <div class="modal-body" style="display: flex; flex-direction: column; gap: 12px;">
            <div class="form-group">
              <label class="form-label">Station / Publisher Name *</label>
              <input type="text" id="new-out-name" class="form-input" placeholder="e.g. Arts TV, Kana TV, Bisrat FM, Bole Mega LED" required>
            </div>

            <div class="form-grid-2">
              <div class="form-group">
                <label class="form-label">Media Category *</label>
                <select id="new-out-type" class="form-select" required>
                  <option value="Television" selected>Television</option>
                  <option value="Radio">Radio</option>
                  <option value="Digital Screen">Digital Screen / LED</option>
                  <option value="Billboard">Outdoor Billboard</option>
                  <option value="Transit">Transit (Bus, Light Rail)</option>
                  <option value="Social">Digital & Social Media</option>
                  <option value="Print">Print & Press</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">Geographic Coverage</label>
                <select id="new-out-cov" class="form-select">
                  <option value="National" selected>National</option>
                  <option value="Addis Ababa Metro">Addis Ababa Metro</option>
                  <option value="Regional (Oromia, Amhara, etc.)">Regional</option>
                  <option value="Diaspora & Global">Diaspora & Global</option>
                </select>
              </div>
            </div>

            <div class="form-grid-2">
              <div class="form-group">
                <label class="form-label">Vendor / Enterprise Name</label>
                <input type="text" id="new-out-vendor" class="form-input" placeholder="e.g. Arts Media Enterprise">
              </div>
              <div class="form-group">
                <label class="form-label">Contact Person</label>
                <input type="text" id="new-out-contact" class="form-input" placeholder="Commercial Manager">
              </div>
            </div>

            <div class="form-grid-2">
              <div class="form-group">
                <label class="form-label">Contact Phone</label>
                <input type="text" id="new-out-phone" class="form-input" placeholder="+251 11 ... / +251 91 ...">
              </div>
              <div class="form-group">
                <label class="form-label">Rate Card Summary</label>
                <input type="text" id="new-out-rate" class="form-input" placeholder="e.g. ETB 8,500/prime spot">
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" onclick="closeModal('add-outlet-modal')">Cancel</button>
            <button type="submit" id="new-out-submit-btn" class="btn btn-primary">Save to Directory</button>
          </div>
        </form>
      </div>
    </div>

    <!-- 4. Record Expense Voucher Modal -->
    <div id="expense-modal" class="modal-backdrop">
      <div class="modal-dialog" style="max-width: 520px;">
        <div class="modal-header">
          <div>
            <div class="modal-title">Record Expense Voucher</div>
            <div class="modal-subtitle">Log marketing expenditure, invoice voucher, or vendor disbursement</div>
          </div>
          <button class="modal-close" onclick="closeModal('expense-modal')">&times;</button>
        </div>
        <form id="expense-form" onsubmit="window.handleRecordExpenseSubmit(event)">
          <div class="modal-body" style="display: flex; flex-direction: column; gap: 12px;">
            <div class="form-group">
              <label class="form-label">Linked Campaign *</label>
              <select id="exp-campaign" class="form-select">
                <option value="">General Corporate / Non-campaign</option>
                ${cachedCampaigns.map(c => `<option value="${c.id}">${c.id} • ${c.title}</option>`).join('')}
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Expense Description *</label>
              <input type="text" id="exp-title" class="form-input" placeholder="e.g. EBC Prime Time Broadcast Invoice #048" required>
            </div>

            <div class="form-grid-2">
              <div class="form-group">
                <label class="form-label">Amount (ETB) *</label>
                <input type="number" id="exp-amount" class="form-input" placeholder="e.g. 225000" min="0" required>
              </div>

              <div class="form-group">
                <label class="form-label">Disbursement Stage *</label>
                <select id="exp-stage" class="form-select" required>
                  <option value="Paid" selected>Paid Out</option>
                  <option value="Invoiced">Invoiced Pending Payment</option>
                  <option value="Committed">Committed Contract</option>
                  <option value="Approved">Approved Allocation</option>
                </select>
              </div>
            </div>

            <div class="form-grid-2">
              <div class="form-group">
                <label class="form-label">Vendor / Station</label>
                <input type="text" id="exp-vendor" class="form-input" placeholder="e.g. Ethiopian Broadcasting Corp">
              </div>

              <div class="form-group">
                <label class="form-label">Invoice / Receipt Ref</label>
                <input type="text" id="exp-invoice" class="form-input" placeholder="e.g. INV-2026-9921">
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" onclick="closeModal('expense-modal')">Cancel</button>
            <button type="submit" id="exp-submit-btn" class="btn btn-primary">Record Expense</button>
          </div>
        </form>
      </div>
    </div>

    <!-- 5. Add Campaign Activity / Task Modal -->
    <div id="activity-modal" class="modal-backdrop">
      <div class="modal-dialog" style="max-width: 520px;">
        <div class="modal-header">
          <div>
            <div class="modal-title">Create Campaign Deliverable / Task</div>
            <div class="modal-subtitle">Assign operational tasks, creative production, and milestones</div>
          </div>
          <button class="modal-close" onclick="closeModal('activity-modal')">&times;</button>
        </div>
        <form id="activity-form" onsubmit="window.handleCreateActivitySubmit(event)">
          <div class="modal-body" style="display: flex; flex-direction: column; gap: 12px;">
            <div class="form-group">
              <label class="form-label">Linked Campaign *</label>
              <select id="act-campaign" class="form-select" required>
                ${cachedCampaigns.map(c => `<option value="${c.id}">${c.id} • ${c.title}</option>`).join('')}
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Deliverable Title *</label>
              <input type="text" id="act-title" class="form-input" placeholder="e.g. Produce Amharic & Oromo 30s Audio Commercial" required>
            </div>

            <div class="form-grid-2">
              <div class="form-group">
                <label class="form-label">Activity Type</label>
                <select id="act-type" class="form-select">
                  <option value="Creative Production" selected>Creative Production</option>
                  <option value="Media Booking">Media Booking</option>
                  <option value="Field Activation">Field Activation</option>
                  <option value="Compliance & Audit">Compliance & Audit</option>
                  <option value="Executive Review">Executive Review</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">Assigned Owner</label>
                <input type="text" id="act-owner" class="form-input" value="${state.currentUser ? state.currentUser.name : 'Kirubel Misrak'}">
              </div>
            </div>

            <div class="form-grid-2">
              <div class="form-group">
                <label class="form-label">Due Date *</label>
                <input type="date" id="act-due" class="form-input" value="${new Date().toISOString().split('T')[0]}" required>
              </div>

              <div class="form-group">
                <label class="form-label">Allocated Budget (ETB)</label>
                <input type="number" id="act-budget" class="form-input" placeholder="0" min="0">
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" onclick="closeModal('activity-modal')">Cancel</button>
            <button type="submit" id="act-submit-btn" class="btn btn-primary">Create Deliverable</button>
          </div>
        </form>
      </div>
    </div>

    <!-- 6. Verify Ad Delivery Modal -->
    <div id="verify-modal" class="modal-backdrop">
      <div class="modal-dialog" style="max-width: 540px;">
        <div class="modal-header">
          <div>
            <div class="modal-title">Verify Ad Delivery & Proof of Performance</div>
            <div class="modal-subtitle">Official broadcast compliance certificate & transmission log audit</div>
          </div>
          <button class="modal-close" onclick="closeModal('verify-modal')">${icons.close}</button>
        </div>
        <form id="verify-form">
          <input type="hidden" id="vf-placement-id">
          <div class="modal-body" style="display: flex; flex-direction: column; gap: 14px;">
            <div id="verify-ad-meta" style="background: #F8FAFC; border: 1px solid var(--ep-border); border-radius: var(--radius-sm); padding: 12px 14px;"></div>
            
            <div class="form-grid-2">
              <div class="form-group">
                <label class="form-label">Verification Decision *</label>
                <select id="vf-status" class="form-select" required>
                  <option value="Verified" selected>✓ Verified as Delivered (Airtime / Proof Confirmed)</option>
                  <option value="Under Review">⏳ Under Review (Pending Broadcast Certificate)</option>
                  <option value="Flagged">⚠️ Flagged / Disputed (Under-delivered or Mismatched)</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Delivered Spots / Runs</label>
                <input type="number" id="vf-delivered-spots" class="form-input" placeholder="e.g. 30 (Optional)" min="0">
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Proof of Performance / Certificate Reference *</label>
              <textarea id="vf-notes" class="form-textarea" placeholder="e.g. EBS Broadcast Transmission Log #TR-9921, Airtime Certificate, or As-Run Log verified on Nov 3..." required></textarea>
            </div>

            <div class="form-group">
              <label class="form-label">Verified By (Super Administrator / Officer) *</label>
              <input type="text" id="vf-user" class="form-input" value="${state.currentUser ? state.currentUser.name : 'Kirubel Misrak'}" required>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" onclick="closeModal('verify-modal')">Cancel</button>
            <button type="submit" id="vf-submit-btn" class="btn btn-primary">Confirm & Log Verification</button>
          </div>
        </form>
      </div>
    </div>
  `;

  // Initial render of stations picker
  renderOutletPicker();

  // Bind Form Submissions
  bindFormSubmissions();
}

function updateCampaignDropdowns() {
  const selects = ['plc-campaign', 'exp-campaign', 'act-campaign'];
  selects.forEach(selId => {
    const el = document.getElementById(selId);
    if (!el) return;
    const currentVal = el.value;
    el.innerHTML = cachedCampaigns.length === 0
      ? '<option value="">No campaigns available</option>'
      : cachedCampaigns.map(c => `<option value="${c.id}">${c.id} • ${c.title}</option>`).join('');
    if (currentVal) el.value = currentVal;
  });
}

export function renderOutletPicker() {
  const grid = document.getElementById('outlet-picker-grid');
  if (!grid) return;

  const filtered = activeOutletFilter === 'all'
    ? cachedOutlets
    : cachedOutlets.filter(o => o.type === activeOutletFilter);

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; padding: 14px; text-align: center; color: var(--ep-muted); font-size: 12px;">
        No stations found in this category. Click "+ Add New Media Outlet" to register one.
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered.map(o => {
    const isChecked = selectedOutletIds.has(o.id);
    return `
      <label class="outlet-checkbox-card ${isChecked ? 'selected' : ''}" style="display: flex; align-items: flex-start; gap: 8px; padding: 8px 10px; border-radius: 6px; border: 1px solid ${isChecked ? 'var(--ep-primary)' : 'var(--ep-border)'}; background: ${isChecked ? '#EEF2FF' : '#FFFFFF'}; cursor: pointer; transition: all 0.15s ease;">
        <input type="checkbox" value="${o.id}" ${isChecked ? 'checked' : ''} onchange="window.toggleOutletSelection('${o.id}', this.checked)" style="margin-top: 2px;">
        <div style="flex: 1; min-width: 0;">
          <div style="font-size: 12px; font-weight: 600; color: var(--ep-text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${o.name}</div>
          <div style="display: flex; align-items: center; gap: 6px; margin-top: 2px;">
            <span class="pill pill-draft" style="font-size: 9.5px; padding: 1px 5px;">${o.type}</span>
            <span style="font-size: 10px; color: var(--ep-muted);">${o.coverage || 'National'}</span>
          </div>
          ${o.rate_summary ? `<div style="font-size: 10px; color: var(--ep-text-secondary); margin-top: 2px; font-family: monospace;">${o.rate_summary}</div>` : ''}
        </div>
      </label>
    `;
  }).join('');

  updateSelectedCount();
  window.calculatePlacementTotalCost();
}

window.toggleOutletSelection = function(outletId, isChecked) {
  if (isChecked) {
    selectedOutletIds.add(outletId);
  } else {
    selectedOutletIds.delete(outletId);
  }
  renderOutletPicker();
};

window.selectAllVisibleOutlets = function() {
  const filtered = activeOutletFilter === 'all'
    ? cachedOutlets
    : cachedOutlets.filter(o => o.type === activeOutletFilter);
  filtered.forEach(o => selectedOutletIds.add(o.id));
  renderOutletPicker();
};

window.clearSelectedOutlets = function() {
  selectedOutletIds.clear();
  renderOutletPicker();
};

window.filterModalOutlets = function(cat) {
  activeOutletFilter = cat;
  document.querySelectorAll('.outlet-filter-tabs .chip-btn').forEach(btn => {
    if (btn.dataset.ocat === cat) btn.classList.add('active');
    else btn.classList.remove('active');
  });
  renderOutletPicker();
};

function updateSelectedCount() {
  const countEl = document.getElementById('plc-selected-count');
  if (countEl) {
    countEl.textContent = `${selectedOutletIds.size} station${selectedOutletIds.size === 1 ? '' : 's'} selected`;
  }
}

window.calculatePlacementTotalCost = function() {
  const enteredTotal = document.getElementById('plc-total-cost')?.value;
  const spots = Number(document.getElementById('plc-spots')?.value) || 0;
  const unitCost = Number(document.getElementById('plc-unit-cost')?.value) || 0;
  const count = selectedOutletIds.size;

  const detailsEl = document.getElementById('plc-calc-details');
  const totalEl = document.getElementById('plc-calc-total');

  if (enteredTotal !== undefined && enteredTotal !== '' && Number(enteredTotal) > 0) {
    const pkgAmount = Number(enteredTotal);
    const total = (count > 1 ? count : 1) * pkgAmount;
    if (detailsEl) {
      if (count > 1) {
        detailsEl.textContent = `${count} stations × ${formatETB(pkgAmount)} contract package`;
      } else {
        detailsEl.textContent = `Lump-sum contract package${spots > 0 ? ` (~${spots} airings)` : ''} • Budget is optional`;
      }
    }
    if (totalEl) {
      totalEl.textContent = formatETB(total);
    }
  } else if (spots > 0 && unitCost > 0) {
    const total = (count > 0 ? count : 1) * spots * unitCost;
    if (detailsEl) {
      detailsEl.textContent = `${count > 0 ? count : 1} station(s) × ${spots} spots @ ${formatETB(unitCost)}`;
    }
    if (totalEl) {
      totalEl.textContent = formatETB(total);
    }
  } else {
    if (detailsEl) {
      detailsEl.textContent = count > 0
        ? `${count} station${count === 1 ? '' : 's'} selected • Contract Agreement (Budget optional / 0 ETB)`
        : 'Select station(s) • Budget is completely optional';
    }
    if (totalEl) {
      totalEl.textContent = 'ETB 0 (Optional)';
    }
  }
};

window.openAddOutletModal = function() {
  const modal = document.getElementById('add-outlet-modal');
  if (modal) modal.classList.add('active');
};

window.handleCreateOutletSubmit = async function(e) {
  e.preventDefault();
  const name = document.getElementById('new-out-name')?.value.trim();
  const type = document.getElementById('new-out-type')?.value;
  const coverage = document.getElementById('new-out-cov')?.value;
  const vendor_name = document.getElementById('new-out-vendor')?.value.trim();
  const contact_person = document.getElementById('new-out-contact')?.value.trim();
  const contact_phone = document.getElementById('new-out-phone')?.value.trim();
  const rate_summary = document.getElementById('new-out-rate')?.value.trim();
  const submitBtn = document.getElementById('new-out-submit-btn');

  if (!name || !type) {
    showToast('Outlet name and category are required.', 'error');
    return;
  }

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Saving...';
  }

  try {
    const newOutlet = await api('/api/media-outlets', {
      method: 'POST',
      body: JSON.stringify({ name, type, coverage, vendor_name, contact_person, contact_phone, rate_summary })
    });

    cachedOutlets.push(newOutlet);
    selectedOutletIds.add(newOutlet.id);
    closeModal('add-outlet-modal');
    document.getElementById('add-outlet-form')?.reset();
    showToast(`Media outlet "${name}" registered and selected!`, 'success');

    renderOutletPicker();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Save to Directory';
    }
  }
};

window.handleRecordExpenseSubmit = async function(e) {
  e.preventDefault();
  const campaign_id = document.getElementById('exp-campaign')?.value || null;
  const title = document.getElementById('exp-title')?.value.trim();
  const amount = Number(document.getElementById('exp-amount')?.value) || 0;
  const stage = document.getElementById('exp-stage')?.value;
  const vendor = document.getElementById('exp-vendor')?.value.trim();
  const invoice_ref = document.getElementById('exp-invoice')?.value.trim();
  const submitBtn = document.getElementById('exp-submit-btn');

  if (!title || amount <= 0) {
    showToast('Valid expense description and positive amount are required.', 'error');
    return;
  }

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Recording...';
  }

  try {
    await api('/api/budget/expenses', {
      method: 'POST',
      body: JSON.stringify({ campaign_id, title, amount, stage, vendor, invoice_ref })
    });

    closeModal('expense-modal');
    document.getElementById('expense-form')?.reset();
    showToast(`Expense voucher for "${title}" recorded successfully!`, 'success');

    if (window.router) window.router.handleRoute();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Record Expense';
    }
  }
};

window.handleCreateActivitySubmit = async function(e) {
  e.preventDefault();
  const campaign_id = document.getElementById('act-campaign')?.value;
  const title = document.getElementById('act-title')?.value.trim();
  const activity_type = document.getElementById('act-type')?.value;
  const owner = document.getElementById('act-owner')?.value.trim();
  const due_date = document.getElementById('act-due')?.value;
  const budget = Number(document.getElementById('act-budget')?.value) || 0;
  const submitBtn = document.getElementById('act-submit-btn');

  if (!campaign_id || !title) {
    showToast('Campaign and title are required.', 'error');
    return;
  }

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating...';
  }

  try {
    await api('/api/activities', {
      method: 'POST',
      body: JSON.stringify({ campaign_id, title, activity_type, owner, due_date, budget })
    });

    closeModal('activity-modal');
    document.getElementById('activity-form')?.reset();
    showToast(`Task "${title}" created successfully!`, 'success');

    if (window.router) window.router.handleRoute();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Create Deliverable';
    }
  }
};

function bindFormSubmissions() {
  const campForm = document.getElementById('campaign-form');
  if (campForm) {
    campForm.onsubmit = async (e) => {
      e.preventDefault();
      const submitBtn = document.getElementById('cmp-submit-btn');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Launching...';
      }

      try {
        const payload = {
          title: document.getElementById('cmp-title').value.trim(),
          portfolio_id: document.getElementById('cmp-portfolio').value,
          owner: document.getElementById('cmp-owner').value.trim(),
          start_date: document.getElementById('cmp-start').value,
          end_date: document.getElementById('cmp-end').value,
          budget: Number(document.getElementById('cmp-budget').value) || 0,
          priority: document.getElementById('cmp-priority')?.value || 'High',
          strategic_objective: document.getElementById('cmp-objective').value.trim(),
          execution_status: 'Active',
          approval_status: 'Approved'
        };
        const res = await api('/api/campaigns', { method: 'POST', body: JSON.stringify(payload) });
        showToast('Campaign launched successfully!', 'success');
        closeModal('campaign-modal');
        campForm.reset();
        await refreshModalData();
        window.router.navigate(`/campaigns/${res.id}`);
      } catch (err) {
        showToast(err.message, 'error');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Launch Campaign';
        }
      }
    };
  }

  const plcForm = document.getElementById('placement-form');
  if (plcForm) {
    plcForm.onsubmit = async (e) => {
      e.preventDefault();
      if (selectedOutletIds.size === 0) {
        showToast('Please select at least one media station from the list.', 'error');
        return;
      }

      const submitBtn = document.getElementById('plc-submit-btn');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Booking Placements...';
      }

      try {
        const enteredTotal = document.getElementById('plc-total-cost')?.value;
        const spots = Number(document.getElementById('plc-spots')?.value) || 0;
        const unitCost = Number(document.getElementById('plc-unit-cost')?.value) || 0;

        let totalCost = 0;
        if (enteredTotal !== undefined && enteredTotal !== '' && Number(enteredTotal) >= 0) {
          totalCost = Number(enteredTotal);
        } else if (spots > 0 && unitCost > 0) {
          totalCost = spots * unitCost;
        }

        const payload = {
          campaign_id: document.getElementById('plc-campaign').value,
          ad_name: document.getElementById('plc-name').value.trim(),
          outlet_ids: Array.from(selectedOutletIds),
          placement_type: document.getElementById('plc-type').value.trim() || 'Monthly Broadcast Flight',
          start_date: document.getElementById('plc-start').value,
          end_date: document.getElementById('plc-end').value,
          total_spots: spots > 0 ? spots : 1,
          total_cost: totalCost,
          unit_cost: spots > 0 && totalCost > 0 ? Math.round(totalCost / spots) : unitCost,
          contract_ref: document.getElementById('plc-contract').value.trim()
        };

        const res = await api('/api/advertisements', { method: 'POST', body: JSON.stringify(payload) });
        showToast(res.message || 'Media placement flights booked successfully!', 'success');
        closeModal('placement-modal');
        plcForm.reset();
        selectedOutletIds.clear();
        if (window.router) window.router.handleRoute();
      } catch (err) {
        showToast(err.message, 'error');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Book Placement Flights';
        }
      }
    };
  }

  const vfForm = document.getElementById('verify-form');
  if (vfForm) {
    vfForm.onsubmit = async (e) => {
      e.preventDefault();
      const id = document.getElementById('vf-placement-id').value;
      const status = document.getElementById('vf-status')?.value || 'Verified';
      const notes = document.getElementById('vf-notes')?.value.trim();
      const deliveredSpots = document.getElementById('vf-delivered-spots')?.value;
      const verified_by = document.getElementById('vf-user')?.value.trim() || (state.currentUser ? state.currentUser.name : 'Kirubel Misrak');
      const submitBtn = document.getElementById('vf-submit-btn');

      if (!id) {
        showToast('Error: Placement flight ID is missing.', 'error');
        return;
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Certifying Proof...';
      }

      try {
        await api(`/api/advertisements/${id}/verify`, {
          method: 'POST',
          body: JSON.stringify({
            status,
            notes,
            delivered_spots: deliveredSpots !== '' && deliveredSpots !== undefined ? Number(deliveredSpots) : undefined,
            verified_by
          })
        });
        showToast(`Ad delivery ${status.toLowerCase()} and certified successfully!`, 'success');
        closeModal('verify-modal');
        vfForm.reset();

        // Refresh drawer inspection if open
        const drawerBackdrop = document.getElementById('placement-drawer-backdrop');
        if (drawerBackdrop && drawerBackdrop.classList.contains('active')) {
          if (typeof window.inspectPlacement === 'function') {
            window.inspectPlacement(id);
          }
        }

        if (window.router) window.router.handleRoute();
      } catch (err) {
        showToast(err.message, 'error');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Confirm & Log Verification';
        }
      }
    };
  }
}

// Global Modal Helpers
window.closeModal = closeModal;

window.openModal = async function(id) {
  await refreshModalData();
  const el = document.getElementById(id);
  if (el) {
    if (id === 'campaign-modal') {
      const ownerInput = document.getElementById('cmp-owner');
      if (ownerInput && state.currentUser) ownerInput.value = state.currentUser.name;
    }
    el.classList.add('active');
  }
};

window.openPlacementForCampaign = async function(campaignId) {
  await refreshModalData();
  const campSelect = document.getElementById('plc-campaign');
  if (campSelect) campSelect.value = campaignId;
  window.openModal('placement-modal');
};

window.openVerifyModal = function(id, adName, outletName) {
  let modal = document.getElementById('verify-modal');
  if (!modal) {
    initModals();
    modal = document.getElementById('verify-modal');
  }

  const input = document.getElementById('vf-placement-id');
  if (input) input.value = id;

  const userInput = document.getElementById('vf-user');
  if (userInput && state.currentUser) userInput.value = state.currentUser.name;

  const meta = document.getElementById('verify-ad-meta');
  if (meta) {
    meta.innerHTML = `
      <div style="font-size: 13.5px; font-weight: 700; color: var(--ep-text);">${adName || 'Broadcast Placement'}</div>
      <div style="font-size: 12px; color: var(--ep-muted); margin-top: 3px;">
        Media Station: <strong style="color: var(--ep-primary);">${outletName || 'Broadcast Partner'}</strong> • Placement ID: <span class="code-tag primary">${id}</span>
      </div>
    `;
  }

  const notesInput = document.getElementById('vf-notes');
  if (notesInput && !notesInput.value) {
    notesInput.value = `Verified broadcast transmission certificate and log for ${outletName || 'station'}.`;
  }

  if (modal) modal.classList.add('active');
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
