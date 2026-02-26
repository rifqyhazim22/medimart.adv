const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

/**
 * Optimizes an image file:
 * 1. Converts to WebP
 * 2. Compresses (Quality 80)
 * 3. Resizes (Max width)
 * 4. Deletes original file
 * 
 * @param {Object} file - Multer file object
 * @param {number} maxWidth - Maximum width in pixels
 * @returns {Promise<string>} - New relative path to the optimized image
 */
const optimizeImage = async (file, maxWidth = 800) => {
    if (!file) return null;

    try {
        const dir = path.dirname(file.path);
        const filename = path.basename(file.path, path.extname(file.path)); // Remove extension
        const newFilename = `${filename}.webp`;
        const newPath = path.join(dir, newFilename);

        console.log(`[ImageOptimizer] Processing: ${file.originalname} -> ${newFilename}`);

        await sharp(file.path)
            .resize({ width: maxWidth, withoutEnlargement: true })
            .webp({ quality: 80 })
            .toFile(newPath);

        // Remove the original uncompressed file
        if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
            console.log(`[ImageOptimizer] Deleted original: ${file.path}`);
        }

        // Return relative path for DB
        return `/uploads/products/${newFilename}`;

    } catch (error) {
        console.error('[ImageOptimizer] Error:', error);
        // Fallback: If optimization fails, return original path but warn
        return `/uploads/products/${file.filename}`;
    }
};

module.exports = { optimizeImage };
