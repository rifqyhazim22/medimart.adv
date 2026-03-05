/**
 * Centralized View Helpers for EJS Templates
 * This keeps the EJS files clean and handles complex UI logic on the server side.
 */

const { translations } = require('./serverI18n'); // Import if we need direct access, but we'll use the passed `t` function.

/**
 * Generates the HTML for an order or item status badge.
 * @param {string} status - The status from the database (e.g. 'paid', 'processing').
 * @param {string} role - The context role: 'buyer' or 'seller' to adjust text orientation.
 * @param {Array} items - Optional. Array of order items to determine if an order is partially cancelled/rejected.
 * @param {function} t - The request's translation function `req.t`.
 * @returns {string} - Clean, formatted HTML string.
 */
function renderOrderBadge(status, role, items, t) {
    let badgeClass = status;
    let i18nKey = role === 'buyer' ? `user.status_${status}` : `seller.st_${status}`;

    const isBuyer = role === 'buyer';

    // Advanced Check for Partial Orders (Buyer Context)
    let partialSuffix = '';
    if (isBuyer && items && items.length > 0) {
        const hasActive = items.some(i => ['paid', 'processing', 'shipped'].includes(i.status));
        const hasCancelled = items.some(i => i.status === 'cancelled');
        const hasRejected = items.some(i => i.status === 'rejected');

        if (status === 'cancelled' || status === 'rejected') {
            if (hasCancelled && hasRejected) {
                badgeClass = 'cancelled';
                i18nKey = 'user.status_cancelled_both';
            }
        }

        if (hasActive && (hasCancelled || hasRejected)) {
            partialSuffix = ` <span style="font-size: 11px; color: var(--text-gray); text-transform: none; font-weight: 500;">(${t('user.status_partial') || 'Parsial'})</span>`;
        }
    }

    // Attempt to translate the main text
    let translatedText = t(i18nKey);
    // Fallback if key missing entirely from translation object
    if (translatedText === i18nKey) {
        translatedText = status.charAt(0).toUpperCase() + status.slice(1);
    }

    // Map the status to the unified CSS aesthetic
    let bgCol = 'var(--border)';
    let textCol = 'var(--text-dark)';

    if (badgeClass === 'paid' || badgeClass === 'pending') { bgCol = '#fef3c7'; textCol = '#92400e'; }
    if (badgeClass === 'processing' || badgeClass === 'processed') { bgCol = '#ccfbf1'; textCol = '#0d9488'; }
    if (badgeClass === 'shipped') { bgCol = '#dbeafe'; textCol = '#1e40af'; }
    if (badgeClass === 'completed') { bgCol = '#d1fae5'; textCol = '#065f46'; }
    if (badgeClass === 'cancelled' || badgeClass === 'rejected') { bgCol = '#fee2e2'; textCol = '#b91c1c'; }

    return `<span class="modern-status-badge ${badgeClass}" style="padding: 4px 12px; border-radius: 9999px; font-size: 11px; font-weight: 600; text-transform: none; letter-spacing: normal; background: ${bgCol}; color: ${textCol}; display: inline-flex; align-items: center; gap: 4px;">
                ${translatedText}
            </span>${partialSuffix}`;
}

/**
 * Specifically for the smaller item-level badge within order details (No background)
 */
function renderItemInlineStatus(status, t) {
    let color = 'var(--text-gray)';

    switch (status) {
        case 'paid':
        case 'pending': color = '#92400e'; break;
        case 'processing':
        case 'processed': color = '#0d9488'; break;
        case 'shipped': color = '#1e40af'; break;
        case 'completed': color = '#065f46'; break;
        case 'cancelled':
        case 'rejected': color = '#b91c1c'; break;
    }

    // Attempt translation
    const key = `user.status_${status}_short`;
    let translated = t(key);

    // Fallback if short key missing
    if (translated === key) {
        translated = t(`user.status_${status}`);
    }

    // Final fallback
    if (translated === `user.status_${status}`) {
        translated = status.charAt(0).toUpperCase() + status.slice(1);
    }

    return `<span style="color: ${color}; font-size: 12px; font-weight: 600; text-transform: none; display: flex; align-items: center; gap: 4px;" title="${status}">${translated}</span>`;
}

module.exports = {
    renderOrderBadge,
    renderItemInlineStatus
};
