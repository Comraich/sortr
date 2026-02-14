/**
 * Admin authorization middleware
 *
 * Checks if the authenticated user has admin privileges.
 * Must be used after authenticateToken middleware.
 */
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (!req.user.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  next();
};

module.exports = { requireAdmin };
