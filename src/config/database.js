const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');

dotenv.config();

// ✅ Check if DATABASE_URL exists
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set!');
  console.error('Please add DATABASE_URL in Render Environment Variables');
  process.exit(1);
}

console.log('🔍 Connecting to database...');

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});

module.exports = sequelize;