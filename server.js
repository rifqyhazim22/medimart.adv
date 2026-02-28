const express = require('express');
const session = require('express-session');
const flash = require('connect-flash');
const path = require('path');
const methodOverride = require('method-override');
const app = express();
const PORT = process.env.PORT || 3001;

// Import Routes
const routes = require('./routes');

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));

const { sequelize, Cart, CartItem, Product } = require('./models');
const SequelizeStore = require('connect-session-sequelize')(session.Store);

const sessionStore = new SequelizeStore({
    db: sequelize
});

// Trust proxy for Vercel if using secure cookies
if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
    app.set('trust proxy', 1);
}

// Session Configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'medimart_secret_key',
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
        secure: process.env.NODE_ENV === 'production' || !!process.env.VERCEL,
        maxAge: 24 * 60 * 60 * 1000
    }
}));

// IMPORTANT VERCEL FIX: Do not run .sync() on every serverless function cold-start!
// We already ran migration/creation for the Sessions table locally or via CLI.
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    sessionStore.sync().catch(err => {
        console.error('Session Store Sync Error:', err.message);
    });
}

app.use(flash());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Global Variables
app.use(async (req, res, next) => {
    res.locals.currentUser = req.session.user || null;
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');

    res.locals.cartCount = 0;
    res.locals.cartTotal = 0;

    // Persistent Cart Integration for Global Header Badges
    if (req.session.user) {
        try {
            const userCart = await Cart.findOne({
                where: { user_id: req.session.user.id },
                include: [{ model: CartItem, as: 'items', include: ['product'] }]
            });
            if (userCart && userCart.items) {
                res.locals.cartCount = userCart.items.reduce((acc, item) => acc + item.quantity, 0);
                res.locals.cartTotal = userCart.items.reduce((acc, item) => acc + ((parseFloat(item.product?.price) || 0) * item.quantity), 0);
            }
        } catch (err) {
            console.error('Error fetching global cart:', err);
        }
    } else {
        const cart = req.session.cart || [];
        res.locals.cartCount = cart.reduce((acc, item) => acc + (parseInt(item.quantity) || 0), 0);
        res.locals.cartTotal = cart.reduce((acc, item) => acc + ((parseFloat(item.price) || 0) * (parseInt(item.quantity) || 0)), 0);
    }

    next();
});

// Use Routes
app.use('/', routes);

// 404 Handler
app.use((req, res) => {
    res.status(404).send('Page Not Found');
});

if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
}

module.exports = app;
