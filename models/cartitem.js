'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class CartItem extends Model {
        static associate(models) {
            CartItem.belongsTo(models.Cart, { foreignKey: 'cart_id' });
            CartItem.belongsTo(models.Product, { foreignKey: 'product_id', as: 'product' });
        }
    }
    CartItem.init({
        cart_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        product_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        quantity: {
            type: DataTypes.INTEGER,
            defaultValue: 1,
            allowNull: false
        }
    }, {
        sequelize,
        modelName: 'CartItem',
        tableName: 'cart_items',
        underscored: true
    });
    return CartItem;
};
