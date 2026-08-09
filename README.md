# 🏭 Textile Factory UI - Frontend Application

![Vue.js](https://img.shields.io/badge/Vue.js-35495E?style=for-the-badge&logo=vue.js&logoColor=4FC08D)
![Bootstrap](https://img.shields.io/badge/Bootstrap_5-563D7C?style=for-the-badge&logo=bootstrap&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E)

Aplikasi *frontend* modern dan responsif yang dirancang khusus untuk antarmuka pengguna sistem manajemen pabrik tekstil. Dibangun menggunakan **Vue.js 3** dan **Bootstrap 5**, aplikasi ini terhubung langsung dengan backend Express.js untuk menyajikan dasbor pemantauan, manajemen inventori, dan operasional pabrik secara *real-time*.

## ✨ Fitur Utama

- **📊 Dasbor Interaktif:** Visualisasi data produksi harian, status mesin, dan metrik efisiensi secara langsung.
- **📱 Desain Responsif & Operator-Friendly:** Menggunakan antarmuka Bootstrap 5 yang dioptimalkan untuk layar *desktop* di ruang admin maupun *tablet* untuk operator di lantai pabrik.
- **📦 UI Manajemen Inventori:** Antarmuka yang intuitif untuk melacak stok bahan baku, pergerakan barang, dan ketersediaan kain siap kirim.
- **🔐 Sistem Autentikasi:** Halaman *login* aman dengan pengelolaan token JWT berbasis *role* (Admin, Operator Gudang, Teknisi).

---

## 🛠️ Prasyarat

Sebelum memulai, pastikan kamu telah menginstal:
- [Node.js](https://nodejs.org/en/) (v16.x atau lebih baru disarankan)

## ⚙️ Variabel Lingkungan (.env)

Buat file `.env` (atau `.env.local`) di *root directory* untuk menghubungkan *frontend* dengan API *backend*. 

```env
# Konfigurasi URL Backend Express.js
VITE_API_BASE_URL=<masukkan_url_api_backend_disini_contoh_http://localhost:3000/api>

# Variabel tambahan (opsional)
VITE_APP_TITLE=Textile Factory Dashboard