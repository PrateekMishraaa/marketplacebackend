const { verifyToken } = require('../utils/generateToken');
const { AppError } = require('../utils/errorHandler');

/**
 * Protect routes - verify JWT token
 */
const protect = async (req, res, next) => {
  try {
    let token;

    // Check if token exists in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // If no token, return error
    if (!token) {
      return next(new AppError('You are not logged in. Please login to continue.', 401));
    }

    // Verify token
    const decoded = verifyToken(token);

    // If token is invalid, return error
    if (!decoded) {
      return next(new AppError('Invalid token. Please login again.', 401));
    }

    // Attach user info to request
    req.user = decoded;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  protect,
};