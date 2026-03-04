'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('conversations', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            buyer_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: { model: 'users', key: 'id' }
            },
            seller_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: { model: 'users', key: 'id' }
            },
            last_message: {
                type: Sequelize.TEXT,
                allowNull: true
            },
            last_message_at: {
                type: Sequelize.DATE,
                allowNull: true
            },
            last_sender_id: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: { model: 'users', key: 'id' }
            },
            last_message_read: {
                type: Sequelize.BOOLEAN,
                defaultValue: false
            },
            buyer_unread: {
                type: Sequelize.INTEGER,
                defaultValue: 0
            },
            seller_unread: {
                type: Sequelize.INTEGER,
                defaultValue: 0
            },
            created_at: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.literal('NOW()')
            },
            updated_at: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.literal('NOW()')
            }
        });

        // Unique constraint: one conversation per buyer-seller pair
        await queryInterface.addIndex('conversations', ['buyer_id', 'seller_id'], {
            unique: true,
            name: 'unique_buyer_seller_pair'
        });
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('conversations');
    }
};
