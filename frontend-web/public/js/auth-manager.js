// Shared AuthManager used across pages (maestro, estudiante, dashboard)
class AuthManager {
  constructor() {
    this.token = localStorage.getItem('token');
    this.refreshToken = localStorage.getItem('refreshToken');
    this.baseURL = window.API_CONFIG ? window.API_CONFIG.API_BASE : 'http://localhost:8080';
    this._refreshIntervalId = null;
  }

  checkSession() {
    if (!this.token) {
      window.location.href = '/';
      return false;
    }
    return true;
  }

  getAuthHeaders() {
    return {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json'
    };
  }

  async getUserData() {
    try {
      if (!this.token) return null;
      const payload = JSON.parse(atob(this.token.split('.')[1]));
      return {
        // Provide both `id` and `userId` to be compatible with callers that expect either
        id: payload.userId || payload.id || null,
        userId: payload.userId || payload.id || null,
        name: payload.name || payload.nombre || 'Usuario',
        // Normalize role: support role or roles array
        role: (payload.roles && Array.isArray(payload.roles)) ? payload.roles[0] : (payload.role || null)
      };
    } catch (err) {
      console.error('AuthManager.getUserData decode error', err);
      this.logout();
      return null;
    }
  }

  // start token health check: verifies token periodically and logs out on invalid
  startTokenRefresh(intervalMs = 4 * 60 * 1000) {
    // Avoid multiple intervals
    if (this._refreshIntervalId) return;

    this._refreshIntervalId = setInterval(async () => {
      try {
        if (!this.token) {
          this.logout();
          return;
        }

        const res = await fetch(this.baseURL + '/auth/verify-token', {
          method: 'POST',
          headers: this.getAuthHeaders(),
          body: JSON.stringify({ token: this.token })
        });

        if (!res.ok) {
          console.warn('Token verification failed, logging out');
          this.logout();
        }
      } catch (err) {
        console.error('Error verifying token:', err);
        // Do not logout on transient errors; keep trying
      }
    }, intervalMs);
  }

  stopTokenRefresh() {
    if (this._refreshIntervalId) {
      clearInterval(this._refreshIntervalId);
      this._refreshIntervalId = null;
    }
  }

  showMessage(message, type = 'info') {
    const statusMessage = document.getElementById('status-message');
    if (statusMessage) {
      statusMessage.textContent = message;
      statusMessage.className = `status-message ${type}`;
      statusMessage.style.display = 'block';
      setTimeout(() => { statusMessage.style.display = 'none'; }, 5000);
    } else {
      // fallback to alert in absence of UI
      if (type === 'error') alert('❌ ' + message);
      else if (type === 'success') alert('✅ ' + message);
      else console.info(message);
    }
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    this.stopTokenRefresh();
    window.location.href = '/';
  }
}

// Expose a global instance
window.authManager = new AuthManager();
