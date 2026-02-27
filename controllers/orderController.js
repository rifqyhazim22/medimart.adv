const { Order, OrderItem, Product, User, sequelize } = require('../models');
const { Op } = require('sequelize');

const updateOrderStatus = async (orderId, transaction = null) => {
    const options = transaction ? { transaction } : {};
    const items = await OrderItem.findAll({ where: { order_id: orderId }, ...options });
    if (items.length === 0) return;

    const activeItems = items.filter(i => i.status !== 'cancelled' && i.status !== 'rejected');

    // Recalculate true Total Price left for the Invoice
    const recalculatedTotal = activeItems.reduce((acc, i) => acc + (parseFloat(i.price_at_purchase) * i.quantity), 0);
    const updatePayload = { total_price: recalculatedTotal };

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

    const allActiveCompleted = activeItems.every(i => i.status === 'completed');
    const allActiveShipped = activeItems.every(i => i.status === 'shipped' || i.status === 'completed');
    const anyActiveProcessed = activeItems.some(i => i.status === 'processed' || i.status === 'shipped' || i.status === 'completed');

    let newStatus = 'paid';
    if (allActiveCompleted) newStatus = 'completed';
    else if (allActiveShipped) newStatus = 'shipped';
    else if (anyActiveProcessed) newStatus = 'processing';

    updatePayload.status = newStatus;
    await Order.update(updatePayload, { where: { id: orderId }, ...options });
};

