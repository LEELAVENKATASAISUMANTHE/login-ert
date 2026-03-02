/**
 * Role-based Authorization Middleware
 *
 * Usage:
 *   router.get('/admin', authenticate, requireRole(['ADMIN', 'SUPER_ADMIN']), handler);
 *
 * Must be used AFTER the `authenticate` middleware, which attaches `req.user`.
 * Checks that `req.user.role_name` is in the allowed list.
 */

import logger from '../utils/logger.js';

/**
 * Returns Express middleware that allows only the listed roles.
 * @param {string[]} allowedRoles — e.g. ['ADMIN', 'SUPER_ADMIN']
 */
export const requireRole = (allowedRoles = []) => {
  // Normalise to upper-case for case-insensitive comparison
  const normalised = allowedRoles.map((r) => r.toUpperCase());

  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Authentication required.' });
      }

      const userRole = (req.user.role_name || '').toUpperCase();

      if (!normalised.includes(userRole)) {
        logger.warn('Role authorization denied', {
          user_id: req.user.user_id,
          role: req.user.role_name,
          required: allowedRoles,
          path: req.originalUrl,
        });

        return res.status(403).json({
          success: false,
          message: 'Access denied. Insufficient permissions.',
        });
      }

      return next();
    } catch (err) {
      logger.error('requireRole middleware error', { error: err.message, stack: err.stack });
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  };
};
