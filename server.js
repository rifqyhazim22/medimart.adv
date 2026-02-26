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

// Session Configuration
app.use(session({
    secret: 'medimart_secret_key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }
}));

app.use(flash());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Global Variables
app.use((req, res, next) => {
    res.locals.currentUser = req.session.user || null;
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');

    const cart = req.session.cart || [];
    res.locals.cartCount = cart.reduce((acc, item) => acc + (parseInt(item.quantity) || 0), 0);
    res.locals.cartTotal = cart.reduce((acc, item) => acc + ((parseFloat(item.price) || 0) * (parseInt(item.quantity) || 0)), 0);

    next();
});

// Use Routes
app.use('/', routes);

// 404 Handler
app.use((req, res) => {
    res.status(404).send('Page Not Found');
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
