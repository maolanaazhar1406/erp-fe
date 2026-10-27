// Konfigurasi semua endpoint dari Postman collection.
// Setiap resource otomatis mendapat halaman list, detail, tambah, edit, hapus
// sesuai flag yang diisi di sini.
//
// Tipe field: text | number | date | email | password | textarea | select | permissions | lines
//  - select: pakai optionsFrom (key resource lain) atau options (array string statis)
//  - lines : daftar baris item (dengan fields di dalamnya), untuk PO, SO, GR, jurnal
//  - only  : 'create' | 'edit' -> field hanya tampil saat tambah/edit

// const PO_STATUS = ['draft', 'confirmed', 'received'];
// const SO_STATUS = ['draft', 'confirmed', 'delivered'];

const PO_STATUS = ['confirmed'];
const SO_STATUS = ['confirmed', 'delivered'];

export const resources = {
  users: {
    title: 'Pengguna', path: '/api/v1/users', detail: true, create: true, update: true, remove: true,
    fields: [
      { name: 'username', label: 'Username', required: true },
      { name: 'full_name', label: 'Nama lengkap' },
      { name: 'email', label: 'Email', type: 'email' },
      { name: 'password', label: 'Password', type: 'password', required: true, only: 'create' },
      { name: 'role_id', label: 'Role', type: 'select', optionsFrom: 'roles', required: true },
    ],
  },
  roles: {
    title: 'Role', path: '/api/v1/roles', detail: true, create: true, update: true, remove: true,
    fields: [
      { name: 'name', label: 'Nama role', required: true },
      { name: 'description', label: 'Deskripsi', type: 'textarea' },
      { name: 'permissions', label: 'Permission', type: 'permissions' },
    ],
  },
  products: {
    title: 'Produk', path: '/api/v1/products', detail: true, create: true, update: true, remove: true,
    fields: [
      { name: 'code', label: 'Kode', required: true },
      { name: 'name', label: 'Nama', required: true },
      { name: 'description', label: 'Deskripsi', type: 'textarea' },
      { name: 'category_id', label: 'Kategori', type: 'select', optionsFrom: 'product-categories', required: true },
      { name: 'unit_id', label: 'Satuan', type: 'select', optionsFrom: 'units', required: true },
      { name: 'price', label: 'Harga', type: 'number', required: true },
    ],
  },
  'product-categories': {
    title: 'Kategori Produk', path: '/api/v1/product-categories', detail: true, create: true, update: true, remove: true,
    fields: [
      { name: 'name', label: 'Nama', required: true },
      { name: 'description', label: 'Deskripsi', type: 'textarea' },
    ],
  },
  units: {
    title: 'Satuan (UOM)', path: '/api/v1/units', detail: true, create: true, update: true, remove: true,
    fields: [
      { name: 'name', label: 'Nama', required: true },
      { name: 'abbreviation', label: 'Singkatan', required: true },
    ],
  },
  customers: {
    title: 'Pelanggan', path: '/api/v1/customers', detail: true, create: true, update: true, remove: true,
    fields: [
      { name: 'name', label: 'Nama', required: true },
      { name: 'code', label: 'Kode' },
      { name: 'email', label: 'Email', type: 'email' },
      { name: 'phone', label: 'Telepon' },
      { name: 'address', label: 'Alamat', type: 'textarea' },
    ],
  },
  suppliers: {
    title: 'Supplier', path: '/api/v1/suppliers', detail: true, create: true, update: true, remove: true,
    fields: [
      { name: 'name', label: 'Nama', required: true },
      { name: 'code', label: 'Kode' },
      { name: 'email', label: 'Email', type: 'email' },
      { name: 'phone', label: 'Telepon' },
      { name: 'address', label: 'Alamat', type: 'textarea' },
    ],
  },
  accounts: {
    title: 'Chart of Accounts', path: '/api/v1/accounts', detail: true, create: true, update: true,
    fields: [
      { name: 'code', label: 'Kode', required: true, only: 'create' },
      { name: 'name', label: 'Nama akun', required: true },
      { name: 'account_type', label: 'Tipe', type: 'select', options: ['asset', 'liability', 'equity', 'revenue', 'expense'], required: true, only: 'create' },
      { name: 'parent_id', label: 'Induk akun', type: 'select', optionsFrom: 'accounts', only: 'create' },
    ],
  },
  'purchase-orders': {
    title: 'Purchase Order', path: '/api/v1/purchase-orders', detail: true, create: true, update: true, statuses: PO_STATUS,
    fields: [
      { name: 'supplier_id', label: 'Supplier', type: 'select', optionsFrom: 'suppliers', required: true },
      { name: 'order_date', label: 'Tanggal order', type: 'date', required: true },
      { name: 'notes', label: 'Catatan', type: 'textarea' },
      {
        name: 'items', label: 'Item', type: 'lines',
        fields: [
          { name: 'product_id', label: 'Produk', type: 'select', optionsFrom: 'products', required: true },
          { name: 'quantity', label: 'Qty', type: 'number', required: true },
          { name: 'unit_price', label: 'Harga satuan', type: 'number', required: true },
        ],
      },
    ],
  },
  'goods-receipts': {
    title: 'Goods Receipt', path: '/api/v1/goods-receipts', detail: true, create: true,
    fields: [
      {
        name: 'po_id', label: 'Purchase Order', type: 'select', optionsFrom: 'purchase-orders', optionLabel: 'po_number', required: true,
        // Saat PO dipilih, ambil detailnya dan isi otomatis baris "items"
        onSelect: {
          path: '/api/v1/purchase-orders',
          target: 'items',
          map: po => (po.items || []).map(it => ({
            po_item_id: it.id,
            product_id: it.product_id,
            quantity_received: it.quantity,
          })),
        },
      },
      { name: 'receipt_date', label: 'Tanggal terima', type: 'date', required: true },
      { name: 'notes', label: 'Catatan', type: 'textarea' },
      {
        name: 'items', label: 'Item diterima', type: 'lines',
        fields: [
          { name: 'po_item_id', label: 'ID item PO', type: 'number', required: true },
          { name: 'product_id', label: 'Produk', type: 'select', optionsFrom: 'products', required: true },
          { name: 'quantity_received', label: 'Qty diterima', type: 'number', required: true },
        ],
      },
    ],
  },
  inventory: { title: 'Saldo Stok', path: '/api/v1/inventory' },
  'stock-movements': { title: 'Pergerakan Stok', path: '/api/v1/inventory/movements' },
  'stock-adjustments': {
    title: 'Penyesuaian Stok', path: '/api/v1/inventory/adjustments', list: false, create: true,
    fields: [
      { name: 'product_id', label: 'Produk', type: 'select', optionsFrom: 'products', required: true },
      { name: 'quantity', label: 'Qty (negatif = kurang)', type: 'number', required: true },
      { name: 'reason', label: 'Alasan', required: true },
    ],
  },
  'sales-orders': {
    title: 'Sales Order', path: '/api/v1/sales-orders', detail: true, create: true, update: true, statuses: SO_STATUS,
    fields: [
      { name: 'customer_id', label: 'Pelanggan', type: 'select', optionsFrom: 'customers', required: true },
      { name: 'order_date', label: 'Tanggal order', type: 'date', required: true },
      { name: 'notes', label: 'Catatan', type: 'textarea' },
      {
        name: 'items', label: 'Item', type: 'lines',
        fields: [
          { name: 'product_id', label: 'Produk', type: 'select', optionsFrom: 'products', required: true },
          { name: 'quantity', label: 'Qty', type: 'number', required: true },
          { name: 'unit_price', label: 'Harga satuan', type: 'number', required: true },
        ],
      },
    ],
  },
  'journal-entries': {
    title: 'Jurnal Umum', path: '/api/v1/journal-entries', detail: true, create: true,
    fields: [
      { name: 'entry_date', label: 'Tanggal', type: 'date', required: true },
      { name: 'description', label: 'Keterangan', required: true },
      { name: 'reference_type', label: 'Tipe referensi' },
      { name: 'reference_id', label: 'ID referensi', type: 'number' },
      {
        name: 'lines', label: 'Baris jurnal (total debit harus = kredit)', type: 'lines',
        fields: [
          { name: 'account_id', label: 'Akun', type: 'select', optionsFrom: 'accounts', required: true },
          { name: 'debit', label: 'Debit', type: 'number', default: 0 },
          { name: 'credit', label: 'Kredit', type: 'number', default: 0 },
          { name: 'description', label: 'Keterangan' },
        ],
      },
    ],
  },
  payments: {
    title: 'Pembayaran', path: '/api/v1/payments', detail: true, create: true,
    fields: [
      { name: 'payment_type', label: 'Jenis', type: 'select', options: ['receivable', 'payable'], required: true },
      { name: 'reference_id', label: 'ID referensi (SO/PO)', type: 'number', required: true },
      { name: 'amount', label: 'Jumlah', type: 'number', required: true },
      { name: 'payment_date', label: 'Tanggal bayar', type: 'date', required: true },
      { name: 'payment_method', label: 'Metode', default: 'bank_transfer' },
      { name: 'notes', label: 'Catatan', type: 'textarea' },
    ],
  },
  'accounts-payable': { title: 'Hutang (AP)', path: '/api/v1/accounts-payable' },
  'accounts-receivable': { title: 'Piutang (AR)', path: '/api/v1/accounts-receivable' },
};

