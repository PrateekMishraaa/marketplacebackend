const { sequelize } = require('./src/models');

async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection successful!');
    console.log('📊 Database:', process.env.DB_NAME);
    console.log('👤 User:', process.env.DB_USER);
    process.exit(0);
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.log('\n💡 Fix: Check DB_PASSWORD in .env');
    process.exit(1);
  }
}

testConnection();