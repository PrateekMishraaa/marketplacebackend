const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');

dotenv.config();

// ✅ Use DATABASE_URL if available (Render), otherwise use individual variables
const sequelize = new Sequelize(
  process.env.DATABASE_URL || process.env.DB_NAME,
  process.env.DATABASE_URL ? undefined : process.env.DB_USER,
  process.env.DATABASE_URL ? undefined : process.env.DB_PASSWORD,
  {
    host: process.env.DATABASE_URL ? undefined : process.env.DB_HOST,
    port: process.env.DATABASE_URL ? undefined : process.env.DB_PORT,
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    dialectOptions: process.env.DATABASE_URL ? {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    } : {},
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    define: {
      timestamps: true,
      underscored: true,
    },
  }
);

module.exports = sequelize;