module.exports = {
    // Create Order
    create: async (req, res) => {
        const { recipient_name, recipient_phone, shipping_address, payment_method } = req.body;
        const cart = req.session.cart || [];

        if (cart.length === 0) {
            req.flash('error', 'Keranjang belanja Anda masih kosong nih. Yuk tambah barang dulu!');
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
                    status: 'paid',
                    payment_method,
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
                        throw new Error(`Stok tidak cukup untuk produk: ${product.name}`);
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
            req.session.cart = [];
            req.session.save(() => {
                const flashMsg = createdOrderIds.length > 1
                    ? `Transaksi berhasil! Pesanan Anda dipecah menjadi ${createdOrderIds.length} tagihan terpisah berdasarkan masing-masing toko.`
                    : 'Transaksi berhasil! Pesanan Anda sedang diteruskan ke Penjual.';
                req.flash('success_msg', flashMsg);
                res.redirect('/user/dashboard');
            });

        } catch (err) {
            await t.rollback();
            console.error(err);
            req.flash('error', 'Yah, transaksi gagal diproses, pastikan saldo atau koneksi aman: ' + err.message);
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
                req.flash('error', 'Waduh, pesanan yang Anda cari tidak dapat ditemukan di catatan kami.');
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
                product_name: i.Product ? i.Product.name : 'Unknown Product',
                image_url: i.Product ? i.Product.image_url : '',
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
                req.flash('success_msg', 'Pesanan utuh berhasil dibatalkan. Jangan khawatir, sistem telah mencatatnya.');
                res.redirect('/orders/' + req.params.id);
            });

        } catch (err) {
            await t.rollback();
            console.error(err);
            req.session.save(() => {
                req.flash('error', 'Gagal membatalkan pesanan. Coba lagi nanti: ' + err.message);
                res.redirect('/user/dashboard');
            });
        }
    },

    // Customer Cancel Single Item
    cancelItem: async (req, res) => {
        const isAjax = req.xhr || req.headers.accept.indexOf('json') > -1;
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
                if (isAjax) return res.status(404).json({ success: false, message: 'Item tidak ditemukan' });
                throw new Error('Item tidak ditemukan');
            }

            if (['cancelled', 'completed', 'rejected', 'shipped'].includes(item.status)) {
                if (isAjax) return res.status(400).json({ success: false, message: 'Item tidak bisa dibatalkan' });
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
                return res.json({ success: true, message: 'Satu barang berhasil dibatalkan.' });
            }

            req.session.save(() => {
                req.flash('success_msg', 'Satu barang dari pesanan berhasil dibatalkan. Sisa barang akan tetap dikirim.');
                res.redirect('/orders/' + item.order_id);
            });
        } catch (err) {
            await t.rollback();
            console.error(err);
            if (isAjax) return res.status(500).json({ success: false, message: err.message });
            req.session.save(() => {
                req.flash('error', 'Terjadi sedikit kendala saat membatalkan barang: ' + err.message);
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
                req.flash('success_msg', 'Hore! Pesanan telah Anda terima. Semoga produknya bermanfaat ya! 🎉');
                res.redirect('/orders/' + item.order_id);
            });
        } catch (err) {
            console.error(err);
            req.session.save(() => {
                req.flash('error', 'Gagal konfirmasi: ' + err.message);
                res.redirect('/user/dashboard');
            });
        }
    },

    // Seller Actions
    sellerProcess: async (req, res) => {
        const isAjax = req.xhr || req.headers.accept.indexOf('json') > -1;
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
                    if (isAjax) return res.status(400).json({ success: false, message: "Stok barang tidak mencukupi." });
                    throw new Error("Stok barang tidak mencukupi.");
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
                return res.json({ success: true, message: 'Pesanan diproses', status: 'processed' });
            }

            req.session.save(() => {
                req.flash('success_msg', 'Pesanan diproses.');
                res.redirect('/seller/dashboard');
            });
        } catch (err) {
            await t.rollback();
            console.error(err);
            if (isAjax) return res.status(500).json({ success: false, message: err.message || 'Gagal memproses pesanan' });
            req.session.save(() => {
                req.flash('error', err.message || 'Gagal.');
                res.redirect('/seller/dashboard');
            });
        }
    },

    sellerShip: async (req, res) => {
        const isAjax = req.xhr || req.headers.accept.indexOf('json') > -1;
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
                return res.json({ success: true, message: 'Pesanan dikirim', status: 'shipped' });
            }

            req.session.save(() => {
                req.flash('success_msg', 'Pesanan dikirim.');
                res.redirect('/seller/dashboard');
            });
        } catch (err) {
            console.error(err);
            if (isAjax) return res.status(500).json({ success: false, message: 'Gagal mengirim pesanan' });
            req.session.save(() => {
                req.flash('error', 'Gagal.');
                res.redirect('/seller/dashboard');
            });
        }
    },

    sellerReject: async (req, res) => {
        const isAjax = req.xhr || req.headers.accept.indexOf('json') > -1;
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
                if (isAjax) return res.status(400).json({ success: false, message: "Sudah ditolak/batal" });
                throw new Error('Sudah ditolak/batal');
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
                return res.json({ success: true, message: 'Pesanan ditolak', status: 'rejected' });
            }

            req.session.save(() => {
                req.flash('success_msg', 'Pesanan ditolak.');
                res.redirect('/seller/dashboard');
            });
        } catch (err) {
            await t.rollback();
            console.error(err);
            if (isAjax) return res.status(500).json({ success: false, message: 'Gagal menolak pesanan' });
            req.session.save(() => {
                req.flash('error', 'Gagal: ' + err.message);
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
                req.flash('error', 'Pesanan tidak ditemukan atau akses ditolak.');
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
        const isAjax = req.xhr || req.headers.accept.indexOf('json') > -1;
        try {
            const order = await Order.findOne({
                where: { id: req.params.id, user_id: req.session.user.id }
            });
            if (!order) {
                if (isAjax) return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan' });
                throw new Error('Pesanan tidak ditemukan');
            }

            // Allow hiding if status is completed or cancelled.
            if (order.status !== 'completed' && order.status !== 'cancelled' && order.status !== 'rejected') {
                if (isAjax) return res.status(400).json({ success: false, message: 'Hanya pesanan selesai, ditolak, atau dibatalkan yang bisa dihapus dari riwayat.' });
                throw new Error('Hanya pesanan selesai, ditolak, atau dibatalkan yang bisa dihapus dari riwayat.');
            }

            await order.update({ visible_to_customer: false });

            if (isAjax) {
                return res.json({ success: true, message: 'Riwayat pesanan dihapus.' });
            }

            req.session.save(() => {
                req.flash('success_msg', 'Riwayat pesanan dihapus.');
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
        const isAjax = req.xhr || req.headers.accept.indexOf('json') > -1;
        try {
            const item = await OrderItem.findOne({
                where: { id: req.params.id, seller_id: req.session.user.id }
            });
            if (!item) {
                if (isAjax) return res.status(404).json({ success: false, message: 'Item tidak ditemukan' });
                throw new Error('Item tidak ditemukan');
            }

            // Allow hiding if completed, cancelled, or rejected
            if (!['completed', 'cancelled', 'rejected'].includes(item.status)) {
                if (isAjax) return res.status(400).json({ success: false, message: 'Hanya pesanan selesai/batal/tolak yang bisa dihapus.' });
                throw new Error('Hanya pesanan selesai/batal/tolak yang bisa dihapus.');
            }

            await item.update({ visible_to_seller: false });

            if (isAjax) {
                return res.json({ success: true, message: 'Riwayat pesanan dihapus.' });
            }

            req.session.save(() => {
                req.flash('success_msg', 'Riwayat pesanan dihapus.');
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
        const isAjax = req.xhr || req.headers.accept.indexOf('json') > -1;
        try {
            const order = await Order.findByPk(req.params.id);
            if (!order) {
                if (isAjax) return res.status(404).json({ success: false, message: 'Order not found' });
                throw new Error('Order not found');
            }

            await order.destroy(); // Cascade deletes items usually, based on migration

            if (isAjax) {
                return res.json({ success: true, message: 'Order permanen dihapus.' });
            }

            req.session.save(() => {
                req.flash('success_msg', 'Order permanen dihapus.');
                res.redirect('/admin/dashboard');
            });
        } catch (err) {
            console.error(err);
            if (isAjax) return res.status(500).json({ success: false, message: 'Gagal menghapus: ' + err.message });
            req.session.save(() => {
                req.flash('error', 'Gagal menghapus: ' + err.message);
                res.redirect('/admin/dashboard');
            });
        }
    }
};
