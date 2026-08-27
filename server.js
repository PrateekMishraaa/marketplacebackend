const app = require('./src/app');
const dotenv = require('dotenv');
const { sequelize, User, Listing, Order } = require('./src/models');
const bcrypt = require('bcryptjs');

dotenv.config();

const PORT = process.env.PORT || 5000;

// ✅ Function to seed database (only if no users exist)
async function seedDatabase() {
  try {
    const userCount = await User.count();
    
    if (userCount === 0) {
      console.log('🔄 No users found. Seeding database...');
      
      const salt = await bcrypt.genSalt(10);
      
      // Create users
      const users = await User.bulkCreate([
        {
          name: 'Admin User',
          email: 'admin@test.com',
          password: await bcrypt.hash('password', salt),
          role: 'admin',
          isActive: true,
        },
        {
          name: 'Rahul Buyer',
          email: 'buyer@test.com',
          password: await bcrypt.hash('password', salt),
          role: 'buyer',
          isActive: true,
        },
        {
          name: 'Priya Seller',
          email: 'seller@test.com',
          password: await bcrypt.hash('password', salt),
          role: 'seller',
          isActive: true,
        },
        {
          name: 'Amit Kumar',
          email: 'amit@test.com',
          password: await bcrypt.hash('password', salt),
          role: 'buyer',
          isActive: true,
        },
        {
          name: 'Neha Gupta',
          email: 'neha@test.com',
          password: await bcrypt.hash('password', salt),
          role: 'seller',
          isActive: true,
        },
      ]);
      
      console.log(`✅ Created ${users.length} users`);
      
      // Get sellers and buyer
      const sellers = await User.findAll({ where: { role: 'seller' } });
      const buyer = await User.findOne({ where: { email: 'buyer@test.com' } });
      
      // Create listings if sellers exist
      if (sellers.length > 0 && buyer) {
        const listings = await Listing.bulkCreate([
          {
            sellerId: sellers[0]?.id,
            title: 'MacBook Pro 14"',
            description: 'Apple M2 Pro chip, 16GB RAM, 512GB SSD',
            price: 1299.00,
            category: 'Electronics',
            imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=300&fit=crop',
            stock: 5,
            status: 'active',
          },
          {
            sellerId: sellers[0]?.id,
            title: 'iPhone 15 Pro Max',
            description: '6.7-inch display, 256GB, Titanium',
            price: 1199.00,
            category: 'Electronics',
            imageUrl: 'https://images.unsplash.com/photo-1696446701796-da61225697cc?w=400&h=300&fit=crop',
            stock: 3,
            status: 'active',
          },
          {
            sellerId: sellers[1]?.id || sellers[0]?.id,
            title: 'Samsung 65" QLED TV',
            description: '4K Smart TV, Quantum HDR',
            price: 899.00,
            category: 'Electronics',
            imageUrl: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400&h=300&fit=crop',
            stock: 8,
            status: 'active',
          },
          {
            sellerId: sellers[1]?.id || sellers[0]?.id,
            title: 'Sony WH-1000XM5',
            description: 'Wireless Noise Cancelling Headphones',
            price: 399.00,
            category: 'Accessories',
            imageUrl: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=400&h=300&fit=crop',
            stock: 10,
            status: 'active',
          },
        ]);
        
        console.log(`✅ Created ${listings.length} listings`);
        
        // Create orders
        if (listings.length > 0) {
          await Order.bulkCreate([
            {
              buyerId: buyer.id,
              listingId: listings[0].id,
              quantity: 1,
              totalPrice: 1299.00,
              status: 'pending',
              shippingAddress: '123 Main Street, Mumbai, India',
            },
            {
              buyerId: buyer.id,
              listingId: listings[2].id,
              quantity: 2,
              totalPrice: 1798.00,
              status: 'approved',
              shippingAddress: '456 Park Avenue, Delhi, India',
            },
          ]);
          
          console.log('✅ Created orders');
        }
      }
      
      console.log('✅ Database seeded successfully!');
      console.log('📋 Test Credentials:');
      console.log('  Buyer:  buyer@test.com / password');
      console.log('  Seller: seller@test.com / password');
      console.log('  Admin:  admin@test.com / password');
    } else {
      console.log(`✅ Database already has ${userCount} users. Skipping seed.`);
    }
  } catch (error) {
    console.error('❌ Seeding error:', error.message);
  }
}

// ✅ Main server startup
sequelize.authenticate()
  .then(() => {
    console.log('✅ PostgreSQL connected successfully');
    
    // ✅ Sync database (creates tables if they don't exist)
    return sequelize.sync({ alter: true });
  })
  .then(() => {
    console.log('✅ Database synced');
    
    // ✅ Auto-seed if no users exist
    return seedDatabase();
  })
  .then(() => {
    // ✅ Start server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📝 Environment: ${process.env.NODE_ENV}`);
    });
  })
  .catch((error) => {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  });