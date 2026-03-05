const { Order, OrderItem, Product, User, Cart, CartItem, sequelize } = require('../models');
const { Op } = require('sequelize');
const { Invoice } = require('../utils/xendit');

const updateOrderStatus = async (orderId, transaction = null) => {
    const options = transaction ? { transaction } : {};
    const items = await OrderItem.findAll({ where: { order_id: orderId }, ...options });
    if (items.length === 0) return;

    const activeItems = items.filter(i => i.status !== 'cancelled' && i.status !== 'rejected');

    // Recalculate true Total Price left for the Invoice
    const recalculatedTotal = parseFloat(activeItems.reduce((acc, i) => acc + (parseFloat(i.price_at_purchase) * i.quantity), 0));

    const order = await Order.findByPk(orderId, options);
    if (!order) return;

    const updatePayload = { total_price: recalculatedTotal };

    // If total price changed (e.g. an item was cancelled), void the old invoice link
    // so we can regenerate it with the correct amount.
    if (parseFloat(order.total_price) !== recalculatedTotal) {
        updatePayload.invoice_url = null;
    }

    if (activeItems.length === 0) {
        // Distinguish between purely rejected vs cancelled vs mixed
        // If ALL items are inactive because of rejection, or any one item was rejected, we flag it.
        // Usually, if a seller rejects at least one item and the buyer cancels the rest, it's safer to mark as 'cancelled' (Failed Order) or 'rejected'.
        // Let's make "cancelled" the dominant status if buyer involved, otherwise "rejected" if purely seller's doing.
        // Wait, the user's screenshot has 1 rejected and 1 cancelled, but status stood still.
        // That means this block WASN'T executed or "cancelled" got overwritten!

        const hasCancelled = items.some(i => i.status === 'cancelled');
        const hasRejected = items.some(i => i.status === 'rejected');

        if (hasCancelled) {
            updatePayload.status = 'cancelled'; // If buyer cancelled at least one, it's a "Cancelled" Invoice
        } else if (hasRejected) {
            updatePayload.status = 'rejected'; // Purely rejected by seller
        } else {
            updatePayload.status = 'cancelled'; // Fallback
        }

        await Order.update(updatePayload, { where: { id: orderId }, ...options });
        return;
    }

    // Removed duplicate findByPk call

    const allActiveCompleted = activeItems.every(i => i.status === 'completed');
    const allActiveShipped = activeItems.every(i => i.status === 'shipped' || i.status === 'completed');
    const anyActiveProcessed = activeItems.some(i => i.status === 'processed' || i.status === 'shipped' || i.status === 'completed');

    // If ANY item is paid, or the order was already paid, the base state is 'paid'
    // Otherwise, if all items are pending, the base state is 'pending'
    const anyItemPaid = activeItems.some(i => i.status === 'paid');
    const isActuallyPaid = order.status !== 'pending' || anyItemPaid;

    let newStatus = isActuallyPaid ? 'paid' : 'pending';

    if (allActiveCompleted) newStatus = 'completed';
    else if (allActiveShipped) newStatus = 'shipped';
    else if (anyActiveProcessed) newStatus = 'processing';

    updatePayload.status = newStatus;
    await Order.update(updatePayload, { where: { id: orderId }, ...options });
};
module.exports = {
    updateOrderStatus,
    // Create Order
    create: async (req, res) => {
        const { recipient_name, recipient_phone, shipping_address, payment_method } = req.body;
        let cart = [];
        let dbCartId = null;

        if (req.session.user) {
            const userCart = await Cart.findOne({
                where: { user_id: req.session.user.id },
                include: [{ model: CartItem, as: 'items', include: ['product'] }]
            });
            if (userCart && userCart.items) {
                dbCartId = userCart.id;
                cart = userCart.items.map(item => ({
                    id: item.product.id,
                    price: parseFloat(item.product.price),
                    seller_id: item.product.seller_id,
                    quantity: item.quantity,
                    stock: item.product.stock,
                    name: item.product.name
                }));
            }
        } else {
            cart = req.session.cart || [];
        }

        if (cart.length === 0) {
            if (req.xhr || req.headers.accept.indexOf('json') > -1) {
                return res.status(400).json({ success: false, message: req.t('order.cart_empty') });
            }
            req.flash('error', req.t('order.cart_empty'));
            return res.redirect('/cart');
        }

        const t = await sequelize.transaction();

        try {
            // Group items by seller_id
            const ordersBySeller = {};
            for (const item of cart) {
                if (!ordersBySeller[item.seller_id]) {
                    ordersBySeller[item.seller_id] = {
                        items: [],
                        total: 0
                    };
                }
                ordersBySeller[item.seller_id].items.push(item);
                ordersBySeller[item.seller_id].total += (item.price * item.quantity);
            }

            const createdOrderIds = [];

            // Iterate over each seller group to create separate Orders (Split Checkout)
            for (const sellerId in ordersBySeller) {
                const group = ordersBySeller[sellerId];

                // Create individual Invoice for this specific Seller
                const order = await Order.create({
                    user_id: req.session.user.id,
                    total_price: group.total,
                    status: 'pending', // Pending payment
                    payment_method: payment_method || 'midtrans',
                    recipient_name,
                    recipient_phone,
                    shipping_address
                }, { transaction: t });

                createdOrderIds.push(order.id);

                // Insert Items for this specific Invoice
                for (const item of group.items) {
                    // Check Stock sequentially to prevent overselling
                    const product = await Product.findByPk(item.id, {
                        transaction: t,
                        lock: true // Prevent race conditions
                    });

                    if (product.stock < item.quantity) {
                        throw new Error(req.t('order.stock_insufficient', product.name));
                    }

                    await OrderItem.create({
                        order_id: order.id,
                        product_id: item.id,
                        quantity: item.quantity,
                        price_at_purchase: item.price,
                        seller_id: item.seller_id,
                        status: 'pending'
                    }, { transaction: t });

                    // Stock is intentionally NOT decremented during checkout to prevent hoarding.
                    // Stock will be decremented when the seller accepts (processes) the order.
                }
            }

            await t.commit();

            if (dbCartId) {
                await CartItem.destroy({ where: { cart_id: dbCartId } });
            } else {
                req.session.cart = [];
            }

            // Create Xendit Invoice
            const totalGross = Object.values(ordersBySeller).reduce((sum, group) => sum + group.total, 0);

            const externalId = `MASTER-${Date.now()}-${createdOrderIds.join('-')}`;

            const invoiceItems = cart.map(item => ({
                name: item.name.substring(0, 50),
                price: item.price,
                quantity: item.quantity,
                category: 'Health & Pharmacy'
            }));

            const invoiceData = {
                externalId: externalId,
                amount: totalGross,
                description: `Purchase for order ${externalId}`,
                customer: {
                    givenNames: recipient_name.substring(0, 50),
                    mobileNumber: recipient_phone
                    // address info is available but Xendit simplified payload is usually enough
                },
                items: invoiceItems,
                successRedirectUrl: `${req.protocol}://${req.get('host')}/user/dashboard?checkout=success&order_ids=${createdOrderIds.join(',')}`,
                failureRedirectUrl: `${req.protocol}://${req.get('host')}/cart?checkout=failed&order_ids=${createdOrderIds.join(',')}`
            };

            const invoiceResponse = await Invoice.createInvoice({ data: invoiceData });
            const invoiceUrl = invoiceResponse.invoiceUrl;

            // Store external_id and invoice_url for polling fallback and "Pay Now" logic
            await Order.update({
                external_id: externalId,
                invoice_url: invoiceUrl
            }, { where: { id: createdOrderIds } });

            // Return JSON response for AJAX to catch and redirect
            if (req.xhr || req.headers.accept.indexOf('json') > -1) {
                return res.json({
                    success: true,
                    invoiceUrl: invoiceUrl,
                    orderIds: createdOrderIds
                });
            }

            // Fallback
            req.session.save(() => {
                const flashMsg = createdOrderIds.length > 1
                    ? req.t('order.checkout_success_multi', createdOrderIds.length)
                    : req.t('order.checkout_success_single');
                req.flash('success_msg', flashMsg);
                res.redirect('/user/dashboard?checkout=success');
            });

        } catch (err) {
            await t.rollback();
            console.error('Checkout error:', err);

            if (req.xhr || req.headers.accept.indexOf('json') > -1) {
                return res.status(500).json({ success: false, message: req.t('order.checkout_failed', err.message) });
            }

            req.flash('error', req.t('order.checkout_failed', err.message));
            res.redirect('/cart');
        }
    },

    // Show Detail
    detail: async (req, res) => {
        try {
            const order = await Order.findOne({
                where: { id: req.params.id, user_id: req.session.user.id }
            });

            if (!order) {
                req.flash('error', req.t('order.not_found'));
                return res.redirect('/user/dashboard');
            }

            const items = await OrderItem.findAll({
                where: { order_id: order.id },
                include: [
                    { model: Product },
                    { model: User, as: 'seller' }
                ]
            });

            // Map generic items specifically for the view if needed, or pass models
            // The view expects `items` with product_name, image_url, seller_name
            // We can map it or adjust the view. Let's map it to match old object structure to be safe.
            const mappedItems = items.map(i => ({
                id: i.id,
                quantity: i.quantity,
                status: i.status,
                price_at_purchase: i.price_at_purchase,
                product_id: i.product_id,
                product_name: i.Product ? i.Product.name : 'Unknown Product',
                image_url: i.Product ? i.Product.image_url : '',
                seller: i.seller,
                seller_name: i.seller ? i.seller.full_name : 'Unknown Seller',
                seller_address: i.seller ? i.seller.address : 'Alamat Seller Tidak Tersedia',
                order_id: i.order_id
            }));

            res.render('order-detail', { order, items: mappedItems });
        } catch (err) {
            console.error(err);
            res.status(500).send('Server Error');
        }
    },

    // Customer Cancel
    cancel: async (req, res) => {
        const t = await sequelize.transaction();
        try {
            const order = await Order.findOne({
                where: { id: req.params.id, user_id: req.session.user.id },
                transaction: t,
                lock: true // Lock order to prevent double cancellation
            });

            if (!order) throw new Error('Order tidak ditemukan');
            if (['cancelled', 'completed'].includes(order.status)) throw new Error('Tidak bisa dibatalkan');

            await order.update({ status: 'cancelled' }, { transaction: t });

            const items = await OrderItem.findAll({ where: { order_id: order.id }, transaction: t });

            for (const item of items) {
                if (!['rejected', 'cancelled'].includes(item.status)) {
                    const previousStatus = item.status;
                    await item.update({ status: 'cancelled' }, { transaction: t });

                    // Only return stock if it was previously processed or shipped
                    if (previousStatus === 'processed' || previousStatus === 'shipped' || previousStatus === 'completed') {
                        await Product.increment('stock', {
                            by: item.quantity,
                            where: { id: item.product_id },
                            transaction: t
                        });
                    }
                }
            }

            await updateOrderStatus(order.id, t);
            await t.commit();
            req.session.save(() => {
                req.flash('success_msg', req.t('order.cancelled'));
                res.redirect('/orders/' + req.params.id);
            });

        } catch (err) {
            await t.rollback();
            console.error(err);
            req.session.save(() => {
                req.flash('error', req.t('order.cancel_failed', err.message));
                res.redirect('/user/dashboard');
            });
        }
    },

    // Customer Cancel Single Item
    cancelItem: async (req, res) => {
        const isAjax = req.xhr || (req.headers.accept || '').indexOf('json') > -1;
        const t = await sequelize.transaction();
        try {
            const item = await OrderItem.findOne({
                where: { id: req.params.id },
                include: [{
                    model: Order,
                    where: { user_id: req.session.user.id }
                }],
                transaction: t,
                lock: true
            });

            if (!item) {
                if (isAjax) return res.status(404).json({ success: false, message: req.t('order.item_not_found') });
                throw new Error('Item tidak ditemukan');
            }

            if (['cancelled', 'completed', 'rejected', 'shipped'].includes(item.status)) {
                if (isAjax) return res.status(400).json({ success: false, message: req.t('order.item_cannot_cancel') });
                throw new Error('Item sudah diproses, dikirim, selesai, atau dibatalkan');
            }

            const previousStatus = item.status;
            await item.update({ status: 'cancelled' }, { transaction: t });

            if (previousStatus === 'processed' || previousStatus === 'shipped') {
                await Product.increment('stock', {
                    by: item.quantity,
                    where: { id: item.product_id },
                    transaction: t
                });
            }

            await updateOrderStatus(item.order_id, t);
            await t.commit();

            if (isAjax) {
                return res.json({ success: true, message: req.t('order.item_cancelled') });
            }

            req.session.save(() => {
                req.flash('success_msg', req.t('order.item_cancel_flash'));
                res.redirect('/orders/' + item.order_id);
            });
        } catch (err) {
            await t.rollback();
            console.error(err);
            if (isAjax) return res.status(500).json({ success: false, message: err.message });
            req.session.save(() => {
                req.flash('error', req.t('order.item_cancel_error', err.message));
                res.redirect('/user/dashboard');
            });
        }
    },

    // Customer Complete (Item)
    completeItem: async (req, res) => {
        try {
            const item = await OrderItem.findByPk(req.params.id, {
                include: [{ model: Order, where: { user_id: req.session.user.id } }]
            });

            if (!item) throw new Error('Item tidak ditemukan');
            if (item.status !== 'shipped') throw new Error('Item belum dikirim');

            await item.update({ status: 'completed' });
            await updateOrderStatus(item.order_id);

            req.session.save(() => {
                req.flash('success_msg', req.t('order.complete_success'));
                res.redirect('/orders/' + item.order_id);
            });
        } catch (err) {
            console.error(err);
            req.session.save(() => {
                req.flash('error', req.t('order.confirm_failed', err.message));
                res.redirect('/user/dashboard');
            });
        }
    },

    // Seller Actions
    sellerProcess: async (req, res) => {
        const isAjax = req.xhr || (req.headers.accept || '').indexOf('json') > -1;
        const t = await sequelize.transaction();
        try {
            const item = await OrderItem.findOne({
                where: { id: req.params.id, seller_id: req.session.user.id },
                transaction: t,
                lock: true // Lock the order item
            });
            if (!item) {
                if (isAjax) return res.status(404).json({ success: false, message: "Item not found" });
                throw new Error("Item not found");
            }

            // Deduct stock only when accepting a pending/paid order
            if (item.status === 'pending' || item.status === 'paid') {
                const product = await Product.findByPk(item.product_id, { transaction: t, lock: true });
                if (!product || product.stock < item.quantity) {
                    if (isAjax) return res.status(400).json({ success: false, message: req.t('order.seller_stock_insufficient') });
                    throw new Error(req.t('order.seller_stock_insufficient'));
                }
                await Product.decrement('stock', {
                    by: item.quantity,
                    where: { id: item.product_id },
                    transaction: t
                });
            }

            await item.update({ status: 'processed' }, { transaction: t });

            // updateOrderStatus happens BEFORE commit to be atomic within transaction
            await updateOrderStatus(item.order_id, t);
            await t.commit();

            if (isAjax) {
                return res.json({ success: true, message: req.t('order.processed'), status: 'processed' });
            }

            req.session.save(() => {
                req.flash('success_msg', req.t('order.processed'));
                res.redirect('/seller/dashboard');
            });
        } catch (err) {
            await t.rollback();
            console.error(err);
            if (isAjax) return res.status(500).json({ success: false, message: err.message || req.t('order.seller_process_failed') });
            req.session.save(() => {
                req.flash('error', err.message || 'Gagal.');
                res.redirect('/seller/dashboard');
            });
        }
    },

    sellerShip: async (req, res) => {
        const isAjax = req.xhr || (req.headers.accept || '').indexOf('json') > -1;
        try {
            const item = await OrderItem.findOne({
                where: { id: req.params.id, seller_id: req.session.user.id }
            });
            if (!item) {
                if (isAjax) return res.status(404).json({ success: false, message: "Item not found" });
                throw new Error("Item not found");
            }

            await item.update({ status: 'shipped' });
            await updateOrderStatus(item.order_id);

            if (isAjax) {
                return res.json({ success: true, message: req.t('order.shipped'), status: 'shipped' });
            }

            req.session.save(() => {
                req.flash('success_msg', req.t('order.shipped'));
                res.redirect('/seller/dashboard');
            });
        } catch (err) {
            console.error(err);
            if (isAjax) return res.status(500).json({ success: false, message: req.t('order.ship_failed') });
            req.session.save(() => {
                req.flash('error', 'Gagal.');
                res.redirect('/seller/dashboard');
            });
        }
    },

    sellerReject: async (req, res) => {
        const isAjax = req.xhr || (req.headers.accept || '').indexOf('json') > -1;
        const t = await sequelize.transaction();
        try {
            const item = await OrderItem.findOne({
                where: { id: req.params.id, seller_id: req.session.user.id },
                transaction: t,
                lock: true // Lock item
            });
            if (!item) {
                if (isAjax) return res.status(404).json({ success: false, message: "Item not found" });
                throw new Error("Item not found");
            }
            if (['rejected', 'cancelled'].includes(item.status)) {
                if (isAjax) return res.status(400).json({ success: false, message: req.t('order.already_rejected') });
                throw new Error(req.t('order.already_rejected'));
            }

            const previousStatus = item.status;
            await item.update({ status: 'rejected' }, { transaction: t });

            // Only return stock if it was previously processed or shipped (already deducted)
            if (previousStatus === 'processed' || previousStatus === 'shipped' || previousStatus === 'completed') {
                await Product.increment('stock', {
                    by: item.quantity,
                    where: { id: item.product_id },
                    transaction: t
                });
            }

            // updateOrderStatus syncs invoice amount inside transaction
            await updateOrderStatus(item.order_id, t);
            await t.commit();

            if (isAjax) {
                return res.json({ success: true, message: req.t('order.rejected'), status: 'rejected' });
            }

            req.session.save(() => {
                req.flash('success_msg', req.t('order.rejected'));
                res.redirect('/seller/dashboard');
            });
        } catch (err) {
            await t.rollback();
            console.error(err);
            if (isAjax) return res.status(500).json({ success: false, message: req.t('order.reject_failed') });
            req.session.save(() => {
                req.flash('error', req.t('order.seller_reject_error', err.message));
                res.redirect('/seller/dashboard');
            });
        }
    },

    // Seller Detail
    sellerDetail: async (req, res) => {
        try {
            // Find the specific OrderItem belonging to this seller
            // We use the ID passed in params which corresponds to the OrderItem ID (not Order ID)
            // because sellers deal with items individually.
            const item = await OrderItem.findOne({
                where: { id: req.params.id, seller_id: req.session.user.id },
                include: [
                    { model: Product },
                    { model: Order, include: [{ model: User, as: 'user' }] } // Buyer info
                ]
            });

            if (!item) {
                req.flash('error', req.t('order.seller_detail_denied'));
                return res.redirect('/seller/dashboard');
            }

            res.render('seller/order-detail', { item });
        } catch (err) {
            console.error(err);
            res.status(500).send('Server Error');
        }
    },

    // Customer Hide History (Soft Delete)
    hideHistory: async (req, res) => {
        const isAjax = req.xhr || (req.headers.accept || '').indexOf('json') > -1;
        try {
            const order = await Order.findOne({
                where: { id: req.params.id, user_id: req.session.user.id }
            });
            if (!order) {
                if (isAjax) return res.status(404).json({ success: false, message: req.t('order.order_not_found') });
                throw new Error('Pesanan tidak ditemukan');
            }

            // Allow hiding if status is completed or cancelled.
            if (order.status !== 'completed' && order.status !== 'cancelled' && order.status !== 'rejected') {
                if (isAjax) return res.status(400).json({ success: false, message: req.t('order.hide_restriction') });
                throw new Error('Hanya pesanan selesai, ditolak, atau dibatalkan yang bisa dihapus dari riwayat.');
            }

            await order.update({ visible_to_customer: false });

            if (isAjax) {
                return res.json({ success: true, message: req.t('order.history_removed') });
            }

            req.session.save(() => {
                req.flash('success_msg', req.t('order.history_removed'));
                res.redirect('/user/dashboard');
            });
        } catch (err) {
            console.error(err);
            if (isAjax) return res.status(500).json({ success: false, message: err.message });
            req.session.save(() => {
                req.flash('error', err.message);
                res.redirect('/user/dashboard');
            });
        }
    },

    // Seller Hide History (Soft Delete)
    hideSellerHistory: async (req, res) => {
        const isAjax = req.xhr || (req.headers.accept || '').indexOf('json') > -1;
        try {
            const item = await OrderItem.findOne({
                where: { id: req.params.id, seller_id: req.session.user.id }
            });
            if (!item) {
                if (isAjax) return res.status(404).json({ success: false, message: req.t('order.item_not_found') });
                throw new Error('Item tidak ditemukan');
            }

            // Allow hiding if completed, cancelled, or rejected
            if (!['completed', 'cancelled', 'rejected'].includes(item.status)) {
                if (isAjax) return res.status(400).json({ success: false, message: req.t('order.hide_restriction_short') });
                throw new Error('Hanya pesanan selesai/batal/tolak yang bisa dihapus.');
            }

            await item.update({ visible_to_seller: false });

            if (isAjax) {
                return res.json({ success: true, message: req.t('order.history_removed') });
            }

            req.session.save(() => {
                req.flash('success_msg', req.t('order.history_removed'));
                res.redirect('/seller/dashboard');
            });
        } catch (err) {
            console.error(err);
            if (isAjax) return res.status(500).json({ success: false, message: err.message });
            req.session.save(() => {
                req.flash('error', err.message);
                res.redirect('/seller/dashboard');
            });
        }
    },

    // Admin Hard Delete
    adminDelete: async (req, res) => {
        const isAjax = req.xhr || (req.headers.accept || '').indexOf('json') > -1;
        try {
            const order = await Order.findByPk(req.params.id);
            if (!order) {
                if (isAjax) return res.status(404).json({ success: false, message: 'Order not found' });
                throw new Error('Order not found');
            }

            await order.destroy(); // Cascade deletes items usually, based on migration

            if (isAjax) {
                return res.json({ success: true, message: req.t('order.permanent_deleted') });
            }

            req.session.save(() => {
                req.flash('success_msg', req.t('order.permanent_deleted'));
                res.redirect('/admin/dashboard');
            });
        } catch (err) {
            console.error(err);
            if (isAjax) return res.status(500).json({ success: false, message: req.t('order.delete_failed', err.message) });
            req.session.save(() => {
                req.flash('error', req.t('order.delete_failed', err.message));
                res.redirect('/admin/dashboard');
            });
        }
    },

    // Xendit Webhook Notification
    xenditWebhook: async (req, res) => {
        try {
            // Verify callback token if you have it in .env
            const callbackToken = req.headers['x-callback-token'];
            if (process.env.XENDIT_CALLBACK_TOKEN && callbackToken !== process.env.XENDIT_CALLBACK_TOKEN) {
                return res.status(401).json({ status: 'error', message: 'Unauthorized' });
            }

            const { external_id, status } = req.body;
            console.log(`Xendit webhook received for ${external_id}. Status: ${status}`);

            // Parse external_id (e.g., "MASTER-123456789-1-2-3")
            const parts = external_id.split('-');
            const orderIds = parts.slice(2);

            let newStatus = 'pending';

            if (status === 'PAID' || status === 'SETTLED') {
                newStatus = 'paid';
            } else if (status === 'EXPIRED') {
                newStatus = 'cancelled';
            }

            // Update all related Orders and their items
            const t = await sequelize.transaction();
            try {
                for (let oid of orderIds) {
                    await Order.update({ status: newStatus }, { where: { id: oid }, transaction: t });
                    await OrderItem.update({ status: newStatus }, { where: { order_id: oid }, transaction: t });

                    // Trigger internal status sync (handling partially processed logic if needed)
                    await updateOrderStatus(oid, t);
                }
                await t.commit();
                res.status(200).json({ status: 'success', message: 'OK' });
            } catch (updateErr) {
                await t.rollback();
                console.error('Failed to update orders from Xendit webhook:', updateErr);
                res.status(500).json({ status: 'error', message: 'Database update failed' });
            }

        } catch (err) {
            console.error('Xendit Notification Error:', err);
            res.status(500).json({ status: 'error', message: 'Internal Server Error' });
        }
    },

    // Resume Payment (Regenerate Invoice if needed)
    resumePayment: async (req, res) => {
        try {
            const order = await Order.findOne({
                where: { id: req.params.id, user_id: req.session.user.id },
                include: [{ model: OrderItem, as: 'items', include: [Product] }]
            });

            if (!order) {
                req.flash('error', req.t('order.not_found'));
                return res.redirect('/user/dashboard');
            }

            if (order.status !== 'pending') {
                req.flash('error', 'Pesanan ini sudah dibayar atau tidak bisa dilanjutkan.');
                return res.redirect('/orders/' + order.id);
            }

            // If we have a valid invoice_url and price matches, use it
            if (order.invoice_url) {
                return res.redirect(order.invoice_url);
            }

            // Otherwise, generate a NEW invoice with current active items
            const activeItems = (order.items || []).filter(i => i.status !== 'cancelled' && i.status !== 'rejected');

            if (activeItems.length === 0) {
                req.flash('error', 'Semua item dalam pesanan ini telah dibatalkan.');
                return res.redirect('/orders/' + order.id);
            }

            const totalGross = parseFloat(order.total_price);
            const externalId = `RENEW-${Date.now()}-${order.id}`;

            const invoiceItems = activeItems.map(item => ({
                name: (item.Product ? item.Product.name : 'Product').substring(0, 50),
                price: parseFloat(item.price_at_purchase),
                quantity: item.quantity,
                category: 'Health & Pharmacy'
            }));

            const invoiceData = {
                externalId: externalId,
                amount: totalGross,
                description: `Payment for order #ORD-${order.id}`,
                customer: {
                    givenNames: order.recipient_name.substring(0, 50),
                    mobileNumber: order.recipient_phone
                },
                items: invoiceItems,
                successRedirectUrl: `${req.protocol}://${req.get('host')}/user/dashboard?checkout=success&order_ids=${order.id}`,
                failureRedirectUrl: `${req.protocol}://${req.get('host')}/cart?checkout=failed&order_ids=${order.id}`
            };

            const invoiceResponse = await Invoice.createInvoice({ data: invoiceData });
            const invoiceUrl = invoiceResponse.invoiceUrl;

            // Update order with NEW link and external_id
            await order.update({
                invoice_url: invoiceUrl,
                external_id: externalId
            });

            res.redirect(invoiceUrl);

        } catch (err) {
            console.error('Resume payment error:', err);
            req.flash('error', 'Gagal memproses pembayaran. Silakan coba lagi nanti.');
            res.redirect('/orders/' + req.params.id);
        }
    }
};
