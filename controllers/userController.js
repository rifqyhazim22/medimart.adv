const { User } = require('../models');

module.exports = {
    delete: async (req, res) => {
        const isAjax = req.xhr || req.headers.accept.indexOf('json') > -1;
        try {
            const targetId = req.params.id;
            // Prevent deleting self
            if (parseInt(targetId) === req.session.user.id) {
                if (isAjax) return res.status(403).json({ success: false, message: req.t('user.cannot_delete_self') });
                req.flash('error', req.t('user.cannot_delete_self'));
                return res.redirect('/admin/dashboard');
            }

            await User.destroy({ where: { id: targetId } });

            if (isAjax) {
                return res.json({ success: true, message: req.t('user.deleted') });
            }

            req.session.save(() => {
                req.flash('success_msg', req.t('user.deleted'));
                res.redirect('/admin/dashboard');
            });
        } catch (err) {
            console.error(err);
            if (isAjax) return res.status(500).json({ success: false, message: req.t('user.delete_failed') });
            req.session.save(() => {
                req.flash('error', req.t('user.delete_failed'));
                res.redirect('/admin/dashboard');
            });
        }
    }
};
