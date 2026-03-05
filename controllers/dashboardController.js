const { User, Product, Order, OrderItem, sequelize } = require('../models');
const { Op } = require('sequelize');
const { updateOrderStatus } = require('./orderController');
const { Invoice } = require('../utils/xendit');

module.exports = {
    // User Dashboard (Stats Only)
    userDashboard: async (req, res) => {
        try {
            const user = req.session.user;

            // Poll for status updates for any pending orders before rendering
            const pendingOrders = await Order.findAll({
                where: { user_id: user.id, status: 'pending', external_id: { [Op.ne]: null } }
            });

            for (const order of pendingOrders) {
                try {
                    // Fetch invoices matching this external_id
                    const invoices = await Invoice.getInvoices({ externalId: order.external_id });
                    if (invoices && invoices.length > 0) {
                        const inv = invoices[0]; // Take the first match
                        if (inv.status === 'PAID' || inv.status === 'SETTLED') {
                            await Order.update({ status: 'paid' }, { where: { id: order.id } });
                            await OrderItem.update({ status: 'paid' }, { where: { order_id: order.id } });
                            await updateOrderStatus(order.id);
                        } else if (inv.status === 'EXPIRED') {
                            await Order.update({ status: 'cancelled' }, { where: { id: order.id } });
                            await OrderItem.update({ status: 'cancelled' }, { where: { order_id: order.id } });
                            await updateOrderStatus(order.id);
                        }
                    }
                } catch (e) {
                    console.error(`Polling fallback failed for Order ${order.id}:`, e.message);
                }
            }

            // Calculate Stats accurately based on authentic Order counts
            const totalOrders = await Order.count({ where: { user_id: user.id, visible_to_customer: true } });
            const activeOrders = await Order.count({
                where: {
                    user_id: user.id,
                    visible_to_customer: true,
                    status: { [Op.notIn]: ['completed', 'cancelled', 'rejected'] }
                }
            });

            // Total spent is the summation of valid OrderItem prices
            const validItems = await OrderItem.findAll({
                include: [{ model: Order, where: { user_id: user.id, visible_to_customer: true } }],
                where: { status: { [Op.in]: ['paid', 'processed', 'shipped', 'completed'] } }
            });
            const totalSpent = validItems.reduce((sum, item) => sum + (parseFloat(item.price_at_purchase) * item.quantity), 0);

            // Recent 3 orders for quick preview
            const recentOrders = await Order.findAll({
                where: { user_id: user.id, visible_to_customer: true },
                include: [{ model: OrderItem, as: 'items', include: [{ model: Product }] }],
                order: [['id', 'DESC']],
                limit: 3
            });

            const stats = { totalOrders, activeOrders, totalSpent };

            res.render('user/dashboard', { stats, recentOrders });
        } catch (err) {
            console.error(err);
            res.status(500).send('Server Error');
        }
    },

    // User Order History (Full)
    userOrders: async (req, res) => {
        try {
            const user = req.session.user;

            // Poll for status updates for any pending orders
            const pendingOrders = await Order.findAll({
                where: { user_id: user.id, status: 'pending', external_id: { [Op.ne]: null } }
            });

            for (const order of pendingOrders) {
                try {
                    const invoices = await Invoice.getInvoices({ externalId: order.external_id });
                    if (invoices && invoices.length > 0) {
                        const inv = invoices[0];
                        if (inv.status === 'PAID' || inv.status === 'SETTLED') {
                            await Order.update({ status: 'paid' }, { where: { id: order.id } });
                            await OrderItem.update({ status: 'paid' }, { where: { order_id: order.id } });
                            await updateOrderStatus(order.id);
                        } else if (inv.status === 'EXPIRED') {
                            await Order.update({ status: 'cancelled' }, { where: { id: order.id } });
                            await OrderItem.update({ status: 'cancelled' }, { where: { order_id: order.id } });
                            await updateOrderStatus(order.id);
                        }
                    }
                } catch (e) {
                    console.error(`Polling fallback failed for Order ${order.id}:`, e.message);
                }
            }

            const orders = await Order.findAll({
                where: { user_id: user.id, visible_to_customer: true },
                include: [
                    {
                        model: OrderItem,
                        as: 'items',
                        include: [
                            { model: Product },
                            { model: User, as: 'seller' }
                        ]
                    }
                ],
                order: [['id', 'DESC']]
            });

            res.render('user/orders', { orders });
        } catch (err) {
            console.error(err);
            res.status(500).send('Server Error');
        }
    },

    // Seller Dashboard (Stats & Advanced Analytics)
    sellerDashboard: async (req, res) => {
        try {
            const user = req.session.user;

            const allProducts = await Product.findAll({ where: { seller_id: user.id } });

            // Kalkulasi Pendapatan Lapak & Chart Data
            const sellerValidItems = await OrderItem.findAll({
                where: {
                    seller_id: user.id,
                    status: { [Op.in]: ['paid', 'processed', 'shipped', 'completed'] }
                },
                include: [{ model: Product }, { model: Order }],
                order: [['id', 'ASC']]
            });

            let grossSellerRevenue = 0;
            const monthlyRevenue = new Array(12).fill(0);
            const productSalesMap = {}; // Untuk Top Products

            sellerValidItems.forEach(item => {
                const itemRevenue = parseFloat(item.price_at_purchase) * item.quantity;
                grossSellerRevenue += itemRevenue;

                // Chart Data (Net Revenue = 90% of Gross)
                const month = new Date(item.Order ? item.Order.createdAt : Date.now()).getMonth();
                monthlyRevenue[month] += (itemRevenue * 0.90);

                // Populating top products
                if (item.Product) {
                    if (!productSalesMap[item.Product.id]) {
                        productSalesMap[item.Product.id] = {
                            name: item.Product.name,
                            image: item.Product.image_url,
                            qty: 0,
                            revenue: 0
                        };
                    }
                    productSalesMap[item.Product.id].qty += item.quantity;
                    productSalesMap[item.Product.id].revenue += (itemRevenue * 0.90);
                }
            });
            const netSellerRevenue = grossSellerRevenue * 0.90; // Admin mendapat 10% dari GMV

            // Urutkan Product Terlaris dan ambil 5 teratas
            const topProducts = Object.values(productSalesMap)
                .sort((a, b) => b.qty - a.qty)
                .slice(0, 5);

            // Fetch Recent Orders (All items including pending)
            const recentOrderItems = await OrderItem.findAll({
                where: { seller_id: user.id, visible_to_seller: true },
                include: [
                    { model: Product },
                    { model: Order, include: [{ model: User, as: 'user' }] }
                ],
                order: [['id', 'DESC']],
                limit: 5
            });

            const recentOrders = recentOrderItems.map(item => ({
                id: item.id,
                status: item.status,
                quantity: item.quantity,
                price: item.price_at_purchase,
                product_name: item.Product ? item.Product.name : 'Terhapus',
                buyer_name: item.Order && item.Order.user ? item.Order.user.username : 'Unknown',
                date: item.Order ? item.Order.createdAt : null
            }));

            const stats = {
                totalProducts: allProducts.length,
                totalStock: allProducts.reduce((sum, p) => sum + p.stock, 0),
                totalValue: allProducts.reduce((sum, p) => sum + (parseFloat(p.price) * p.stock), 0),
                netRevenue: netSellerRevenue
            };

            res.render('seller/dashboard', {
                stats,
                monthlyRevenue: JSON.stringify(monthlyRevenue),
                topProducts,
                recentOrders
            });
        } catch (err) {
            console.error(err);
            res.status(500).send('Server Error');
        }
    },

    // Seller Products (Inventory Management)
    sellerProducts: async (req, res) => {
        try {
            const user = req.session.user;
            const search = req.query.search || '';

            const whereClause = { seller_id: user.id };
            if (search) {
                whereClause[Op.or] = [
                    { name: { [Op.iLike]: `%${search}%` } },
                    { description: { [Op.iLike]: `%${search}%` } }
                ];
            }

            const products = await Product.findAll({
                where: whereClause,
                order: [['id', 'DESC']]
            });

            res.render('seller/products', { products, searchQuery: search });
        } catch (err) {
            console.error(err);
            res.status(500).send('Server Error');
        }
    },

    // Seller Orders (Incoming Orders)
    sellerOrders: async (req, res) => {
        try {
            const user = req.session.user;

            // Incoming Orders (Items)
            const orderItems = await OrderItem.findAll({
                where: { seller_id: user.id, visible_to_seller: true },
                include: [
                    { model: Product },
                    { model: Order, include: [{ model: User, as: 'user' }] } // Buyer info
                ],
                order: [['id', 'DESC']]
            });

            const mappedOrders = orderItems.map(item => ({
                id: item.id,
                quantity: item.quantity,
                status: item.status,
                price_at_purchase: item.price_at_purchase,
                product_name: item.Product ? item.Product.name : 'Unknown',
                image_url: item.Product ? item.Product.image_url : '',
                created_at: item.Order ? item.Order.createdAt : new Date(),
                buyer_name: item.Order && item.Order.user ? item.Order.user.username : 'Unknown',
                order_ref_id: item.order_id
            }));

            res.render('seller/orders', { orders: mappedOrders });
        } catch (err) {
            console.error(err);
            res.status(500).send('Server Error');
        }
    },

    // Seller Settings Page
    sellerSettings: async (req, res) => {
        try {
            const user = req.session.user;
            const fullUserData = await User.findByPk(user.id, {
                include: [{ model: sequelize.models.Seller, as: 'seller' }]
            });
            res.render('seller/settings', { seller: fullUserData, currentUser: user });
        } catch (err) {
            console.error(err);
            res.status(500).send('<pre>' + err.stack + '</pre>');
        }
    },

    // Seller Settings Page Update Action
    sellerSettingsUpdate: async (req, res) => {
        try {
            const userId = req.session.user.id;
            const { store_name, store_description, store_address } = req.body;

            const [sellerData, created] = await sequelize.models.Seller.findOrCreate({
                where: { user_id: userId },
                defaults: { store_name, store_description, store_address }
            });

            if (!created) {
                sellerData.store_name = store_name;
                sellerData.store_description = store_description;
                sellerData.store_address = store_address;
            }

            // Optimize Store Banner (supports Cropper.js crop)
            if (req.files) {
                const { optimizeImage } = require('../utils/imageOptimizer');
                // If cropped version exists, use it
                if (req.files.croppedBanner && req.files.croppedBanner[0]) {
                    sellerData.store_banner = await optimizeImage(req.files.croppedBanner[0], 1920);
                }
                // If only original uploaded (no crop), use original
                else if (req.files.store_banner && req.files.store_banner[0]) {
                    sellerData.store_banner = await optimizeImage(req.files.store_banner[0], 1920);
                }
            }

            await sellerData.save();

            req.flash('success_msg', req.t('dashboard.store_updated'));
            res.redirect('/seller/settings');
        } catch (err) {
            console.error(err);
            req.flash('error', req.t('dashboard.store_save_failed'));
            res.redirect('/seller/settings');
        }
    },

    // Admin Dashboard
    adminDashboard: async (req, res) => {
        try {
            const search = req.query.search || '';
            const whereClause = {};
            if (search) {
                whereClause[Op.or] = [
                    { username: { [Op.iLike]: `%${search}%` } },
                    { full_name: { [Op.iLike]: `%${search}%` } },
                    { email: { [Op.iLike]: `%${search}%` } }
                ];
            }

            const allUsers = await User.findAll({ where: whereClause, order: [['id', 'DESC']] });

            // Stats - Calculated from OrderItems for precise item-level accuracy
            const validOrderItems = await OrderItem.findAll({
                where: {
                    status: {
                        [Op.in]: ['paid', 'processed', 'shipped', 'completed']
                    }
                }
            });

            // Unique orders count based on valid items
            const uniqueOrderIds = new Set(validOrderItems.map(item => item.order_id));
            const totalOrders = uniqueOrderIds.size;

            // Total Revenue from valid items only (Gross Merchandise Value)
            const totalRevenue = validOrderItems.reduce((sum, item) => sum + (parseFloat(item.price_at_purchase) * item.quantity), 0);

            // Kebijakan Baru: Admin Medimart berhak mendapatkan 10% dari setiap harga jual.
            const adminRevenue = totalRevenue * 0.10;

            const totalProducts = await Product.count();

            // Recent Orders
            const recentOrders = await Order.findAll({
                limit: 50,
                order: [['id', 'DESC']],
                include: [
                    { model: User, as: 'user' },
                    { model: OrderItem, as: 'items' }
                ]
            });
            // Map for view: customer_name & dynamic total
            const mappedRecentOrders = recentOrders.map(o => {
                let trueTotal = o.total_price;
                if (o.items && o.items.length > 0) {
                    const validItems = o.items.filter(i => i.status !== 'cancelled' && i.status !== 'rejected');
                    trueTotal = validItems.reduce((acc, i) => acc + (parseFloat(i.price_at_purchase) * i.quantity), 0);
                }
                return {
                    id: o.id,
                    total_price: trueTotal,
                    status: o.status,
                    created_at: o.createdAt,
                    customer_name: o.user ? (o.user.full_name || o.user.username) : 'Unknown'
                };
            });

            const stats = {
                totalUsers: allUsers.length,
                totalSellers: allUsers.filter(u => u.role === 'seller').length,
                totalCustomers: allUsers.filter(u => u.role === 'user' || u.role === 'customer').length,
                totalAdmins: allUsers.filter(u => u.role === 'admin').length,
                totalOrders: totalOrders || 0,
                totalRevenue: totalRevenue || 0,
                adminRevenue: adminRevenue || 0,
                totalProducts: totalProducts || 0
            };

            res.render('admin/dashboard', {
                allUsers,
                stats,
                recentOrders: mappedRecentOrders,
                searchQuery: search,
                chartData: [stats.totalCustomers, stats.totalSellers]
            });
        } catch (err) {
            console.error(err);
            res.status(500).send('Server Error');
        }
    }
};
