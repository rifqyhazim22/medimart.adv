const { Conversation, Message, User, Product, Order, OrderItem, Seller } = require('../models');
const { Op } = require('sequelize');

const chatController = {
    // GET /chat — Inbox: list all conversations
    async inbox(req, res) {
        try {
            const userId = req.session.user.id;
            const userRole = req.session.user.role;

            const whereClause = userRole === 'seller' || userRole === 'admin'
                ? { [Op.or]: [{ seller_id: userId }, { buyer_id: userId }] }
                : { buyer_id: userId };

            const conversations = await Conversation.findAll({
                where: whereClause,
                include: [
                    { model: User, as: 'buyer', attributes: ['id', 'username', 'full_name', 'profile_image'] },
                    {
                        model: User, as: 'seller', attributes: ['id', 'username', 'full_name', 'profile_image'],
                        include: [{ model: Seller, as: 'seller', attributes: ['store_name'] }]
                    }
                ],
                order: [['last_message_at', 'DESC NULLS LAST'], ['created_at', 'DESC']]
            });

            // Get total unread
            var totalUnread = 0;
            conversations.forEach(function (c) {
                if (c.seller_id === userId) {
                    totalUnread += c.seller_unread;
                } else {
                    totalUnread += c.buyer_unread;
                }
            });

            res.render('chat/inbox', {
                conversations,
                userRole,
                totalUnread,
                activeTab: 'chat'
            });
        } catch (err) {
            console.error('Chat inbox error:', err);
            req.flash('error_msg', 'Gagal memuat pesan.');
            res.redirect('/');
        }
    },

    // GET /chat/:conversationId — Chat room
    async chatRoom(req, res) {
        try {
            const userId = req.session.user.id;
            const conversationId = req.params.conversationId;

            const conversation = await Conversation.findByPk(conversationId, {
                include: [
                    { model: User, as: 'buyer', attributes: ['id', 'username', 'full_name', 'profile_image'] },
                    {
                        model: User, as: 'seller', attributes: ['id', 'username', 'full_name', 'profile_image'],
                        include: [{ model: Seller, as: 'seller', attributes: ['store_name'] }]
                    }
                ]
            });

            if (!conversation) {
                req.flash('error_msg', 'Percakapan tidak ditemukan.');
                return res.redirect('/chat');
            }

            // Verify user is part of this conversation
            if (conversation.buyer_id !== userId && conversation.seller_id !== userId) {
                req.flash('error_msg', 'Akses ditolak.');
                return res.redirect('/chat');
            }

            // Fetch messages
            const messages = await Message.findAll({
                where: { conversation_id: conversationId },
                include: [{ model: User, as: 'sender', attributes: ['id', 'username', 'full_name', 'profile_image'] }],
                order: [['created_at', 'ASC']],
                limit: 200
            });

            // Mark as read
            const isBuyer = conversation.buyer_id === userId;
            const otherUserId = isBuyer ? conversation.seller_id : conversation.buyer_id;

            await Message.update(
                { is_read: true },
                { where: { conversation_id: conversationId, sender_id: otherUserId, is_read: false } }
            );

            if (isBuyer) {
                await conversation.update({ buyer_unread: 0 });
            } else {
                await conversation.update({ seller_unread: 0 });
            }

            // Update last_message_read if last message was from other user
            if (conversation.last_sender_id === otherUserId) {
                await conversation.update({ last_message_read: true });
            }

            const userRole = req.session.user.role;
            const otherUser = isBuyer ? conversation.seller : conversation.buyer;

            // Fetch context from query params (for quick reply chips)
            var contextProduct = null;
            var contextOrder = null;

            if (req.query.productId) {
                contextProduct = await Product.findByPk(req.query.productId);
            }
            if (req.query.orderId) {
                contextOrder = await Order.findByPk(req.query.orderId);
            }

            res.render('chat/room', {
                conversation,
                messages,
                otherUser,
                userRole,
                activeTab: 'chat',
                contextProduct: contextProduct ? contextProduct.toJSON() : null,
                contextOrder: contextOrder ? contextOrder.toJSON() : null
            });
        } catch (err) {
            console.error('Chat room error:', err);
            req.flash('error_msg', 'Gagal memuat percakapan.');
            res.redirect('/chat');
        }
    },

    // POST /chat/start — Create or find conversation, redirect with context (no auto-send)
    async startChat(req, res) {
        try {
            const userId = req.session.user.id;
            const userRole = req.session.user.role;
            const { sellerId, productId, orderId } = req.body;

            if (!sellerId) {
                req.flash('error_msg', 'User tidak ditemukan.');
                return res.redirect('back');
            }

            // Determine buyer and seller
            var buyerId, sellerUserId;
            if (userRole === 'seller') {
                sellerUserId = userId;
                buyerId = parseInt(sellerId);
            } else if (userRole === 'admin') {
                const targetUser = await User.findByPk(parseInt(sellerId));
                if (targetUser && targetUser.role === 'seller') {
                    // Target is seller -> Admin acts as buyer
                    buyerId = userId;
                    sellerUserId = parseInt(sellerId);
                } else {
                    // Target is customer (or admin) -> target acts as buyer, Admin acts as seller
                    buyerId = parseInt(sellerId);
                    sellerUserId = userId;
                }
            } else {
                buyerId = userId;
                sellerUserId = parseInt(sellerId);
            }

            // Find or create the ONE conversation between this buyer-seller pair
            var conversation = await Conversation.findOne({
                where: { buyer_id: buyerId, seller_id: sellerUserId }
            });

            if (!conversation) {
                conversation = await Conversation.create({
                    buyer_id: buyerId,
                    seller_id: sellerUserId
                });
            }

            // Build redirect URL with context as query params (no auto-sent message)
            var redirectUrl = '/chat/' + conversation.id;
            var queryParts = [];
            if (productId) queryParts.push('productId=' + productId);
            if (orderId) queryParts.push('orderId=' + orderId);
            if (queryParts.length > 0) redirectUrl += '?' + queryParts.join('&');

            res.redirect(redirectUrl);
        } catch (err) {
            console.error('Start chat error:', err);
            req.flash('error_msg', 'Gagal memulai percakapan.');
            res.redirect('back');
        }
    },

    // GET /api/chat/unread — Get total unread count
    async getUnreadCount(req, res) {
        try {
            const userId = req.session.user.id;
            const userRole = req.session.user.role;

            const whereClause = userRole === 'seller' || userRole === 'admin'
                ? { [Op.or]: [{ seller_id: userId }, { buyer_id: userId }] }
                : { buyer_id: userId };

            const conversations = await Conversation.findAll({ where: whereClause });

            var totalUnread = 0;
            conversations.forEach(function (c) {
                if (c.seller_id === userId) {
                    totalUnread += c.seller_unread;
                } else {
                    totalUnread += c.buyer_unread;
                }
            });

            res.json({ unread: totalUnread });
        } catch (err) {
            console.error('Unread count error:', err);
            res.json({ unread: 0 });
        }
    }
};

module.exports = chatController;
