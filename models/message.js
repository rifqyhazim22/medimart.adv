'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Message extends Model {
        static associate(models) {
            Message.belongsTo(models.Conversation, { foreignKey: 'conversation_id', as: 'conversation' });
            Message.belongsTo(models.User, { foreignKey: 'sender_id', as: 'sender' });
        }
    }

    Message.init({
        conversation_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        sender_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        message: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        context_type: {
            type: DataTypes.STRING,
            defaultValue: 'text'
        },
        context_data: {
            type: DataTypes.JSONB,
            allowNull: true
        },
        is_read: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        image_url: {
            type: DataTypes.STRING,
            allowNull: true
        }
    }, {
        sequelize,
        modelName: 'Message',
        tableName: 'messages',
        underscored: true,
        updatedAt: false
    });

    return Message;
};
