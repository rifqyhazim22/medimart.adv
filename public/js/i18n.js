/**
 * MediMart i18n (Internationalization) System
 * Supports: Indonesian (id) and English (en)
 * Works alongside the theme toggle — persisted in localStorage
 */

const translations = {
    // ========== HEADER ==========
    'nav.marketplace': { id: 'Marketplace', en: 'Marketplace' },
    'nav.admin_dashboard': { id: 'Admin Dashboard', en: 'Admin Dashboard' },
    'nav.dashboard': { id: 'Dashboard', en: 'Dashboard' },
    'nav.products': { id: 'Kelola Produk & Inventaris', en: 'Manage Products & Inventory' },
    'nav.orders': { id: 'Pesanan Masuk', en: 'Incoming Orders' },
    'nav.settings': { id: 'Pengaturan Toko', en: 'Store Settings' },
    'nav.my_orders': { id: 'Pesanan Saya', en: 'My Orders' },
    'auth.login': { id: 'Masuk', en: 'Login' },
    'auth.register': { id: 'Daftar', en: 'Register' },
    'auth.logout': { id: 'Logout', en: 'Logout' },
    'header.search_placeholder': { id: 'Cari obat, vitamin, alat kesehatan...', en: 'Search medicines, vitamins, health tools...' },
    'header.search_seller': { id: 'Cari inventaris saya...', en: 'Search my inventory...' },
    'header.theme_title': { id: 'Ganti Layar Siang/Malam', en: 'Toggle Day/Night Mode' },
    'header.lang_title': { id: 'Ganti Bahasa', en: 'Switch Language' },
    'header.profile_title': { id: 'Manajemen Profil Akun', en: 'Account Profile Management' },

    // ========== LOGIN PAGE ==========
    'login.welcome': { id: 'Selamat Datang!', en: 'Welcome!' },
    'login.subtitle': { id: 'Silakan login sesuai peran Anda', en: 'Please login with your role' },
    'login.role_customer': { id: 'Pelanggan', en: 'Customer' },
    'login.role_seller': { id: 'Seller', en: 'Seller' },
    'login.role_admin': { id: 'Admin', en: 'Admin' },
    'login.username': { id: 'Username', en: 'Username' },
    'login.password': { id: 'Password', en: 'Password' },
    'login.username_placeholder': { id: 'Masukkan username', en: 'Enter username' },
    'login.password_placeholder': { id: 'Masukkan password', en: 'Enter password' },
    'login.submit': { id: 'Masuk Sekarang', en: 'Login Now' },
    'login.forgot': { id: 'Lupa password?', en: 'Forgot password?' },
    'login.no_account': { id: 'Belum punya akun?', en: "Don't have an account?" },
    'login.register_now': { id: 'Daftar sekarang', en: 'Register now' },
    'login.brand_tagline': { id: 'Apotek Digital Terpercaya Anda', en: 'Your Trusted Digital Pharmacy' },
    'login.feature_1': { id: '✅ Obat asli & terjamin', en: '✅ Genuine & guaranteed medicines' },
    'login.feature_2': { id: '✅ Konsultasi apoteker gratis', en: '✅ Free pharmacist consultation' },
    'login.feature_3': { id: '✅ Pengiriman cepat & aman', en: '✅ Fast & safe delivery' },
    'login.feat1_title': { id: 'Marketplace Lengkap', en: 'Complete Marketplace' },
    'login.feat1_desc': { id: 'Ribuan produk kesehatan tersedia', en: 'Thousands of health products available' },
    'login.feat2_title': { id: 'Dashboard Seller', en: 'Seller Dashboard' },
    'login.feat2_desc': { id: 'Kelola toko Anda dengan mudah', en: 'Manage your store easily' },
    'login.feat3_title': { id: 'Aman & Terpercaya', en: 'Safe & Trusted' },
    'login.feat3_desc': { id: 'Transaksi dijamin keamanannya', en: 'Transactions are guaranteed secure' },
    'login.remember_me': { id: 'Ingat saya', en: 'Remember me' },
    'login.guest': { id: 'Lanjut sebagai Tamu', en: 'Continue as Guest' },
    'login.or': { id: 'atau', en: 'or' },
    'login.demo_title': { id: '💡 Akun Demo (Auto-Fill Aktif):', en: '💡 Demo Account (Auto-Fill Active):' },
    'login.demo_desc': { id: 'Pilih tab di atas untuk mengisi akun secara otomatis.', en: 'Select a tab above to auto-fill credentials.' },

    // ========== REGISTER PAGE ==========
    'register.title': { id: 'Buat Akun Baru', en: 'Create New Account' },
    'register.subtitle': { id: 'Bergabung dengan MediMart untuk akses kesehatan terpercaya', en: 'Join MediMart for trusted health access' },
    'register.fullname': { id: 'Nama Lengkap', en: 'Full Name' },
    'register.fullname_placeholder': { id: 'Masukkan nama lengkap', en: 'Enter full name' },
    'register.username_placeholder': { id: 'Pilih username', en: 'Choose username' },
    'register.email': { id: 'Email', en: 'Email' },
    'register.email_placeholder': { id: 'contoh@email.com', en: 'example@email.com' },
    'register.password_placeholder': { id: 'Buat password (min. 6 karakter)', en: 'Create password (min. 6 characters)' },
    'register.role_label': { id: 'Daftar Sebagai', en: 'Register As' },
    'register.role_customer': { id: 'Pembeli', en: 'Buyer' },
    'register.role_customer_desc': { id: 'Belanja obat dan produk kesehatan', en: 'Shop medicines and health products' },
    'register.role_seller': { id: 'Penjual', en: 'Seller' },
    'register.role_seller_desc': { id: 'Jual produk kesehatan di MediMart', en: 'Sell health products on MediMart' },
    'register.submit': { id: 'Daftar Sekarang', en: 'Register Now' },
    'register.has_account': { id: 'Sudah punya akun?', en: 'Already have an account?' },
    'register.login_now': { id: 'Login disini', en: 'Login here' },
    'register.tagline': { id: 'Bergabunglah dengan ribuan pengguna lain untuk hidup yang lebih sehat.', en: 'Join thousands of users for a healthier life.' },
    'register.feat1_title': { id: 'Daftar Cepat', en: 'Quick Registration' },
    'register.feat1_desc': { id: 'Proses pendaftaran mudah, hanya butuh waktu kurang dari 1 menit.', en: 'Easy registration process, takes less than 1 minute.' },
    'register.feat2_title': { id: 'Promo Eksklusif', en: 'Exclusive Promos' },
    'register.feat2_desc': { id: 'Dapatkan akses ke promo dan diskon khusus member baru.', en: 'Get access to exclusive promos and discounts for new members.' },
    'register.feat3_title': { id: 'Transaksi Aman', en: 'Secure Transactions' },
    'register.feat3_desc': { id: 'Sistem pembayaran terintegrasi dan aman untuk setiap transaksi.', en: 'Integrated and secure payment system for every transaction.' },
    'register.subtitle_form': { id: 'Lengkapi data diri Anda untuk mendaftar', en: 'Complete your details to register' },
    'register.register_as': { id: 'Saya ingin mendaftar sebagai:', en: 'I want to register as:' },
    'register.username': { id: 'Username', en: 'Username' },
    'register.back_home': { id: '← Kembali ke Beranda', en: '← Back to Home' },

    // ========== MARKETPLACE / INDEX ==========
    'index.explore': { id: 'Eksplorasi Katalog', en: 'Explore Catalog' },
    'index.all': { id: 'Semua', en: 'All' },
    'index.out_of_stock': { id: 'Habis', en: 'Out of Stock' },
    'index.remaining': { id: 'Sisa:', en: 'Left:' },
    'index.stock': { id: 'Stok:', en: 'Stock:' },
    'index.add_cart': { id: '+ Keranjang', en: '+ Cart' },
    'index.add_to_cart': { id: 'Tambah ke Keranjang', en: 'Add to Cart' },
    'index.no_products': { id: 'Belum ada produk yang tersedia.', en: 'No products available yet.' },
    'index.total_shopping': { id: 'Total Belanja', en: 'Total Shopping' },
    'index.continue': { id: 'Lanjut', en: 'Continue' },

    // ========== CART ==========
    'cart.continue_shopping': { id: 'Lanjut Belanja', en: 'Continue Shopping' },
    'cart.title': { id: 'Keranjang Belanja', en: 'Shopping Cart' },
    'cart.subtitle': { id: 'Review pesanan Anda sebelum checkout', en: 'Review your order before checkout' },
    'cart.items_in_cart': { id: 'Item di Keranjang', en: 'Items in Cart' },
    'cart.clear': { id: 'Kosongkan', en: 'Clear All' },
    'cart.empty': { id: 'Keranjang belanja Anda kosong.', en: 'Your shopping cart is empty.' },
    'cart.start_shopping': { id: 'Mulai Belanja', en: 'Start Shopping' },
    'cart.order_summary': { id: 'Ringkasan Pesanan', en: 'Order Summary' },
    'cart.shipping': { id: 'Ongkos Kirim', en: 'Shipping' },
    'cart.free': { id: 'GRATIS', en: 'FREE' },
    'cart.discount': { id: 'Diskon', en: 'Discount' },
    'cart.total': { id: 'Total', en: 'Total' },
    'cart.checkout_now': { id: 'Checkout Sekarang', en: 'Checkout Now' },
    'cart.login_to_checkout': { id: 'Login untuk Checkout', en: 'Login to Checkout' },
    'cart.payment_methods': { id: 'Metode Pembayaran:', en: 'Payment Methods:' },
    'cart.promo_title': { id: 'Punya Kode Promo?', en: 'Have a Promo Code?' },
    'cart.promo_placeholder': { id: 'Masukkan kode promo', en: 'Enter promo code' },
    'cart.promo_apply': { id: 'Pakai', en: 'Apply' },
    'cart.original_product': { id: 'Produk Original', en: 'Original Products' },
    'cart.fast_shipping': { id: 'Pengiriman Cepat', en: 'Fast Shipping' },
    'cart.secure_transaction': { id: 'Transaksi Aman', en: 'Secure Transaction' },
    'cart.you_may_like': { id: 'Mungkin Anda Tertarik', en: 'You May Also Like' },
    'cart.no_recommendations': { id: 'Tidak ada rekomendasi saat ini.', en: 'No recommendations at this time.' },
    'cart.confirm_clear': { id: 'Yakin ingin mengosongkan keranjang?', en: 'Are you sure you want to clear the cart?' },
    'cart.yes_clear': { id: 'Ya, Kosongkan', en: 'Yes, Clear' },
    'cart.cancel': { id: 'Batal', en: 'Cancel' },
    'cart.confirm': { id: 'Konfirmasi', en: 'Confirm' },
    'cart.remove_item': { id: 'Hapus item ini dari keranjang?', en: 'Remove this item from cart?' },
    'cart.yes_remove': { id: 'Ya, Hapus', en: 'Yes, Remove' },

    // ========== CHECKOUT ==========
    'checkout.back_to_cart': { id: 'Kembali ke Keranjang', en: 'Back to Cart' },
    'checkout.title': { id: 'Checkout Pesanan', en: 'Checkout Order' },
    'checkout.shipping_address': { id: 'Alamat Pengiriman', en: 'Shipping Address' },
    'checkout.recipient_name': { id: 'Nama Penerima', en: 'Recipient Name' },
    'checkout.recipient_placeholder': { id: 'Nama lengkap penerima', en: 'Recipient full name' },
    'checkout.phone': { id: 'Nomor Telepon', en: 'Phone Number' },
    'checkout.address': { id: 'Alamat Lengkap', en: 'Full Address' },
    'checkout.address_placeholder': { id: 'Jalan, Nomor rumah, RT/RW, Kelurahan, Kecamatan', en: 'Street, house number, district, city' },
    'checkout.payment_method': { id: 'Metode Pembayaran', en: 'Payment Method' },
    'checkout.bank_transfer': { id: 'Transfer Bank (BCA/Mandiri)', en: 'Bank Transfer (BCA/Mandiri)' },
    'checkout.ewallet': { id: 'E-Wallet (GoPay/OVO/Dana)', en: 'E-Wallet (GoPay/OVO/Dana)' },
    'checkout.cod': { id: 'Bayar di Tempat (COD)', en: 'Cash on Delivery (COD)' },
    'checkout.subtotal': { id: 'Subtotal', en: 'Subtotal' },
    'checkout.total_pay': { id: 'Total Bayar', en: 'Total Payment' },
    'checkout.confirm_pay': { id: 'Konfirmasi & Bayar', en: 'Confirm & Pay' },
    'checkout.securing': { id: 'Mengamankan Transaksi..', en: 'Securing Transaction..' },
    'checkout.please_wait': { id: 'Mohon tunggu, kami sedang menyandikan pesanan Anda 🔒', en: 'Please wait, we are encrypting your order 🔒' },

    // ========== SELLER DASHBOARD ==========
    'seller.dashboard_title': { id: 'Dashboard Toko', en: 'Store Dashboard' },
    'seller.greeting_suffix': { id: '! Kelola produk Anda disini.', en: '! Manage your products here.' },
    'seller.total_products': { id: 'Total Produk', en: 'Total Products' },
    'seller.total_stock': { id: 'Total Stok', en: 'Total Stock' },
    'seller.inventory_value': { id: 'Nilai Inventory', en: 'Inventory Value' },
    'seller.net_revenue': { id: 'Laba Bersih (90%)', en: 'Net Revenue (90%)' },
    'seller.revenue_trend': { id: 'Tren Laba Bersih Lapak Tahun Ini (IDR)', en: 'Store Net Revenue Trend This Year (IDR)' },
    'seller.top_products': { id: 'Top 5 Produk Terlaris', en: 'Top 5 Best Sellers' },
    'seller.items_sold': { id: 'barang terjual', en: 'items sold' },
    'seller.no_sales': { id: 'Belum ada penjualan tercatat.', en: 'No sales recorded yet.' },
    'seller.recent_orders': { id: 'Pesanan Masuk Terbaru', en: 'Recent Incoming Orders' },
    'seller.view_all': { id: 'Lihat Seluruhnya', en: 'View All' },
    'seller.buyer': { id: 'Pembeli', en: 'Buyer' },
    'seller.product_qty': { id: 'Produk (Kuantitas)', en: 'Product (Quantity)' },
    'seller.receipt_amount': { id: 'Nominal Resi', en: 'Receipt Amount' },
    'seller.order_status': { id: 'Status Order', en: 'Order Status' },
    'seller.order_date': { id: 'Tanggal Berlangsung', en: 'Date' },
    'seller.no_orders': { id: 'Hingga saat ini belum ada pesanan yang masuk. Perbanyak inventaris produk!', en: 'No orders yet. Increase your product inventory!' },

    // ========== ORDER STATUS ==========
    'status.pending': { id: 'Menunggu Dibayar', en: 'Awaiting Payment' },
    'status.paid': { id: 'Perlu Diproses', en: 'Needs Processing' },
    'status.processed': { id: 'Sedang Dikemas', en: 'Being Packed' },
    'status.shipped': { id: 'Meluncur Dikirim', en: 'Shipped' },
    'status.completed': { id: 'Transaksi Selesai', en: 'Completed' },
    'status.cancelled': { id: 'Dibatalkan', en: 'Cancelled' },

    // ========== PROFILE ==========
    'profile.title': { id: 'Profil Master Pengguna', en: 'User Master Profile' },
    'profile.subtitle': { id: 'Sesuaikan identitas pribadi, avatar, nomor telepon, dan keamanan kata sandi Anda.', en: 'Customize your personal identity, avatar, phone number, and password security.' },
    'profile.upload_photo': { id: 'Klik untuk upload foto', en: 'Click to upload photo' },
    'profile.change_photo': { id: 'Klik untuk ganti foto', en: 'Click to change photo' },
    'profile.max_size': { id: 'Maks 2MB, format JPG/PNG', en: 'Max 2MB, JPG/PNG format' },
    'profile.fullname': { id: 'Nama Lengkap', en: 'Full Name' },
    'profile.username': { id: 'Username', en: 'Username' },
    'profile.email': { id: 'Email', en: 'Email' },
    'profile.phone': { id: 'Telepon', en: 'Phone' },
    'profile.address': { id: 'Alamat', en: 'Address' },
    'profile.member_since': { id: 'Bergabung Sejak', en: 'Member Since' },
    'profile.edit': { id: 'Edit Profil', en: 'Edit Profile' },
    'profile.save': { id: 'Terapkan Perubahan Profil', en: 'Apply Profile Changes' },
    'profile.cancel': { id: 'Batal', en: 'Cancel' },
    'profile.not_set': { id: 'Belum diatur', en: 'Not set' },
    'profile.photo_label': { id: 'Foto Profil', en: 'Profile Photo' },
    'profile.basic_info': { id: 'Informasi Dasar', en: 'Basic Information' },
    'profile.change_password': { id: 'Ganti Sandi Keamanan', en: 'Change Security Password' },

    // ========== PRODUCT ==========
    'product.add_to_cart': { id: 'Tambah ke Keranjang', en: 'Add to Cart' },
    'product.out_of_stock': { id: 'Stok Habis', en: 'Out of Stock' },
    'product.description': { id: 'Deskripsi', en: 'Description' },
    'product.category': { id: 'Kategori', en: 'Category' },
    'product.stock': { id: 'Stok', en: 'Stock' },
    'product.price': { id: 'Harga', en: 'Price' },
    'product.seller': { id: 'Penjual', en: 'Seller' },
    'product.visit_store': { id: 'Kunjungi Toko', en: 'Visit Store' },
    'product.add_product': { id: 'Tambah Produk', en: 'Add Product' },
    'product.edit_product': { id: 'Edit Produk', en: 'Edit Product' },
    'product.product_name': { id: 'Nama Produk', en: 'Product Name' },
    'product.product_image': { id: 'Gambar Produk', en: 'Product Image' },
    'product.requires_prescription': { id: 'Butuh Resep', en: 'Requires Prescription' },

    // ========== PRODUCT FORM ==========
    'form.save': { id: 'Simpan', en: 'Save' },
    'form.cancel': { id: 'Batal', en: 'Cancel' },
    'form.back': { id: 'Kembali', en: 'Back' },
    'form.delete': { id: 'Hapus', en: 'Delete' },
    'form.edit': { id: 'Edit', en: 'Edit' },
    'form.submit': { id: 'Kirim', en: 'Submit' },

    // ========== USER DASHBOARD ==========
    'user.dashboard_title': { id: 'Pesanan Saya', en: 'My Orders' },
    'user.total_orders': { id: 'Total Pesanan', en: 'Total Orders' },
    'user.active_orders': { id: 'Pesanan Aktif', en: 'Active Orders' },
    'user.total_spent': { id: 'Total Belanja', en: 'Total Spent' },
    'user.order_history': { id: 'Riwayat Pesanan', en: 'Order History' },
    'user.no_orders': { id: 'Belum ada pesanan.', en: 'No orders yet.' },
    'user.view_detail': { id: 'Lihat Detail', en: 'View Detail' },
    'user.order_detail': { id: 'Detail Pesanan', en: 'Order Detail' },

    // ========== FORGOT/RESET PASSWORD ==========
    'forgot.title': { id: 'Lupa Password', en: 'Forgot Password' },
    'forgot.subtitle': { id: 'Masukkan email Anda untuk reset password', en: 'Enter your email to reset password' },
    'forgot.email_placeholder': { id: 'Masukkan email Anda', en: 'Enter your email' },
    'forgot.submit': { id: 'Kirim Link Reset', en: 'Send Reset Link' },
    'forgot.back_to_login': { id: 'Kembali ke halaman login', en: 'Back to login page' },
    'reset.title': { id: 'Reset Password', en: 'Reset Password' },
    'reset.new_password': { id: 'Password Baru', en: 'New Password' },
    'reset.confirm_password': { id: 'Konfirmasi Password', en: 'Confirm Password' },
    'reset.submit': { id: 'Reset Password', en: 'Reset Password' },

    // ========== STORE ==========
    'store.products': { id: 'Produk', en: 'Products' },
    'store.no_products': { id: 'Toko ini belum memiliki produk.', en: 'This store has no products yet.' },

    // ========== TOAST / ALERTS ==========
    'toast.add_success': { id: 'Berhasil masuk keranjang!', en: 'Added to cart!' },
    'toast.add_failed': { id: 'Gagal menambahkan', en: 'Failed to add' },
    'toast.connection_error': { id: 'Terjadi kesalahan koneksi', en: 'Connection error occurred' },
    'toast.update_failed': { id: 'Gagal update keranjang', en: 'Failed to update cart' },
    'toast.promo_unavailable': { id: 'Fitur promo belum tersedia saat ini.', en: 'Promo feature is not available yet.' },
    'toast.clear_failed': { id: 'Gagal mengosongkan keranjang', en: 'Failed to clear cart' },
    'toast.error_generic': { id: 'Terjadi kesalahan', en: 'An error occurred' },

    // ========== SWAL CONFIRM/DIALOG ==========
    'swal.are_you_sure': { id: 'Anda Yakin?', en: 'Are You Sure?' },
    'swal.wait': { id: 'Tunggu Sebentar..', en: 'Wait a Moment..' },
    'swal.confirm': { id: 'Konfirmasi', en: 'Confirm' },
    'swal.yes_continue': { id: 'Ya, Lanjutkan', en: 'Yes, Continue' },
    'swal.back': { id: 'Kembali', en: 'Go Back' },
    'swal.processing': { id: 'Memproses...', en: 'Processing...' },
    'swal.processing_desc': { id: 'Meneruskan instruksi Anda, mohon tunggu sebentar.', en: 'Forwarding your instructions, please wait a moment.' },

    // Login Swal
    'swal.verifying': { id: 'Memverifikasi Kredensial..', en: 'Verifying Credentials..' },
    'swal.verifying_customer': { id: 'Menyiapkan Dasbor Pelanggan Anda 🔒', en: 'Preparing your Customer Dashboard 🔒' },
    'swal.verifying_seller': { id: 'Menyiapkan Dasbor Seller Anda 🔒', en: 'Preparing your Seller Dashboard 🔒' },
    'swal.verifying_admin': { id: 'Menyiapkan Dasbor Instansi Admin Anda 🔒', en: 'Preparing your Admin Dashboard 🔒' },

    // Register Swal
    'swal.creating_account': { id: 'Menciptakan Akun Anda..', en: 'Creating Your Account..' },
    'swal.creating_account_desc': { id: 'Mengenkripsi kata sandi dan mendaftarkan entitas Anda 🛡️', en: 'Encrypting password and registering your entity 🛡️' },

    // Checkout Swal
    'swal.securing': { id: 'Mengamankan Transaksi..', en: 'Securing Transaction..' },
    'swal.securing_desc': { id: 'Mohon tunggu, kami sedang menyandikan pesanan Anda 🔒', en: 'Please wait, we are encrypting your order 🔒' },

    // Cart Swal
    'swal.clear_cart': { id: 'Yakin ingin mengosongkan keranjang?', en: 'Are you sure you want to clear the cart?' },
    'swal.yes_clear': { id: 'Ya, Kosongkan', en: 'Yes, Clear' },
    'swal.cancel': { id: 'Batal', en: 'Cancel' },
    'swal.remove_item': { id: 'Hapus item ini dari keranjang?', en: 'Remove this item from cart?' },
    'swal.yes_remove': { id: 'Ya, Hapus', en: 'Yes, Remove' },

    // Toast random titles
    'toast.success_1': { id: 'Langkah yang Tepat! 🚀', en: 'Great Move! 🚀' },
    'toast.success_2': { id: 'Yes, Berhasil! 🎉', en: 'Yes, Success! 🎉' },
    'toast.success_3': { id: 'Kerja Bagus! ✨', en: 'Nice Work! ✨' },
    'toast.success_4': { id: 'Mantap Sekali! 🏆', en: 'Awesome! 🏆' },
    'toast.success_5': { id: 'Wah, Sukses! 🎯', en: 'Wow, Done! 🎯' },
    'toast.error_1': { id: 'Yaaah, Maaf Ya.. 🥺', en: 'Oh No, Sorry.. 🥺' },
    'toast.error_2': { id: 'Oops, Ada Kendala 🛠️', en: 'Oops, Something Went Wrong 🛠️' },
    'toast.error_3': { id: 'Tunggu Sebentar ✋', en: 'Hold On ✋' },
    'toast.error_4': { id: 'Ups, Gagal Nih 💔', en: 'Oops, Failed 💔' },
    'toast.error_5': { id: 'Sayang Sekali.. 🌧️', en: 'Too Bad.. 🌧️' },
    'toast.warning_1': { id: 'Perhatian Sebentar 💡', en: 'Heads Up 💡' },
    'toast.warning_2': { id: 'Hati-hati Ya 🚦', en: 'Be Careful 🚦' },
    'toast.warning_3': { id: 'Cek Sekali Lagi 👀', en: 'Double Check 👀' },

    // ========== INDEX CARD LABELS ==========
    'index.remaining_prefix': { id: 'Sisa:', en: 'Left:' },
    'index.stock_prefix': { id: 'Stok:', en: 'Stock:' },
    'index.btn_out_of_stock': { id: 'Habis', en: 'Sold Out' },
    'index.btn_add_cart': { id: '+ Keranjang', en: '+ Cart' },
    'index.item_suffix': { id: 'Item', en: 'Item' },

    // ========== CHECKOUT PAYMENT LABELS ==========
    'checkout.bank_label': { id: '🏦 Transfer Bank (BCA/Mandiri)', en: '🏦 Bank Transfer (BCA/Mandiri)' },
    'checkout.ewallet_label': { id: '📱 E-Wallet (GoPay/OVO/Dana)', en: '📱 E-Wallet (GoPay/OVO/Dana)' },
    'checkout.cod_label': { id: '💰 Bayar di Tempat (COD)', en: '💰 Cash on Delivery (COD)' },

    // ========== LOGIN DIVIDER ==========
    'login.divider_or': { id: 'atau', en: 'or' },

    // ========== MISC ==========
    'misc.loading': { id: 'Memuat...', en: 'Loading...' },
    'misc.item': { id: 'Item', en: 'Item' },
    'misc.hide_confirm': { id: 'Yakin ingin menyembunyikan riwayat pesanan ini?', en: 'Are you sure you want to hide this order history?' },
    'misc.yes_hide': { id: 'Ya, Sembunyikan', en: 'Yes, Hide' },
    'misc.shop_again': { id: '🛍️ Belanja Lagi', en: '🛍️ Shop Again' },
    'misc.detail_invoice': { id: 'Detail Invoice', en: 'Invoice Detail' },
    'misc.delete': { id: '🗑️ Hapus', en: '🗑️ Delete' },
};

