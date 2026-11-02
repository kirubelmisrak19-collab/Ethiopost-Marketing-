/**
 * Ethiopost Marketing Command Center
 * Client State, Authentication & Utility Layer
 */

const TOKEN_KEY = 'ethiopost_auth_token';
const USER_KEY = 'ethiopost_auth_user';

export function getAuthToken() {
  if (typeof localStorage === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser() {
  if (typeof localStorage === 'undefined') return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

export function setAuthSession(token, user) {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
  state.authToken = token;
  state.currentUser = user;
  updateUserUI();
}

export function clearAuthSession() {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }
  state.authToken = null;
  state.currentUser = null;
}

export function isLoggedIn() {
  return Boolean(getAuthToken() && getStoredUser());
}

export const state = {
  currentRoute: 'overview',
  activeMonth: '2026-10',
  authToken: getAuthToken(),
  currentUser: getStoredUser()
};

export function setCurrentUser(user) {
  state.currentUser = user;
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
  updateUserUI();
}

export function updateUserUI() {
  if (!state.currentUser) return;
  const nameEl = document.getElementById('sidebar-user-name');
  const roleEl = document.getElementById('sidebar-user-role');
  const avatarEl = document.getElementById('sidebar-user-avatar');
  if (nameEl) nameEl.textContent = state.currentUser.name;
  if (roleEl) roleEl.textContent = state.currentUser.role;
  if (avatarEl) {
    avatarEl.textContent = state.currentUser.avatar || state.currentUser.name.split(' ').map(n => n[0]).join('').substring(0, 2);
  }
}

export async function api(endpoint, options = {}) {
  try {
    const headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...options.headers
    };

    const token = getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      ...options,
      headers
    };

    const res = await fetch(endpoint, config);

    // Handle 401 Unauthorized / Token Expiry
    if (res.status === 401 && endpoint !== '/api/auth/login') {
      clearAuthSession();
      if (typeof window !== 'undefined' && typeof window.showLoginGate === 'function') {
        window.showLoginGate('Session expired or access unauthorized. Please sign in again.');
      }
      throw new Error('Access denied: Please sign in to continue.');
    }

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
    if (endpoint !== '/api/auth/login') {
      showToast(err.message, 'error');
    }
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
