const { sequelize, Product } = require('./models');

(async () => {
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');
        const products = await Product.findAll();
        console.log('Products query successful. Count:', products.length);
        process.exit(0);
    } catch (error) {
        console.error('Unable to connect to the database:', error);
        process.exit(1);
    }
})();
