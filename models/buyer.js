'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Buyer extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Buyer.belongsTo(models.User, { foreignKey: 'user_id' });
    }
  }
  Buyer.init({
    user_id: DataTypes.INTEGER,
    shipping_address: DataTypes.TEXT,
    date_of_birth: DataTypes.DATE,
    loyalty_points: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Buyer',
    tableName: 'buyers',
    underscored: true,
  });
  return Buyer;
};