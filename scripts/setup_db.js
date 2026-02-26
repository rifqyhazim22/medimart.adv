const { Client } = require('pg');
require('dotenv').config();
const bcrypt = require('bcryptjs');

const dbConfig = {
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: 'postgres', // Connect to default DB first to create target DB
    password: process.env.DB_PASSWORD || 'postgres',
    port: process.env.DB_PORT || 5432,
};
const targetDbName = process.env.DB_NAME || 'medimart';

async function setupDatabase() {
    const client = new Client(dbConfig);

    try {
        await client.connect();

        // Check if database exists
        const res = await client.query(`SELECT 1 FROM pg_database WHERE datname = $1`, [targetDbName]);

        if (res.rowCount > 0) {
            console.log(`Database ${targetDbName} exists. Dropping it...`);
            // Terminate other connections to the database before dropping
            await client.query(`
                SELECT pg_terminate_backend(pg_stat_activity.pid)
                FROM pg_stat_activity
                WHERE pg_stat_activity.datname = '${targetDbName}'
                AND pid <> pg_backend_pid();
            `);
            await client.query(`DROP DATABASE ${targetDbName}`);
        }

        console.log(`Creating database ${targetDbName}...`);
        await client.query(`CREATE DATABASE ${targetDbName}`);

        await client.end();

        // Connect to the new database
        const newDbClient = new Client({
            ...dbConfig,
            database: targetDbName
        });

        await newDbClient.connect();
        console.log(`Connected to ${targetDbName}. Creating tables...`);

        // Create Users Table
        await newDbClient.query(`
            CREATE TABLE users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'seller', 'buyer')),
                full_name VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Create Products Table
        await newDbClient.query(`
            CREATE TABLE products (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                description TEXT,
                price DECIMAL(12, 2) NOT NULL,
                stock INTEGER NOT NULL DEFAULT 0,
                category VARCHAR(50),
                image_url TEXT,
                seller_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Create Orders Table
        await newDbClient.query(`
            CREATE TABLE orders (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                total_price DECIMAL(12, 2) NOT NULL,
                status VARCHAR(20) DEFAULT 'pending', -- pending, paid, shipped, completed, cancelled
                shipping_address TEXT,
                payment_method VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Create Order Items Table
        await newDbClient.query(`
            CREATE TABLE order_items (
                id SERIAL PRIMARY KEY,
                order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
                product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
                quantity INTEGER NOT NULL,
                price_at_purchase DECIMAL(12, 2) NOT NULL,
                status VARCHAR(20) DEFAULT 'pending', -- pending, accepted, rejected, cancelled
                seller_id INTEGER REFERENCES users(id) -- redundant but useful for fast queries
            );
        `);

        // Seed Initial Data
        console.log('Seeding initial data...');
        const hashedPassword = await bcrypt.hash('password123', 10);

        // Admin
        await newDbClient.query(`
            INSERT INTO users (username, password, role, full_name)
            VALUES ('admin', $1, 'admin', 'Administrator')
        `, [hashedPassword]);

        // Seller
        const sellerRes = await newDbClient.query(`
            INSERT INTO users (username, password, role, full_name)
            VALUES ('seller1', $1, 'seller', 'Toko Sehat Selalu')
            RETURNING id
        `, [hashedPassword]);
        const sellerId = sellerRes.rows[0].id;

        // Buyer
        await newDbClient.query(`
            INSERT INTO users (username, password, role, full_name)
            VALUES ('buyer1', $1, 'buyer', 'Budi Santoso')
        `, [hashedPassword]);

        // Products
        await newDbClient.query(`
            INSERT INTO products (name, description, price, stock, category, image_url, seller_id)
            VALUES 
            ('Paracetamol 500mg', 'Obat penurun demam dan pereda nyeri', 5000, 100, 'Obat Bebas', '/img/paracetamol.jpg', $1),
            ('Vitamin C 1000mg', 'Suplemen daya tahan tubuh', 15000, 50, 'Vitamin', '/img/vitaminC.webp', $1),
            ('Minyak Kayu Putih', 'Minyak hangat untuk meredakan masuk angin', 25000, 75, 'Herbal', '/img/minyakKayuPutih.jpg', $1)
        `, [sellerId]);

        console.log('Database setup complete! ✅');
        await newDbClient.end();

    } catch (err) {
        console.error('Error setting up database:', err);
    }
}

setupDatabase();
