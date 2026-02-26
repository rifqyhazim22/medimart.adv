module.exports = {
    isAuthenticated: (req, res, next) => {
        if (req.session.user) {
            return next();
        }
        req.flash('error', 'Silakan login terlebih dahulu.');
        res.redirect('/login');
    },

    isSeller: (req, res, next) => {
        if (req.session.user && req.session.user.role === 'seller') {
            return next();
        }
        req.flash('error', 'Akses ditolak. Halaman khusus penjual.');
        res.redirect('/');
    },

    isAdmin: (req, res, next) => {
        if (req.session.user && req.session.user.role === 'admin') {
            return next();
        }
        req.flash('error', 'Akses ditolak. Halaman khusus admin.');
        res.redirect('/');
    }
};
