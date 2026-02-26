const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const dbConfig = {
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    password: process.env.DB_PASSWORD || 'postgres',
    port: process.env.DB_PORT || 5432,
};

const DB_NAME = process.env.DB_NAME || 'medimart';

async function createDatabaseIfNotExists() {
    const client = new Client({
        ...dbConfig,
        database: 'postgres' // Connect to default db first
    });

    try {
        await client.connect();
        const res = await client.query(`SELECT 1 FROM pg_database WHERE datname = '${DB_NAME}'`);
        if (res.rowCount === 0) {
            console.log(`Creating database ${DB_NAME}...`);
            await client.query(`CREATE DATABASE "${DB_NAME}"`);
            console.log(`Database ${DB_NAME} created.`);
        } else {
            console.log(`Database ${DB_NAME} already exists.`);
        }
    } catch (err) {
        console.error('Error checking/creating database:', err);
        process.exit(1);
    } finally {
        await client.end();
    }
}

async function runSchemaAndSeed() {
    const client = new Client({
        ...dbConfig,
        database: DB_NAME
    });

    try {
        await client.connect();
        console.log(`Connected to database ${DB_NAME}.`);

        // 1. Run Schema
        console.log('📜 Applying schema...');
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        await client.query(schemaSql);
        console.log('✅ Schema applied.');

        // 2. Seed Data
        console.log('🌱 Seeding data...');

        // Users
        const passwordAdmin = await bcrypt.hash('admin123', 10);
        const passwordSeller = await bcrypt.hash('seller123', 10);
        const passwordUser = await bcrypt.hash('user123', 10);

        // Check if users already exist to avoid duplicates if re-running without drop
        // (Though schema usually has DROPs, so it's clean slate)

        const usersQuery = `
            INSERT INTO users (username, password, full_name, email, role) VALUES
            ($1, $2, 'Administrator', 'admin@medimart.com', 'admin'),
            ($3, $4, 'Apotek Sehat', 'seller1@medimart.com', 'seller'),
            ($5, $6, 'John Doe', 'user@medimart.com', 'customer')
            RETURNING id, username, role;
        `;

        const usersRes = await client.query(usersQuery, [
            'admin', passwordAdmin,
            'seller1', passwordSeller,
            'user', passwordUser
        ]);

        const users = usersRes.rows;
        const seller = users.find(u => u.role === 'seller');

        console.log('✅ Users seeded');

        // Products
        if (seller) {
            const productsQuery = `
                INSERT INTO products (name, category, description, price, stock, image_url, seller_id) VALUES
                ('Obat Stamina', 'Obat Bebas', 'Suplemen herbal peningkat stamina.', 25000, 50, '/img/vitaminC.webp', $1),
                ('Minyak Kayu Putih', 'Herbal', 'Minyak ekaliptus murni untuk menghangatkan tubuh.', 18000, 100, '/img/minyakKayuPutih.jpg', $1),
                ('Balsem Otot Geliga', 'Obat Nyeri', 'Balsem untuk meredakan nyeri otot dan keseleo.', 12000, 80, '/img/balsemOtot.webp', $1),
                ('Kompres Demam', 'Alat Kesehatan', 'Plester kompres penurun panas instan.', 8000, 200, '/img/byebyefever.webp', $1)
                RETURNING id, name;
            `;

            await client.query(productsQuery, [seller.id]);
            console.log('✅ Products seeded');
        }

        console.log('🎉 Database setup completed successfully!');

    } catch (err) {
        console.error('❌ Error during schema/seed:', err);
    } finally {
        await client.end();
    }
}

// Main execution
(async () => {
    await createDatabaseIfNotExists();
    await runSchemaAndSeed();
})();
