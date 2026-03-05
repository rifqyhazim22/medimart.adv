const { Conversation, Message, User } = require('../models');

module.exports = function (io, sessionMiddleware) {
    // Share Express session with Socket.IO
    io.use(function (socket, next) {
        sessionMiddleware(socket.request, {}, next);
    });

    io.on('connection', function (socket) {
        var session = socket.request.session;
        if (!session || !session.user) {
            socket.disconnect();
            return;
        }

        var userId = session.user.id;
        var userRole = session.user.role;
        // Join personal room for notifications
        socket.join('user-' + userId);

        // Join a conversation room
        socket.on('join-conversation', function (conversationId) {
            socket.join('conversation-' + conversationId);
        });

        // Leave a conversation room
        socket.on('leave-conversation', function (conversationId) {
            socket.leave('conversation-' + conversationId);
        });

        // Send message
        socket.on('send-message', function (data) {
            (async function () {
                try {
                    var conversationId = data.conversationId;
                    var message = data.message;
                    var contextType = data.contextType;
                    var contextData = data.contextData;
                    var imageUrl = data.image_url || null;

                    // Verify user is part of this conversation
                    var conversation = await Conversation.findByPk(conversationId);
                    if (!conversation) return;
                    if (conversation.buyer_id !== userId && conversation.seller_id !== userId) return;

                    // Create message
                    var newMessage = await Message.create({
                        conversation_id: conversationId,
                        sender_id: userId,
                        message: message || '',
                        context_type: contextType || 'text',
                        context_data: contextData || null,
                        image_url: imageUrl
                    });

                    // Update conversation — track last sender for read receipts
                    var isBuyer = conversation.buyer_id === userId;
                    var updateData = {
                        last_message: message ? message.substring(0, 100) : (imageUrl ? '📷' : ''),
                        last_message_at: new Date(),
                        last_sender_id: userId,
                        last_message_read: false
                    };

                    if (isBuyer) {
                        updateData.seller_unread = (conversation.seller_unread || 0) + 1;
                    } else {
                        updateData.buyer_unread = (conversation.buyer_unread || 0) + 1;
                    }

                    await conversation.update(updateData);

                    // Fetch sender info
                    var sender = await User.findByPk(userId, {
                        attributes: ['id', 'username', 'full_name', 'profile_image']
                    });

                    var messagePayload = {
                        id: newMessage.id,
                        conversation_id: conversationId,
                        sender_id: userId,
                        image_url: newMessage.image_url,
                        sender: {
                            id: sender.id,
                            username: sender.username,
                            full_name: sender.full_name,
                            profile_image: sender.profile_image
                        },
                        message: message,
                        context_type: newMessage.context_type,
                        context_data: newMessage.context_data,
                        is_read: false,
                        created_at: newMessage.created_at
                    };

                    // Broadcast to conversation room
                    io.to('conversation-' + conversationId).emit('new-message', messagePayload);

                    // Notify the other user (for unread badge update)
                    var otherUserId = isBuyer ? conversation.seller_id : conversation.buyer_id;
                    io.to('user-' + otherUserId).emit('unread-update', {
                        conversationId: conversationId,
                        totalUnread: isBuyer ? (conversation.seller_unread || 0) + 1 : (conversation.buyer_unread || 0) + 1
                    });

                } catch (err) {
                    console.error('Socket send-message error:', err);
                }
            })();
        });

        // Typing indicators
        socket.on('typing', function (conversationId) {
            socket.to('conversation-' + conversationId).emit('user-typing', {
                userId: userId,
                username: session.user.username
            });
        });

        socket.on('stop-typing', function (conversationId) {
            socket.to('conversation-' + conversationId).emit('user-stop-typing', {
                userId: userId
            });
        });

        // Mark messages as read — updates read receipt
        socket.on('mark-read', function (conversationId) {
            (async function () {
                try {
                    var conversation = await Conversation.findByPk(conversationId);
                    if (!conversation) return;

                    var isBuyer = conversation.buyer_id === userId;
                    var otherUserId = isBuyer ? conversation.seller_id : conversation.buyer_id;

                    // Mark all messages from the other person as read
                    await Message.update(
                        { is_read: true },
                        {
                            where: {
                                conversation_id: conversationId,
                                sender_id: otherUserId,
                                is_read: false
                            }
                        }
                    );

                    // Reset unread counter
                    var updateData = {};
                    if (isBuyer) {
                        updateData.buyer_unread = 0;
                    } else {
                        updateData.seller_unread = 0;
                    }

                    // Update read receipt if last message was from the other user
                    if (conversation.last_sender_id === otherUserId) {
                        updateData.last_message_read = true;
                    }

                    await conversation.update(updateData);

                    // Notify user their badge updated
                    io.to('user-' + userId).emit('unread-update', {
                        conversationId: conversationId,
                        totalUnread: 0
                    });

                    // Notify sender that messages were read (for ✓✓ blue ticks)
                    io.to('user-' + otherUserId).emit('messages-read', {
                        conversationId: conversationId,
                        readBy: userId
                    });

                } catch (err) {
                    console.error('Socket mark-read error:', err);
                }
            })();
        });
    });
};
