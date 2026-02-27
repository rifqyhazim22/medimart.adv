const { User, Buyer, Seller, Admin } = require('../models');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { Op } = require('sequelize');

module.exports = {
    loginPage: (req, res) => {
        res.render('login');
    },

    registerPage: (req, res) => {
        res.render('register');
    },

    login: async (req, res) => {
        const { username, password } = req.body;
        try {
            const user = await User.findOne({
                where: { username },
                include: [
                    { model: Seller, as: 'seller' },
                    { model: Buyer, as: 'buyer' },
                    { model: Admin, as: 'admin' }
                ]
            });
            if (user) {
                const isMatch = await bcrypt.compare(password, user.password);
                if (isMatch) {
                    // Check Role Mismatch
                    const selectedRole = req.body.role || 'customer'; // Default to customer if missing
                    // Map frontend role names to DB role names if necessary (here they match: 'customer', 'seller', 'admin')
                    // Note: DB has 'customer' or 'user' - let's normalize. 
                    // Seed uses: 'admin', 'seller', 'customer'. View sends: 'admin', 'seller', 'customer'.

                    if (user.role !== selectedRole) {
                        // Allow 'customer' to also match 'user' if legacy
                        if (!(selectedRole === 'customer' && (user.role === 'user' || user.role === 'customer'))) {
                            req.flash('error', `Akses ditolak. Coba periksa lagi, karena sepertinya ini bukan akun ${selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}.`);
                            return res.redirect('/login');
                        }
                    }

                    req.session.user = user;

                    // Remember Me Logic
                    if (req.body.remember_me) {
                        // Set cookie to expire in 30 days
                        req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000;
                    } else {
                        // Session cookie (expires when browser closes)
                        req.session.cookie.expires = false;
                    }

                    return req.session.save(() => {
                        req.flash('success_msg', `Selamat datang kembali, ${user.full_name}! Senang melihat Anda bertransaksi lagi.`);
                        if (user.role === 'admin') {
                            return res.redirect('/admin/dashboard');
                        }
                        if (user.role === 'seller') {
                            return res.redirect('/seller/dashboard');
                        }
                        return res.redirect('/');
                    });
                }
            }
            req.flash('error', 'Hmm, sepertinya Username atau Password Anda kurang tepat. Coba lagi ya!');
            res.redirect('/login');
        } catch (err) {
            console.error(err);
            req.flash('error', 'Terjadi kesalahan pada server.');
            res.redirect('/login');
        }
    },

    register: async (req, res) => {
        const { username, password, full_name, email, role } = req.body;
        try {
            const existingUser = await User.findOne({ where: { username } });
            if (existingUser) {
                req.flash('error', 'Maaf, Username tersebut sudah ada yang punya. Coba variasi nama lain?');
                return res.redirect('/register');
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            const newUser = await User.create({
                username,
                password: hashedPassword,
                full_name,
                email,
                role
            });

            if (role === 'seller') {
                await Seller.create({
                    user_id: newUser.id,
                    store_name: full_name || username
                });
            } else if (role === 'customer' || role === 'buyer') {
                await Buyer.create({
                    user_id: newUser.id
                });
            } else if (role === 'admin') {
                await Admin.create({
                    user_id: newUser.id,
                    department: 'General',
                    job_title: 'Administrator'
                });
            }

            req.session.save(() => {
                req.flash('success_msg', `Selamat bergabung, ${full_name}! Akun Anda telah berhasil diciptakan. Silakan masuk untuk mulai penjelajahan.`);
                res.redirect('/login');
            });
        } catch (err) {
            console.error(err);
            req.session.save(() => {
                req.flash('error', 'Aduh, ada sedikit kendala saat mendaftarkan Anda. Mohon coba beberapa saat lagi.');
                res.redirect('/register');
            });
        }
    },

    logout: (req, res) => {
        req.session.destroy(() => {
            res.redirect('/login');
        });
    },

    // FORGOT PASSWORD
    forgotPasswordPage: (req, res) => {
        res.render('forgot-password');
    },

    forgotPassword: async (req, res) => {
        const { email } = req.body;
        try {
            const user = await User.findOne({ where: { email } });
            if (!user) {
                req.flash('error', 'Email tidak ditemukan.');
                return res.redirect('/forgot-password');
            }

            // Generate Token
            const token = crypto.randomBytes(20).toString('hex');
            const expireTime = Date.now() + 3600000; // 1 hour

            await user.update({
                reset_password_token: token,
                reset_password_expires: expireTime
            });

            // SIMULATION: Log to console
            console.log('==================================================');
            console.log(`[SIMULASI EMAIL] Link Reset Password untuk ${email}:`);
            console.log(`http://localhost:3000/auth/reset-password/${token}`);
            console.log('==================================================');

            req.flash('success_msg', 'Link reset password telah dikirim ke email Anda (Cek Terminal Server untuk simulasi).');
            res.redirect('/forgot-password');
        } catch (err) {
            console.error(err);
            req.flash('error', 'Gagal memproses permintaan.');
            res.redirect('/forgot-password');
        }
    },

    resetPasswordPage: async (req, res) => {
        const { token } = req.params;
        try {
            const user = await User.findOne({
                where: {
                    reset_password_token: token,
                    reset_password_expires: { [Op.gt]: Date.now() }
                }
            });

            if (!user) {
                req.flash('error', 'Token tidak valid atau sudah kadaluarsa.');
                return res.redirect('/forgot-password');
            }

            res.render('reset-password', { token });
        } catch (err) {
            console.error(err);
            req.flash('error', 'Terjadi kesalahan.');
            res.redirect('/forgot-password');
        }
    },

    resetPassword: async (req, res) => {
        const { token } = req.params;
        const { password, confirmPassword } = req.body;

        try {
            if (password !== confirmPassword) {
                req.flash('error', 'Password tidak cocok.');
                return res.redirect(`/auth/reset-password/${token}`);
            }

            const user = await User.findOne({
                where: {
                    reset_password_token: token,
                    reset_password_expires: { [Op.gt]: Date.now() }
                }
            });

            if (!user) {
                req.flash('error', 'Token tidak valid atau sudah kadaluarsa.');
                return res.redirect('/forgot-password');
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            await user.update({
                password: hashedPassword,
                reset_password_token: null,
                reset_password_expires: null
            });

            req.flash('success_msg', 'Password berhasil diubah. Silakan login.');
            res.redirect('/login');
        } catch (err) {
            console.error(err);
            req.flash('error', 'Gagal mereset password.');
            res.redirect(`/auth/reset-password/${token}`);
        }
    }
};
