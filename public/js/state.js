/**
 * Ethiopost Marketing Command Center
 * Client State & Utility Layer
 */

const savedUser = typeof localStorage !== 'undefined' ? localStorage.getItem('ethiopost_user') : null;
let parsedUser = null;
try {
  if (savedUser) parsedUser = JSON.parse(savedUser);
} catch (e) {}

export const state = {
  currentRoute: 'overview',
  activeMonth: '2026-10',
  currentUser: parsedUser || {
    id: 'USR-001',
    name: 'Dawit Tadesse',
    role: 'Marketing & Communication Manager',
    email: 'dawit.tadesse@ethiopost.et',
    department: 'Executive'
  }
};

export function setCurrentUser(user) {
  state.currentUser = user;
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('ethiopost_user', JSON.stringify(user));
  }
  updateUserUI();
  showToast(`Active team role switched to ${user.name}`, 'success');
  // Re-render current route to reflect user's context
  if (typeof window !== 'undefined' && window.router) {
    window.router.handleRoute();
  }
}

export function updateUserUI() {
  const nameEl = document.getElementById('sidebar-user-name');
  const roleEl = document.getElementById('sidebar-user-role');
  const avatarEl = document.getElementById('sidebar-user-avatar');
  if (nameEl) nameEl.textContent = state.currentUser.name;
  if (roleEl) roleEl.textContent = state.currentUser.role;
  if (avatarEl) {
    const initials = state.currentUser.name.split(' ').map(n => n[0]).join('').substring(0, 2);
    avatarEl.textContent = initials;
  }
}

export async function api(endpoint, options = {}) {
  try {
    const config = {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    const res = await fetch(endpoint, config);
    if (!res.ok) {
      let errorMsg = `Server error (${res.status})`;
      try {
        const errorJson = await res.json();
        if (errorJson.error) errorMsg = errorJson.error;
      } catch (e) {}
      throw new Error(errorMsg);
    }

    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      return await res.json();
    }
    if (endpoint.startsWith('/api/')) {
      const text = await res.text();
      try { return JSON.parse(text); } catch (e) { throw new Error('API non-JSON response (' + res.status + '): ' + text.substring(0, 80)); }
    }
    return await res.text();
  } catch (err) {
    showToast(err.message, 'error');
    throw err;
  }
}

export function formatETB(amount) {
  const num = Number(amount) || 0;
  return 'ETB ' + num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

export function formatCompactETB(amount) {
  const num = Number(amount) || 0;
  if (num >= 1000000) {
    return 'ETB ' + (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 1000) {
    return 'ETB ' + (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return 'ETB ' + num;
}

export function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;

  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(8px)';
    toast.style.transition = 'all 0.2s ease';
    setTimeout(() => toast.remove(), 200);
  }, 3500);
}

export function openModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('active');
}

export function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('active');
}

if (typeof window !== 'undefined') {
  window.openModal = openModal;
  window.closeModal = closeModal;
}
