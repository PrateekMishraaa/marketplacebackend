const express = require('express');
const router = express.Router();
const { body, query, param } = require('express-validator');
const { validate } = require('../middleware/validation');
const { protect } = require('../middleware/auth');
const { restrictTo } = require('../middleware/roleCheck');  // ✅ Check this import
const {
  getAllListings,
  getListingById,
  createListing,
  updateListing,
  deleteListing,
  getMyListings,
  searchListings,
  getListingsByCategory,
} = require('../controllers/listingController');

// @route   GET /api/listings
// @desc    Get all listings with filters
// @access  Public
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('category').optional().isString().withMessage('Category must be a string'),
    query('minPrice').optional().isFloat({ min: 0 }).withMessage('Min price must be a positive number'),
    query('maxPrice').optional().isFloat({ min: 0 }).withMessage('Max price must be a positive number'),
    query('sort').optional().isIn(['price_asc', 'price_desc', 'newest', 'oldest', 'popular']).withMessage('Invalid sort option'),
  ],
  validate,
  getAllListings
);

// @route   GET /api/listings/search
// @desc    Search listings by keyword
// @access  Public
router.get(
  '/search',
  [
    query('q').notEmpty().withMessage('Search query is required').isLength({ min: 1 }),
  ],
  validate,
  searchListings
);

// @route   GET /api/listings/category/:category
// @desc    Get listings by category
// @access  Public
router.get(
  '/category/:category',
  [
    param('category').notEmpty().withMessage('Category is required'),
  ],
  validate,
  getListingsByCategory
);

// @route   GET /api/listings/my-listings
// @desc    Get logged in seller's listings
// @access  Private (Seller)
router.get('/my-listings', protect, restrictTo('seller', 'admin'), getMyListings);

// @route   GET /api/listings/:id
// @desc    Get single listing by ID
// @access  Public
router.get(
  '/:id',
  [
    param('id').isInt().withMessage('Invalid listing ID'),
  ],
  validate,
  getListingById
);

// @route   POST /api/listings
// @desc    Create a new listing
// @access  Private (Seller)
router.post(
  '/',
  protect,
  restrictTo('seller', 'admin'),
  [
    body('title').trim().notEmpty().withMessage('Title is required').isLength({ min: 3, max: 200 }).withMessage('Title must be between 3 and 200 characters'),
    body('description').optional().isLength({ max: 2000 }).withMessage('Description cannot exceed 2000 characters'),
    body('price').isFloat({ min: 0.01 }).withMessage('Price must be greater than 0'),
    body('category').optional().isString().withMessage('Category must be a string'),
    body('imageUrl').optional().isURL().withMessage('Please provide a valid image URL'),
    body('stock').optional().isInt({ min: 0 }).withMessage('Stock must be a positive integer'),
  ],
  validate,
  createListing
);

// @route   PUT /api/listings/:id
// @desc    Update a listing
// @access  Private (Seller who owns the listing or Admin)
router.put(
  '/:id',
  protect,
  restrictTo('seller', 'admin'),
  [
    param('id').isInt().withMessage('Invalid listing ID'),
    body('title').optional().trim().isLength({ min: 3, max: 200 }).withMessage('Title must be between 3 and 200 characters'),
    body('description').optional().isLength({ max: 2000 }).withMessage('Description cannot exceed 2000 characters'),
    body('price').optional().isFloat({ min: 0.01 }).withMessage('Price must be greater than 0'),
    body('category').optional().isString().withMessage('Category must be a string'),
    body('imageUrl').optional().isURL().withMessage('Please provide a valid image URL'),
    body('stock').optional().isInt({ min: 0 }).withMessage('Stock must be a positive integer'),
    body('status').optional().isIn(['active', 'inactive', 'sold']).withMessage('Invalid status'),
  ],
  validate,
  updateListing
);

// @route   DELETE /api/listings/:id
// @desc    Delete a listing
// @access  Private (Seller who owns the listing or Admin)
router.delete(
  '/:id',
  protect,
  restrictTo('seller', 'admin'),
  [
    param('id').isInt().withMessage('Invalid listing ID'),
  ],
  validate,
  deleteListing
);

module.exports = router;