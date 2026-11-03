/**
 * Ethiopost Marketing Command Center
 * Team Directory, Super Admin User Governance & Access Provisioning
 */

import { api, showToast, state } from '../state.js';
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
    const isSuperAdmin = state.currentUser && state.currentUser.role === 'Super Administrator';

    container.innerHTML = `
      <div style="margin-bottom: 20px;">
        <h2 style="font-size: 18px; font-weight: 700; color: var(--ep-text); margin-bottom: 2px;">
          Team Directory & Access Governance
        </h2>
        <p style="font-size: 12.5px; color: var(--ep-muted);">
          Centralized user identity management, credential provisioning, and role-based permissions
        </p>
      </div>

      <!-- Super Admin Authority Banner -->
      <div class="governance-banner">
        <div>
          <div class="governance-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
            Super Administrator Account Control
          </div>
          <div class="governance-desc">
            ${isSuperAdmin 
              ? 'You are logged in as <strong>Kirubel Misrak (Super Administrator)</strong>. You have exclusive authorization to create new accounts, assign roles, and issue login credentials for team members.'
              : 'Account provisioning and role assignments are managed exclusively by Super Administrator <strong>Kirubel Misrak</strong>.'
            }
          </div>
        </div>
        ${isSuperAdmin ? `
          <button class="btn btn-primary" onclick="window.openProvisionUserModal()" style="flex-shrink: 0;">
            <span style="font-size: 15px; font-weight: bold; margin-right: 4px;">+</span> Provision Team Account
          </button>
        ` : ''}
      </div>

      <!-- Pending Approvals & Separation of Duties Policy -->
      <div class="card" style="margin-bottom: 24px;">
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
            <div class="card-title">Active Team Members (${users.length})</div>
            <div class="card-subtitle">Authorized users with active access credentials to this Command Center</div>
          </div>
          ${isSuperAdmin ? `
            <button class="btn btn-primary btn-sm" onclick="window.openProvisionUserModal()">
              + Provision Account
            </button>
          ` : ''}
        </div>
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Member Name</th>
                <th>Assigned Role</th>
                <th>Official Email</th>
                <th>Department</th>
                <th>Status</th>
                <th>Last Login</th>
                <th style="text-align: right;">Account Actions</th>
              </tr>
            </thead>
            <tbody>
              ${users.map(u => {
                const isSelf = state.currentUser && state.currentUser.id === u.id;
                const isActive = u.status === 'Active';
                return `
                  <tr>
                    <td>
                      <div style="display: flex; align-items: center; gap: 10px;">
                        <div class="user-avatar" style="width: 30px; height: 30px; font-size: 11px; background: #EEF2FF; color: var(--ep-primary); font-weight: 700; border: 1px solid #C7D2FE;">
                          ${u.avatar || u.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div style="font-weight: 600; color: var(--ep-text);">${u.name}</div>
                          ${isSelf ? '<span style="font-size: 10px; color: var(--ep-primary); font-weight: 600;">(Your Account)</span>' : ''}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span class="pill ${u.role === 'Super Administrator' ? 'pill-active' : 'pill-draft'}" style="font-weight: 600;">
                        ${u.role}
                      </span>
                    </td>
                    <td><span class="code-tag">${u.email}</span></td>
                    <td style="color: var(--ep-text-secondary);">${u.department || 'Marketing Operations'}</td>
                    <td>
                      <span class="pill ${isActive ? 'pill-active' : 'pill-expired'}">
                        <span class="dot-pulse-wrap"><span class="dot-pulse" style="background: ${isActive ? '#10B981' : '#EF4444'};"></span>${u.status}</span>
                      </span>
                    </td>
                    <td style="color: var(--ep-muted); font-size: 11.5px;">
                      ${u.last_login ? u.last_login.split(' ')[0] : 'Never logged in'}
                    </td>
                    <td style="text-align: right;">
                      ${isSuperAdmin ? `
                        <div style="display: inline-flex; gap: 6px; align-items: center;">
                          <button class="btn btn-secondary btn-sm" onclick="window.openResetPasswordModal('${u.id}', '${u.name}')" title="Reset user password">
                            Reset Password
                          </button>
                          ${!isSelf ? `
                            <button class="btn btn-sm ${isActive ? 'btn-secondary' : 'btn-primary'}" onclick="window.toggleUserStatus('${u.id}', '${isActive ? 'Inactive' : 'Active'}', '${u.name}')" title="${isActive ? 'Deactivate account' : 'Reactivate account'}">
                              ${isActive ? 'Deactivate' : 'Activate'}
                            </button>
                            <button class="btn btn-sm" style="background: #FEE2E2; color: #DC2626; border: 1px solid #FECACA;" onclick="window.deleteUserAccount('${u.id}', '${u.name}')" title="Delete account">
                              Delete
                            </button>
                          ` : ''}
                        </div>
                      ` : `
                        <span style="font-size: 11px; color: var(--ep-muted);">Managed by Super Admin</span>
                      `}
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

// --------------------------------------------------------------------------
// SUPER ADMIN USER PROVISIONING MODAL & ACTIONS
// --------------------------------------------------------------------------

window.openProvisionUserModal = function() {
  const modalContainer = document.getElementById('dynamic-modal-slot') || document.getElementById('modal-container');
  if (!modalContainer) return;

  modalContainer.innerHTML = `
    <div class="modal-backdrop active" id="provision-user-modal">
      <div class="modal-dialog" style="max-width: 500px;">
        <div class="modal-header">
          <div>
            <div class="modal-title">Provision New Team Member Account</div>
            <div class="modal-subtitle">Create verified credentials for Ethiopost marketing personnel</div>
          </div>
          <button class="modal-close" onclick="window.closeModal('provision-user-modal')">&times;</button>
        </div>
        <form onsubmit="window.handleCreateUserSubmit(event)">
          <div class="modal-body" style="display: flex; flex-direction: column; gap: 14px;">
            <div class="form-group">
              <label class="form-label">Full Name *</label>
              <input type="text" id="new-user-name" class="form-input" placeholder="e.g. Dawit Tadesse" required oninput="window.autoSuggestEmail(this.value)">
            </div>

            <div class="form-group">
              <label class="form-label">Official Work Email *</label>
              <input type="email" id="new-user-email" class="form-input" placeholder="e.g. dawit.tadesse@ethiopost.et" required>
            </div>

            <div class="form-row" style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
              <div class="form-group">
                <label class="form-label">Assigned Role *</label>
                <select id="new-user-role" class="form-input">
                  <option value="Campaign Manager" selected>Campaign Manager</option>
                  <option value="Media Placement Officer">Media Placement Officer</option>
                  <option value="Marketing Director">Marketing Director</option>
                  <option value="Budget & Finance Lead">Budget & Finance Lead</option>
                  <option value="Creative & Content Lead">Creative & Content Lead</option>
                  <option value="Agency & Partner Manager">Agency & Partner Manager</option>
                  <option value="Brand Auditor / Viewer">Brand Auditor / Viewer</option>
                  <option value="Super Administrator">Super Administrator</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">Department</label>
                <input type="text" id="new-user-dept" class="form-input" value="Marketing & Digital Communications">
              </div>
            </div>

            <div class="form-group">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                <label class="form-label" style="margin-bottom: 0;">Initial Password *</label>
                <button type="button" class="btn btn-secondary btn-sm" style="padding: 2px 8px; font-size: 11px;" onclick="window.generateRandomPassword('new-user-password')">
                  Generate Strong
                </button>
              </div>
              <input type="text" id="new-user-password" class="form-input" value="Ethiopost@2026" required>
              <div style="font-size: 11px; color: var(--ep-muted); margin-top: 4px;">
                The user can sign in immediately at the live URL with these credentials.
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" onclick="window.closeModal('provision-user-modal')">Cancel</button>
            <button type="submit" id="create-user-submit-btn" class="btn btn-primary">Create Account</button>
          </div>
        </form>
      </div>
    </div>
  `;
};

window.autoSuggestEmail = function(fullName) {
  const emailInput = document.getElementById('new-user-email');
  if (!emailInput) return;
  const cleaned = fullName.trim().toLowerCase().replace(/[^a-z\s]/g, '').replace(/\s+/g, '.');
  if (cleaned) {
    emailInput.value = `${cleaned}@ethiopost.et`;
  }
};

window.generateRandomPassword = function(targetInputId) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
  let pwd = 'Ep@';
  for (let i = 0; i < 8; i++) {
    pwd += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  const input = document.getElementById(targetInputId);
  if (input) input.value = pwd;
};

window.handleCreateUserSubmit = async function(e) {
  e.preventDefault();
  const name = document.getElementById('new-user-name')?.value.trim();
  const email = document.getElementById('new-user-email')?.value.trim();
  const role = document.getElementById('new-user-role')?.value;
  const department = document.getElementById('new-user-dept')?.value.trim();
  const password = document.getElementById('new-user-password')?.value.trim();
  const submitBtn = document.getElementById('create-user-submit-btn');

  if (!name || !email || !password) {
    showToast('Please fill all required fields.', 'error');
    return;
  }

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Provisioning...';
  }

  try {
    const res = await api('/api/users', {
      method: 'POST',
      body: JSON.stringify({ name, email, role, department, password })
    });

    window.closeModal('provision-user-modal');
    showToast(`Account provisioned successfully for ${name}!`, 'success');

    // Show Credential Hand-off Modal
    window.showCredentialHandOffModal(name, email, role, password);

    // Refresh view
    if (window.router) {
      window.router.handleRoute();
    }
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Create Account';
    }
  }
};

