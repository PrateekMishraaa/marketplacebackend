require('dotenv').config();

console.log('🔍 Debugging .env file:');
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_PORT:', process.env.DB_PORT);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('Password length:', process.env.DB_PASSWORD?.length);
console.log('Password characters:', process.env.DB_PASSWORD?.split('').map(c => `[${c}]`).join(''));