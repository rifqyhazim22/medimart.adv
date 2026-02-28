const { User, Order, Buyer, Seller, Admin } = require('../models');
const bcrypt = require('bcryptjs');
const { optimizeImage } = require('../utils/imageOptimizer');

module.exports = {
    index: async (req, res) => {
        try {
            const user = await User.findByPk(req.session.user.id, {
                include: [
                    { model: Seller, as: 'seller' },
                    { model: Buyer, as: 'buyer' },
                    { model: Admin, as: 'admin' }
                ]
            });
            res.render('profile/index', { user });
        } catch (err) {
            console.error(err);
            req.flash('error', req.t('profile.load_failed'));
            res.redirect('/');
        }
    },

    edit: async (req, res) => {
        try {
            const user = await User.findByPk(req.session.user.id, {
                include: [
                    { model: Seller, as: 'seller' },
                    { model: Buyer, as: 'buyer' },
                    { model: Admin, as: 'admin' }
                ]
            });
            res.render('profile/edit', { user });
        } catch (err) {
            console.error(err);
            req.flash('error', req.t('profile.edit_load_failed'));
            res.redirect('/profile');
        }
    },

    editPost: async (req, res) => {
        const { username, full_name, email, phone, address, new_password, confirm_password, bank_account } = req.body;
        try {
            const user = await User.findByPk(req.session.user.id, {
                include: [
                    { model: Seller, as: 'seller' },
                    { model: Buyer, as: 'buyer' }
                ]
            });

            // Check if username is being changed
            if (username && username !== user.username) {
                const existingUser = await User.findOne({ where: { username } });
                if (existingUser) {
                    req.flash('error', req.t('profile.username_taken'));
                    return res.redirect('/profile');
                }
            }

            // Ganti Sandi (Jika diisi)
            if (new_password) {
                if (new_password !== confirm_password) {
                    req.flash('error', req.t('profile.password_mismatch'));
                    return res.redirect('/profile');
                }
                const hashedPassword = await bcrypt.hash(new_password, 10);
                await user.update({ password: hashedPassword });
            }

            // Ganti Avatar
            let profile_image = user.profile_image;
            if (req.file) {
                profile_image = await optimizeImage(req.file, 400); // 400px width limit for avatars
            }

            await user.update({ username, full_name, email, phone, address, profile_image });

            // Simpan alamat untuk pelanggan, atau spesifik bank rekening untuk seller
            if (user.role === 'customer') {
                if (user.buyer) {
                    await user.buyer.update({ shipping_address: address });
                } else {
                    await Buyer.create({ user_id: user.id, shipping_address: address });
                }
            } else if (user.role === 'seller') {
                if (user.seller) {
                    await user.seller.update({ bank_account: bank_account || null });
                } else {
                    await Seller.create({ user_id: user.id, bank_account: bank_account || null, store_name: user.username });
                }
            }

            // Update session data
            req.session.user = user;

            req.session.save(() => {
                req.flash('success_msg', req.t('profile.updated'));
                res.redirect('/profile');
            });
        } catch (err) {
            console.error(err);
            req.session.save(() => {
                req.flash('error', req.t('profile.update_failed'));
                res.redirect('/profile');
            });
        }
    },

    deleteAccount: async (req, res) => {
        try {
            const userId = req.session.user.id;
            const user = await User.findByPk(userId);
            // ... (imports are weird here, but okay)
            const { Order, OrderItem } = require('../models');
            const { Op } = require('sequelize');

            if (user.role === 'customer') {
                // Check for active orders
                const activeOrders = await Order.count({
                    where: {
                        user_id: userId,
                        status: { [Op.in]: ['paid', 'processing', 'shipped'] }
                    }
                });

                if (activeOrders > 0) {
                    req.flash('error', req.t('profile.active_orders'));
                    return res.redirect('/profile');
                }
            } else if (user.role === 'seller') {
                // Check for active items being sold
                const activeItems = await OrderItem.count({
                    where: {
                        seller_id: userId,
                        status: { [Op.in]: ['paid', 'processed', 'shipped'] }
                    }
                });

                if (activeItems > 0) {
                    req.flash('error', req.t('profile.active_seller_orders'));
                    return res.redirect('/profile');
                }
            }

            await user.destroy();
            req.session.destroy(() => {
                res.redirect('/');
            });
        } catch (err) {
            console.error(err);
            req.session.save(() => {
                req.flash('error', req.t('profile.delete_failed', err.message));
                res.redirect('/profile');
            });
        }
    }
};
