const { Product } = require('../models');

async function verifyUpload() {
    try {
        const product = await Product.findOne({
            where: { name: 'Test Crop' },
            order: [['createdAt', 'DESC']]
        });

        if (product) {
            console.log('Product Found:');
            console.log('ID:', product.id);
            console.log('Name:', product.name);
            console.log('Image URL:', product.image_url);

            if (product.image_url && product.image_url.startsWith('/uploads/products/')) {
                console.log('VERIFICATION SUCCESS: Image URL has correct format.');
            } else {
                console.log('VERIFICATION FAILED: Invalid Image URL format.');
            }
        } else {
            console.log('VERIFICATION FAILED: Product "Test Crop" not found.');
        }
    } catch (error) {
        console.error('Error:', error);
    }
    process.exit();
}

verifyUpload();
