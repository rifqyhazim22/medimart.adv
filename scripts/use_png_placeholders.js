const db = require('../db');

const updateImages = async () => {
    try {
        console.log('Switching to reliable PNG placeholders...');

        const updates = [
            { name: 'Minyak Kayu Putih', image: '/img/minyakKayuPutih.png' },
            { name: 'Vitamin C 1000mg', image: '/img/vitaminC.png' },
            { name: 'Paracetamol', image: '/img/paracetamol.png' },
            { name: 'ByeBye Fever', image: '/img/byebyefever.webp' } // This one was fine
        ];

        for (const update of updates) {
            await db.query('UPDATE products SET image_url = $1 WHERE name ILIKE $2', [update.image, `%${update.name}%`]);
            console.log(`Updated ${update.name} to ${update.image}`);
        }

        console.log('Database updated with PNG paths.');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

updateImages();
