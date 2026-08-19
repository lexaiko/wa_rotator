# 🌴 TripBanyuwangi.com - WhatsApp Smart Rotator & Leads Management

Platform Smart WhatsApp Link Rotator dan Distribusi Leads berbasis **Express.js (Backend)** dan **Vite React + TailwindCSS (Frontend)** untuk **TripBanyuwangi.com**.

Dirancang khusus untuk mendukung performa kampanye iklan berbayar (Meta Ads, TikTok Ads, Google Search Ads, Bio Instagram) dengan redirect secepat kilat (<5ms), pembobotan cerdas tim CS, kontrol jadwal/shift kerja otomatis, batasan kuota harian (daily cap), pelacakan geolokasi & perangkat, trigger pixel, serta integrasi mulus dengan **CRM TripBwi (`../crm`)**.

---

## ⚡ Fitur Utama

1. **Smart Link & Multi-Campaigns**:
   - Pembuatan custom slug unik (e.g. `/kawah-ijen`, `/baluran-safari`, `/ig-bio`).
   - **Direct 302 Redirect Instan (Zero UI)**: Tanpa loading screen perantara, pengunjung langsung melompat ke WhatsApp (< 2ms latency).
   - Template pesan WhatsApp dinamis dengan placeholder: `{nama_cs}`, `{greeting}`, `{kota}`, `{channel}`, `{campaign}`, `{crm_keyword}`.

2. **Algoritma Pembobotan & Rotasi CS**:
   - **Smooth Weighted Round-Robin (Nginx Algorithm)**: Distribusi sangat halus dan adil sesuai persentase bobot tanpa penumpukan (clustering).
   - **Weighted Probabilistic Random**: Rasio acak kumulatif.
   - **Strict Round-Robin**: Bergiliran rata 1:1:1.
   - **Sticky Session**: Mengarahkan pengunjung lama yang mengklik ulang ke CS yang sama dalam 24 jam.

3. **Manajemen CS, Shift & Kuota Harian**:
   - Master Toggle **ON / OFF** per CS dalam 1 klik.
   - **Auto Schedule / Jam Kerja**: CS otomatis offline di luar jam shift (e.g. 08:00 - 17:00 WIB).
   - **Daily Lead Cap**: Pembatasan maksimal lead per hari per CS (otomatis istirahat jika tercapai).
   - **Fallback Handler**: Otomatis mengarahkan ke nomor darurat/piket jika seluruh CS sedang off.

4. **Deteksi Geolokasi & Device (Offline & Cepat)**:
   - Deteksi Kota, Provinsi, dan Negara pengunjung secara offline menggunakan `geoip-lite`.
   - Deteksi tipe perangkat (Mobile/Desktop/Tablet), OS, dan Browser.
   - Deteksi otomatis sumber channel sosial media (TikTok, Instagram, Facebook, Google, Direct).

5. **Tracking Pixels & Event Conversion**:
   - Multi-pixel support: **Meta Pixel** (`PageView`, `Lead`), **TikTok Pixel** (`Contact`), **Google Analytics (GA4)** (`generate_lead`).

6. **Live Simulator & Testing Tool**:
   - Uji coba rotasi link secara langsung (simulasi 50 / 100 / 500 klik) dengan visualisasi bar distribusi nyata vs target bobot sebelum kampanye diluncurkan ke iklan.

7. **Log Klik & Export CSV**:
   - Riwayat klik lengkap dengan filter tanggal, kampanye, CS, dan ekspor instan ke file CSV.

---

## 🛠️ Tech Stack

- **Backend (`src/`)**: Node.js (ES Module), Express.js 4, Prisma ORM 5 (SQLite / MySQL), `geoip-lite`, `ua-parser-js`, `node-cron`.
- **Frontend (`frontend/`)**: Vite 6, React 18, TailwindCSS 3, Lucide React, Chart.js (`react-chartjs-2`).
- **Tema UI**: TripBanyuwangi Signature Orange & Dark Glassmorphism.

---

## 🚀 Cara Menjalankan Project

### 1. Jalankan Backend (Port 3001)
```bash
# Install dependencies backend
npm install

# Push database & seed data contoh
npx prisma db push
npm run prisma:seed

# Jalankan server Express (Development)
npm run dev
```

Backend akan berjalan di: **`http://localhost:3001`**  
Link redirect: **`http://localhost:3001/r/:slug`**

### 2. Jalankan Frontend Dashboard (Port 5173)
Buka terminal baru di folder `frontend`:
```bash
cd frontend
npm install
npm run dev
```
Dashboard akan terbuka di: **`http://localhost:5173`**

### 3. Build Production (Single Server)
```bash
# Build frontend menjadi static files
npm run build:frontend

# Jalankan backend (akan otomatis menyajikan dashboard di port 3001)
npm start
```

---

## 🔗 Integrasi dengan CRM TripBwi (`../crm`)

1. **Deteksi Sumber Referral**: Template pesan rotator otomatis menyematkan keyword seperti `[Ref: TikTok]`. Saat chat pertama kali masuk ke WhatsApp CS, modul `GreetingRule` di CRM `trip-bwi-classifier` akan langsung memetakan `referral_source` secara otomatis.
2. **Database Bersama (Opsional)**: Untuk menghubungkan langsung ke MySQL CRM, ubah `DATABASE_URL` di `.env` menjadi URL MySQL CRM Anda.
