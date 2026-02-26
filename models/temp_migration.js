'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class temp_migration extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  temp_migration.init({
    visible_to_customer: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'temp_migration',
  });
  return temp_migration;
};