'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Product extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Product.belongsTo(models.User, { foreignKey: 'seller_id', as: 'seller' });
      Product.hasMany(models.OrderItem, { foreignKey: 'product_id' });
      Product.hasMany(models.CartItem, { foreignKey: 'product_id' });
    }
  }
  Product.init({
    name: DataTypes.STRING,
    description: DataTypes.TEXT,
    price: DataTypes.DECIMAL,
    stock: DataTypes.INTEGER,
    category: DataTypes.STRING,
    image_url: DataTypes.STRING,
    original_image_url: DataTypes.STRING,
    seller_id: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Product',
    modelName: 'Product',
    tableName: 'products',
    underscored: true,
    updatedAt: false,
  });
  return Product;
};