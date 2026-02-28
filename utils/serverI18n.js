/**
 * Server-Side i18n Helper
 * Reads the 'lang' cookie (set by the client-side language toggle) and provides
 * a `req.t(key, ...args)` function for translating flash and JSON messages.
 */

const translations = {
    // ========== AUTH ==========
    'auth.role_denied': {
        id: (role) => `Akses ditolak. Coba periksa lagi, karena sepertinya ini bukan akun ${role}.`,
        en: (role) => `Access denied. Please check again, this doesn't seem to be a ${role} account.`
    },
    'auth.welcome_back': {
        id: (name) => `Selamat datang kembali, ${name}! Senang melihat Anda bertransaksi lagi.`,
        en: (name) => `Welcome back, ${name}! Nice to see you again.`
    },
    'auth.wrong_credentials': {
        id: 'Hmm, sepertinya Username atau Password Anda kurang tepat. Coba lagi ya!',
        en: 'Hmm, your Username or Password seems incorrect. Please try again!'
    },
    'auth.server_error': {
        id: 'Terjadi kesalahan pada server.',
        en: 'A server error occurred.'
    },
    'auth.username_taken': {
        id: 'Maaf, Username tersebut sudah ada yang punya. Coba variasi nama lain?',
        en: 'Sorry, that Username is already taken. Try a different one?'
    },
    'auth.register_success': {
        id: (name) => `Selamat bergabung, ${name}! Akun Anda telah berhasil diciptakan. Silakan masuk untuk mulai penjelajahan.`,
        en: (name) => `Welcome aboard, ${name}! Your account has been created. Please log in to start exploring.`
    },
    'auth.register_failed': {
        id: 'Aduh, ada sedikit kendala saat mendaftarkan Anda. Mohon coba beberapa saat lagi.',
        en: 'Oops, there was an issue registering you. Please try again shortly.'
    },
    'auth.email_not_found': {
        id: 'Email tidak ditemukan.',
        en: 'Email not found.'
    },
    'auth.reset_link_sent': {
        id: 'Link reset password telah dikirim ke email Anda (Cek Terminal Server untuk simulasi).',
        en: 'Password reset link has been sent to your email (Check Server Terminal for simulation).'
    },
    'auth.request_failed': {
        id: 'Gagal memproses permintaan.',
        en: 'Failed to process request.'
    },
    'auth.token_invalid': {
        id: 'Token tidak valid atau sudah kadaluarsa.',
        en: 'Token is invalid or has expired.'
    },
    'auth.error_generic': {
        id: 'Terjadi kesalahan.',
        en: 'An error occurred.'
    },
    'auth.password_mismatch': {
        id: 'Password tidak cocok.',
        en: 'Passwords do not match.'
    },
    'auth.password_reset_success': {
        id: 'Password berhasil diubah. Silakan login.',
        en: 'Password changed successfully. Please login.'
    },
    'auth.password_reset_failed': {
        id: 'Gagal mereset password.',
        en: 'Failed to reset password.'
    },

    // ========== CART ==========
    'cart.product_not_found': {
        id: 'Produk tidak ditemukan',
        en: 'Product not found'
    },
    'cart.own_product': {
        id: 'Anda tidak dapat membeli produk Anda sendiri',
        en: 'You cannot buy your own product'
    },
    'cart.own_product_flash': {
        id: 'Wah, Anda tidak dapat memborong produk dari lapak Anda sendiri ya 😅',
        en: "Oops, you can't buy products from your own store 😅"
    },
    'cart.server_error': {
        id: 'Server Error',
        en: 'Server Error'
    },
    'cart.max_stock': {
        id: 'Stok makasimal tercapai',
        en: 'Maximum stock reached'
    },
    'cart.min_quantity': {
        id: 'Minimal 1 barang',
        en: 'Minimum 1 item'
    },
    'cart.item_removed': {
        id: 'Item dihapus',
        en: 'Item removed'
    },
    'cart.item_removed_flash': {
        id: 'Sip, barang telah dikeluarkan dari keranjang belanja.',
        en: 'Done, item has been removed from your cart.'
    },
    'cart.cleared': {
        id: 'Keranjang dikosongkan',
        en: 'Cart cleared'
    },
    'cart.cleared_flash': {
        id: 'Keranjang sudah dibersihkan. Yuk mulai berburu barang baru! ✨',
        en: 'Cart has been cleared. Let\'s start hunting for new items! ✨'
    },

    // ========== PRODUCT ==========
    'product.not_found': {
        id: 'Produk tidak ditemukan',
        en: 'Product not found'
    },
    'product.store_not_found': {
        id: 'Toko tidak ditemukan atau data penjual tidak valid.',
        en: 'Store not found or seller data is invalid.'
    },
    'product.added': {
        id: 'Produk berhasil ditambahkan',
        en: 'Product added successfully'
    },
    'product.add_failed': {
        id: 'Gagal menambah produk',
        en: 'Failed to add product'
    },
    'product.updated': {
        id: 'Produk berhasil diupdate',
        en: 'Product updated successfully'
    },
    'product.update_failed': {
        id: 'Gagal update produk',
        en: 'Failed to update product'
    },
    'product.deleted': {
        id: 'Produk dihapus',
        en: 'Product deleted'
    },
    'product.delete_failed': {
        id: 'Gagal menghapus produk',
        en: 'Failed to delete product'
    },

    // ========== PROFILE ==========
    'profile.load_failed': {
        id: 'Gagal memuat profil.',
        en: 'Failed to load profile.'
    },
    'profile.edit_load_failed': {
        id: 'Gagal memuat form edit.',
        en: 'Failed to load edit form.'
    },
    'profile.username_taken': {
        id: 'Username sudah digunakan oleh pengguna lain.',
        en: 'Username is already taken by another user.'
    },
    'profile.password_mismatch': {
        id: 'Konfirmasi kata sandi baru tidak cocok.',
        en: 'New password confirmation does not match.'
    },
    'profile.updated': {
        id: 'Profil berhasil diperbarui secara menyeluruh.',
        en: 'Profile updated successfully.'
    },
    'profile.update_failed': {
        id: 'Gagal memperbarui profil.',
        en: 'Failed to update profile.'
    },
    'profile.active_orders': {
        id: 'Tidak dapat menghapus akun karena masih ada pesanan yang aktif.',
        en: 'Cannot delete account because there are still active orders.'
    },
    'profile.active_seller_orders': {
        id: 'Tidak dapat menghapus akun karena masih ada pesanan masuk yang belum selesai.',
        en: 'Cannot delete account because there are still pending incoming orders.'
    },
    'profile.delete_failed': {
        id: (msg) => `Gagal menghapus akun: ${msg}`,
        en: (msg) => `Failed to delete account: ${msg}`
    },

    // ========== USER (Admin) ==========
    'user.cannot_delete_self': {
        id: 'Anda tidak dapat menghapus akun sendiri.',
        en: 'You cannot delete your own account.'
    },
    'user.deleted': {
        id: 'User berhasil dihapus.',
        en: 'User deleted successfully.'
    },
    'user.delete_failed': {
        id: 'Gagal menghapus user',
        en: 'Failed to delete user'
    },

    // ========== ORDER ==========
    'order.cart_empty': {
        id: 'Keranjang belanja Anda masih kosong nih. Yuk tambah barang dulu!',
        en: 'Your cart is still empty. Let\'s add some items first!'
    },
    'order.checkout_failed': {
        id: (msg) => `Yah, transaksi gagal diproses, pastikan saldo atau koneksi aman: ${msg}`,
        en: (msg) => `Transaction failed to process, please check your balance or connection: ${msg}`
    },
    'order.not_found': {
        id: 'Waduh, pesanan yang Anda cari tidak dapat ditemukan di catatan kami.',
        en: 'Oops, the order you\'re looking for cannot be found in our records.'
    },
    'order.cancelled': {
        id: 'Pesanan utuh berhasil dibatalkan. Jangan khawatir, sistem telah mencatatnya.',
        en: 'Order successfully cancelled. Don\'t worry, the system has recorded it.'
    },
    'order.item_not_found': {
        id: 'Item tidak ditemukan',
        en: 'Item not found'
    },
    'order.item_cannot_cancel': {
        id: 'Item tidak bisa dibatalkan',
        en: 'Item cannot be cancelled'
    },
    'order.item_cancelled': {
        id: 'Satu barang berhasil dibatalkan.',
        en: 'One item successfully cancelled.'
    },
    'order.processed': {
        id: 'Pesanan diproses',
        en: 'Order processed'
    },
    'order.shipped': {
        id: 'Pesanan dikirim',
        en: 'Order shipped'
    },
    'order.ship_failed': {
        id: 'Gagal mengirim pesanan',
        en: 'Failed to ship order'
    },
    'order.rejected': {
        id: 'Pesanan ditolak',
        en: 'Order rejected'
    },
    'order.reject_failed': {
        id: 'Gagal menolak pesanan',
        en: 'Failed to reject order'
    },
    'order.order_not_found': {
        id: 'Pesanan tidak ditemukan',
        en: 'Order not found'
    },
    'order.hide_restriction': {
        id: 'Hanya pesanan selesai, ditolak, atau dibatalkan yang bisa dihapus dari riwayat.',
        en: 'Only completed, rejected, or cancelled orders can be removed from history.'
    },
    'order.hide_restriction_short': {
        id: 'Hanya pesanan selesai/batal/tolak yang bisa dihapus.',
        en: 'Only completed/cancelled/rejected orders can be removed.'
    },
    'order.history_removed': {
        id: 'Riwayat pesanan dihapus.',
        en: 'Order history removed.'
    },
    'order.permanent_deleted': {
        id: 'Order permanen dihapus.',
        en: 'Order permanently deleted.'
    },
    'order.delete_failed': {
        id: (msg) => `Gagal menghapus: ${msg}`,
        en: (msg) => `Failed to delete: ${msg}`
    },

    // ========== DASHBOARD / SELLER ==========
    'dashboard.store_updated': {
        id: 'Identitas lapak berhasil diperbarui!',
        en: 'Store identity updated successfully!'
    },
    'dashboard.store_save_failed': {
        id: 'Gagal menyimpan pengaturan toko.',
        en: 'Failed to save store settings.'
    },

    // ========== ROUTES / MIDDLEWARE ==========
    'route.login_required': {
        id: 'Silakan login terlebih dahulu',
        en: 'Please login first'
    },
    'route.seller_only': {
        id: 'Akses khusus penjual.',
        en: 'Seller access only.'
    },
    'route.admin_only': {
        id: 'Akses khusus Admin.',
        en: 'Admin access only.'
    },

    // ========== ORDER (EXTRA) ==========
    'order.checkout_success_multi': {
        id: (count) => `Transaksi berhasil! Pesanan Anda dipecah menjadi ${count} tagihan terpisah berdasarkan masing-masing toko.`,
        en: (count) => `Transaction successful! Your order has been split into ${count} separate invoices per store.`
    },
    'order.checkout_success_single': {
        id: 'Transaksi berhasil! Pesanan Anda sedang diteruskan ke Penjual.',
        en: 'Transaction successful! Your order is being forwarded to the Seller.'
    },
    'order.stock_insufficient': {
        id: (name) => `Stok tidak cukup untuk produk: ${name}`,
        en: (name) => `Insufficient stock for product: ${name}`
    },
    'order.cancel_failed': {
        id: (msg) => `Gagal membatalkan pesanan. Coba lagi nanti: ${msg}`,
        en: (msg) => `Failed to cancel order. Try again later: ${msg}`
    },
    'order.item_cancel_flash': {
        id: 'Satu barang dari pesanan berhasil dibatalkan. Sisa barang akan tetap dikirim.',
        en: 'One item from the order has been cancelled. The remaining items will still be shipped.'
    },
    'order.item_cancel_error': {
        id: (msg) => `Terjadi sedikit kendala saat membatalkan barang: ${msg}`,
        en: (msg) => `There was an issue cancelling the item: ${msg}`
    },
    'order.complete_success': {
        id: 'Hore! Pesanan telah Anda terima. Semoga produknya bermanfaat ya! 🎉',
        en: 'Hooray! Your order has been received. Hope the product is useful! 🎉'
    },
    'order.confirm_failed': {
        id: (msg) => `Gagal konfirmasi: ${msg}`,
        en: (msg) => `Confirmation failed: ${msg}`
    },
    'order.seller_stock_insufficient': {
        id: 'Stok barang tidak mencukupi.',
        en: 'Insufficient product stock.'
    },
    'order.seller_process_failed': {
        id: 'Gagal memproses pesanan',
        en: 'Failed to process order'
    },
    'order.already_rejected': {
        id: 'Sudah ditolak/batal',
        en: 'Already rejected/cancelled'
    },
    'order.seller_reject_error': {
        id: (msg) => `Gagal: ${msg}`,
        en: (msg) => `Failed: ${msg}`
    },
    'order.seller_detail_denied': {
        id: 'Pesanan tidak ditemukan atau akses ditolak.',
        en: 'Order not found or access denied.'
    },
};

/**
 * Express middleware that attaches `req.t(key, ...args)` based on cookie 'lang'.
 */
function i18nMiddleware(req, res, next) {
    // Read language from cookie (set by client-side toggle), default to 'id'
    const lang = req.cookies?.lang || 'id';

    req.t = function (key, ...args) {
        const entry = translations[key];
        if (!entry) return key; // Fallback: return key itself

        const value = entry[lang] || entry['id']; // Fallback to Indonesian
        if (typeof value === 'function') {
            return value(...args);
        }
        return value;
    };

    next();
}

module.exports = { i18nMiddleware, translations };
