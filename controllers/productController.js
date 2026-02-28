const { Product, User, Order, OrderItem, sequelize } = require('../models');
const { Op } = require('sequelize');
const { optimizeImage } = require('../utils/imageOptimizer');

module.exports = {
    // Marketplace Home
    index: async (req, res) => {
        try {
            const { category, search } = req.query;
            const where = {};
            if (category && category !== 'all') where.category = category;
            if (search) where.name = { [Op.iLike]: `%${search}%` };

            const products = await Product.findAll({
                where,
                include: [{ model: User, as: 'seller' }],
                order: [['createdAt', 'DESC']]
            });

            // Recommendation Engine Logic
            let recommendedProducts = [];
            let recoTitle = "Spesial Untuk Anda";

            if (req.session.user && req.session.user.role !== 'seller') {
                const userId = req.session.user.id;
                // Find categories this user has bought
                const pastOrders = await OrderItem.findAll({
                    include: [
                        { model: Order, where: { user_id: userId } },
                        { model: Product, attributes: ['category'] }
                    ]
                });

                if (pastOrders.length > 0) {
                    const boughtCategories = [...new Set(pastOrders.map(item => item.Product?.category).filter(Boolean))];

                    if (boughtCategories.length > 0) {
                        recoTitle = "Berdasarkan Pembelian Anda";
                        recommendedProducts = await Product.findAll({
                            where: { category: { [Op.in]: boughtCategories } },
                            include: [{ model: User, as: 'seller' }],
                            order: sequelize.random(),
                            limit: 4
                        });
                    }
                }
            }

            // Fallback generic recommendation if no history or not logged in
            if (recommendedProducts.length === 0) {
                recommendedProducts = await Product.findAll({
                    include: [{ model: User, as: 'seller' }],
                    order: sequelize.random(),
                    limit: 4
                });
            }

            res.render('index', {
                products,
                category: category || 'all',
                searchQuery: search,
                cartCount: res.locals.cartCount || 0,
                cartTotal: res.locals.cartTotal || 0,
                recommendedProducts,
                recoTitle,
                currentUser: req.session.user || null
            });
        } catch (err) {
            console.error(err);
            res.status(500).send('Server Error');
        }
    },

    // Public Product Detail
    show: async (req, res) => {
        try {
            const product = await Product.findByPk(req.params.id, {
                include: [{ model: User, as: 'seller' }]
            });
            if (!product) {
                req.flash('error', req.t('product.not_found'));
                return res.redirect('/');
            }
            res.render('product-detail', {
                product,
                cartCount: res.locals.cartCount || 0,
                cartTotal: res.locals.cartTotal || 0,
                currentUser: req.session.user || null
            });
        } catch (err) {
            console.error(err);
            res.status(500).send('Server Error');
        }
    },

    // Public Seller Store View
    storeView: async (req, res) => {
        try {
            const sellerId = req.params.id;
            const seller = await User.findOne({
                where: { id: sellerId, role: 'seller' }
            });

            if (!seller) {
                req.flash('error', req.t('product.store_not_found'));
                return res.redirect('/');
            }

            const products = await Product.findAll({
                where: { seller_id: sellerId },
                order: [['createdAt', 'DESC']]
            });

            res.render('store/index', {
                seller,
                products,
                cartCount: res.locals.cartCount || 0,
                cartTotal: res.locals.cartTotal || 0,
                currentUser: req.session.user || null
            });
        } catch (err) {
            console.error(err);
            res.status(500).send('Server Error');
        }
    },

    // Seller Dashboard Products
    sellerIndex: async (req, res) => {
        try {
            const products = await Product.findAll({
                where: { seller_id: req.session.user.id },
                order: [['createdAt', 'DESC']]
            });
            // Note: Dashboard also needs orders, so we might need a Dashboard Controller or mix it here.
            // For now, let's return data or handle it in the dashboard route.
            return products;
        } catch (err) {
            console.error(err);
            throw err;
        }
    },

    // Create Page
    createPage: (req, res) => {
        res.render('product-form', { isEdit: false, product: {}, currentUser: req.session.user });
    },

    // Create Action
    create: async (req, res) => {
        const { name, category, description, price, stock } = req.body;
        let image_url = req.body.image_url; // Default if provided
        let original_image_url = null;

        // Check for uploaded files
        if (req.files) {
            // Case 1: Original Image Uploaded
            if (req.files.image && req.files.image[0]) {
                // Optimize Original (Max 1920px)
                original_image_url = await optimizeImage(req.files.image[0], 1920);
                image_url = original_image_url; // Default display to original if no crop
            }

            // Case 2: Cropped Image Uploaded (Overrides display)
            if (req.files.croppedImage && req.files.croppedImage[0]) {
                // Optimize Cropped (Max 800px)
                image_url = await optimizeImage(req.files.croppedImage[0], 800);
            }
        }

        try {
            await Product.create({
                name, category, description, price, stock, image_url, original_image_url,
                seller_id: req.session.user.id
            });
            req.flash('success_msg', req.t('product.added'));
            res.redirect('/seller/dashboard');
        } catch (err) {
            console.error(err);
            req.flash('error', req.t('product.add_failed'));
            res.redirect('/products/new');
        }
    },

    // Edit Page
    editPage: async (req, res) => {
        try {
            const product = await Product.findOne({
                where: { id: req.params.id, seller_id: req.session.user.id }
            });
            if (!product) {
                req.flash('error', req.t('product.not_found'));
                return res.redirect('/seller/dashboard');
            }
            res.render('product-form', { isEdit: true, product, currentUser: req.session.user });
        } catch (err) {
            console.error(err);
            res.redirect('/seller/dashboard');
        }
    },

    // Update Action
    update: async (req, res) => {
        const { name, category, description, price, stock } = req.body;
        // Logic for updates:
        // 1. If 'image' (new original) provided: update 'original_image_url' AND 'image_url' (reset crop).
        // 2. If 'croppedImage' provided: update 'image_url' only.

        try {
            const product = await Product.findOne({ where: { id: req.params.id, seller_id: req.session.user.id } });
            if (!product) {
                req.flash('error', req.t('product.not_found'));
                return res.redirect('/seller/dashboard');
            }

            let updateData = {
                name, category, description, price, stock
            };
            // Update logic for file uploads
            if (req.files) {
                // New Original File
                if (req.files.image && req.files.image[0]) {
                    // Optimize New Original
                    const originalPath = await optimizeImage(req.files.image[0], 1920);
                    updateData.original_image_url = originalPath;
                    updateData.image_url = originalPath; // Reset display to new original
                }

                // New Cropped File
                if (req.files.croppedImage && req.files.croppedImage[0]) {
                    // Optimize New Cropped
                    updateData.image_url = await optimizeImage(req.files.croppedImage[0], 800);
                }
            }

            await product.update(updateData);
            req.flash('success_msg', req.t('product.updated'));
            res.redirect('/seller/dashboard');
        } catch (err) {
            console.error(err);
            req.flash('error', req.t('product.update_failed'));
            res.redirect('/seller/dashboard'); // Helper redirect or referer
        }
    },

    // Delete Action
    delete: async (req, res) => {
        try {
            await Product.destroy({
                where: { id: req.params.id, seller_id: req.session.user.id }
            });
            req.flash('success_msg', req.t('product.deleted'));
            res.redirect('/seller/dashboard');
        } catch (err) {
            console.error(err);
            req.flash('error', req.t('product.delete_failed'));
            res.redirect('/seller/dashboard');
        }
    }
};
