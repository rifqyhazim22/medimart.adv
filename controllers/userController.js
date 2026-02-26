const { User } = require('../models');

module.exports = {
    delete: async (req, res) => {
        const isAjax = req.xhr || req.headers.accept.indexOf('json') > -1;
        try {
            const targetId = req.params.id;
            // Prevent deleting self
            if (parseInt(targetId) === req.session.user.id) {
                if (isAjax) return res.status(403).json({ success: false, message: 'Anda tidak dapat menghapus akun sendiri.' });
                req.flash('error', 'Anda tidak dapat menghapus akun sendiri.');
                return res.redirect('/admin/dashboard');
            }

            await User.destroy({ where: { id: targetId } });

            if (isAjax) {
                return res.json({ success: true, message: 'User berhasil dihapus.' });
            }

            req.session.save(() => {
                req.flash('success_msg', 'User berhasil dihapus.');
                res.redirect('/admin/dashboard');
            });
        } catch (err) {
            console.error(err);
            if (isAjax) return res.status(500).json({ success: false, message: 'Gagal menghapus user' });
            req.session.save(() => {
                req.flash('error', 'Gagal menghapus user');
                res.redirect('/admin/dashboard');
            });
        }
    }
};
