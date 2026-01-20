try {
  module.exports = require('@proyecto/shared-auth/src/services/authService');
} catch (err) {
  module.exports = require('../fallback/authService');
}
