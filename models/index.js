'use strict';

require('dotenv').config();

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const process = require('process');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../config/config.json')[env];
const db = {};

let sequelize;
const customConfig = { ...config };

// Wajib untuk Vercel Serverless: memaksa bundler menyertakan modul 'pg'
customConfig.dialectModule = require('pg');

// Paksa konfigurasi SSL jika berjalan di Vercel/Production
if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
  customConfig.dialectOptions = {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  };
}

if (customConfig.use_env_variable) {
  sequelize = new Sequelize(process.env[customConfig.use_env_variable], customConfig);
} else {
  sequelize = new Sequelize(customConfig.database, customConfig.username, customConfig.password, customConfig);
}

db.User = require('./user.js')(sequelize, Sequelize.DataTypes);
db.Buyer = require('./buyer.js')(sequelize, Sequelize.DataTypes);
db.Seller = require('./seller.js')(sequelize, Sequelize.DataTypes);
db.Admin = require('./admin.js')(sequelize, Sequelize.DataTypes);
db.Product = require('./product.js')(sequelize, Sequelize.DataTypes);
db.Order = require('./order.js')(sequelize, Sequelize.DataTypes);
db.OrderItem = require('./orderitem.js')(sequelize, Sequelize.DataTypes);
db.Cart = require('./cart.js')(sequelize, Sequelize.DataTypes);
db.CartItem = require('./cartitem.js')(sequelize, Sequelize.DataTypes);
db.TempMigration = require('./temp_migration.js')(sequelize, Sequelize.DataTypes);

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
