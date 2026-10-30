/**
 * Ethiopost Marketing Command Center
 * Marketing Budget & Expense Accounting (Prompt Section 9)
 */

import { api, formatETB, formatCompactETB } from '../state.js';
import { icons } from '../components/icons.js';

export async function renderBudget(container) {
  container.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: center; height: 260px; color: var(--ep-muted);">
      Loading Marketing Budget & Ledger...
    </div>
  `;

  try {
    const data = await api('/api/budget');
    const { stageTotals, expenses, allocations } = data;

    const totalSpend = (stageTotals.paid || 0) + (stageTotals.invoiced || 0);

    container.innerHTML = `
      <div style="margin-bottom: 20px;">
        <h2 style="font-size: 18px; font-weight: 700; color: var(--ep-text); margin-bottom: 2px;">
          Marketing Budget & Financial Governance
        </h2>
        <p style="font-size: 12.5px; color: var(--ep-muted);">
          Lifecycle expense accounting across Committed, Invoiced, and Paid disbursement stages
        </p>
      </div>

      <!-- Financial Stage Summary Grid -->
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-top">
            <span class="kpi-label">Approved Allocation</span>
            <div class="kpi-icon-pill">
              ${icons.budget}
            </div>
          </div>
          <div class="kpi-value">${formatCompactETB(stageTotals.approved)}</div>
          <div class="kpi-sub">Authorized for procurement</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-top">
            <span class="kpi-label">Committed Contracts</span>
            <div class="kpi-icon-pill gold">
              ${icons.activities}
            </div>
          </div>
          <div class="kpi-value">${formatCompactETB(stageTotals.committed)}</div>
          <div class="kpi-sub">Media contracts under execution</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-top">
            <span class="kpi-label">Invoiced Pending</span>
            <div class="kpi-icon-pill">
              ${icons.reports}
            </div>
          </div>
          <div class="kpi-value">${formatCompactETB(stageTotals.invoiced)}</div>
          <div class="kpi-sub">Verified station invoices</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-top">
            <span class="kpi-label">Total Spend Disbursed</span>
            <div class="kpi-icon-pill green">
              ${icons.check}
            </div>
          </div>
          <div class="kpi-value" style="color: var(--ep-primary);">${formatCompactETB(totalSpend)}</div>
          <div class="kpi-sub">Paid out: ${formatCompactETB(stageTotals.paid)}</div>
          <div class="micro-progress-wrap" style="max-width: 100%; margin-top: 8px;">
            <div class="micro-progress-fill green" style="width: ${stageTotals.approved > 0 ? Math.min(100, Math.round((totalSpend / stageTotals.approved) * 100)) : 0}%;"></div>
          </div>
        </div>
      </div>

      <!-- Service Portfolio Allocations -->
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">Portfolio Budget Ceilings (FY2026/27)</div>
            <div class="card-subtitle">Monthly allocations, contracted obligations, and disbursed totals by service line</div>
          </div>
        </div>
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Service Portfolio</th>
                <th>Monthly Ceiling</th>
                <th>Committed Contracts</th>
                <th>Invoiced Pending</th>
                <th style="text-align: right;">Disbursed Paid</th>
              </tr>
            </thead>
            <tbody>
              ${allocations.map(a => `
                <tr>
                  <td>
                    <div style="display: flex; align-items: center; gap: 8px;">
                      <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: ${a.portfolio_color};"></span>
                      <strong style="color: var(--ep-text);">${a.portfolio_name}</strong>
                    </div>
                  </td>
                  <td class="tabular-num">${formatETB(a.approved_budget)}</td>
                  <td class="tabular-num">${formatETB(a.committed_budget)}</td>
                  <td class="tabular-num">${formatETB(a.invoiced_budget)}</td>
                  <td class="tabular-num" style="text-align: right; font-weight: 700; color: var(--ep-primary);">${formatETB(a.paid_budget)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Itemized Ledger -->
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">Itemized Expense Ledger (${expenses.length})</div>
            <div class="card-subtitle">Individual vouchers, station invoices, and media flight disbursements</div>
          </div>
        </div>
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Expense Description</th>
                <th>Category</th>
                <th>Vendor / Partner</th>
                <th>Invoice Ref</th>
                <th>Stage</th>
                <th style="text-align: right;">Amount (ETB)</th>
              </tr>
            </thead>
            <tbody>
              ${expenses.map(e => `
                <tr>
                  <td style="font-weight: 600; color: var(--ep-text);">${e.title}</td>
                  <td><span class="pill pill-draft">${e.category}</span></td>
                  <td style="color: var(--ep-text-secondary);">${e.vendor || '—'}</td>
                  <td><span class="code-tag">${e.invoice_ref || '—'}</span></td>
                  <td><span class="pill pill-${e.stage.toLowerCase()}">${e.stage}</span></td>
                  <td class="tabular-num" style="text-align: right; font-weight: 700; color: var(--ep-text);">${formatETB(e.amount)}</td>
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
