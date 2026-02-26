const fs = require('fs');
const path = require('path');
const { Product } = require('../models');

const LEGACY_DIR = path.join(__dirname, '../public/img');
const UPLOAD_DIR = path.join(__dirname, '../public/uploads/products');

// Ensure upload dir exists
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const MAPPINGS = {
    'Balsem Otot Geliga': 'balsemOtot.webp',
    'Kompres Demam': 'byebyefever.webp',
    'Obat Stamina': 'vitaminC.webp',
    'Paracetamol': 'paracetamol.png',
    'Minyak Kayu Putih': 'minyakKayuPutih.png'
};

async function migrateImages() {
    try {
        console.log('Starting migration...');

        for (const [productName, fileName] of Object.entries(MAPPINGS)) {
            const oldPath = path.join(LEGACY_DIR, fileName);
            // Create a new filename with timestamp to match upload pattern, or just keep simple?
            // Let's keep specific filenames to be clean, but maybe prefix with 'legacy-' to avoid collision?
            // Actually, let's just copy them to uploads/products/fileName. 
            // If we want to be consistent with uploads, we could rename them. 
            // Let's keep original names for simplicity unless collision.
            const newFileName = `legacy-${fileName}`;
            const newPath = path.join(UPLOAD_DIR, newFileName);

            if (fs.existsSync(oldPath)) {
                // Copy file (safest)
                fs.copyFileSync(oldPath, newPath);
                console.log(`Copied ${fileName} to ${newFileName}`);

                // Update DB
                const product = await Product.findOne({ where: { name: productName } });
                if (product) {
                    product.image_url = `/uploads/products/${newFileName}`;
                    await product.save();
                    console.log(`Updated ${productName} image_url`);
                } else {
                    console.error(`Product ${productName} not found!`);
                }
            } else {
                console.warn(`File ${fileName} not found in public/img`);
            }
        }

        // Clean up public/img
        console.log('Cleaning up public/img...');
        const files = fs.readdirSync(LEGACY_DIR);
        for (const file of files) {
            if (file === 'default-product.svg') continue; // KEEP THIS

            // Delete all others
            const filePath = path.join(LEGACY_DIR, file);
            fs.unlinkSync(filePath);
            console.log(`Deleted ${file}`);
        }

        console.log('Migration complete!');
    } catch (error) {
        console.error('Migration failed:', error);
    }
    process.exit();
}

migrateImages();
