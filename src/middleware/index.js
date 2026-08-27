const { protect } = require('./auth');
const { restrictTo } = require('./roleCheck');
const { validate } = require('./validation');

module.exports = {
  protect,
  restrictTo,
  validate,
};