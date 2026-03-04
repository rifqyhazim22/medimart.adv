'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Conversation extends Model {
        static associate(models) {
            Conversation.belongsTo(models.User, { foreignKey: 'buyer_id', as: 'buyer' });
            Conversation.belongsTo(models.User, { foreignKey: 'seller_id', as: 'seller' });
            Conversation.hasMany(models.Message, { foreignKey: 'conversation_id', as: 'messages' });
        }
    }

    Conversation.init({
        buyer_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        seller_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        last_message: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        last_message_at: {
            type: DataTypes.DATE,
            allowNull: true
        },
        last_sender_id: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        last_message_read: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        buyer_unread: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        seller_unread: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        }
    }, {
        sequelize,
        modelName: 'Conversation',
        tableName: 'conversations',
        underscored: true
    });

    return Conversation;
};
