import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ArrowLeft, Printer } from 'lucide-react';
import { api, errMsg } from '../api/client';
import { resources } from '../config/resources';
import { formatDate } from '../utils/date';

// Ganti dengan data perusahaan Anda
const COMPANY = { name: 'PT Small ERP Indonesia', address: 'Jl. Contoh No. 1, Jakarta', phone: '021-000000' };

const rp = n => `Rp ${Number(n || 0).toLocaleString('id-ID')}`;

const DOCS = {
    'purchase-orders': {
        title: 'Purchase Order', no: 'po_number', partyLabel: 'Supplier', party: 'supplier_name',
        meta: d => [['Tanggal order', formatDate(d.order_date)], ['Status', d.status]],
        items: d => d.items || [],
        total: d => d.total_amount,
    },
    'sales-orders': {
        title: 'Sales Order', no: 'so_number', partyLabel: 'Pelanggan', party: 'customer_name',
        meta: d => [['Tanggal order', formatDate(d.order_date)], ['Status', d.status]],
        items: d => d.items || [],
        total: d => d.total_amount,
    },
    payments: {
        title: 'Bukti Pembayaran', no: 'payment_number', partyLabel: 'Referensi', party: 'number',
        meta: d => [
            ['Jenis', d.payment_type === 'receivable' ? 'Penerimaan' : 'Pengeluaran'],
            ['Tanggal bayar', formatDate(d.payment_date)],
            ['Metode', d.payment_method],
        ],
        items: () => [],
        total: d => d.amount,
    },
};

export default function PrintDocument() {
    const { key, id } = useParams();
    const cfg = DOCS[key];
    const [d, setD] = useState(null);
    const [err, setErr] = useState('');

    useEffect(() => {
        if (!cfg) return;
        api.get(`${resources[key].path}/${id}`)
            .then(({ data }) => setD(data.data))
            .catch(e => setErr(errMsg(e)));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [key, id]);

    if (!cfg) return <p style={{ padding: 24 }}>Dokumen ini tidak bisa dicetak.</p>;
    if (err) return <p style={{ padding: 24 }} className="error">{err}</p>;
    if (!d) return <p style={{ padding: 24 }}>Memuat dokumen...</p>;

    const items = cfg.items(d);
    const sumItems = items.reduce((s, it) => s + Number(it.total_price ?? it.quantity * it.unit_price), 0);
    const total = Number(cfg.total(d) ?? sumItems);

    return (
        <div className="print-wrap">
            <div className="print-bar no-print">
                <button className="ghost" onClick={() => window.close()}><ArrowLeft size={15} /> Tutup</button>
                <button onClick={() => window.print()}><Printer size={15} /> Cetak / Simpan PDF</button>
            </div>

            <article className="sheet">
                <header className="sheet-head">
                    <div>
                        <h1>{COMPANY.name}</h1>
                        <p>{COMPANY.address}<br />Telp. {COMPANY.phone}</p>
                    </div>
                    <div className="sheet-title">
                        <h2>{cfg.title}</h2>
                        <b>{d[cfg.no]}</b>
                    </div>
                </header>

                <section className="sheet-meta">
                    <div><span>{cfg.partyLabel}</span><b>{d[cfg.party] || '-'}</b></div>
                    {cfg.meta(d).map(([k, v]) => (
                        <div key={k}><span>{k}</span><b>{v || '-'}</b></div>
                    ))}
                </section>

                {items.length > 0 && (
                    <table className="sheet-table">
                        <thead>
                            <tr>
                                <th>No</th><th>Produk</th><th className="r">Qty</th><th className="r">Harga</th><th className="r">Subtotal</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((it, i) => (
                                <tr key={i}>
                                    <td>{i + 1}</td>
                                    <td>{it.product_name || `#${it.product_id}`}</td>
                                    <td className="r">{it.quantity}</td>
                                    <td className="r">{rp(it.unit_price)}</td>
                                    <td className="r">{rp(it.total_price ?? it.quantity * it.unit_price)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                <div className="sheet-total"><span>Total</span><b>{rp(total)}</b></div>
                {d.notes && <p className="sheet-notes"><b>Catatan:</b> {d.notes}</p>}

                <footer className="sheet-sign">
                    <div><span>Dibuat oleh</span></div>
                    <div><span>Disetujui oleh</span></div>
                </footer>
            </article>
        </div>
    );
}