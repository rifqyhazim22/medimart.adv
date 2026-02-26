'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Order extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Order.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
      Order.hasMany(models.OrderItem, { foreignKey: 'order_id', as: 'items' });
      Order.belongsToMany(models.Product, { through: models.OrderItem, foreignKey: 'order_id', otherKey: 'product_id' });
    }
  }
  Order.init({
    user_id: DataTypes.INTEGER,
    total_price: DataTypes.DECIMAL,
    status: DataTypes.STRING,
    payment_method: DataTypes.STRING,
    recipient_name: DataTypes.STRING,
    recipient_phone: DataTypes.STRING,
    shipping_address: DataTypes.TEXT,
    visible_to_customer: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    sequelize,
    modelName: 'Order',
    tableName: 'orders',
    underscored: true,
    updatedAt: false,
  });
  return Order;
};