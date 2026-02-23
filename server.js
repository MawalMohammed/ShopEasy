const express = require('express');
const session = require('express-session');
const path = require('path');

const app = express();
const PORT = 3000;

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: 'shopeasy-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { httpOnly: false }
}));

// ============================================================
// Product Data (in-memory)
// ============================================================
const products = [
    {
        id: 1,
        name: 'Wireless Headphones',
        price: 49.99,
        description: 'High-quality wireless headphones with active noise cancellation and 30-hour battery life.',
        category: 'Electronics'
    },
    {
        id: 2,
        name: 'Smart Watch',
        price: 129.99,
        description: 'Feature-rich smart watch with heart rate monitoring, GPS, and water resistance.',
        category: 'Electronics'
    },
    {
        id: 3,
        name: 'USB-C Hub',
        price: 35.99,
        description: '7-in-1 USB-C hub with HDMI output, USB 3.0 ports, and SD card reader.',
        category: 'Accessories'
    },
    {
        id: 4,
        name: 'Mechanical Keyboard',
        price: 89.99,
        description: 'RGB mechanical keyboard with Cherry MX switches and programmable keys.',
        category: 'Accessories'
    },
    {
        id: 5,
        name: 'Portable Charger',
        price: 24.99,
        description: '10000mAh portable power bank with fast charging and dual USB output.',
        category: 'Electronics'
    },
    {
        id: 6,
        name: 'Laptop Stand',
        price: 45.99,
        description: 'Adjustable aluminum laptop stand for ergonomic viewing and better airflow.',
        category: 'Accessories'
    }
];

// In-memory orders storage
const orders = [];

// ============================================================
// Global Middleware
// ============================================================
app.use((req, res, next) => {
    if (!req.session.cart) {
        req.session.cart = [];
    }
    res.locals.cartCount = req.session.cart.length;
    next();
});

// ============================================================
// Routes
// ============================================================

// Home page - product listing
app.get('/', (req, res) => {
    res.render('index', { products });
});

// Search products
app.get('/search', (req, res) => {
    const query = req.query.q || '';

    const results = products.filter(p =>
        p.name.includes(query) || p.description.includes(query)
    );

    res.render('search', { query, results });
});

// Product detail page
app.get('/product/:id', (req, res) => {
    const product = products.find(p => p.id === parseInt(req.params.id));
    if (!product) {
        return res.status(404).send('Product not found');
    }
    res.render('product', { product });
});

// Add item to cart
app.post('/cart/add', (req, res) => {
    const productId = parseInt(req.body.productId);
    const product = products.find(p => p.id === productId);

    if (product) {
        req.session.cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            quantity: 1
        });
    }

    res.redirect('/cart');
});

// View cart
app.get('/cart', (req, res) => {
    const cart = req.session.cart;
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    res.render('cart', { cart, subtotal });
});

// Remove item from cart
app.post('/cart/remove', (req, res) => {
    const index = parseInt(req.body.index);
    req.session.cart.splice(index, 1);
    res.redirect('/cart');
});

// Checkout page
app.get('/checkout', (req, res) => {
    const cart = req.session.cart;
    if (cart.length === 0) {
        return res.redirect('/cart');
    }
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    res.render('checkout', { cart, subtotal, discount: 0, total: subtotal });
});

// Apply discount code
app.post('/checkout/apply-discount', (req, res) => {
    const code = req.body.discountCode;
    const cart = req.session.cart;
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    let discount = 0;
    let error = '';

    if (code === 'SAVE10') {
        discount = 10;
    } else if (code) {
        error = 'Invalid discount code';
    }

    const total = subtotal - discount;
    res.render('checkout', { cart, subtotal, discount, total, discountCode: code, error });
});

// Place order
app.post('/checkout/place-order', (req, res) => {
    const { fullName, email, phone, address } = req.body;
    const cart = req.session.cart;
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discount = req.body.discount ? parseFloat(req.body.discount) : 0;
    const total = subtotal - discount;

    const order = {
        id: orders.length + 1001,
        customerName: fullName,
        email,
        phone,
        address,
        items: [...cart],
        subtotal,
        discount,
        total,
        date: new Date().toISOString()
    };

    orders.push(order);
    req.session.cart = [];

    res.render('confirmation', { order });
});

// Login page
app.get('/login', (req, res) => {
    res.render('login', { error: '' });
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (username === 'admin' && password === 'admin123') {
        req.session.isAdmin = true;
        res.redirect('/admin/orders');
    } else {
        res.render('login', { error: 'Invalid username or password' });
    }
});

app.get('/admin/orders', (req, res) => {
    res.render('admin/orders', { orders });
});

// ============================================================
// Start Server
// ============================================================
app.listen(PORT, () => {
    console.log(`ShopEasy is running at http://localhost:${PORT}`);
});
