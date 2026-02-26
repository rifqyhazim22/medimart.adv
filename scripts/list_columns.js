const { Sequelize } = require('sequelize');
const config = require('../config/config.json');
const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

const sequelize = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, {
    host: dbConfig.host,
    dialect: dbConfig.dialect,
    logging: false
});

async function inspect() {
    try {
        await sequelize.authenticate();
        const queryInterface = sequelize.getQueryInterface();

        const tables = ['users', 'products', 'orders', 'order_items'];

        for (const table of tables) {
            const description = await queryInterface.describeTable(table);
            console.log(`TABLE: ${table}`);
            console.log(Object.keys(description).join(', '));
            console.log('---');
        }

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await sequelize.close();
    }
}

inspect();
