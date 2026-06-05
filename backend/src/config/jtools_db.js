const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 5432,
    dialect: 'postgres',
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    dialectOptions: process.env.NODE_ENV === 'production' ? {
      ssl: { require: true, rejectUnauthorized: false }
    } : {}
  }
);

const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('PostgreSQL conectado correctamente');
  } catch (error) {
    console.error(' No se pudo conectar a la base de datos:', error.message);
    process.exit(1);
  }
};

module.exports = { sequelize, testConnection };