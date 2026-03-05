const { Xendit } = require('xendit-node');

const xenditClient = new Xendit({
    secretKey: process.env.XENDIT_SECRET_KEY || 'xnd_development_placeholder_key',
});

module.exports = {
    xenditClient,
    Invoice: xenditClient.Invoice
};
