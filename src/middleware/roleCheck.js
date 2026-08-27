const { AppError } = require('../utils/errorHandler');

/**
 * Restrict access to specific roles
 * @param  {...string} roles - Allowed roles
 * @returns {Function} Middleware function
 */
const restrictTo = (...roles) => {
  return (req, res, next) => {
    // Check if user is authenticated
    if (!req.user) {
      return next(new AppError('You are not logged in. Please login to continue.', 401));
    }

    // Check if user has required role
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(
          `Access denied. This action requires one of these roles: ${roles.join(', ')}. You have: ${req.user.role}`,
          403
        )
      );
    }

    next();
  };
};

// ✅ CORRECT EXPORT - Make sure this is exactly like this
module.exports = {
  restrictTo,
};