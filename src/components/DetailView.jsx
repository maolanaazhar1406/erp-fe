import { CalendarDays, Clock } from 'lucide-react';
import { label } from './DataView';

const HERO_TITLE_KEYS = ['po_number', 'so_number', 'gr_number', 'entry_number', 'payment_number', 'code', 'name', 'username', 'title'];
const MONEY = /(price|amount|total|cost|debit|credit|balance|value)/i;
const SKIP = new Set(['id', 'status', 'created_at', 'updated_at']);
const HIDE_COL = /^id$|_id$|^created_|^updated_/;
const ISO_DT = /^\d{4}-\d{2}-\d{2}T/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

const STATUS_COLORS = {
    draft: '#64748b', confirmed: '#2563eb', received: '#059669',
    delivered: '#059669', paid: '#059669', cancelled: '#dc2626',
};

const PALETTE = ['#2563eb', '#7c3aed', '#0891b2', '#059669', '#dc2626', '#d97706', '#db2777', '#4f46e5'];
export const colorFor = key => PALETTE[[...key].reduce((s, c) => s + c.charCodeAt(0), 0) % PALETTE.length];

const isObj = v => v !== null && typeof v === 'object' && !Array.isArray(v);
const isRowArr = v => Array.isArray(v) && v.length > 0 && v.every(isObj);
const money = v => `Rp ${Number(v).toLocaleString('id-ID')}`;

function fmtValue(k, v) {
    if (v === null || v === undefined || v === '') return '-';
    if (typeof v === 'boolean') return v ? 'Ya' : 'Tidak';
    if (typeof v === 'number') return MONEY.test(k) ? money(v) : v.toLocaleString('id-ID');
    if (typeof v === 'string' && ISO_DT.test(v)) {
        return new Date(v).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
    }
    if (typeof v === 'string' && DATE.test(v)) {
        return new Date(v + 'T00:00:00').toLocaleDateString('id-ID', { dateStyle: 'long' });
    }
    return String(v);
}

function Pill({ on }) {
    return <span className={`pill ${on ? 'ok' : 'off'}`}>{on ? 'Ya' : 'Tidak'}</span>;
}

function Tiles({ items }) {
    return (
        <div className="dv-grid">
            {items.map(([k, v]) => (
                <div className="dv-tile" key={k}>
                    <span>{label(k)}</span>
                    {typeof v === 'boolean' ? <Pill on={v} /> : <b>{fmtValue(k, v)}</b>}
                </div>
            ))}
        </div>
    );
}

function ItemTable({ rows }) {
    const keys = Object.keys(rows[0]).filter(k => {
        const v = rows[0][k];
        return !isObj(v) && !Array.isArray(v) && !HIDE_COL.test(k);
    });
    const totalKey = keys.find(k => /^total/i.test(k));
    const total = totalKey ? rows.reduce((s, r) => s + Number(r[totalKey] || 0), 0) : null;

    return (
        <div className="table-wrap">
            <table className="dv-table">
                <thead>
                    <tr>{keys.map(k => <th key={k}>{label(k)}</th>)}</tr>
                </thead>
                <tbody>
                    {rows.map((r, i) => (
                        <tr key={i}>{keys.map(k => <td key={k}>{fmtValue(k, r[k])}</td>)}</tr>
                    ))}
                </tbody>
                {total !== null && (
                    <tfoot>
                        <tr>
                            {keys.map((k, i) => (
                                <td key={k}>
                                    {i === 0 ? <b>Total</b> : k === totalKey ? <b>{money(total)}</b> : ''}
                                </td>
                            ))}
                        </tr>
                    </tfoot>
                )}
            </table>
        </div>
    );
}

export default function DetailView({ data, color = '#2563eb' }) {
    const titleKey = HERO_TITLE_KEYS.find(k => data[k]);
    const title = titleKey ? data[titleKey] : `#${data.id}`;
    const entries = Object.entries(data);

    const scalars = entries.filter(([k, v]) => !isObj(v) && !Array.isArray(v) && !SKIP.has(k) && k !== titleKey);
    const metrics = scalars.filter(([k, v]) => typeof v === 'number' && MONEY.test(k)).slice(0, 3);
    const metricKeys = new Set(metrics.map(([k]) => k));
    const info = scalars.filter(([k]) => !metricKeys.has(k));
    const nested = entries.filter(([, v]) => isObj(v));
    const lists = entries.filter(([, v]) => isRowArr(v));

    return (
        <div className="dv">
            <div className="dv-hero" style={{ '--c': color }}>
                <div>
                    <div className="dv-kicker">#{data.id}</div>
                    <h2>{title}</h2>
                    {data.status && (
                        <span className="badge" style={{ '--b': STATUS_COLORS[data.status] || '#64748b' }}>
                            {data.status}
                        </span>
                    )}
                </div>
                {metrics.length > 0 && (
                    <div className="dv-metrics">
                        {metrics.map(([k, v]) => (
                            <div key={k}><span>{label(k)}</span><b>{fmtValue(k, v)}</b></div>
                        ))}
                    </div>
                )}
            </div>

            {info.length > 0 && (
                <section className="dv-section">
                    <h4>Informasi</h4>
                    <Tiles items={info} />
                </section>
            )}

            {nested.map(([k, v]) => (
                <section className="dv-section" key={k}>
                    <h4>{label(k)}</h4>
                    <Tiles items={Object.entries(v).filter(([, x]) => !isObj(x) && !Array.isArray(x))} />
                </section>
            ))}

            {lists.map(([k, v]) => (
                <section className="dv-section" key={k}>
                    <h4>{label(k)} <span className="count">{v.length}</span></h4>
                    <ItemTable rows={v} />
                </section>
            ))}

            <div className="dv-meta">
                {data.created_at && <span><Clock size={14} /> Dibuat {fmtValue('created_at', data.created_at)}</span>}
                {data.updated_at && <span><CalendarDays size={14} /> Diubah {fmtValue('updated_at', data.updated_at)}</span>}
            </div>
        </div>
    );
}