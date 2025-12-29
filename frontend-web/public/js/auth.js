/**
 * Centralized JWT Authentication Handler
 * Manages token storage, verification, and automatic header injection
 */

// Handle unhandled promise rejections from browser extensions
window.addEventListener('unhandledrejection', function(event) {
  const msg = String(event.reason || '');
  // Suppress the specific browser extension error about message channel
  if (msg.includes('message channel') || 
      msg.includes('asynchronous response') ||
      msg.includes('listener indicated') ||
      msg.includes('closed before a response')) {
    event.preventDefault();
    console.debug('[auth.js] Suppressed extension message:', event.reason);
  }
});

(function () {
  // Determine API base URL dynamically based on environment
  let API_BASE;
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    // Local development
    API_BASE = 'http://localhost:8080';
  } else {
    // Production - use the same host but with port 8080
    API_BASE = `http://${window.location.hostname}:8080`;
  }
  
  const TOKEN_KEY = 'acomp_jwt_token_v1';

  // Prevent multiple executions
  let initialized = false;

  /**
   * Token management
   */
  function getToken() {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch (e) {
      return null;
    }
  }

  function setToken(token) {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch (e) {
      // ignore
    }
  }

  function removeToken() {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch (e) {
      // ignore
    }
  }

  /**
   * Login
   */
  async function login(email, password) {
    try {
      const res = await fetch(API_BASE + '/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.status === 200 && data.success && data.token) {
        setToken(data.token);
        window.currentUser = data.user;
        return { success: true, user: data.user };
      }
      return { success: false, error: data.error || 'Login failed' };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  }

  /**
   * Register
   */
  async function register(email, password, name, role = 'estudiante') {
    try {
      const res = await fetch(API_BASE + '/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name, role })
      });
      const data = await res.json();
      if (res.status === 201 && data.success) {
        return { success: true, user: data.user };
      }
      return { success: false, error: data.error || 'Registration failed' };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  }

  /**
   * Logout
   */
  async function logout() {
    try {
      const token = getToken();
      if (token) {
        await fetch(API_BASE + '/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
          },
          body: JSON.stringify({})
        });
      }
    } catch (err) {
      // ignore
    } finally {
      removeToken();
    }
    return { success: true };
  }

  /**
   * Verify token
   */
  async function verifyToken(token) {
    if (!token) return { valid: false };
    try {
      const res = await fetch(API_BASE + '/auth/verify-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({})
      });
      if (res.status === 200) {
        const data = await res.json();
        return { valid: true, payload: data.payload || data };
      }
      return { valid: false };
    } catch (err) {
      return { valid: false };
    }
  }

  /**
   * Patch fetch() to auto-add Authorization header
   */
  (function patchFetch() {
    const _fetch = window.fetch.bind(window);
    window.fetch = async function (input, init = {}) {
      try {
        const token = getToken();
        if (token) {
          init.headers = init.headers || {};
          if (!init.headers['Authorization'] && !init.headers['authorization']) {
            init.headers['Authorization'] = 'Bearer ' + token;
          }
        }
      } catch (e) {
        // ignore
      }
      return _fetch(input, init);
    };
  })();

  /**
   * Auto-redirect and token verification logic
   */
  async function initializeAuth() {
    if (initialized) return;
    initialized = true;

    try {
      const path = (location.pathname || '').toLowerCase();
      const isLogin = path.includes('login.html') || path === '/' || path === '';
      const token = getToken();

      // No token
      if (!token) {
        if (!isLogin) {
          location.href = '/login.html';
        }
        return;
      }

      // Verify token
      const result = await verifyToken(token);
      if (result && result.valid) {
        window.currentUser = result.payload;
        // If on login and have valid token, redirect
        if (isLogin) {
          const role = (result.payload && result.payload.roles && result.payload.roles[0]) || 'estudiante';
          location.href = role === 'estudiante' ? '/estudiante.html' : '/index.html';
        }
        return;
      }

      // Token invalid
      removeToken();
      if (!isLogin) {
        location.href = '/login.html';
      }
    } catch (err) {
      console.error('[auth.js] Error during initialization:', err);
      // Don't throw - let page load normally
    }
  }

  /**
   * Expose public API
   */
  window.AuthClient = {
    getToken,
    setToken,
    removeToken,
    login,
    register,
    logout,
    verifyToken
  };

  /**
   * Initialize on DOM ready
   */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAuth);
  } else {
    setTimeout(initializeAuth, 0);
  }
})();
