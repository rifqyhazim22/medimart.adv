'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('orders', 'visible_to_customer', {
      type: Sequelize.BOOLEAN,
      defaultValue: true,
      allowNull: false
    });
    await queryInterface.addColumn('orders', 'visible_to_seller', {
      type: Sequelize.BOOLEAN,
      defaultValue: true,
      allowNull: false
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('orders', 'visible_to_customer');
    await queryInterface.removeColumn('orders', 'visible_to_seller');
  }
};
