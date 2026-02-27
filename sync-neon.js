const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DATABASE_URL = 'postgresql://neondb_owner:npg_D30YcEUulaCR@ep-calm-cake-a1jilaaq-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require';

async function forceSyncNeon() {
    console.log('Connecting to NeonDB directly...');
    const client = new Client({
        connectionString: DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        await client.connect();

        console.log('Drop everything and execute raw schema.sql...');
        const schemaPath = path.join(__dirname, 'db', 'schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');

        await client.query(schemaSql);

        // Also recreate Sessions table which is needed for Vercel connect-session-sequelize
        await client.query(`
            CREATE TABLE IF NOT EXISTS "Sessions" (
                "sid" VARCHAR(36) , "expires" TIMESTAMP WITH TIME ZONE, "data" TEXT, 
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL, "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL, 
                PRIMARY KEY ("sid")
            );
        `);

        console.log('Seeding baseline users and products...');
        const passwordAdmin = await bcrypt.hash('admin123', 10);
        const passwordSeller = await bcrypt.hash('seller123', 10);
        const passwordUser = await bcrypt.hash('user123', 10);

        const usersQuery = `
            INSERT INTO users (username, password, full_name, email, role, created_at) VALUES
            ($1, $2, 'Administrator', 'admin@medimart.com', 'admin', NOW()),
            ($3, $4, 'Apotek Sehat', 'seller1@medimart.com', 'seller', NOW()),
            ($5, $6, 'John Doe', 'user@medimart.com', 'customer', NOW())
            RETURNING id, username, role;
        `;
        const usersRes = await client.query(usersQuery, ['admin', passwordAdmin, 'seller1', passwordSeller, 'user', passwordUser]);

        const seller = usersRes.rows.find(u => u.role === 'seller');
        const buyer = usersRes.rows.find(u => u.role === 'customer');
        const admin = usersRes.rows.find(u => u.role === 'admin');

        if (seller) await client.query(`INSERT INTO sellers (user_id, store_name, is_verified) VALUES ($1, $2, $3)`, [seller.id, 'Toko Apotek Sehat', true]);
        if (buyer) await client.query(`INSERT INTO buyers (user_id) VALUES ($1)`, [buyer.id]);
        if (admin) await client.query(`INSERT INTO admins (user_id, department, job_title) VALUES ($1, $2, $3)`, [admin.id, 'General Staff', 'Superadmin']);

        if (seller) {
            const productsQuery = `
                INSERT INTO products (name, category, description, price, stock, image_url, original_image_url, seller_id, created_at) VALUES
                ('Obat Stamina', 'Obat Bebas', 'Suplemen herbal peningkat stamina.', 25000, 50, '/img/vitaminC.webp', '/img/vitaminC.webp', $1, NOW()),
                ('Minyak Kayu Putih', 'Herbal', 'Minyak ekaliptus murni untuk menghangatkan tubuh.', 18000, 100, '/img/minyakKayuPutih.jpg', '/img/minyakKayuPutih.jpg', $1, NOW()),
                ('Balsem Otot Geliga', 'Obat Nyeri', 'Balsem untuk meredakan nyeri otot dan keseleo.', 12000, 80, '/img/balsemOtot.webp', '/img/balsemOtot.webp', $1, NOW()),
                ('Kompres Demam', 'Alat Kesehatan', 'Plester kompres penurun panas instan.', 8000, 200, '/img/byebyefever.webp', '/img/byebyefever.webp', $1, NOW())
            `;
            await client.query(productsQuery, [seller.id]);
        }

        console.log('✅ Synchronized! NeonDB strictly matched to model cases.');
    } catch (err) {
        console.error('❌ Failed:', err);
    } finally {
        await client.end();
    }
}

forceSyncNeon();
