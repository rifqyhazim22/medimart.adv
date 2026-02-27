'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Seller extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Seller.belongsTo(models.User, { foreignKey: 'user_id' });
    }
  }
  Seller.init({
    user_id: DataTypes.INTEGER,
    store_name: DataTypes.STRING,
    store_description: DataTypes.TEXT,
    store_address: DataTypes.TEXT,
    bank_account: DataTypes.STRING,
    is_verified: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'Seller',
    tableName: 'sellers',
    underscored: true,
  });
  return Seller;
};