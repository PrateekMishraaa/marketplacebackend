const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const { validate } = require('../middleware/validation');
const { protect } = require('../middleware/auth');          // ✅ From auth.js
const { restrictTo } = require('../middleware/roleCheck');
const {
  createOrder,
  getMyOrders,
  getOrderById,
  markOrderComplete,
  getSellerOrders,
  cancelOrder,
} = require('../controllers/orderController');

// @route   POST /api/orders
// @desc    Create a new order
// @access  Private (Buyer)
router.post(
  '/',
  protect,
  restrictTo('buyer'),
  [
    body('listingId').isInt().withMessage('Listing ID is required and must be a number'),
    body('quantity').optional().isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
    body('shippingAddress').optional().isString().withMessage('Shipping address must be a string'),
    body('notes').optional().isString().withMessage('Notes must be a string'),
  ],
  validate,
  createOrder
);

// @route   GET /api/orders/my-orders
// @desc    Get logged in buyer's orders
// @access  Private (Buyer)
router.get(
  '/my-orders',
  protect,
  restrictTo('buyer'),
  [
    query('status').optional().isIn(['pending', 'approved', 'rejected', 'completed']).withMessage('Invalid status filter'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  ],
  validate,
  getMyOrders
);

// @route   GET /api/orders/seller-orders
// @desc    Get orders for seller's listings
// @access  Private (Seller)
router.get(
  '/seller-orders',
  protect,
  restrictTo('seller', 'admin'),
  [
    query('status').optional().isIn(['pending', 'approved', 'rejected', 'completed']).withMessage('Invalid status filter'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  ],
  validate,
  getSellerOrders
);

// @route   GET /api/orders/:id
// @desc    Get single order by ID
// @access  Private (Buyer who owns the order, Seller who owns the listing, or Admin)
router.get(
  '/:id',
  protect,
  [
    param('id').isInt().withMessage('Invalid order ID'),
  ],
  validate,
  getOrderById
);

// @route   PUT /api/orders/:id/complete
// @desc    Mark order as completed
// @access  Private (Buyer who owns the order)
router.put(
  '/:id/complete',
  protect,
  restrictTo('buyer'),
  [
    param('id').isInt().withMessage('Invalid order ID'),
  ],
  validate,
  markOrderComplete
);

// @route   PUT /api/orders/:id/cancel
// @desc    Cancel an order
// @access  Private (Buyer who owns the order)
router.put(
  '/:id/cancel',
  protect,
  restrictTo('buyer'),
  [
    param('id').isInt().withMessage('Invalid order ID'),
  ],
  validate,
  cancelOrder
);

module.exports = router;