window.showCredentialHandOffModal = function(name, email, role, password) {
  const modalContainer = document.getElementById('dynamic-modal-slot') || document.getElementById('modal-container');
  if (!modalContainer) return;

  const credentialsText = `Ethiopost Marketing Command Center
Live Portal: ${window.location.origin}
Full Name: ${name}
Role: ${role}
Email: ${email}
Password: ${password}

Please sign in and keep your credentials secure.`;

  modalContainer.innerHTML = `
    <div class="modal-backdrop active" id="credential-modal">
      <div class="modal-dialog" style="max-width: 480px;">
        <div class="modal-header">
          <div>
            <div class="modal-title">Account Created Successfully</div>
            <div class="modal-subtitle">Share these access credentials with ${name}</div>
          </div>
          <button class="modal-close" onclick="window.closeModal('credential-modal')">&times;</button>
        </div>
        <div class="modal-body">
          <div style="background: #F8FAFC; border: 1px solid var(--ep-border); border-radius: var(--radius-md); padding: 16px; margin-bottom: 14px;">
            <div style="font-size: 11px; font-weight: 700; color: var(--ep-muted); text-transform: uppercase; margin-bottom: 8px;">Login Details</div>
            <div style="display: grid; grid-template-columns: 100px 1fr; gap: 8px; font-size: 13px;">
              <span style="color: var(--ep-muted);">Portal:</span>
              <span style="font-weight: 600; color: var(--ep-primary);">${window.location.origin}</span>
              <span style="color: var(--ep-muted);">Work Email:</span>
              <span style="font-weight: 600;">${email}</span>
              <span style="color: var(--ep-muted);">Password:</span>
              <code style="background: #EEF2FF; padding: 2px 6px; border-radius: 4px; font-weight: 700; color: var(--ep-primary);">${password}</code>
              <span style="color: var(--ep-muted);">Role:</span>
              <span>${role}</span>
            </div>
          </div>
          <div style="font-size: 12px; color: var(--ep-muted); line-height: 1.4;">
            Send these details directly to the team member via company email or secure chat.
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" onclick="window.closeModal('credential-modal')">Done</button>
          <button type="button" class="btn btn-primary" onclick="navigator.clipboard.writeText(\`${credentialsText.replace(/`/g, '\\`')}\`); window.showToast('Credentials copied to clipboard!', 'success');">
            Copy Credentials
          </button>
        </div>
      </div>
    </div>
  `;
};

