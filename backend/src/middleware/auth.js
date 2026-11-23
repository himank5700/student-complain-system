const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'complaint_system_dev_secret_key_btech_2026_xyz987';

/**
 * Middleware: Verify JWT Authentication Token
 * Validates the Authorization header (Bearer <token>)
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  // Header format: "Bearer <token>"
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No authentication token provided.'
    });
  }

  jwt.verify(token, JWT_SECRET, (err, decodedUser) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: 'Invalid or expired authentication token. Please log in again.'
      });
    }

    // Attach decoded user information (id, email, role, name) to request
    req.user = decodedUser;
    next();
  });
}

/**
 * Middleware: Role-Based Authorization
 * Allows restricting an endpoint to specific roles (e.g. 'admin')
 */
function requireRole(requiredRole) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    if (req.user.role !== requiredRole) {
      return res.status(403).json({
        success: false,
        message: `Forbidden. This action requires ${requiredRole} privileges.`
      });
    }

    next();
  };
}

// Shortcut middleware specifically for administrators
const requireAdmin = requireRole('admin');

module.exports = {
  authenticateToken,
  requireRole,
  requireAdmin,
  JWT_SECRET
};