export const reports = [
  { slug: 'sales', title: 'Laporan Penjualan' },
  { slug: 'purchases', title: 'Laporan Pembelian' },
  { slug: 'inventory', title: 'Laporan Inventori' },
  { slug: 'stock-movements', title: 'Laporan Pergerakan Stok' },
  { slug: 'accounts-payable', title: 'Laporan Hutang' },
  { slug: 'accounts-receivable', title: 'Laporan Piutang' },
  { slug: 'cash-flow', title: 'Arus Kas' },
  { slug: 'profit-loss', title: 'Laba Rugi' },
  { slug: 'balance-sheet', title: 'Neraca' },
];

export const menu = [
  { group: 'Pengguna', items: ['users', 'roles'] },
  { group: 'Master Data', items: ['products', 'product-categories', 'units', 'customers', 'suppliers'] },
  { group: 'Pengadaan', items: ['purchase-orders', 'goods-receipts'] },
  { group: 'Inventori', items: ['inventory', 'stock-movements', 'stock-adjustments'] },
  { group: 'Penjualan', items: ['sales-orders'] },
  { group: 'Keuangan', items: ['accounts', 'journal-entries', 'payments', 'accounts-payable', 'accounts-receivable'] },
];

// Pemetaan modul ke prefix permission backend (lihat router.go).
// Aksi dibentuk otomatis: `${PERM[key]}:read|create|update|delete`.
export const PERM = {
  users: 'users',
  roles: 'roles',
  products: 'products',
  'product-categories': 'products',
  units: 'products',
  customers: 'customers',
  suppliers: 'suppliers',
  'purchase-orders': 'purchases',
  'goods-receipts': 'purchases',
  inventory: 'inventory',
  'stock-movements': 'inventory',
  'stock-adjustments': 'inventory',
  'sales-orders': 'sales',
  accounts: 'finance',
  'journal-entries': 'finance',
  payments: 'finance',
  'accounts-payable': 'finance',
  'accounts-receivable': 'finance',
};

export const permFor = (key, action) => `${PERM[key]}:${action}`;