'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      User.hasMany(models.Product, { foreignKey: 'seller_id', as: 'products' });
      User.hasMany(models.Order, { foreignKey: 'user_id', as: 'orders' });
      User.hasOne(models.Buyer, { foreignKey: 'user_id', as: 'buyer' });
      User.hasOne(models.Seller, { foreignKey: 'user_id', as: 'seller' });
      User.hasOne(models.Admin, { foreignKey: 'user_id', as: 'admin' });
      User.hasOne(models.Cart, { foreignKey: 'user_id', as: 'cart' });
    }
  }
  User.init({
    username: DataTypes.STRING,
    password: DataTypes.STRING,
    full_name: DataTypes.STRING,
    email: DataTypes.STRING,
    role: DataTypes.STRING,
    address: DataTypes.TEXT,
    phone: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'User',
    modelName: 'User',
    tableName: 'users',
    underscored: true,
    updatedAt: false,
  });
  return User;
};