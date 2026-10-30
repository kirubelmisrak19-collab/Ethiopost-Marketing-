/**
 * Ethiopost Marketing Command Center
 * Team Directory, Access Governance & Separation of Duties (Prompt Section 2 & 11)
 */

import { api, showToast, state, setCurrentUser } from '../state.js';
import { icons } from '../components/icons.js';

export async function renderTeamAccess(container) {
  container.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: center; height: 260px; color: var(--ep-muted);">
      Loading Ethiopost Marketing Team & Access Matrix...
    </div>
  `;

  try {
    const data = await api('/api/team');
    const { users, approvals } = data;

    container.innerHTML = `
      <div style="margin-bottom: 20px;">
        <h2 style="font-size: 18px; font-weight: 700; color: var(--ep-text); margin-bottom: 2px;">
          Team Directory & Role Governance
        </h2>
        <p style="font-size: 12.5px; color: var(--ep-muted);">
          10 authorized marketing roles, role-based access permissions, and separation of duties compliance
        </p>
      </div>

      <!-- Pending Approvals & Separation of Duties Policy -->
      <div class="card" style="margin-bottom: 20px;">
        <div class="card-header">
          <div>
            <div class="card-title">Governance Sign-Off & Approvals Queue</div>
            <div class="card-subtitle">Separation of duties policy: Requesters cannot approve their own submissions</div>
          </div>
        </div>
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Request Title & ID</th>
                <th>Entity Type</th>
                <th>Submitted By</th>
                <th>Assigned Approver</th>
                <th>Status</th>
                <th style="text-align: right;">Decision Action</th>
              </tr>
            </thead>
            <tbody>
              ${approvals.length === 0 ? `
                <tr><td colspan="6" class="empty-state">No pending approval requests.</td></tr>
              ` : approvals.map(app => `
                <tr>
                  <td>
                    <div style="font-weight: 600; color: var(--ep-text); margin-bottom: 2px;">${app.title}</div>
                    <div><span class="code-tag">${app.id}</span></div>
                  </td>
                  <td><span class="pill pill-draft">${app.entity_type}</span></td>
                  <td><strong>${app.requester}</strong></td>
                  <td>${app.assigned_to}</td>
                  <td>
                    <span class="pill pill-${app.status.toLowerCase()}">${app.status}</span>
                  </td>
                  <td style="text-align: right;">
                    ${app.status === 'Pending' ? `
                      <button class="btn btn-primary btn-sm" onclick="handleApprovalAction('${app.id}', 'Approved', '${app.requester}')">
                        Authorize Sign-off
                      </button>
                    ` : `
                      <span class="pill pill-active">${icons.check} Signed Off</span>
                    `}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- User Directory -->
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">Marketing & Communication Team Members (${users.length})</div>
            <div class="card-subtitle">Active staff directory across executive, campaign, and digital marketing roles</div>
          </div>
        </div>
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Member Name</th>
                <th>Departmental Role</th>
                <th>Email Address</th>
                <th>Department</th>
                <th>Access Status</th>
                <th style="text-align: right;">Active Role</th>
              </tr>
            </thead>
            <tbody>
              ${users.map(u => `
                <tr>
                  <td>
                    <div style="display: flex; align-items: center; gap: 10px;">
                      <div class="user-avatar" style="width: 28px; height: 28px; font-size: 11px; background: #EEF2FF; color: var(--ep-primary); font-weight: 700;">${u.avatar}</div>
                      <div style="font-weight: 600; color: var(--ep-text);">${u.name}</div>
                    </div>
                  </td>
                  <td>
                    <span class="pill pill-draft" style="font-weight: 500;">${u.role}</span>
                  </td>
                  <td><span class="code-tag">${u.email}</span></td>
                  <td style="color: var(--ep-text-secondary);">${u.department}</td>
                  <td>
                    <span class="pill pill-active"><span class="dot-pulse-wrap"><span class="dot-pulse"></span>${u.status}</span></span>
                  </td>
                  <td style="text-align: right;">
                    ${state.currentUser.name === u.name ? `
                      <span class="pill pill-active" style="padding: 4px 10px;">✓ Current User</span>
                    ` : `
                      <button class="btn btn-secondary btn-sm" onclick='window.switchUserSession(${JSON.stringify(u)})'>
                        Switch to Role
                      </button>
                    `}
                  </td>
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

window.switchUserSession = function(user) {
  setCurrentUser(user);
};

window.handleApprovalAction = async function(id, action, requester) {
  try {
    const actorName = state.currentUser ? state.currentUser.name : 'Dawit Tadesse';
    await api(`/api/approvals/${id}/decide`, {
      method: 'POST',
      body: JSON.stringify({
        action,
        actor: actorName,
        comments: `Authorized by ${actorName} (${state.currentUser ? state.currentUser.role : 'Manager'})`
      })
    });
    showToast(`Request ${id} ${action.toLowerCase()} successfully by ${actorName}`, 'success');
    window.router.handleRoute();
  } catch (err) {}
};
