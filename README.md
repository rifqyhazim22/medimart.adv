# 🏥 MediMart - Advanced E-Commerce Architecture

MediMart adalah **Aplikasi Fullstack E-Commerce** terdepan dengan fitur *Real-Time*, sistem perlindungan tingkat produksi (Production-grade Security), dan manajemen keranjang belanja yang persisten.

Dibangun dengan **Clean Architecture (MVC)** dan didistribusikan (*deploy*) untuk berjalan di peladen awan tanpa server (*Cloud Serverless Environment*).

---

## 🚀 Tech Stack & Infrastructure

Proyek ini tidak hanya sekadar antarmuka (*front-end*), melainkan sistem hibrida *client-server* tingkat menengah-atas (*mid-senior level*):

- **Backend / Core Engine**: Node.js dengan framework `Express.js`.
- **Database**: PostgreSQL di-_hosting_ di **AWS** (Neon DB `ap-southeast-1`).
- **ORM & Migrations**: `Sequelize ORM` (mengatur 13 entitas tabel relasional ketat).
- **View Engine**: Embedded JavaScript (`EJS`) dengan dukungan multi-bahasa global (i18n).
- **Real-Time Engine**: `Socket.IO` untuk fitur Obrolan (*Chat*) penjual-pembeli secara sinkron (*bidirectional*).
- **Cloud Deployment**: **Vercel** (`@vercel/node` Serverless Functions).

---

## 🛡️ Cyber Security & Data Privacy (Security Posture)

Aplikasi ini dipersenjatai lapisan pertahanan di setiap aspek siklus (*development, local, push repo, cloud deploy*):

1. **HTTP Defense Layer**: Menggunakan `Helmet JS` untuk menjamin lapis keamanan standar melawan _Clickjacking_, _MIME Sniffing_, dan eksploitasi peramban (*browser exploitation*).
2. **Session Hijacking Prevention**: Sesi kuki dikendalikan menggunakan `connect-session-sequelize`. Pada lingkungan produksi (`process.env.NODE_ENV === 'production'`), kuki bersidang akan dipaksa menggunakan jalur aman tersandi: `secure: true`.
3. **Database Injection Safe**: Seluruh komunikasi antara server Express dan PostgreSQL memanfaatkan *Parameterized ORM Queries* turunan Sequelize. _SQL Injection_ 100% dicegah.
4. **Secret Splitting**: Tidak ada satu pun rahasia (*tokens* / tautan *DATABASE_URL*) yang tertulis tetap di repositori awan. Repositori *development* diamankan dengan `.gitignore` dan Vercel CLI (*Environment Variables*) mencegah data penting terekspos ketika di-*push* ke GitHub publik.
5. **Kriptografi Kata Sandi**: Otentikasi aplikasi menggunakan `bcrypt.js` (*Password Hashing Algorithm*), bukan _plaintext_.

---

## 💎 Fitur Unggulan Sistem (Features Showcase)

### 1. 🧬 Arsitektur Status Granular (Per-Item Logic)
Tidak seperti platform dasar, manajemen pesanan MediMart dapat **dibatalkan/ditolak per individu produk**, bukan per faktur keseluruhan. Hal ini memicu fungsi basis data otomatis (`Auto-Restock`) tanpa merusak alur transaksi (*transaction flow*).

### 2. 💬 In-App Web Socket Messaging
Percakapan *real-time* berbasis `Socket.IO` antara pengguna. Fitur lencana baca (*unread badges*) di-_render_ langsung dan dibagikan (*shared session state*) bersama tumpukan sesi *Express middleware*.

### 3. 🛡️ Strict Role Access Control (RBAC)
Pemisahan otoritas tegas antara Admin, _Seller_ (Manajer Toko), dan _Buyer_ (Pembeli). Intervensi transaksi disaring agar penjual tidak dapat "membeli barangnya sendiri". Sistem menunjang _Double-Blind Sync_.

### 4. ✨ High-Conversion UI / UX
Tampilan merespons mulus tanpa membebankan server (*No-Reload Actions*). Bar tindakan pintar (*Sticky Checkout CTA*) mendeteksi jumlah nilai keranjang dan melayang secara persisten, mendongkrak konversi pembelian (*Conversion Rate Optimization*).

---

## 🏗️ Menjalankan Proyek secara Lokal

1. Persiapkan basis data PostgreSQL (*localhost*), lalu sesuaikan fail rahasia pada `.env`:
```env
# Contoh di lokal (development)
DB_USER=postgres
DB_PASSWORD=rahasia
DB_NAME=medimart
```

2. Pasang modul turunan (Dependencies).
```bash
npm install
```

3. Modul otomatis penyalur basis data (*seeding*) akan melahirkan data perintis (dummy data) Admin, Pembeli, Penjual & Produk.
```bash
npm run setup
```

4. Jalankan pengembang jalan raya (Dev Server) melalui Nodemon:
```bash
npm run dev
```
