# 🏥 MediMart: Ekosistem Layanan Kesehatan Masa Depan

[English](README.md) | [Bahasa Indonesia](README.id.md)

![Arsitektur](https://img.shields.io/badge/Arsitektur-MVC%20%7C%20SSR-orange?style=for-the-badge)
![Database](https://img.shields.io/badge/Database-PostgreSQL%20(Neon)-blue?style=for-the-badge&logo=postgresql)
![Realtime](https://img.shields.io/badge/Realtime-Socket.io-black?style=for-the-badge&logo=socketdotio)
![Pembayaran](https://img.shields.io/badge/Pembayaran-Xendit%20Integrated-brightgreen?style=for-the-badge)
![Cloud](https://img.shields.io/badge/Cloud-Vercel%20Deployed-white?style=for-the-badge&logo=vercel)

**MediMart** adalah marketplace teknologi kesehatan (health-tech) full-stack premium yang dirancang untuk merevolusi aksesibilitas farmasi. Dibangun di atas **arsitektur MVC** yang kokoh, platform ini menggabungkan komunikasi real-time, gerbang pembayaran yang aman, dan pemrosesan gambar cerdas ke dalam satu platform tunggal yang siap produksi.

---

## 🌐 Realita Proyek
Dalam dunia di mana layanan kesehatan digital merupakan kebutuhan, MediMart menjembatani kesenjangan antara penjual terverifikasi dan pasien.
- **URL Produksi Live**: [https://medimart-adv.vercel.app](https://medimart-adv.vercel.app)
- **Strategi Deployment**: Deployment Serverless di **Vercel** dengan kluster **Neon PostgreSQL** yang terdistribusi secara global.
- **Postur Keamanan**: Keamanan tingkat produksi menggunakan `Helmet.js`, prinsip perlindungan CSRF, dan manajemen sesi terenkripsi melalui `Sequelize Store`.

---

## 🏗️ Arsitektur & Struktur Sistem

MediMart dirancang untuk skalabilitas dan pemeliharaan, mematuhi prinsip **Separation of Concerns (SoC)** yang ketat.

### 🏢 Tech Stack
- **Engine**: Node.js & Express.js (Asynchronous, non-blocking I/O).
- **Penyimpanan**: PostgreSQL dengan **Sequelize ORM** untuk interaksi database yang aman secara tipe.
- **Komunikasi**: WebSockets (Socket.IO) untuk sinkronisasi dua arah secara real-time.
- **Templating**: EJS dengan sistem desain CSS kustom (Vanilla CSS untuk performa maksimal).
- **Pemrosesan**: `Sharp` untuk manipulasi gambar sisi server berkinerja tinggi.

### 📁 Blueprint Teknis
```text
├── controllers/      # Logika bisnis & Orkestrasi permintaan
├── db/               # Engine seeding & Inisialisasi database
├── migrations/       # Kontrol versi skema (Sequelize migrations)
├── models/           # Definisi data & Pemetaan relasional
├── public/           # Aset frontend yang dioptimalkan untuk performa
├── routes/           # Routing API RESTful & Kontroler view
├── utils/            # Logika i18n, Pengoptimal gambar, Middleware pembayaran
├── views/            # Templat SSR dinamis
└── server.js         # Titik masuk utama aplikasi (Core entry point)
```

---

## 🧠 Inti Algoritma

### 1. 🖼️ Pipa Gambar Cerdas (Sharp.js)
Sistem tidak sekadar "mengunggah" gambar, tetapi memprosesnya melalui pipa optimasi:
- **Koreksi Rasio Aspek**: Secara otomatis memotong setiap unggahan menjadi kotak 1:1 yang sempurna untuk menjaga harmoni UI.
- **Optimasi Memori**: Mengompresi buffer mentah menjadi format JPG/PNG siap produksi, mengurangi biaya bandwidth sebesar ~60%.

### 2. 🛡️ Algoritma Siklus Hidup Pembayaran Xendit
Keamanan adalah yang utama dalam pembayaran kesehatan. Integrasi kami menggunakan **Algoritma Verifikasi Status**:
- **Invoice Bertanda Tangan**: Backend menghasilkan tautan invoice aman yang unik.
- **Webhook Handshaking**: Menggunakan algoritma verifikasi token callback untuk memastikan hanya notifikasi asli dari Xendit yang dapat memicu perubahan status.
- **Operasi Atomik**: Pembaruan status pesanan dan penambahan stok dibungkus dalam transaksi database untuk memastikan integritas data.

### 3. 💬 Sinkronisasi Real-time Sadar-Konteks (Socket.IO)
Algoritma chat kami bukan sekadar penyampai pesan biasa. Chat ini **Sadar-Konteks**:
- **Binding Konteks Produk**: Secara otomatis mengaitkan produk aktif ke sesi chat, memungkinkan penjual melihat dengan tepat apa yang ditanyakan pengguna.
- **Logika Kehadiran (Presence)**: Mengelola status pengguna dan lencana pesan yang belum dibaca (unread badges) secara dinamis di seluruh status sesi.

### 4. 🌍 Mesin i18n Rekursif
Logika internasionalisasi properti yang:
- Mendeteksi kuki `lang`.
- Menghasilkan kunci terjemahan secara rekursif (contoh: `category.obat_bebas`) berdasarkan entri database, memastikan UI selalu terlokalisasi tanpa pengodean nilai secara mentah (hardcoding).

---

## 🚀 Peningkatan Selanjutnya (Roadmap)
MediMart dirancang untuk jangka panjang. Visi kami untuk versi 2.0 meliputi:
- **🤖 Apoteker AI**: Mengintegrasikan LLM yang dilatih secara medis untuk pemeriksaan interaksi obat awal.
- **🚚 API Logistik Cerdas**: Integrasi dengan mitra pengiriman berbasis API (Gojek/Grab/JNE) untuk pengiriman "Obat Instan" 1 jam.
- **💊 Brankas Resep Digital**: Pemindaian dan verifikasi resep berbasis OCR untuk obat-obatan terbatas.
- **📈 Dasbor Analitik**: Prediksi permintaan berbasis deep learning untuk penjual.
- **📱 Integrasi Mobile Native**: Aplikasi pendamping yang dibangun dengan React Native untuk peringatan kesehatan berbasis push notification.

---

## 🛠️ Pengembangan Lokal & Deployment

1. **Sinkronisasi Repositori**: `git clone https://github.com/rifqyhazim22/medimart.adv.git`
2. **Instalasi Dependensi**: `npm install`
3. **Konfigurasi Lingkungan**: Atur `.env` dengan `DATABASE_URL`, `XENDIT_SECRET_KEY`, dan `SESSION_SECRET`.
4. **Inisialisasi Skema**: `npx sequelize-cli db:migrate` kemudian `npm run setup` untuk data awal.
5. **Eksekusi**: `npm run dev`.

---

Dikembangkan dengan visi untuk masa depan yang lebih sehat. ✨🚀