window.openResetPasswordModal = function(userId, userName) {
  const modalContainer = document.getElementById('dynamic-modal-slot') || document.getElementById('modal-container');
  if (!modalContainer) return;

  modalContainer.innerHTML = `
    <div class="modal-backdrop active" id="reset-pwd-modal">
      <div class="modal-dialog" style="max-width: 440px;">
        <div class="modal-header">
          <div>
            <div class="modal-title">Reset Password</div>
            <div class="modal-subtitle">Set new login password for ${userName}</div>
          </div>
          <button class="modal-close" onclick="window.closeModal('reset-pwd-modal')">&times;</button>
        </div>
        <form onsubmit="window.handleResetPasswordSubmit(event, '${userId}', '${userName}')">
          <div class="modal-body">
            <div class="form-group">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                <label class="form-label" style="margin-bottom: 0;">New Password *</label>
                <button type="button" class="btn btn-secondary btn-sm" style="padding: 2px 8px; font-size: 11px;" onclick="window.generateRandomPassword('reset-new-password')">
                  Generate
                </button>
              </div>
              <input type="text" id="reset-new-password" class="form-input" value="Ethiopost@2026" required minlength="6">
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" onclick="window.closeModal('reset-pwd-modal')">Cancel</button>
            <button type="submit" class="btn btn-primary">Update Password</button>
          </div>
        </form>
      </div>
    </div>
  `;
};

window.handleResetPasswordSubmit = async function(e, userId, userName) {
  e.preventDefault();
  const newPassword = document.getElementById('reset-new-password')?.value.trim();
  if (!newPassword || newPassword.length < 6) {
    showToast('Password must be at least 6 characters.', 'error');
    return;
  }

  try {
    await api(`/api/users/${userId}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ newPassword })
    });
    window.closeModal('reset-pwd-modal');
    showToast(`Password successfully reset for ${userName}!`, 'success');
  } catch (err) {
    showToast(err.message, 'error');
  }
};

window.toggleUserStatus = async function(userId, newStatus, userName) {
  const confirmMsg = `Are you sure you want to change ${userName}'s status to "${newStatus}"?`;
  if (!confirm(confirmMsg)) return;

  try {
    await api(`/api/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify({ status: newStatus })
    });
    showToast(`${userName} is now ${newStatus}.`, 'success');
    if (window.router) window.router.handleRoute();
  } catch (err) {
    showToast(err.message, 'error');
  }
};

window.deleteUserAccount = async function(userId, userName) {
  const confirmMsg = `CAUTION: Are you sure you want to permanently delete the account for "${userName}"?\nThis cannot be undone.`;
  if (!confirm(confirmMsg)) return;

  try {
    await api(`/api/users/${userId}`, {
      method: 'DELETE'
    });
    showToast(`Account for ${userName} deleted.`, 'info');
    if (window.router) window.router.handleRoute();
  } catch (err) {
    showToast(err.message, 'error');
  }
};

window.handleApprovalAction = async function(id, action, requester) {
  try {
    const actorName = state.currentUser ? state.currentUser.name : 'Kirubel Misrak';
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
