// Format tanggal: 29-okt-2026 (tanpa jam)
const BULAN = ['jan', 'feb', 'mar', 'apr', 'mei', 'jun', 'jul', 'agu', 'sep', 'okt', 'nov', 'des'];
const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;
const DATETIME = /^\d{4}-\d{2}-\d{2}T/;

// Mengembalikan string tanggal, atau null jika `v` bukan tanggal
export function formatDate(v) {
    if (typeof v !== 'string') return null;

    let y, m, d;
    const only = DATE_ONLY.exec(v);
    if (only) {
        // Tanggal saja (misalnya 2024-01-15): dibaca langsung agar tidak bergeser zona waktu
        [, y, m, d] = only;
    } else if (DATETIME.test(v)) {
        // Tanggal dan jam (ISO): diubah ke zona waktu lokal, jamnya dibuang
        const dt = new Date(v);
        if (isNaN(dt)) return null;
        y = dt.getFullYear();
        m = dt.getMonth() + 1;
        d = dt.getDate();
    } else {
        return null;
    }

    return `${String(d).padStart(2, '0')}-${BULAN[Number(m) - 1]}-${y}`;
}