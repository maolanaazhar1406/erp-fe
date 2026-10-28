// Renderer generik: menampilkan object/array apa pun (laporan, dan fallback) sebagai tabel/key-value
import { formatDate } from '../utils/date';

const isObj = v => v !== null && typeof v === 'object';

export const label = k => k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

export const fmt = v => {
  if (v === null || v === undefined || v === '') return '-';
  if (typeof v === 'boolean') return v ? 'Ya' : 'Tidak';
  if (typeof v === 'number') return v.toLocaleString('id-ID');
  if (typeof v === 'string') {
    const d = formatDate(v);
    if (d) return d;
  }
  if (isObj(v)) return JSON.stringify(v);
  return String(v);
};

export function Table({ rows }) {
  if (!rows.length) return <p className="muted">Tidak ada data.</p>;
  const keys = [...new Set(rows.flatMap(r => Object.keys(r)))].filter(k => !rows.some(r => isObj(r[k])));
  return (
    <div className="table-wrap">
      <table>
        <thead><tr>{keys.map(k => <th key={k}>{label(k)}</th>)}</tr></thead>
        <tbody>
          {rows.map((r, i) => <tr key={i}>{keys.map(k => <td key={k}>{fmt(r[k])}</td>)}</tr>)}
        </tbody>
      </table>
    </div>
  );
}

export default function DataView({ data }) {
  if (Array.isArray(data)) {
    return data.every(isObj) ? <Table rows={data} /> : <p>{data.map(fmt).join(', ')}</p>;
  }
  if (isObj(data)) {
    return (
      <div>
        {Object.entries(data).map(([k, v]) =>
          isObj(v) ? (
            <section key={k} style={{ marginTop: 16 }}>
              <h4>{label(k)}</h4>
              <DataView data={v} />
            </section>
          ) : (
            <div className="kv" key={k}><span>{label(k)}</span><b>{fmt(v)}</b></div>
          )
        )}
      </div>
    );
  }
  return <p>{fmt(data)}</p>;
}