const { Product, sequelize } = require('../models');

module.exports = {
    index: async (req, res) => {
        try {
            const cart = req.session.cart || [];
            const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

            // Fetch Recommended Products (Random 3) - Postgres Specific 'RANDOM()'
            const recommendedProducts = await Product.findAll({
                order: sequelize.random(),
                limit: 3
            });

            res.render('cart', { cart, subtotal, recommendedProducts });
        } catch (err) {
            console.error(err);
            const cart = req.session.cart || [];
            res.render('cart', { cart, subtotal: 0, recommendedProducts: [] });
        }
    },

    add: async (req, res) => {
        const { productId } = req.body;
        const isAjax = req.xhr || req.headers.accept.indexOf('json') > -1;

        try {
            const product = await Product.findByPk(productId);
            if (!product) {
                if (isAjax) return res.status(404).json({ success: false, message: 'Produk tidak ditemukan' });
                return res.redirect('/');
            }

            if (req.session.user && product.seller_id === req.session.user.id) {
                if (isAjax) return res.status(403).json({ success: false, message: 'Anda tidak dapat membeli produk Anda sendiri' });
                req.flash('error', 'Wah, Anda tidak dapat memborong produk dari lapak Anda sendiri ya 😅');
                return res.redirect(req.get('Referer') || '/');
            }

            if (!req.session.cart) req.session.cart = [];
            const cart = req.session.cart;
            const existingItem = cart.find(item => item.id === product.id);
            let message = '';
            let success = true;

            if (existingItem) {
                if (existingItem.quantity < product.stock) {
                    existingItem.quantity++;
                    message = 'Jumlah produk ditambahkan';
                } else {
                    success = false;
                    message = 'Stok tidak mencukupi';
                }
            } else {
                if (product.stock > 0) {
                    cart.push({
                        id: product.id,
                        name: product.name,
                        price: parseFloat(product.price),
                        image_url: product.image_url,
                        seller_id: product.seller_id,
                        quantity: 1
                    });
                    message = 'Produk masuk keranjang';
                } else {
                    success = false;
                    message = 'Stok habis';
                }
            }
            req.session.cart = cart; // Save session logic object

            if (isAjax) {
                const cartCount = cart.reduce((a, b) => a + b.quantity, 0);
                const cartTotal = cart.reduce((a, b) => a + (b.price * b.quantity), 0);

                return req.session.save(err => {
                    if (err) console.error(err);
                    res.json({ success, message, cartCount, cartTotal });
                });
            }

            req.session.save(() => {
                if (success) req.flash('success_msg', message);
                else req.flash('error', message);
                res.redirect(req.get('Referer') || '/');
            });
        } catch (err) {
            console.error(err);
            if (isAjax) return res.status(500).json({ success: false, message: 'Server Error' });
            res.redirect('/');
        }
    },

    update: async (req, res) => {
        const { productId, action } = req.body;
        const isAjax = req.xhr || req.headers.accept.indexOf('json') > -1;

        try {
            const cart = req.session.cart || [];
            const itemIndex = cart.findIndex(item => String(item.id) === String(productId));

            if (itemIndex > -1) {
                if (action === 'increase') {
                    // Check stock
                    const product = await Product.findByPk(productId);
                    if (product && cart[itemIndex].quantity < product.stock) {
                        cart[itemIndex].quantity++;
                    } else {
                        if (isAjax) return res.json({ success: false, message: 'Stok makasimal tercapai' });
                    }
                } else if (action === 'decrease') {
                    if (cart[itemIndex].quantity > 1) {
                        cart[itemIndex].quantity--;
                    } else {
                        // Prevent decreasing below 1 via AJAX for now, to avoid accidental removal
                        // User should use 'Remove' button (trash icon) if they want to delete.
                        // But wait, the previous logic removed it. 
                        // Plan said: "Ensure quantity never goes below 1 in Cart."
                        if (isAjax) return res.json({ success: false, message: 'Minimal 1 barang' });

                        // Fallback for non-ajax: remove item
                        cart.splice(itemIndex, 1);
                    }
                }
            }
            req.session.cart = cart;

            if (isAjax) {
                const item = cart[itemIndex];
                const itemQuantity = item ? item.quantity : 0;
                const itemTotal = item ? item.price * item.quantity : 0;
                const subtotal = cart.reduce((a, b) => a + (b.price * b.quantity), 0);
                const cartCount = cart.reduce((a, b) => a + b.quantity, 0);

                return req.session.save(err => {
                    if (err) console.error(err);
                    res.json({
                        success: true,
                        itemQuantity,
                        itemTotal,
                        subtotal,
                        cartTotal: subtotal,
                        cartCount
                    });
                });
            }

            req.session.save(() => res.redirect('/cart'));
        } catch (err) {
            console.error(err);
            if (isAjax) return res.status(500).json({ success: false, message: 'Server Error' });
            res.redirect('/cart');
        }
    },

    clear: (req, res) => {
        const isAjax = req.xhr || req.headers.accept.indexOf('json') > -1;
        req.session.cart = [];

        if (isAjax) {
            return res.json({ success: true, message: 'Keranjang dikosongkan' });
        }

        req.flash('success_msg', 'Keranjang sudah dibersihkan. Yuk mulai berburu barang baru! ✨');
        res.redirect('/cart');
    },

    checkoutPage: (req, res) => {
        const cart = req.session.cart || [];
        if (cart.length === 0) return res.redirect('/cart');
        const cartTotal = cart.reduce((acc, item) => acc + ((parseFloat(item.price) || 0) * (parseInt(item.quantity) || 0)), 0);
        res.render('checkout', { cart, cartTotal });
    },

    remove: (req, res) => {
        const { productId } = req.body;
        const isAjax = req.xhr || req.headers.accept.indexOf('json') > -1;

        try {
            const cart = req.session.cart || [];
            const newCart = cart.filter(item => String(item.id) !== String(productId));
            req.session.cart = newCart;

            if (isAjax) {
                const subtotal = newCart.reduce((a, b) => a + (b.price * b.quantity), 0);
                const cartCount = newCart.reduce((a, b) => a + b.quantity, 0);

                return req.session.save(err => {
                    if (err) {
                        console.error('Session save error:', err);
                        return res.status(500).json({ success: false, message: 'Session Error' });
                    }
                    res.json({
                        success: true,
                        message: 'Item dihapus',
                        cartCount,
                        cartTotal: subtotal,
                        subtotal
                    });
                });
            }

            req.session.save(() => {
                req.flash('success_msg', 'Sip, barang telah dikeluarkan dari keranjang belanja.');
                res.redirect('/cart');
            });
        } catch (err) {
            console.error(err);
            if (isAjax) return res.status(500).json({ success: false, message: 'Server Error' });
            res.redirect('/cart');
        }
    }
};
