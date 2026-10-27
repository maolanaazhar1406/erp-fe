# ERP Kecil - Frontend

Frontend React untuk **Small ERP System**, sebuah aplikasi ERP sederhana untuk pengelolaan pengguna, master data, pengadaan, inventori, penjualan, keuangan, dan laporan. Aplikasi ini berkomunikasi dengan REST API berbasis Go (`/api/v1`) menggunakan autentikasi JWT.

## Fitur

- **Autentikasi**: login dengan username dan password, token JWT disimpan di `localStorage`, dan otomatis logout jika token tidak valid (HTTP 401).
- **Dashboard**: status server dan jumlah data utama (user, produk, pelanggan, supplier, PO, SO).
- **Pengguna & Role**: CRUD user dan role, dengan pemilihan permission memakai checkbox.
- **Master Data**: produk, kategori produk, satuan (UOM), pelanggan, dan supplier.
- **Pengadaan**: purchase order (dengan item dinamis dan ubah status) serta goods receipt.
- **Inventori**: saldo stok, riwayat pergerakan stok, dan penyesuaian stok.
- **Penjualan**: sales order (dengan item dinamis dan ubah status).
- **Keuangan**: chart of accounts, jurnal umum, pembayaran, hutang (AP), dan piutang (AR).
- **Laporan**: penjualan, pembelian, inventori, pergerakan stok, hutang, piutang, arus kas, laba rugi, dan neraca, dengan filter tanggal.

### Pengalaman pengguna

- Sidebar dapat ditutup-buka (tersimpan di `localStorage`), setiap modul dapat dilipat dengan animasi.
- Loading bertingkat: progress bar global, skeleton saat data pertama dimuat, tabel yang meredup saat refresh, dan spinner pada tombol aksi.
- Halaman detail menampilkan header berwarna, badge status, ringkasan angka, kartu informasi, dan tabel item dengan baris total.
- Format otomatis: angka dengan pemisah ribuan, nilai uang dalam Rupiah, dan tanggal dalam format Indonesia.
- Animasi dihormati pengaturan "kurangi gerakan" di sistem operasi (`prefers-reduced-motion`).

## Teknologi

| Kebutuhan | Pustaka |
|---|---|
| UI | React 18 |
| Build tool | Vite 5 |
| Routing | react-router-dom 6 |
| HTTP client | axios |
| Ikon | lucide-react |
| Styling | CSS biasa (`src/index.css`) |

## Struktur Proyek

```
erp-fe/
├── index.html
├── vite.config.js
├── package.json
├── .env.example
└── src/
    ├── main.jsx                  # Entry point, BrowserRouter, AuthProvider
    ├── App.jsx                   # Definisi route dan proteksi login
    ├── index.css                 # Seluruh style aplikasi
    ├── api/
    │   ├── client.js             # Instance axios, interceptor token dan 401
    │   └── loading.js            # Penghitung request untuk progress bar
    ├── config/
    │   └── resources.js          # Konfigurasi semua endpoint dan form
    ├── context/
    │   └── AuthContext.jsx       # State login, token, dan data user
    ├── components/
    │   ├── Layout.jsx            # Sidebar dan kerangka halaman
    │   ├── FormModal.jsx         # Form tambah/edit generik
    │   ├── DetailView.jsx        # Tampilan halaman detail
    │   ├── DataView.jsx          # Renderer generik (dipakai laporan)
    │   └── Loading.jsx           # Progress bar, skeleton, spinner
    └── pages/
        ├── Login.jsx
        ├── Dashboard.jsx
        ├── ResourcePage.jsx      # List dan detail untuk semua modul
        └── ReportPage.jsx        # Daftar dan detail laporan
```

### Arsitektur singkat

Sebagian besar modul tidak punya halaman sendiri. Semua dideskripsikan di `src/config/resources.js`:

- `path`: endpoint API.
- `fields`: field form tambah/edit, termasuk tipe `select` (diisi dari resource lain lewat `optionsFrom`) dan `lines` (daftar item dinamis).
- `create`, `update`, `remove`, `detail`, `list`: flag fitur yang tersedia untuk modul tersebut.
- `statuses`: daftar status yang bisa dipilih di halaman detail.

Menambah modul baru biasanya cukup dengan menambah entri di `resources` dan `menu`, lalu menambahkan icon di `Layout.jsx`.

## Persyaratan

- Node.js 18 atau lebih baru
- npm
- Backend Small ERP yang sudah berjalan (default `http://localhost:8080`)

## Instalasi dan Menjalankan

```bash
# 1. Masuk ke folder proyek
cd erp-fe

# 2. Atur alamat backend
cp .env.example .env
# Isi VITE_API_BASE_URL, default: http://localhost:8080

# 3. Install dependency
npm install

# 4. Jalankan mode development
npm run dev
```

Buka `http://localhost:5173` di browser, lalu login dengan akun yang ada di backend.

### Build untuk produksi

```bash
npm run build      # hasil di folder dist/
npm run preview    # cek hasil build secara lokal
```

## Konfigurasi

| Variabel | Default | Keterangan |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:8080` | Alamat dasar backend API |

Variabel dengan prefix `VITE_` dibaca saat build, jadi setelah mengubah `.env` jalankan ulang `npm run dev` atau build ulang.

## Koneksi ke Backend

Frontend (`localhost:5173`) dan backend (`localhost:8080`) berjalan di origin berbeda, sehingga backend **wajib** mengizinkan CORS dari origin frontend. Tanpa itu, browser akan memblokir request login dengan pesan `CORS Missing Allow Origin`.

Backend perlu mengembalikan:

- Header `Access-Control-Allow-Origin: http://localhost:5173`
- Header `Access-Control-Allow-Methods` yang mencakup `GET, POST, PUT, PATCH, DELETE, OPTIONS`
- Header `Access-Control-Allow-Headers` yang mencakup `Content-Type, Authorization`
- Respons `204` untuk request `OPTIONS` (preflight)

