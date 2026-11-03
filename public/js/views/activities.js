/**
 * Ethiopost Marketing Command Center
 * Activity & Task Management Module (Prompt Section 8)
 */

import { api } from '../state.js';
import { icons } from '../components/icons.js';

export async function renderActivities(container) {
  container.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: center; height: 260px; color: var(--ep-muted);">
      Loading Campaign Activities & Tasks...
    </div>
  `;

  try {
    const activities = await api('/api/activities');

    const total = activities.length;
    const completed = activities.filter(a => a.status === 'Completed').length;
    const inProgress = activities.filter(a => a.status === 'In Progress').length;
    const avgProgress = total > 0 ? Math.round(activities.reduce((s, a) => s + (a.progress || 0), 0) / total) : 0;

    container.innerHTML = `
      <div style="margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
        <div>
          <h2 style="font-size: 18px; font-weight: 700; color: var(--ep-text); margin-bottom: 2px;">
            Campaign Activities & Milestone Tracking
          </h2>
          <p style="font-size: 12.5px; color: var(--ep-muted);">
            Operational deliverables, creative production, and field execution accountability
          </p>
        </div>
        <button class="btn btn-primary" onclick="openModal('activity-modal')">
          <span>${icons.plus}</span> + Add Deliverable / Task
        </button>
      </div>

      <!-- Top Summary Metrics Ribbon -->
      <div class="metrics-ribbon">
        <div class="metric-strip-card">
          <span class="metric-strip-label">Total Deliverables</span>
          <span class="metric-strip-val">${total} Tasks</span>
          <span class="metric-strip-sub">Across all campaigns</span>
        </div>
        <div class="metric-strip-card">
          <span class="metric-strip-label">Completed Deliverables</span>
          <span class="metric-strip-val" style="color: #059669;">${completed} Completed</span>
          <span class="metric-strip-sub">100% verified done</span>
        </div>
        <div class="metric-strip-card">
          <span class="metric-strip-label">In Progress Execution</span>
          <span class="metric-strip-val">${inProgress} Active</span>
          <span class="metric-strip-sub">Under active production</span>
        </div>
        <div class="metric-strip-card">
          <span class="metric-strip-label">Overall Completion</span>
          <span class="metric-strip-val">${avgProgress}% Average</span>
          <span class="metric-strip-sub">Delivery execution rate</span>
        </div>
      </div>

      <div class="card">
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Deliverable / Task Title</th>
                <th>Linked Campaign</th>
                <th>Type</th>
                <th>Assigned Owner</th>
                <th>Due Date</th>
                <th>Completion Progress</th>
                <th>Status</th>
                <th style="text-align: right;">Action</th>
              </tr>
            </thead>
            <tbody>
              ${activities.length === 0 ? `
                <tr><td colspan="8" class="empty-state">No activities recorded. Click "+ Add Deliverable / Task" to create one.</td></tr>
              ` : activities.map(a => `
                <tr>
                  <td>
                    <div style="font-weight: 600; color: var(--ep-text);">${a.title}</div>
                    ${a.milestone ? '<span style="font-size: 10px; color: var(--ep-accent); font-weight: 700;">★ Strategic Milestone</span>' : ''}
                  </td>
                  <td>
                    <a href="#/campaigns/${a.campaign_id}" style="text-decoration: none;" onmouseover="this.style.color='var(--ep-primary)'">
                      <span class="code-tag primary">${a.campaign_id}</span>
                      <div style="font-size: 12px; color: var(--ep-text); margin-top: 2px;">${a.campaign_title}</div>
                    </a>
                  </td>
                  <td>
                    <span class="pill pill-draft">${a.activity_type}</span>
                  </td>
                  <td>
                    <div style="display: flex; align-items: center; gap: 6px;">
                      <span style="color: var(--ep-text-secondary); font-weight: 500;">${a.owner}</span>
                    </div>
                  </td>
                  <td class="tabular-num" style="font-size: 12px; color: var(--ep-muted); white-space: nowrap;">
                    <span style="font-weight: 500; color: var(--ep-text-secondary);">${a.due_date}</span>
                  </td>
                  <td style="min-width: 100px;">
                    <div class="tabular-num" style="font-size: 11.5px; font-weight: 600; margin-bottom: 2px; color: var(--ep-text-secondary);">${a.progress}%</div>
                    <div class="progress-bar-wrap">
                      <div class="progress-bar-fill" style="width: ${a.progress}%;"></div>
                    </div>
                  </td>
                  <td>
                    <span class="pill pill-${(a.status || 'pending').toLowerCase()}">
                      ${a.status}
                    </span>
                  </td>
                  <td style="text-align: right;">
                    <div style="display: inline-flex; gap: 6px;">
                      ${a.status !== 'Completed' ? `
                        <button class="btn btn-secondary btn-sm" onclick="window.markActivityCompleted(${a.id})" title="Mark task 100% complete">
                          ✓ Done
                        </button>
                      ` : `
                        <span class="pill pill-active" style="padding: 3px 8px;">✓ Done</span>
                      `}
                      <button class="quick-action-btn" style="color: #DC2626;" onclick="window.deleteActivity(${a.id})" title="Delete task">
                        &times;
                      </button>
                    </div>
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

window.markActivityCompleted = async function(id) {
  try {
    await api(`/api/activities/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status: 'Completed', progress: 100 })
    });
    if (window.router) window.router.handleRoute();
  } catch (err) {}
};

window.deleteActivity = async function(id) {
  if (!confirm('Are you sure you want to delete this activity task?')) return;
  try {
    await api(`/api/activities/${id}`, {
      method: 'DELETE'
    });
    if (window.router) window.router.handleRoute();
  } catch (err) {}
};
