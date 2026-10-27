# ERP Kecil - Frontend

Frontend React untuk **Small ERP System**, aplikasi ERP sederhana untuk pengelolaan pengguna, master data, pengadaan, inventori, penjualan, keuangan, dan laporan. Aplikasi ini berkomunikasi dengan REST API berbasis Go (`/api/v1`) menggunakan autentikasi JWT.

## Daftar Isi

- [Fitur](#fitur)
- [Teknologi](#teknologi)
- [Struktur Proyek](#struktur-proyek)
- [Menjalankan Tanpa Docker](#menjalankan-tanpa-docker)
- [Menjalankan dengan Docker](#menjalankan-dengan-docker)
- [Konfigurasi](#konfigurasi)
- [Koneksi ke Backend](#koneksi-ke-backend)
- [Catatan Pengembangan](#catatan-pengembangan)
- [Pemecahan Masalah](#pemecahan-masalah)

## Fitur

- **Autentikasi**: login dengan username dan password. Token JWT disimpan di `localStorage`, dan user otomatis logout jika backend mengembalikan 401.
- **Dashboard**: status server dan jumlah data utama (user, produk, pelanggan, supplier, PO, SO).
- **Pengguna & Role**: CRUD user dan role, dengan pemilihan permission memakai checkbox.
- **Master Data**: produk, kategori produk, satuan (UOM), pelanggan, dan supplier.
- **Pengadaan**: purchase order (item dinamis dan ubah status) serta goods receipt.
- **Inventori**: saldo stok, riwayat pergerakan stok, dan penyesuaian stok.
- **Penjualan**: sales order (item dinamis dan ubah status).
- **Keuangan**: chart of accounts, jurnal umum, pembayaran, hutang (AP), dan piutang (AR).
- **Laporan**: penjualan, pembelian, inventori, pergerakan stok, hutang, piutang, arus kas, laba rugi, dan neraca, dengan filter tanggal.

### Pengalaman pengguna

- Sidebar bisa ditutup-buka (status tersimpan di `localStorage`), dan setiap modul bisa dilipat dengan animasi.
- Loading bertingkat: progress bar global, skeleton saat data pertama dimuat, tabel yang meredup saat refresh, dan spinner di tombol aksi.
- Halaman detail menampilkan header berwarna, badge status, ringkasan angka, kartu informasi, dan tabel item dengan baris total.
- Format otomatis: pemisah ribuan, nilai uang dalam Rupiah, dan tanggal format Indonesia.
- Animasi dinonaktifkan jika sistem operasi mengaktifkan "kurangi gerakan" (`prefers-reduced-motion`).

## Teknologi

| Kebutuhan | Pustaka / Alat |
|---|---|
| UI | React 18 |
| Build tool | Vite 5 |
| Routing | react-router-dom 6 |
| HTTP client | axios |
| Ikon | lucide-react |
| Styling | CSS biasa (`src/index.css`) |
| Container | Docker, Nginx 1.27 (Alpine), Node.js 20 (Alpine) |

## Struktur Proyek

```
erp-fe/
├── Dockerfile                # Build multi-tahap: Node untuk build, Nginx untuk menyajikan
├── docker-compose.yml        # Menjalankan container web di port 5173
├── nginx.conf                # Konfigurasi Nginx untuk SPA dan cache aset
├── .dockerignore             # File yang tidak ikut masuk ke image
├── index.html
├── vite.config.js
├── package.json
├── .env.example
└── src/
    ├── main.jsx              # Entry point, BrowserRouter, AuthProvider
    ├── App.jsx               # Definisi route dan proteksi login
    ├── index.css             # Seluruh style aplikasi
    ├── api/
    │   ├── client.js         # Instance axios, interceptor token dan 401
    │   └── loading.js        # Penghitung request untuk progress bar
    ├── config/
    │   └── resources.js      # Konfigurasi endpoint dan form semua modul
    ├── context/
    │   └── AuthContext.jsx   # State login, token, dan data user
    ├── components/
    │   ├── Layout.jsx        # Sidebar dan kerangka halaman
    │   ├── FormModal.jsx     # Form tambah/edit generik
    │   ├── DetailView.jsx    # Tampilan halaman detail
    │   ├── DataView.jsx      # Renderer generik (dipakai laporan)
    │   └── Loading.jsx       # Progress bar, skeleton, spinner
    └── pages/
        ├── Login.jsx
        ├── Dashboard.jsx
        ├── ResourcePage.jsx  # List dan detail semua modul
        └── ReportPage.jsx    # Daftar dan detail laporan
```

### Cara kerja konfigurasi modul

Sebagian besar modul tidak punya halaman sendiri. Semuanya dideskripsikan di `src/config/resources.js`:

- `path`: endpoint API.
- `fields`: field form tambah/edit. Tipe `select` mengambil pilihan dari resource lain lewat `optionsFrom`, dan tipe `lines` membuat daftar item dinamis.
- `create`, `update`, `remove`, `detail`, `list`: flag fitur yang tersedia untuk modul itu.
- `statuses`: daftar status yang bisa dipilih di halaman detail.

Untuk menambah modul baru, tambahkan entri di `resources` dan `menu`, lalu tambahkan icon di `Layout.jsx`.

## Menjalankan Tanpa Docker

### Persyaratan

- Node.js 18 atau lebih baru
- npm
- Backend Small ERP yang sudah berjalan (default `http://localhost:8080`)

### Langkah

```bash
cd erp-fe
cp .env.example .env      # isi VITE_API_BASE_URL jika perlu
npm install
npm run dev               # buka http://localhost:5173
```

Login dengan akun yang ada di backend, misalnya `admin` / `admin123` pada data contoh.

Untuk build produksi tanpa Docker:

```bash
npm run build             # hasil di folder dist/
npm run preview           # cek hasil build secara lokal
```

## Menjalankan dengan Docker

Docker menjalankan aplikasi dalam dua tahap:

1. **Build**: image `node:20-alpine` menginstall dependency dan menjalankan `npm run build`. Hasilnya berupa file statis di folder `dist/`.
2. **Serve**: image `nginx:1.27-alpine` hanya menyalin folder `dist/` dan menyajikannya di port 80. Node.js dan source code tidak ikut ke image akhir, sehingga ukurannya kecil.

Dengan cara ini, server yang berjalan di container hanya Nginx. Tidak ada proses Node.js saat aplikasi digunakan.

### Persyaratan

- Docker Engine 20.10 atau lebih baru, atau Docker Desktop
- Docker Compose v2 (perintah `docker compose`, bukan `docker-compose`)

Di Linux, pastikan user Anda masuk ke grup `docker` agar tidak perlu `sudo`:

```bash
sudo usermod -aG docker $USER
# logout lalu login lagi
```

### Perintah dasar

```bash
# Build image dan jalankan di background
docker compose up -d --build

# Buka di browser
#   http://localhost:5173

# Lihat log
docker compose logs -f web

# Cek status container
docker compose ps

# Hentikan dan hapus container
docker compose down
```

Gunakan `--build` setiap kali kode atau `.env` berubah. Tanpa flag itu, Compose memakai image lama.

### Update setelah ada perubahan kode

```bash
git pull                          # atau salin file baru ke folder ini
docker compose up -d --build
```

Container lama akan diganti otomatis. Jika ingin build tanpa cache, misalnya setelah mengubah dependency:

```bash
docker compose build --no-cache web
docker compose up -d web
```

### File Docker dan fungsinya

| File | Fungsi |
|---|---|
| `Dockerfile` | Dua tahap: build dengan Node, lalu sajikan dengan Nginx. Layer dependency di-cache agar build ulang lebih cepat. |
| `nginx.conf` | Semua path diarahkan ke `index.html` agar route seperti `/r/products` tidak 404 saat di-refresh. Aset ber-hash di-cache satu tahun. Gzip aktif. |
| `docker-compose.yml` | Mendefinisikan service `web`, port `5173:80`, build arg `VITE_API_BASE_URL`, dan `restart: unless-stopped`. |
| `.dockerignore` | Mengecualikan `node_modules`, `dist`, `.env`, dan `.git` dari build context. |

### Alamat backend saat build

Vite menyimpan nilai `VITE_*` ke dalam bundle saat build, bukan saat container berjalan. Karena itu:

- `.env` **tidak** ikut masuk ke image (sudah dikecualikan di `.dockerignore`).
- Compose membaca `VITE_API_BASE_URL` dari file `.env` di folder yang sama untuk diteruskan sebagai build arg. Jika tidak ada, nilainya `http://localhost:8080`.
- Jika alamat backend berubah, jalankan ulang `docker compose up -d --build`. Mengubah `.env` saja tidak cukup.

Contoh `.env` untuk Docker:

```env
VITE_API_BASE_URL=http://localhost:8080
```

### Port dan CORS

Port host `5173` dipetakan ke port `80` di container. Browser akan melihat origin `http://localhost:5173`, sama dengan origin pengembangan lokal (`npm run dev`). Karena itu backend **tidak perlu** mengubah konfigurasi CORS.

Jika port host diubah, misalnya `8081:80`, origin berubah menjadi `http://localhost:8081`. Backend harus mengizinkan origin baru itu di middleware CORS.

### Menjalankan tanpa Compose

```bash
docker build --build-arg VITE_API_BASE_URL=http://localhost:8080 -t erp-fe .
docker run -d --name erp-fe -p 5173:80 --restart unless-stopped erp-fe
```

Hentikan dan hapus container:

```bash
docker stop erp-fe && docker rm erp-fe
```

### Memverifikasi container

```bash
# Halaman utama harus mengembalikan 200
curl -I http://localhost:5173

# Route SPA harus tetap mengembalikan index.html, bukan 404
curl -I http://localhost:5173/r/products
```

Di browser, buka `http://localhost:5173/reports/sales`, lalu tekan `F5`. Halaman harus tetap tampil.

### Masuk ke dalam container

```bash
docker compose exec web sh
ls /usr/share/nginx/html        # isi hasil build
cat /etc/nginx/conf.d/default.conf
```

### Produksi

Konfigurasi ini cocok untuk pengujian internal atau server kecil. Untuk penggunaan publik:

- Letakkan reverse proxy (Nginx, Caddy, atau Traefik) di depan container untuk HTTPS dan domain.
- Gunakan domain asli sebagai `VITE_API_BASE_URL` dan tambahkan origin domain tersebut ke CORS backend.
- Pertimbangkan cookie `HttpOnly` untuk token, karena saat ini token disimpan di `localStorage`.

## Konfigurasi

| Variabel | Default | Dibaca saat | Keterangan |
|---|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:8080` | Build | Alamat dasar backend API |

Variabel dengan prefix `VITE_` harus diisi sebelum build. Mengubahnya setelah container berjalan tidak berpengaruh.

## Koneksi ke Backend

Frontend (`localhost:5173`) dan backend (`localhost:8080`) berjalan di origin berbeda. Backend **wajib** mengizinkan CORS dari origin frontend. Tanpa itu, browser memblokir request login dengan pesan `CORS Missing Allow Origin`.

Backend perlu mengembalikan:

- `Access-Control-Allow-Origin: http://localhost:5173`
- `Access-Control-Allow-Methods` yang mencakup `GET, POST, PUT, PATCH, DELETE, OPTIONS`
- `Access-Control-Allow-Headers` yang mencakup `Content-Type, Authorization`
- Status `204` untuk request `OPTIONS` (preflight)

Browser memanggil API langsung dari komputer Anda, bukan dari dalam container. Karena itu `VITE_API_BASE_URL` harus berisi alamat yang bisa dijangkau dari browser (misalnya `localhost:8080`), bukan nama service Docker seperti `http://api:8080`.

### Format respons yang diharapkan

```json
{
  "success": true,
  "message": "Users retrieved",
  "data": [ ... ],
  "meta": { "page": 1, "per_page": 10, "total": 3 }
}
```

- `data` berupa object (detail) atau array (list).
- `meta` hanya ada pada list yang mendukung paginasi. Jika tidak ada, tabel menampilkan semua data tanpa navigasi halaman.
- Login mengembalikan `data.token` berupa string JWT. Payload JWT berisi `username`, `role`, dan `permissions`.
- Pesan error dibaca dari `message` atau `error` di body respons.

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

### Permission

Frontend tidak menyembunyikan tombol berdasarkan permission. Semua tombol tampil untuk semua user, dan backend yang menolak request jika user tidak berhak.

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

- **Dropdown di form** mengambil pilihan dengan `per_page=100`. Jika data referensi lebih dari 100 baris, sebagian opsi tidak muncul.
- **Progress bar** hanya menghitung request yang lewat instance `api`. Request dengan `fetch` langsung tidak ikut dihitung.
- **Token** disimpan di `localStorage`. Ini praktis untuk pengembangan, tetapi pertimbangkan cookie `HttpOnly` untuk produksi.
- **CSS**: `src/index.css` hanya di-import sekali di `main.jsx`. Jangan import ulang di komponen lain.

## Rencana Pengembangan

- Pencarian dan filter pada tabel
- Validasi keseimbangan debit dan kredit pada jurnal umum
- Menyembunyikan tombol berdasarkan permission dari JWT
- Spinner di tombol Masuk dan indikator loading untuk dropdown form
- Ekspor laporan ke PDF atau Excel
- Health check container (`HEALTHCHECK` di Dockerfile)

## Pemecahan Masalah

### Masalah umum frontend

| Gejala | Penyebab | Solusi |
|---|---|---|
| `Failed to resolve import "lucide-react"` | Dependency belum terinstall | Jalankan `npm install lucide-react` di folder yang berisi `package.json` |
| `CORS Missing Allow Origin` di tab Network | Backend belum mengizinkan origin frontend | Aktifkan middleware CORS di backend, lalu build ulang image backend |
| `Network Error` saat login | Backend tidak berjalan, atau `VITE_API_BASE_URL` salah | Cek `curl http://localhost:8080/health`, lalu periksa `.env` |
| Tampilan berantakan setelah edit CSS | Potongan file CSS tertimpa | Pastikan `src/index.css` berisi seluruh style |

### Masalah Docker

| Gejala | Penyebab | Solusi |
|---|---|---|
| `port is already allocated` atau `bind: address already in use` | Port 5173 dipakai proses lain | Cek dengan `sudo lsof -i :5173`, lalu hentikan prosesnya, atau ubah mapping jadi `"5174:80"` |
| Perubahan kode tidak muncul | Image lama masih dipakai | Jalankan `docker compose up -d --build` |
| Perubahan `.env` tidak berpengaruh | Nilai `VITE_*` ditanam saat build | Jalankan `docker compose up -d --build` |
| Halaman kosong atau aset 404 | Build gagal, folder `dist` tidak terbentuk | Jalankan `docker compose build web` dan periksa error-nya |
| Refresh di `/r/products` menghasilkan 404 | `nginx.conf` tidak ter-copy | Pastikan `COPY nginx.conf` ada di `Dockerfile`, lalu build ulang |
| Login gagal dengan `Network Error` padahal backend hidup | `VITE_API_BASE_URL` berisi nama host Docker (`api:8080`) | Ganti dengan `http://localhost:8080`, lalu build ulang |
| `permission denied while trying to connect to the Docker daemon` | User belum masuk grup `docker` | Jalankan `sudo usermod -aG docker $USER`, lalu login ulang |
| `npm ci` gagal di tahap build | `package-lock.json` tidak sinkron dengan `package.json` | Jalankan `npm install` di lokal untuk memperbarui lock file, lalu build ulang |
| Build lambat setiap kali | Layer dependency ikut berubah | Pastikan `COPY package*.json` dijalankan sebelum `COPY . .` (sudah benar di Dockerfile) |

Untuk melihat log container:

```bash
docker compose logs --tail=100 web
```

## Lisensi

Proyek ini dibuat untuk keperluan belajar dan pengembangan internal. Tambahkan lisensi sesuai kebutuhan.
