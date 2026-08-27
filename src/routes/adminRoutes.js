const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const { validate } = require('../middleware/validation');
const { protect } = require('../middleware/auth');          // ✅ From auth.js
const { restrictTo } = require('../middleware/roleCheck');
const {
  getAllOrders,
  approveOrder,
  rejectOrder,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getDashboardStats,
  getAllListings,
  deleteListingAsAdmin,
  getOrderAnalytics,
} = require('../controllers/adminController');

// ==================== DASHBOARD ====================

// @route   GET /api/admin/dashboard/stats
// @desc    Get dashboard statistics
// @access  Private (Admin)
router.get('/dashboard/stats', protect, restrictTo('admin'), getDashboardStats);

// @route   GET /api/admin/dashboard/analytics
// @desc    Get order analytics
// @access  Private (Admin)
router.get(
  '/dashboard/analytics',
  protect,
  restrictTo('admin'),
  [
    query('period').optional().isIn(['today', 'week', 'month', 'year']).withMessage('Invalid period'),
  ],
  validate,
  getOrderAnalytics
);

// ==================== ORDERS ====================

// @route   GET /api/admin/orders
// @desc    Get all orders with filters
// @access  Private (Admin)
router.get(
  '/orders',
  protect,
  restrictTo('admin'),
  [
    query('status').optional().isIn(['pending', 'approved', 'rejected', 'completed']).withMessage('Invalid status filter'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('sort').optional().isIn(['newest', 'oldest', 'amount_high', 'amount_low']).withMessage('Invalid sort option'),
  ],
  validate,
  getAllOrders
);

// @route   PUT /api/admin/orders/:id/approve
// @desc    Approve an order
// @access  Private (Admin)
router.put(
  '/orders/:id/approve',
  protect,
  restrictTo('admin'),
  [
    param('id').isInt().withMessage('Invalid order ID'),
    body('notes').optional().isString().withMessage('Notes must be a string'),
  ],
  validate,
  approveOrder
);

// @route   PUT /api/admin/orders/:id/reject
// @desc    Reject an order
// @access  Private (Admin)
router.put(
  '/orders/:id/reject',
  protect,
  restrictTo('admin'),
  [
    param('id').isInt().withMessage('Invalid order ID'),
    body('reason').optional().isString().withMessage('Reason must be a string'),
  ],
  validate,
  rejectOrder
);

// ==================== USERS ====================

// @route   GET /api/admin/users
// @desc    Get all users
// @access  Private (Admin)
router.get(
  '/users',
  protect,
  restrictTo('admin'),
  [
    query('role').optional().isIn(['buyer', 'seller', 'admin']).withMessage('Invalid role filter'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('search').optional().isString().withMessage('Search must be a string'),
  ],
  validate,
  getAllUsers
);

// @route   GET /api/admin/users/:id
// @desc    Get single user by ID
// @access  Private (Admin)
router.get(
  '/users/:id',
  protect,
  restrictTo('admin'),
  [
    param('id').isInt().withMessage('Invalid user ID'),
  ],
  validate,
  getUserById
);

// @route   PUT /api/admin/users/:id
// @desc    Update user
// @access  Private (Admin)
router.put(
  '/users/:id',
  protect,
  restrictTo('admin'),
  [
    param('id').isInt().withMessage('Invalid user ID'),
    body('name').optional().trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
    body('email').optional().isEmail().withMessage('Please provide a valid email'),
    body('role').optional().isIn(['buyer', 'seller', 'admin']).withMessage('Invalid role'),
    body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
    body('phone').optional().isMobilePhone().withMessage('Please provide a valid phone number'),
  ],
  validate,
  updateUser
);

// @route   DELETE /api/admin/users/:id
// @desc    Delete user
// @access  Private (Admin)
router.delete(
  '/users/:id',
  protect,
  restrictTo('admin'),
  [
    param('id').isInt().withMessage('Invalid user ID'),
  ],
  validate,
  deleteUser
);

// ==================== LISTINGS ====================

// @route   GET /api/admin/listings
// @desc    Get all listings
// @access  Private (Admin)
router.get(
  '/listings',
  protect,
  restrictTo('admin'),
  [
    query('status').optional().isIn(['active', 'inactive', 'sold']).withMessage('Invalid status filter'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  ],
  validate,
  getAllListings
);

// @route   DELETE /api/admin/listings/:id
// @desc    Delete listing (Admin)
// @access  Private (Admin)
router.delete(
  '/listings/:id',
  protect,
  restrictTo('admin'),
  [
    param('id').isInt().withMessage('Invalid listing ID'),
  ],
  validate,
  deleteListingAsAdmin
);

module.exports = router;