import { api } from '../api/client';

export const stamp = () => new Date().toISOString().slice(0, 10);

export function download(blob, name) {
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement('a'), { href: url, download: name });
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const cell = v => {
    if (v === null || v === undefined) return '';
    if (typeof v === 'object') return JSON.stringify(v);
    return v;
};

// Ambil semua halaman dari endpoint list, mengikuti meta.total
export async function fetchAll(path, params = {}) {
    const out = [];
    for (let page = 1; ; page++) {
        const { data } = await api.get(path, { params: { ...params, page, per_page: 100 } });
        const chunk = data.data || [];
        out.push(...chunk);
        if (!data.meta || out.length >= data.meta.total || chunk.length === 0) break;
    }
    return out;
}

// columns: [{ key, label }]
export function toRows(rows, columns) {
    return [columns.map(c => c.label), ...rows.map(r => columns.map(c => cell(r[c.key])))];
}

export function exportCSV(rows, columns, name) {
    const lines = toRows(rows, columns).map(line =>
        line.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')
    );
    // BOM di awal agar Excel membaca UTF-8 dengan benar
    download(
        new Blob(['\uFEFF' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' }),
        `${name}-${stamp()}.csv`
    );
}

// sheets: [{ name, rows, columns }]
export async function exportXLSX(sheets, name) {
    const XLSX = await import('xlsx');
    const wb = XLSX.utils.book_new();
    sheets.forEach(s => {
        const ws = XLSX.utils.aoa_to_sheet(toRows(s.rows, s.columns));
        XLSX.utils.book_append_sheet(wb, ws, s.name.slice(0, 31));
    });
    XLSX.writeFile(wb, `${name}-${stamp()}.xlsx`);
}