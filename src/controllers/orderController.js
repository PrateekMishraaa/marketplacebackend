const { Order, Listing, User } = require('../models');
const { AppError } = require('../utils/errorHandler');
const { successResponse } = require('../utils/responseHandler');
const { Op } = require('sequelize');

// @desc    Create a new order
// @route   POST /api/orders
// @access  Private (Buyer)
const createOrder = async (req, res, next) => {
  try {
    const { listingId, quantity = 1, shippingAddress, notes } = req.body;

    // Check if listing exists and is active
    const listing = await Listing.findByPk(listingId);
    if (!listing) {
      return next(new AppError('Listing not found', 404));
    }

    if (listing.status !== 'active') {
      return next(new AppError('This listing is not available for purchase', 400));
    }

    if (listing.stock < quantity) {
      return next(new AppError('Insufficient stock available', 400));
    }

    // Check if user is trying to buy their own listing
    if (listing.sellerId === req.user.id) {
      return next(new AppError('You cannot purchase your own listing', 400));
    }

    // Calculate total price
    const totalPrice = listing.price * quantity;

    // Create order
    const order = await Order.create({
      buyerId: req.user.id,
      listingId,
      quantity,
      totalPrice,
      shippingAddress: shippingAddress || null,
      notes: notes || null,
      status: 'pending',
    });

    // Reduce stock
    listing.stock -= quantity;
    if (listing.stock === 0) {
      listing.status = 'sold';
    }
    await listing.save();

    // Fetch order with details
    const orderWithDetails = await Order.findByPk(order.id, {
      include: [
        {
          model: User,
          as: 'buyer',
          attributes: ['id', 'name', 'email'],
        },
        {
          model: Listing,
          as: 'listing',
          include: [
            {
              model: User,
              as: 'seller',
              attributes: ['id', 'name', 'email'],
            },
          ],
        },
      ],
    });

    successResponse(res, orderWithDetails, 'Order placed successfully', 201);
  } catch (error) {
    next(error);
  }
};

// @desc    Get logged in buyer's orders
// @route   GET /api/orders/my-orders
// @access  Private (Buyer)
const getMyOrders = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const where = { buyerId: req.user.id };
    if (status) where.status = status;

    const { count, rows } = await Order.findAndCountAll({
      where,
      include: [
        {
          model: Listing,
          as: 'listing',
          include: [
            {
              model: User,
              as: 'seller',
              attributes: ['id', 'name', 'email'],
            },
          ],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    successResponse(res, {
      orders: rows,
      total: count,
      page: parseInt(page),
      totalPages: Math.ceil(count / limit),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get orders for seller's listings
// @route   GET /api/orders/seller-orders
// @access  Private (Seller)
const getSellerOrders = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    // Get all listings by this seller
    const listings = await Listing.findAll({
      where: { sellerId: req.user.id },
      attributes: ['id'],
    });

    const listingIds = listings.map(l => l.id);

    if (listingIds.length === 0) {
      return successResponse(res, {
        orders: [],
        total: 0,
        page: 1,
        totalPages: 0,
      });
    }

    const where = { listingId: { [Op.in]: listingIds } };
    if (status) where.status = status;

    const { count, rows } = await Order.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'buyer',
          attributes: ['id', 'name', 'email', 'phone'],
        },
        {
          model: Listing,
          as: 'listing',
          attributes: ['id', 'title', 'price'],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    successResponse(res, {
      orders: rows,
      total: count,
      page: parseInt(page),
      totalPages: Math.ceil(count / limit),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single order by ID
// @route   GET /api/orders/:id
// @access  Private (Buyer who owns the order, Seller who owns the listing, or Admin)
const getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const order = await Order.findByPk(id, {
      include: [
        {
          model: User,
          as: 'buyer',
          attributes: ['id', 'name', 'email', 'phone'],
        },
        {
          model: Listing,
          as: 'listing',
          include: [
            {
              model: User,
              as: 'seller',
              attributes: ['id', 'name', 'email', 'phone'],
            },
          ],
        },
      ],
    });

    if (!order) {
      return next(new AppError('Order not found', 404));
    }

    // Check access: buyer who owns the order, seller who owns the listing, or admin
    const isBuyer = order.buyerId === req.user.id;
    const isSeller = order.listing.sellerId === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isBuyer && !isSeller && !isAdmin) {
      return next(new AppError('You do not have permission to view this order', 403));
    }

    successResponse(res, order);
  } catch (error) {
    next(error);
  }
};

// @desc    Mark order as completed
// @route   PUT /api/orders/:id/complete
// @access  Private (Buyer who owns the order)
const markOrderComplete = async (req, res, next) => {
  try {
    const { id } = req.params;

    const order = await Order.findByPk(id);
    if (!order) {
      return next(new AppError('Order not found', 404));
    }

    // Check if buyer owns the order
    if (order.buyerId !== req.user.id) {
      return next(new AppError('You do not have permission to update this order', 403));
    }

    // Check if order is approved
    if (order.status !== 'approved') {
      return next(new AppError('Order must be approved before completion', 400));
    }

    order.status = 'completed';
    order.completedAt = new Date();
    await order.save();

    successResponse(res, order, 'Order marked as completed');
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel an order
// @route   PUT /api/orders/:id/cancel
// @access  Private (Buyer who owns the order)
const cancelOrder = async (req, res, next) => {
  try {
    const { id } = req.params;

    const order = await Order.findByPk(id);
    if (!order) {
      return next(new AppError('Order not found', 404));
    }

    // Check if buyer owns the order
    if (order.buyerId !== req.user.id) {
      return next(new AppError('You do not have permission to cancel this order', 403));
    }

    // Check if order can be cancelled (only pending)
    if (order.status !== 'pending') {
      return next(new AppError('Only pending orders can be cancelled', 400));
    }

    order.status = 'rejected';
    await order.save();

    // Restore stock
    const listing = await Listing.findByPk(order.listingId);
    if (listing) {
      listing.stock += order.quantity;
      if (listing.status === 'sold' && listing.stock > 0) {
        listing.status = 'active';
      }
      await listing.save();
    }

    successResponse(res, order, 'Order cancelled successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getSellerOrders,
  getOrderById,
  markOrderComplete,
  cancelOrder,
};