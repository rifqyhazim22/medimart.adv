const multer = require('multer');
const path = require('path');
const fs = require('fs');

/**
 * Determines the upload subdirectory based on the form field name.
 * - profile_image → /uploads/avatars/
 * - store_banner, croppedBanner → /uploads/banners/
 * - image, croppedImage → /uploads/products/
 */
function getUploadDir(fieldname) {
    if (fieldname === 'profile_image' || fieldname === 'croppedAvatar') {
        return 'public/uploads/avatars';
    } else if (fieldname === 'store_banner' || fieldname === 'croppedBanner') {
        return 'public/uploads/banners';
    }
    return 'public/uploads/products';
}

// Configure storage with dynamic destination
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = getUploadDir(file.fieldname);
        // Ensure directory exists
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        // Create unique filename: timestamp-random-originalName
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

// File filter (images only)
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only images are allowed!'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

module.exports = upload;
