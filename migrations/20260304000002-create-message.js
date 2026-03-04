'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('messages', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            conversation_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: { model: 'conversations', key: 'id' },
                onDelete: 'CASCADE'
            },
            sender_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: { model: 'users', key: 'id' }
            },
            message: {
                type: Sequelize.TEXT,
                allowNull: false
            },
            context_type: {
                type: Sequelize.STRING,
                defaultValue: 'text'
            },
            context_data: {
                type: Sequelize.JSONB,
                allowNull: true
            },
            is_read: {
                type: Sequelize.BOOLEAN,
                defaultValue: false
            },
            created_at: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.literal('NOW()')
            }
        });
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('messages');
    }
};
