'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('sellers', 'store_banner', {
            type: Sequelize.STRING,
            allowNull: true,
            defaultValue: null
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('sellers', 'store_banner');
    }
};