### Format respons yang diharapkan

Frontend mengandalkan format berikut:

```json
{
  "success": true,
  "message": "Users retrieved",
  "data": [ ... ],
  "meta": { "page": 1, "per_page": 10, "total": 3 }
}
```

- `data` berupa object (detail) atau array (list).
- `meta` hanya ada pada endpoint list yang mendukung paginasi. Jika tidak ada, tabel menampilkan semua data tanpa navigasi halaman.
- Login mengembalikan `data.token` berupa string JWT. Payload JWT berisi `username`, `role`, dan `permissions` untuk ditampilkan di sidebar.
- Format error belum dibakukan. Frontend membaca `message` atau `error` dari body respons, lalu jika tidak ada, menampilkan pesan dari axios.

### Endpoint yang digunakan

| Modul | Endpoint |
|---|---|
| Auth | `POST /api/v1/auth/login` |
| Health | `GET /health` |
| Users | `/api/v1/users` (CRUD) |
| Roles | `/api/v1/roles` (CRUD) |
| Products | `/api/v1/products` (CRUD) |
| Kategori produk | `/api/v1/product-categories` (CRUD) |
| Satuan | `/api/v1/units` (CRUD) |
| Customers | `/api/v1/customers` (CRUD) |
| Suppliers | `/api/v1/suppliers` (CRUD) |
| Purchase order | `/api/v1/purchase-orders` (list, detail, create, update, `PATCH /{id}/status`) |
| Goods receipt | `/api/v1/goods-receipts` (list, detail, create) |
| Saldo stok | `GET /api/v1/inventory` |
| Pergerakan stok | `GET /api/v1/inventory/movements` |
| Penyesuaian stok | `POST /api/v1/inventory/adjustments` |
| Sales order | `/api/v1/sales-orders` (list, detail, create, update, `PATCH /{id}/status`) |
| Chart of accounts | `/api/v1/accounts` (list, detail, create, update) |
| Jurnal umum | `/api/v1/journal-entries` (list, detail, create) |
| Pembayaran | `/api/v1/payments` (list, detail, create) |
| Hutang / piutang | `GET /api/v1/accounts-payable`, `GET /api/v1/accounts-receivable` |
| Laporan | `GET /api/v1/reports/{slug}?start_date=&end_date=` |

Slug laporan: `sales`, `purchases`, `inventory`, `stock-movements`, `accounts-payable`, `accounts-receivable`, `cash-flow`, `profit-loss`, `balance-sheet`.

### Hak akses (permission)

Frontend tidak memakai permission untuk menyembunyikan tombol. Semua tombol tampil untuk semua user, dan backend yang menolak request jika user tidak punya izin. Permission dipakai backend:

| Permission | Dipakai untuk |
|---|---|
| `users:read/create/update/delete` | Pengguna |
| `roles:read/create/update/delete` | Role |
| `products:read/create/update/delete` | Produk, kategori, satuan |
| `customers:read/create/update/delete` | Pelanggan |
| `suppliers:read/create/update/delete` | Supplier |
| `purchases:read/create/update` | Purchase order, goods receipt |
| `inventory:read/create` | Stok dan penyesuaian stok |
| `sales:read/create/update` | Sales order |
| `finance:read/create/update` | COA, jurnal, pembayaran, AP/AR |
| `reports:read` | Laporan |

## Catatan Pengembangan

- **Dropdown di form** mengambil data pilihan dengan `per_page=100`. Jika data referensi lebih dari 100 baris, sebagian opsi tidak muncul.
- **Progress bar** hanya menghitung request yang lewat instance `api`. Jika menambahkan request dengan `fetch` langsung, request itu tidak ikut dihitung.
- **Login** memakai token di `localStorage`. Ini praktis untuk pengembangan, tetapi pertimbangkan cookie `HttpOnly` jika aplikasi dipublikasikan.
- **Import CSS**: `src/index.css` hanya di-import sekali di `main.jsx`. Jangan import ulang di komponen lain.

## Rencana Pengembangan

- Pencarian dan filter pada tabel
- Validasi keseimbangan debit dan kredit pada jurnal umum
- Menyembunyikan tombol berdasarkan permission dari JWT
- Spinner pada tombol Masuk dan indikator loading untuk dropdown form
- Ekspor laporan ke PDF atau Excel
- Tampilan mobile yang lebih optimal

## Pemecahan Masalah

| Gejala | Penyebab umum | Solusi |
|---|---|---|
| `Failed to resolve import "lucide-react"` | Dependency belum terinstall | Jalankan `npm install lucide-react` di folder yang berisi `package.json` |
| `CORS Missing Allow Origin` di tab Network | Backend belum mengaktifkan CORS, atau container Docker masih memakai binary lama | Aktifkan middleware CORS, lalu build ulang image backend |
| `Network Error` saat login | Backend tidak berjalan, atau `VITE_API_BASE_URL` salah | Cek `curl http://localhost:8080/health` dan isi `.env` |
| Halaman kosong setelah refresh di `/reports` | Server development tidak mengenali route (jarang terjadi di Vite) | Pastikan membuka lewat `npm run dev`, bukan file HTML langsung |
| Tampilan berantakan setelah edit CSS | Ada style yang tertimpa saat menyalin file | Pastikan `src/index.css` berisi seluruh style, bukan potongan |

## Lisensi

Proyek ini dibuat untuk keperluan belajar dan pengembangan internal. Tambahkan lisensi sesuai kebutuhan.
