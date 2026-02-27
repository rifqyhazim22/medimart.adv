const { User, Order, Buyer, Seller, Admin } = require('../models');
const bcrypt = require('bcryptjs');

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
            req.flash('error', 'Gagal memuat profil.');
            res.redirect('/');
        }
    },

    edit: async (req, res) => {
        try {
            const user = await User.findByPk(req.session.user.id);
            res.render('profile/edit', { user });
        } catch (err) {
            console.error(err);
            req.flash('error', 'Gagal memuat form edit.');
            res.redirect('/profile');
        }
    },

    update: async (req, res) => {
        const { username, full_name, email, phone, address } = req.body;
        try {
            const user = await User.findByPk(req.session.user.id);

            // Check if username is being changed
            if (username && username !== user.username) {
                const existingUser = await User.findOne({ where: { username } });
                if (existingUser) {
                    req.flash('error', 'Username sudah digunakan oleh pengguna lain.');
                    return res.redirect('/profile/edit');
                }
            }

            await user.update({ username, full_name, email, phone, address });

            // Update session data
            req.session.user = user;

            req.session.save(() => {
                req.flash('success_msg', 'Profil berhasil diperbarui.');
                res.redirect('/profile');
            });
        } catch (err) {
            console.error(err);
            req.session.save(() => {
                req.flash('error', 'Gagal memperbarui profil.');
                res.redirect('/profile/edit');
            });
        }
    },

    changePassword: async (req, res) => {
        const { currentPassword, newPassword, confirmNewPassword } = req.body;
        try {
            if (newPassword !== confirmNewPassword) {
                req.flash('error', 'Konfirmasi password baru tidak cocok.');
                return res.redirect('/profile/edit');
            }

            const user = await User.findByPk(req.session.user.id);
            const isMatch = await bcrypt.compare(currentPassword, user.password);

            if (!isMatch) {
                req.flash('error', 'Password saat ini salah.');
                return res.redirect('/profile/edit');
            }

            const hashedPassword = await bcrypt.hash(newPassword, 10);
            await user.update({ password: hashedPassword });

            req.session.save(() => {
                req.flash('success_msg', 'Password berhasil diubah.');
                res.redirect('/profile');
            });
        } catch (err) {
            console.error(err);
            req.session.save(() => {
                req.flash('error', 'Gagal mengubah password.');
                res.redirect('/profile/edit');
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
                    req.flash('error', 'Tidak dapat menghapus akun karena masih ada pesanan yang aktif.');
                    return res.redirect('/profile/edit');
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
                    req.flash('error', 'Tidak dapat menghapus akun karena masih ada pesanan masuk yang belum selesai.');
                    return res.redirect('/profile/edit');
                }
            }

            await user.destroy();
            req.session.destroy(() => {
                res.redirect('/');
            });
        } catch (err) {
            console.error(err);
            req.session.save(() => {
                req.flash('error', 'Gagal menghapus akun: ' + err.message);
                res.redirect('/profile/edit');
            });
        }
    }
};
