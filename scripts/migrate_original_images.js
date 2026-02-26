const { Product } = require('../models');
const { Op } = require('sequelize');

async function migrateOriginalImages() {
    try {
        console.log('Starting data migration for original_image_url...');

        // Find products where image_url is set but original_image_url is null
        const products = await Product.findAll({
            where: {
                image_url: { [Op.ne]: null },
                original_image_url: { [Op.is]: null }
            }
        });

        console.log(`Found ${products.length} products to update.`);

        for (const product of products) {
            product.original_image_url = product.image_url;
            await product.save();
            console.log(`Updated product ${product.id}: ${product.name}`);
        }

        console.log('Data migration complete!');
    } catch (error) {
        console.error('Migration failed:', error);
    }
    process.exit();
}

migrateOriginalImages();
