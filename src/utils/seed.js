const bcrypt = require('bcryptjs');
const { sequelize, User, Listing, Order } = require('../models');

const seedDatabase = async () => {
  try {
    // Sync database
    await sequelize.sync({ force: true });
    console.log('✅ Database synced successfully');

    // Create users
    const salt = await bcrypt.genSalt(10);

    const users = await User.bulkCreate([
      {
        name: 'Admin User',
        email: 'admin@test.com',
        password: await bcrypt.hash('password', salt),
        role: 'admin',
      },
      {
        name: 'Rahul Buyer',
        email: 'buyer@test.com',
        password: await bcrypt.hash('password', salt),
        role: 'buyer',
      },
      {
        name: 'Priya Seller',
        email: 'seller@test.com',
        password: await bcrypt.hash('password', salt),
        role: 'seller',
      },
      {
        name: 'Amit Kumar',
        email: 'amit@test.com',
        password: await bcrypt.hash('password', salt),
        role: 'buyer',
      },
      {
        name: 'Neha Gupta',
        email: 'neha@test.com',
        password: await bcrypt.hash('password', salt),
        role: 'seller',
      },
    ]);

    console.log(`✅ Created ${users.length} users`);

    // Get seller IDs
    const sellers = await User.findAll({ where: { role: 'seller' } });
    const buyer = await User.findOne({ where: { email: 'buyer@test.com' } });

    // Create listings
    const listings = await Listing.bulkCreate([
      {
        sellerId: sellers[0].id,
        title: 'MacBook Pro 14"',
        description: 'Apple M2 Pro chip with 12-core CPU, 16-core GPU, 16GB RAM, 512GB SSD. 14.2-inch Liquid Retina XDR display.',
        price: 1299.00,
        category: 'Electronics',
        imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=300&fit=crop',
        stock: 5,
        status: 'active',
      },
      {
        sellerId: sellers[0].id,
        title: 'iPhone 15 Pro Max',
        description: '6.7-inch Super Retina XDR display, 256GB storage, Titanium body, A17 Pro chip, 48MP main camera.',
        price: 1199.00,
        category: 'Electronics',
        imageUrl: 'https://images.unsplash.com/photo-1696446701796-da61225697cc?w=400&h=300&fit=crop',
        stock: 3,
        status: 'active',
      },
      {
        sellerId: sellers[1].id,
        title: 'Samsung 65" QLED TV',
        description: '65-inch 4K QLED TV with Quantum HDR, 100% Color Volume, Object Tracking Sound, and Smart TV features.',
        price: 899.00,
        category: 'Electronics',
        imageUrl: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400&h=300&fit=crop',
        stock: 8,
        status: 'active',
      },
      {
        sellerId: sellers[1].id,
        title: 'Sony WH-1000XM5',
        description: 'Wireless Noise Cancelling Headphones with 30-hour battery life, Premium sound quality.',
        price: 399.00,
        category: 'Accessories',
        imageUrl: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=400&h=300&fit=crop',
        stock: 10,
        status: 'active',
      },
    ]);

    console.log(`✅ Created ${listings.length} listings`);

    // Create orders
    const orders = await Order.bulkCreate([
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

    console.log(`✅ Created ${orders.length} orders`);

    console.log('✅ Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seedDatabase();