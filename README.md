# 🏥 MediMart: The Next-Gen Healthcare Ecosystem

![Architecture](https://img.shields.io/badge/Architecture-MVC%20%7C%20SSR-orange?style=for-the-badge)
![Database](https://img.shields.io/badge/Database-PostgreSQL%20(Neon)-blue?style=for-the-badge&logo=postgresql)
![Realtime](https://img.shields.io/badge/Realtime-Socket.io-black?style=for-the-badge&logo=socketdotio)
![Payment](https://img.shields.io/badge/Payment-Xendit%20Integrated-brightgreen?style=for-the-badge)
![Cloud](https://img.shields.io/badge/Cloud-Vercel%20Deployed-white?style=for-the-badge&logo=vercel)

**MediMart** is a premium, full-stack health-tech marketplace designed to revolutionize pharmaceutical accessibility. Built on a robust **MVC architecture**, it combines real-time communication, secure payment gateways, and intelligent image processing into a single, cohesive production-ready platform.

---

## 🌐 Project Reality
In a world where digital healthcare is a necessity, MediMart bridges the gap between verified sellers and patients. 
- **Live Production URL**: [https://medimart-adv.vercel.app](https://medimart-adv.vercel.app)
- **Deployment Strategy**: Serverless deployment on **Vercel** with a globally distributed **Neon PostgreSQL** cluster.
- **Security Posture**: Production-grade security using `Helmet.js`, CSRF protection principles, and encrypted session management via `Sequelize Store`.

---

## 🏗️ System Architecture & Structure

MediMart is engineered for scalability and maintainability, adhering to strict **Separation of Concerns (SoC)**.

### 🏢 The Tech Stack
- **Engine**: Node.js & Express.js (Asynchronous, non-blocking I/O).
- **Storage**: PostgreSQL with **Sequelize ORM** for type-safe database interactions.
- **Communication**: WebSockets (Socket.IO) for bi-directional, real-time sync.
- **Templating**: EJS with a custom CSS design system (Vanilla CSS for maximum performance).
- **Processing**: `Sharp` for high-performance server-side image manipulation.

### 📁 Technical Blueprint
```text
├── controllers/      # Business logic & Request orchestration
├── db/               # Seeding engine & Database initialization
├── migrations/       # Schema version control (Sequelize migrations)
├── models/           # Data definitions & Relational mappings
├── public/           # Performance-optimized frontend assets
├── routes/           # RESTful API routing & View controllers
├── utils/            # i18n logic, Image optimizer, Payment middleware
├── views/            # Dynamic SSR templates
└── server.js         # Core application entry point
```

---

## 🧠 Algorithmic Core

### 1. 🖼️ Intelligent Image Pipeline (Sharp.js)
The system doesn't just "upload" images. It processes them through an optimization pipeline:
- **Aspect-Ratio Correction**: Automatically crops any upload to a perfect 1:1 square to maintain UI harmony.
- **Memory Optimization**: Compresses raw buffers into production-ready JPG/PNG, reducing bandwidth costs by ~60%.

### 2. 🛡️ Xendit Payment Lifecycle Algorithm
Security is paramount in healthcare payments. Our integration uses a **State-Verification Algorithm**:
- **Signed Invoices**: Backend generates unique secure invoice links.
- **Webhook Handshaking**: Uses a callback token verification algorithm to ensure only authentic Xendit notifications can trigger status changes.
- **Atomic Operations**: Order status updates and stock replenishment are wrapped in database transactions to ensure data integrity.

### 3. � Context-Aware Real-time Sync (Socket.IO)
Our chat algorithm isn't a simple message relay. It is **Context-Aware**:
- **Product Context Binding**: Automatically binds the active product to the chat session, allowing sellers to see exactly what the user is inquiring about.
- **Presence Logic**: Dynamically manages user status and unread badges across the session state.

### 4. 🌍 Recursive i18n Engine
A proprietary internationalization logic that:
- Detects the `lang` cookie.
- Generates translation keys recursively (e.g., `category.obat_bebas`) based on database entries, ensuring the UI is always localized without hardcoding values.

---

## 🚀 Future Upgrades (The Roadmap)
MediMart is designed for the long haul. Our vision for version 2.0 includes:
- **🤖 AI-Pharmacist**: Integrating a medical-tuned LLM for preliminary drug interaction checks.
- **🚚 Smart Logistics API**: Integration with Gojek/Grab for 1-hour "Instant Meds" delivery.
- **💊 Digital Prescription Vault**: OCR-based scanning and verification for restricted medications.
- **📈 Analytics Dashboard**: Deep-learning based demand forecasting for sellers.
- **📱 Mobile Native Integration**: A companion app built with React Native for push-notification-driven healthcare alerts.

---

## 🛠️ Local Development & Deployment

1. **Repository Synchronization**: `git clone https://github.com/rifqyhazim22/medimart.adv.git`
2. **Dependency Installation**: `npm install`
3. **Environment Configuration**: Setup `.env` with `DATABASE_URL`, `XENDIT_SECRET_KEY`, and `SESSION_SECRET`.
4. **Schema Initialization**: `npx sequelize-cli db:migrate` then `npm run setup` for seed data.
5. **Execution**: `npm run dev`.

---

Developed with a vision for a healthier future. ✨🚀
