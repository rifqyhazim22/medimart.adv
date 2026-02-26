'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class OrderItem extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      OrderItem.belongsTo(models.Order, { foreignKey: 'order_id' });
      OrderItem.belongsTo(models.Product, { foreignKey: 'product_id' });
      OrderItem.belongsTo(models.User, { foreignKey: 'seller_id', as: 'seller' });
    }
  }
  OrderItem.init({
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER
    },
    order_id: DataTypes.INTEGER,
    product_id: DataTypes.INTEGER,
    quantity: DataTypes.INTEGER,
    price_at_purchase: DataTypes.DECIMAL,
    seller_id: DataTypes.INTEGER,
    status: DataTypes.STRING,
    visible_to_seller: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    sequelize,
    modelName: 'OrderItem',
    tableName: 'order_items',
    underscored: true,
    updatedAt: false,
    createdAt: false,
  });
  return OrderItem;
};