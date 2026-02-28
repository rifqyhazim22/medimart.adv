const { Product, Cart, CartItem, sequelize } = require('../models');

// Helper function to get cart regardless of guest or user
async function getCartData(req) {
    if (req.session.user) {
        const userCart = await Cart.findOne({
            where: { user_id: req.session.user.id },
            include: [{ model: CartItem, as: 'items', include: ['product'] }]
        });
        if (!userCart) return { cartItems: [], subtotal: 0, dbCartId: null };

        const cartItems = userCart.items.map(item => ({
            id: item.product.id,
            cartItemId: item.id,
            name: item.product.name,
            price: parseFloat(item.product.price),
            image_url: item.product.image_url,
            seller_id: item.product.seller_id,
            quantity: item.quantity,
            stock: item.product.stock
        }));
        const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
        return { cartItems, subtotal, dbCartId: userCart.id };
    } else {
        const cartItems = req.session.cart || [];
        const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
        return { cartItems, subtotal, dbCartId: null };
    }
}

module.exports = {
    index: async (req, res) => {
        try {
            const { cartItems, subtotal } = await getCartData(req);

            const recommendedProducts = await Product.findAll({
                order: sequelize.random(),
                limit: 3
            });

            res.render('cart', { cart: cartItems, subtotal, recommendedProducts });
        } catch (err) {
            console.error(err);
            res.render('cart', { cart: [], subtotal: 0, recommendedProducts: [] });
        }
    },

    add: async (req, res) => {
        const { productId } = req.body;
        const isAjax = req.xhr || req.headers.accept.indexOf('json') > -1;

        try {
            const product = await Product.findByPk(productId);
            if (!product) {
                if (isAjax) return res.status(404).json({ success: false, message: req.t('cart.product_not_found') });
                return res.redirect('/');
            }

            if (req.session.user && product.seller_id === req.session.user.id) {
                if (isAjax) return res.status(403).json({ success: false, message: req.t('cart.own_product') });
                req.flash('error', req.t('cart.own_product_flash'));
                return res.redirect(req.get('Referer') || '/');
            }

            let message = '';
            let success = true;

            if (req.session.user) {
                // Persistent Cart Logic
                const [cart, created] = await Cart.findOrCreate({ where: { user_id: req.session.user.id } });
                const existingItem = await CartItem.findOne({ where: { cart_id: cart.id, product_id: product.id } });

                if (existingItem) {
                    if (existingItem.quantity < product.stock) {
                        existingItem.quantity++;
                        await existingItem.save();
                        message = 'Jumlah produk ditambahkan';
                    } else {
                        success = false;
                        message = 'Stok tidak mencukupi';
                    }
                } else {
                    if (product.stock > 0) {
                        await CartItem.create({ cart_id: cart.id, product_id: product.id, quantity: 1 });
                        message = 'Produk masuk keranjang';
                    } else {
                        success = false;
                        message = 'Stok habis';
                    }
                }
            } else {
                // Guest Session Cart Logic
                if (!req.session.cart) req.session.cart = [];
                const cart = req.session.cart;
                const existingItem = cart.find(item => item.id === product.id);

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
                req.session.cart = cart;
            }

            // After add, get fresh cart summary
            const { cartItems, subtotal } = await getCartData(req);

            if (isAjax) {
                const cartCount = cartItems.reduce((a, b) => a + b.quantity, 0);
                return res.json({ success, message, cartCount, cartTotal: subtotal });
            }

            if (success) req.flash('success_msg', message);
            else req.flash('error', message);
            res.redirect(req.get('Referer') || '/');
        } catch (err) {
            console.error(err);
            if (isAjax) return res.status(500).json({ success: false, message: req.t('cart.server_error') });
            res.redirect('/');
        }
    },

    update: async (req, res) => {
        const { productId, action } = req.body;
        const isAjax = req.xhr || req.headers.accept.indexOf('json') > -1;

        try {
            const product = await Product.findByPk(productId);
            if (!product) {
                if (isAjax) return res.json({ success: false, message: req.t('cart.product_not_found') });
                return res.redirect('/cart');
            }

            if (req.session.user) {
                // Persistent Cart
                const cart = await Cart.findOne({ where: { user_id: req.session.user.id } });
                if (cart) {
                    const item = await CartItem.findOne({ where: { cart_id: cart.id, product_id: productId } });
                    if (item) {
                        if (action === 'increase') {
                            if (item.quantity < product.stock) {
                                item.quantity++;
                                await item.save();
                            } else {
                                if (isAjax) return res.json({ success: false, message: req.t('cart.max_stock') });
                            }
                        } else if (action === 'decrease') {
                            if (item.quantity > 1) {
                                item.quantity--;
                                await item.save();
                            } else {
                                if (isAjax) return res.json({ success: false, message: req.t('cart.min_quantity') });
                                await item.destroy();
                            }
                        }
                    }
                }
            } else {
                // Guest Session Cart
                const cart = req.session.cart || [];
                const itemIndex = cart.findIndex(item => String(item.id) === String(productId));
                if (itemIndex > -1) {
                    if (action === 'increase') {
                        if (cart[itemIndex].quantity < product.stock) {
                            cart[itemIndex].quantity++;
                        } else {
                            if (isAjax) return res.json({ success: false, message: 'Stok makasimal tercapai' });
                        }
                    } else if (action === 'decrease') {
                        if (cart[itemIndex].quantity > 1) {
                            cart[itemIndex].quantity--;
                        } else {
                            if (isAjax) return res.json({ success: false, message: 'Minimal 1 barang' });
                            cart.splice(itemIndex, 1);
                        }
                    }
                    req.session.cart = cart;
                }
            }

            if (isAjax) {
                const { cartItems, subtotal } = await getCartData(req);
                const updatedItem = cartItems.find(item => String(item.id) === String(productId));
                const itemQuantity = updatedItem ? updatedItem.quantity : 0;
                const itemTotal = updatedItem ? updatedItem.price * itemQuantity : 0;
                const cartCount = cartItems.reduce((a, b) => a + b.quantity, 0);

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

            res.redirect('/cart');
        } catch (err) {
            console.error(err);
            if (isAjax) return res.status(500).json({ success: false, message: 'Server Error' });
            res.redirect('/cart');
        }
    },

    remove: async (req, res) => {
        const { productId } = req.body;
        const isAjax = req.xhr || req.headers.accept.indexOf('json') > -1;

        try {
            if (req.session.user) {
                const cart = await Cart.findOne({ where: { user_id: req.session.user.id } });
                if (cart) {
                    await CartItem.destroy({ where: { cart_id: cart.id, product_id: productId } });
                }
            } else {
                const cart = req.session.cart || [];
                req.session.cart = cart.filter(item => String(item.id) !== String(productId));
            }

            if (isAjax) {
                const { cartItems, subtotal } = await getCartData(req);
                const cartCount = cartItems.reduce((a, b) => a + b.quantity, 0);

                return req.session.save(err => {
                    if (err) console.error(err);
                    res.json({
                        success: true,
                        message: req.t('cart.item_removed'),
                        cartCount,
                        cartTotal: subtotal,
                        subtotal
                    });
                });
            }

            req.flash('success_msg', req.t('cart.item_removed_flash'));
            res.redirect('/cart');
        } catch (err) {
            console.error(err);
            if (isAjax) return res.status(500).json({ success: false, message: 'Server Error' });
            res.redirect('/cart');
        }
    },

    clear: async (req, res) => {
        const isAjax = req.xhr || req.headers.accept.indexOf('json') > -1;

        try {
            if (req.session.user) {
                const cart = await Cart.findOne({ where: { user_id: req.session.user.id } });
                if (cart) {
                    await CartItem.destroy({ where: { cart_id: cart.id } });
                }
            } else {
                req.session.cart = [];
            }

            if (isAjax) {
                return res.json({ success: true, message: req.t('cart.cleared') });
            }

            req.flash('success_msg', req.t('cart.cleared_flash'));
            res.redirect('/cart');
        } catch (err) {
            console.error(err);
            res.redirect('/cart');
        }
    },

    checkoutPage: async (req, res) => {
        try {
            const { cartItems, subtotal } = await getCartData(req);
            if (cartItems.length === 0) return res.redirect('/cart');
            res.render('checkout', { cart: cartItems, cartTotal: subtotal });
        } catch (err) {
            console.error(err);
            res.redirect('/cart');
        }
    }
};
