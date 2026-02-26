'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.removeColumn('orders', 'visible_to_seller');
    await queryInterface.addColumn('order_items', 'visible_to_seller', {
      type: Sequelize.BOOLEAN,
      defaultValue: true,
      allowNull: false
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn('orders', 'visible_to_seller', {
      type: Sequelize.BOOLEAN,
      defaultValue: true,
      allowNull: false
    });
    await queryInterface.removeColumn('order_items', 'visible_to_seller');
  }
};
