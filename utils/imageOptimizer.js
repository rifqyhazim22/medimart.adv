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
 * @param {string} subDir - Subdirectory under /uploads/ (e.g. 'products', 'avatars', 'banners')
 * @returns {Promise<string>} - New relative path to the optimized image
 */
const optimizeImage = async (file, maxWidth = 800, subDir = null) => {
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

        // Determine subdirectory from file path or override
        const detectedSubDir = subDir || detectSubDir(file.path);

        // Return relative path for DB
        return `/uploads/${detectedSubDir}/${newFilename}`;

    } catch (error) {
        console.error('[ImageOptimizer] Error:', error);
        // Fallback: If optimization fails, return original path but warn
        const detectedSubDir = subDir || detectSubDir(file.path);
        return `/uploads/${detectedSubDir}/${file.filename}`;
    }
};

/**
 * Detects subdirectory from file path.
 * E.g. 'public/uploads/avatars/file.jpg' → 'avatars'
 */
function detectSubDir(filePath) {
    const normalized = filePath.replace(/\\/g, '/');
    if (normalized.includes('/uploads/avatars')) return 'avatars';
    if (normalized.includes('/uploads/banners')) return 'banners';
    return 'products';
}

module.exports = { optimizeImage };
