const { Listing, User, Order } = require('../models');
const { AppError } = require('../utils/errorHandler');
const { successResponse } = require('../utils/responseHandler');
const { Op } = require('sequelize');

// @desc    Get all listings with filters
// @route   GET /api/listings
// @access  Public
const getAllListings = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      minPrice,
      maxPrice,
      sort = 'newest',
    } = req.query;

    const offset = (page - 1) * limit;

    // Build filter
    const where = { status: 'active' };
    if (category) where.category = category;
    if (minPrice) where.price = { [Op.gte]: parseFloat(minPrice) };
    if (maxPrice) where.price = { ...where.price, [Op.lte]: parseFloat(maxPrice) };

    // Build sort
    let order = [];
    switch (sort) {
      case 'price_asc': order = [['price', 'ASC']]; break;
      case 'price_desc': order = [['price', 'DESC']]; break;
      case 'newest': order = [['createdAt', 'DESC']]; break;
      case 'oldest': order = [['createdAt', 'ASC']]; break;
      case 'popular': order = [['views', 'DESC']]; break;
      default: order = [['createdAt', 'DESC']];
    }

    const { count, rows } = await Listing.findAndCountAll({
      where,
      order,
      limit: parseInt(limit),
      offset: parseInt(offset),
      include: [
        {
          model: User,
          as: 'seller',
          attributes: ['id', 'name', 'email'],
        },
      ],
    });

    successResponse(res, {
      listings: rows,
      total: count,
      page: parseInt(page),
      totalPages: Math.ceil(count / limit),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Search listings by keyword
// @route   GET /api/listings/search
// @access  Public
const searchListings = async (req, res, next) => {
  try {
    const { q } = req.query;

    const listings = await Listing.findAll({
      where: {
        status: 'active',
        [Op.or]: [
          { title: { [Op.iLike]: `%${q}%` } },
          { description: { [Op.iLike]: `%${q}%` } },
          { category: { [Op.iLike]: `%${q}%` } },
        ],
      },
      include: [
        {
          model: User,
          as: 'seller',
          attributes: ['id', 'name', 'email'],
        },
      ],
    });

    successResponse(res, listings, 'Search results fetched successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Get listings by category
// @route   GET /api/listings/category/:category
// @access  Public
const getListingsByCategory = async (req, res, next) => {
  try {
    const { category } = req.params;

    const listings = await Listing.findAll({
      where: {
        status: 'active',
        category,
      },
      include: [
        {
          model: User,
          as: 'seller',
          attributes: ['id', 'name', 'email'],
        },
      ],
    });

    successResponse(res, listings, `Listings in ${category} category`);
  } catch (error) {
    next(error);
  }
};

// @desc    Get single listing by ID
// @route   GET /api/listings/:id
// @access  Public
const getListingById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const listing = await Listing.findByPk(id, {
      include: [
        {
          model: User,
          as: 'seller',
          attributes: ['id', 'name', 'email', 'phone'],
        },
      ],
    });

    if (!listing) {
      return next(new AppError('Listing not found', 404));
    }

    // Increment views
    listing.views += 1;
    await listing.save();

    successResponse(res, listing);
  } catch (error) {
    next(error);
  }
};

// @desc    Get logged in seller's listings
// @route   GET /api/listings/my-listings
// @access  Private (Seller)
const getMyListings = async (req, res, next) => {
  try {
    const listings = await Listing.findAll({
      where: { sellerId: req.user.id },
      include: [
        {
          model: Order,
          as: 'orders',
          attributes: ['id', 'status', 'quantity', 'totalPrice'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    successResponse(res, listings);
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new listing
// @route   POST /api/listings
// @access  Private (Seller)
const createListing = async (req, res, next) => {
  try {
    const { title, description, price, category, imageUrl, stock } = req.body;

    const listing = await Listing.create({
      sellerId: req.user.id,
      title,
      description,
      price,
      category,
      imageUrl,
      stock: stock || 1,
    });

    successResponse(res, listing, 'Listing created successfully', 201);
  } catch (error) {
    next(error);
  }
};

// @desc    Update a listing
// @route   PUT /api/listings/:id
// @access  Private (Seller who owns the listing or Admin)
const updateListing = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, price, category, imageUrl, stock, status } = req.body;

    const listing = await Listing.findByPk(id);
    if (!listing) {
      return next(new AppError('Listing not found', 404));
    }

    // Check ownership (seller or admin)
    if (listing.sellerId !== req.user.id && req.user.role !== 'admin') {
      return next(new AppError('You do not have permission to update this listing', 403));
    }

    // Update fields
    if (title) listing.title = title;
    if (description) listing.description = description;
    if (price) listing.price = price;
    if (category) listing.category = category;
    if (imageUrl) listing.imageUrl = imageUrl;
    if (stock !== undefined) listing.stock = stock;
    if (status) listing.status = status;

    await listing.save();

    successResponse(res, listing, 'Listing updated successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a listing
// @route   DELETE /api/listings/:id
// @access  Private (Seller who owns the listing or Admin)
const deleteListing = async (req, res, next) => {
  try {
    const { id } = req.params;

    const listing = await Listing.findByPk(id);
    if (!listing) {
      return next(new AppError('Listing not found', 404));
    }

    // Check ownership
    if (listing.sellerId !== req.user.id && req.user.role !== 'admin') {
      return next(new AppError('You do not have permission to delete this listing', 403));
    }

    await listing.destroy();

    successResponse(res, null, 'Listing deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllListings,
  searchListings,
  getListingsByCategory,
  getListingById,
  getMyListings,
  createListing,
  updateListing,
  deleteListing,
};