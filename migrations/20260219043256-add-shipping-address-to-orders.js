'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('orders');
    if (!table.shipping_address) {
      await queryInterface.addColumn('orders', 'shipping_address', {
        type: Sequelize.TEXT,
        allowNull: true
      });
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('orders', 'shipping_address');
  }
};
