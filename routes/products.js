const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

// Middleware to ensure seller
const ensureSeller = (req, res, next) => {
    if (req.session.user && req.session.user.role === 'seller') {
        return next();
    }
    req.flash('error', 'Akses khusus penjual.');
    res.redirect('/');
};

const upload = require('../middlewares/upload');

// Public
router.get('/', productController.index);

// Seller Management
router.get('/products/new', ensureSeller, productController.createPage);
router.post('/products', ensureSeller, upload.fields([{ name: 'image', maxCount: 1 }, { name: 'croppedImage', maxCount: 1 }]), productController.create);
router.get('/products/:id/edit', ensureSeller, productController.editPage);
// Note: using POST for update with method override might be cleaner with multipart forms, 
// but method-override handles PUT query param.
// However, standard HTML forms only support GET/POST. With method-override middleware, 
// it usually looks for _method in body/query. 
// Multer needs to process the body first to access fields if _method is in body.
// But method-override usually runs before multer.
// For simplicity with file uploads, usually POST is safer if PUT fails with multipart 
// without specific configuration. Let's stick to PUT but ensure method-override works.
router.put('/products/:id', ensureSeller, upload.fields([{ name: 'image', maxCount: 1 }, { name: 'croppedImage', maxCount: 1 }]), productController.update);
router.delete('/products/:id', ensureSeller, productController.delete);

module.exports = router;
