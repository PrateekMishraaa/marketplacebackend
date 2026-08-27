// Test imports
try {
  const orderController = require('./src/controllers/orderController');
  console.log('✅ orderController loaded successfully');
  console.log('Available functions:', Object.keys(orderController));
  
  const authController = require('./src/controllers/authController');
  console.log('✅ authController loaded successfully');
  console.log('Available functions:', Object.keys(authController));
  
  const listingController = require('./src/controllers/listingController');
  console.log('✅ listingController loaded successfully');
  console.log('Available functions:', Object.keys(listingController));
  
  const adminController = require('./src/controllers/adminController');
  console.log('✅ adminController loaded successfully');
  console.log('Available functions:', Object.keys(adminController));
} catch (error) {
  console.error('❌ Error loading controller:', error.message);
}