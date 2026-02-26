const { Product, User, sequelize } = require('../models');
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

            res.render('index', {
                products,
                category: category || 'all',
                searchQuery: search,
                cartCount: res.locals.cartCount || 0,
                cartTotal: res.locals.cartTotal || 0
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
        res.render('product-form', { isEdit: false, product: {} });
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
            req.flash('success_msg', 'Produk berhasil ditambahkan');
            res.redirect('/seller/dashboard');
        } catch (err) {
            console.error(err);
            req.flash('error', 'Gagal menambah produk');
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
                req.flash('error', 'Produk tidak ditemukan');
                return res.redirect('/seller/dashboard');
            }
            res.render('product-form', { isEdit: true, product });
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
                req.flash('error', 'Produk tidak ditemukan');
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
            req.flash('success_msg', 'Produk berhasil diupdate');
            res.redirect('/seller/dashboard');
        } catch (err) {
            console.error(err);
            req.flash('error', 'Gagal update produk');
            res.redirect('/seller/dashboard'); // Helper redirect or referer
        }
    },

    // Delete Action
    delete: async (req, res) => {
        try {
            await Product.destroy({
                where: { id: req.params.id, seller_id: req.session.user.id }
            });
            req.flash('success_msg', 'Produk dihapus');
            res.redirect('/seller/dashboard');
        } catch (err) {
            console.error(err);
            req.flash('error', 'Gagal menghapus produk');
            res.redirect('/seller/dashboard');
        }
    }
};