/**
 * Apply language to all elements with data-i18n attributes
 */
function applyLanguage(lang) {
    // Text content
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[key] && translations[key][lang]) {
            el.textContent = translations[key][lang];
        }
    });

    // Placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (translations[key] && translations[key][lang]) {
            el.placeholder = translations[key][lang];
        }
    });

    // Titles (tooltips)
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
        const key = el.getAttribute('data-i18n-title');
        if (translations[key] && translations[key][lang]) {
            el.title = translations[key][lang];
        }
    });

    // innerHTML for elements that contain emojis + text (use sparingly)
    document.querySelectorAll('[data-i18n-html]').forEach(el => {
        const key = el.getAttribute('data-i18n-html');
        if (translations[key] && translations[key][lang]) {
            el.innerHTML = translations[key][lang];
        }
    });
}

/**
 * Toggle language and persist
 */
function toggleLanguage() {
    const current = localStorage.getItem('medimart_lang') || 'id';
    const target = current === 'id' ? 'en' : 'id';
    localStorage.setItem('medimart_lang', target);
    applyLanguage(target);

    // Update toggle button text
    const btn = document.getElementById('langToggleBtn');
    if (btn) btn.textContent = target === 'en' ? 'EN' : 'ID';

    // Also update any floating toggle on login/register
    const floatBtn = document.getElementById('langToggleFloat');
    if (floatBtn) floatBtn.textContent = target === 'en' ? 'EN' : 'ID';
}

/**
 * Get a translation by key for use in JS
 */
function t(key) {
    const lang = localStorage.getItem('medimart_lang') || 'id';
    if (translations[key] && translations[key][lang]) {
        return translations[key][lang];
    }
    return key; // fallback to key
}

/**
 * Initialize language on page load
 */
function initLanguage() {
    const lang = localStorage.getItem('medimart_lang') || 'id';
    applyLanguage(lang);

    // Set toggle button text
    const btn = document.getElementById('langToggleBtn');
    if (btn) btn.textContent = lang === 'en' ? 'EN' : 'ID';

    const floatBtn = document.getElementById('langToggleFloat');
    if (floatBtn) floatBtn.textContent = lang === 'en' ? 'EN' : 'ID';
}

// Auto-init when DOM is ready
document.addEventListener('DOMContentLoaded', initLanguage);
