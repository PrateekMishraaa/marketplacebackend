const { User, Listing, Order } = require('../models');
const { AppError } = require('../utils/errorHandler');
const { successResponse } = require('../utils/responseHandler');
const { Op, Sequelize } = require('sequelize');

// ==================== DASHBOARD ====================

// @desc    Get dashboard statistics
// @route   GET /api/admin/dashboard/stats
// @access  Private (Admin)
const getDashboardStats = async (req, res, next) => {
  try {
    const totalUsers = await User.count();
    const totalListings = await Listing.count();
    const totalOrders = await Order.count();

    const pendingOrders = await Order.count({ where: { status: 'pending' } });
    const completedOrders = await Order.count({ where: { status: 'completed' } });

    const revenueResult = await Order.sum('totalPrice', {
      where: { status: 'completed' },
    });

    // Recent orders (last 10)
    const recentOrders = await Order.findAll({
      limit: 10,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: User,
          as: 'buyer',
          attributes: ['id', 'name', 'email'],
        },
        {
          model: Listing,
          as: 'listing',
          attributes: ['id', 'title'],
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

    successResponse(res, {
      totalUsers,
      totalListings,
      totalOrders,
      pendingOrders,
      completedOrders,
      revenue: revenueResult || 0,
      recentOrders,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get order analytics
// @route   GET /api/admin/dashboard/analytics
// @access  Private (Admin)
const getOrderAnalytics = async (req, res, next) => {
  try {
    const { period = 'week' } = req.query;

    let dateFilter;
    const now = new Date();

    switch (period) {
      case 'today':
        dateFilter = new Date(now.setHours(0, 0, 0, 0));
        break;
      case 'week':
        dateFilter = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        dateFilter = new Date(now.setMonth(now.getMonth() - 1));
        break;
      case 'year':
        dateFilter = new Date(now.setFullYear(now.getFullYear() - 1));
        break;
      default:
        dateFilter = new Date(now.setDate(now.getDate() - 7));
    }

    const orders = await Order.findAll({
      where: {
        createdAt: { [Op.gte]: dateFilter },
      },
      attributes: [
        [Sequelize.fn('DATE', Sequelize.col('createdAt')), 'date'],
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count'],
        [Sequelize.fn('SUM', Sequelize.col('total_price')), 'total'],
      ],
      group: [Sequelize.fn('DATE', Sequelize.col('createdAt'))],
      order: [[Sequelize.fn('DATE', Sequelize.col('createdAt')), 'ASC']],
    });

    // Status distribution
    const statusDistribution = await Order.findAll({
      attributes: [
        'status',
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count'],
      ],
      group: ['status'],
    });

    successResponse(res, {
      period,
      data: orders,
      statusDistribution,
    });
  } catch (error) {
    next(error);
  }
};

// ==================== ORDERS ====================

// @desc    Get all orders with filters
// @route   GET /api/admin/orders
// @access  Private (Admin)
const getAllOrders = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20, sort = 'newest' } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (status) where.status = status;

    let order = [];
    switch (sort) {
      case 'newest': order = [['createdAt', 'DESC']]; break;
      case 'oldest': order = [['createdAt', 'ASC']]; break;
      case 'amount_high': order = [['totalPrice', 'DESC']]; break;
      case 'amount_low': order = [['totalPrice', 'ASC']]; break;
      default: order = [['createdAt', 'DESC']];
    }

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
          include: [
            {
              model: User,
              as: 'seller',
              attributes: ['id', 'name', 'email'],
            },
          ],
        },
      ],
      order,
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

// @desc    Approve an order
// @route   PUT /api/admin/orders/:id/approve
// @access  Private (Admin)
const approveOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const order = await Order.findByPk(id);
    if (!order) {
      return next(new AppError('Order not found', 404));
    }

    if (order.status !== 'pending') {
      return next(new AppError('Only pending orders can be approved', 400));
    }

    order.status = 'approved';
    order.approvedAt = new Date();
    if (notes) order.notes = notes;

    await order.save();

    // Fetch updated order
    const updatedOrder = await Order.findByPk(id, {
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

    successResponse(res, updatedOrder, 'Order approved successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Reject an order
// @route   PUT /api/admin/orders/:id/reject
// @access  Private (Admin)
const rejectOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const order = await Order.findByPk(id);
    if (!order) {
      return next(new AppError('Order not found', 404));
    }

    if (order.status !== 'pending') {
      return next(new AppError('Only pending orders can be rejected', 400));
    }

    order.status = 'rejected';
    if (reason) order.notes = reason;

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

    // Fetch updated order
    const updatedOrder = await Order.findByPk(id, {
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

    successResponse(res, updatedOrder, 'Order rejected successfully');
  } catch (error) {
    next(error);
  }
};

// ==================== USERS ====================

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private (Admin)
const getAllUsers = async (req, res, next) => {
  try {
    const { role, page = 1, limit = 20, search } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (role) where.role = role;
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const { count, rows } = await User.findAndCountAll({
      where,
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    successResponse(res, {
      users: rows,
      total: count,
      page: parseInt(page),
      totalPages: Math.ceil(count / limit),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single user by ID
// @route   GET /api/admin/users/:id
// @access  Private (Admin)
const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id, {
      attributes: { exclude: ['password'] },
      include: [
        {
          model: Listing,
          as: 'listings',
          limit: 5,
          order: [['createdAt', 'DESC']],
        },
        {
          model: Order,
          as: 'orders',
          limit: 5,
          order: [['createdAt', 'DESC']],
        },
      ],
    });

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    successResponse(res, user);
  } catch (error) {
    next(error);
  }
};

// @desc    Update user
// @route   PUT /api/admin/users/:id
// @access  Private (Admin)
const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email, role, isActive, phone } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return next(new AppError('User not found', 404));
    }

    // Prevent admin from changing own role
    if (id === req.user.id && role && role !== user.role) {
      return next(new AppError('Admin cannot change their own role', 400));
    }

    if (name) user.name = name;
    if (email) user.email = email;
    if (role) user.role = role;
    if (isActive !== undefined) user.isActive = isActive;
    if (phone) user.phone = phone;

    await user.save();

    const userData = user.toJSON();
    delete userData.password;

    successResponse(res, userData, 'User updated successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin)
const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Prevent admin from deleting themselves
    if (id === req.user.id) {
      return next(new AppError('Admin cannot delete their own account', 400));
    }

    const user = await User.findByPk(id);
    if (!user) {
      return next(new AppError('User not found', 404));
    }

    await user.destroy();

    successResponse(res, null, 'User deleted successfully');
  } catch (error) {
    next(error);
  }
};

// ==================== LISTINGS ====================

// @desc    Get all listings
// @route   GET /api/admin/listings
// @access  Private (Admin)
const getAllListings = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (status) where.status = status;

    const { count, rows } = await Listing.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'seller',
          attributes: ['id', 'name', 'email'],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
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

// @desc    Delete listing (Admin)
// @route   DELETE /api/admin/listings/:id
// @access  Private (Admin)
const deleteListingAsAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;

    const listing = await Listing.findByPk(id);
    if (!listing) {
      return next(new AppError('Listing not found', 404));
    }

    await listing.destroy();

    successResponse(res, null, 'Listing deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  // Dashboard
  getDashboardStats,
  getOrderAnalytics,

  // Orders
  getAllOrders,
  approveOrder,
  rejectOrder,

  // Users
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,

  // Listings
  getAllListings,
  deleteListingAsAdmin,
};