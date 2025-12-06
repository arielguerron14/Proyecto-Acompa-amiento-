// Simple in-memory cache. Replace with Redis for production.
const cache = new Map();

module.exports = {
  set(token, user) {
    cache.set(token, user);
  },
  get(token) {
    return cache.get(token);
  },
  delete(token) {
    cache.delete(token);
  },
  has(token) {
    return cache.has(token);
  },
  clear() {
    cache.clear();
  }
};
