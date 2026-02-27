'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('sellers', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      user_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      store_name: {
        type: Sequelize.STRING
      },
      store_description: {
        type: Sequelize.TEXT
      },
      store_address: {
        type: Sequelize.TEXT
      },
      bank_account: {
        type: Sequelize.STRING
      },
      is_verified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW')
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('sellers');
  }
};