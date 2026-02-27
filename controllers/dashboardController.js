const { User, Product, Order, OrderItem, sequelize } = require('../models');
const { Op } = require('sequelize');

module.exports = {
    // User Dashboard
    userDashboard: async (req, res) => {
        try {
            const user = req.session.user;

            // Fetch Orders instead of OrderItems to show grouped list
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

            // Calculate Stats based on OrderItems for accuracy
            const allItems = await OrderItem.findAll({
                include: [{ model: Order, where: { user_id: user.id, visible_to_customer: true } }]
            });

            const activeStatuses = ['pending', 'paid', 'processed', 'shipped'];
            const spentStatuses = ['paid', 'processed', 'shipped', 'completed'];

            const uniqueOrders = new Set(allItems.map(item => item.order_id));
            const activeUniqueOrders = new Set(allItems.filter(item => activeStatuses.includes(item.status)).map(item => item.order_id));

            const stats = {
                totalOrders: uniqueOrders.size,
                activeOrders: activeUniqueOrders.size,
                totalSpent: allItems.filter(item => spentStatuses.includes(item.status)).reduce((sum, item) => sum + (parseFloat(item.price_at_purchase) * item.quantity), 0)
            };

            res.render('user/dashboard', { orders, stats });
        } catch (err) {
            console.error(err);
            res.status(500).send('Server Error');
        }
    },

    // Seller Dashboard
    sellerDashboard: async (req, res) => {
        try {
            const user = req.session.user;

            const products = await Product.findAll({
                where: { seller_id: user.id },
                order: [['id', 'DESC']]
            });

            // Incoming Orders (Items)
            const orderItems = await OrderItem.findAll({
                where: { seller_id: user.id, visible_to_seller: true },
                include: [
                    { model: Product },
                    { model: Order, include: [{ model: User, as: 'user' }] } // Buyer info
                ],
                order: [['id', 'DESC']]
            });

            // Map for view compatibility if needed, or update view to use associations
            // View expects: order_ref_id, product_name, image_url, buyer_name, etc.
            const mappedOrders = orderItems.map(item => ({
                id: item.id,
                quantity: item.quantity,
                status: item.status,
                price_at_purchase: item.price_at_purchase,
                product_name: item.Product ? item.Product.name : 'Unknown',
                image_url: item.Product ? item.Product.image_url : '',
                created_at: item.Order ? item.Order.createdAt : new Date(), // Use Order date
                buyer_name: item.Order && item.Order.user ? item.Order.user.username : 'Unknown',
                order_ref_id: item.order_id
            }));

            const stats = {
                totalProducts: products.length,
                totalStock: products.reduce((sum, p) => sum + p.stock, 0),
                totalValue: products.reduce((sum, p) => sum + (parseFloat(p.price) * p.stock), 0)
            };

            res.render('seller/dashboard', { products, orders: mappedOrders, stats });
        } catch (err) {
            console.error(err);
            res.status(500).send('Server Error');
        }
    },

    // Admin Dashboard
    adminDashboard: async (req, res) => {
        try {
            const allUsers = await User.findAll({ order: [['id', 'DESC']] });

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

            // Total Revenue from valid items only
            const totalRevenue = validOrderItems.reduce((sum, item) => sum + (parseFloat(item.price_at_purchase) * item.quantity), 0);

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
                totalProducts: totalProducts || 0
            };

            res.render('admin/dashboard', { allUsers, stats, recentOrders: mappedRecentOrders });
        } catch (err) {
            console.error(err);
            res.status(500).send('Server Error');
        }
    }
};
