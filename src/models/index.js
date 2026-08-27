const sequelize = require('../config/database');
const User = require('./User');
const Listing = require('./Listing');
const Order = require('./Order');

// Define Associations
User.hasMany(Listing, { foreignKey: 'sellerId', as: 'listings' });
Listing.belongsTo(User, { foreignKey: 'sellerId', as: 'seller' });

User.hasMany(Order, { foreignKey: 'buyerId', as: 'orders' });
Order.belongsTo(User, { foreignKey: 'buyerId', as: 'buyer' });

Listing.hasMany(Order, { foreignKey: 'listingId', as: 'orders' });
Order.belongsTo(Listing, { foreignKey: 'listingId', as: 'listing' });

module.exports = {
  sequelize,
  User,
  Listing,
  Order,
};