import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft, Calendar, ChevronRight, TrendingUp, ShoppingBag, Warehouse,
  ArrowLeftRight, Receipt, Wallet, Banknote, BarChart3, Scale,
} from 'lucide-react';
import { api, errMsg } from '../api/client';
import { reports } from '../config/resources';
import DataView, { fmt, label } from '../components/DataView';
import { SkeletonTable, Spinner, useDelayed } from '../components/Loading';
import { useAuth } from '../context/AuthContext';
import Forbidden from '../components/Forbidden';
import ExportMenu from '../components/ExportMenu';
import { exportCSV, exportXLSX } from '../utils/export';

const META = {
  sales: { icon: TrendingUp, color: '#2563eb', desc: 'Ringkasan order penjualan dan pendapatan' },
  purchases: { icon: ShoppingBag, color: '#7c3aed', desc: 'Ringkasan pembelian dari supplier' },
  inventory: { icon: Warehouse, color: '#0891b2', desc: 'Posisi saldo stok seluruh produk' },
  'stock-movements': { icon: ArrowLeftRight, color: '#059669', desc: 'Keluar-masuk stok per periode' },
  'accounts-payable': { icon: Receipt, color: '#dc2626', desc: 'Daftar hutang ke supplier' },
  'accounts-receivable': { icon: Wallet, color: '#d97706', desc: 'Daftar piutang dari pelanggan' },
  'cash-flow': { icon: Banknote, color: '#16a34a', desc: 'Arus kas masuk dan keluar' },
  'profit-loss': { icon: BarChart3, color: '#db2777', desc: 'Pendapatan dikurangi beban' },
  'balance-sheet': { icon: Scale, color: '#4f46e5', desc: 'Aset, liabilitas, dan ekuitas' },
};

const today = () => new Date().toISOString().slice(0, 10);
const isObj = v => v !== null && typeof v === 'object' && !Array.isArray(v);

export default function ReportPage() {
  const { slug } = useParams();
  const { can } = useAuth();
  if (!can('reports:read')) return <Forbidden />;
  const report = reports.find(x => x.slug === slug);
  return report ? <Detail key={slug} report={report} /> : <Index />;
}

function Index() {
  return (
    <>
      <div className="page-head">
        <h2>Laporan</h2>
        <p className="muted">Pilih laporan untuk melihat data</p>
      </div>
      <div className="report-grid">
        {reports.map((r, i) => {
          const m = META[r.slug] || {};
          const Icon = m.icon || BarChart3;
          return (
            <Link
              key={r.slug}
              to={`/reports/${r.slug}`}
              className="report-card"
              style={{ '--c': m.color || '#2563eb', '--d': `${i * 60}ms` }}
            >
              <div className="report-icon"><Icon size={22} /></div>
              <div>
                <h4>{r.title}</h4>
                <p className="muted">{m.desc}</p>
              </div>
              <ChevronRight size={18} className="report-arrow" />
            </Link>
          );
        })}
      </div>
    </>
  );
}

function Detail({ report }) {
  const [start, setStart] = useState(`${new Date().getFullYear()}-01-01`);
  const [end, setEnd] = useState(today());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const busy = useDelayed(loading, 200);
  const m = META[report.slug] || {};
  const Icon = m.icon || BarChart3;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setErr('');
    api.get(`/api/v1/reports/${report.slug}`, { params: { start_date: start, end_date: end } })
      .then(({ data }) => { if (!cancelled) setData(data.data); })
      .catch(e => {
        if (cancelled) return;
        setErr(errMsg(e));
        setData(null);
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [report.slug, start, end]);

  const summary = isObj(data?.summary)
    ? Object.entries(data.summary).filter(([, v]) => v === null || typeof v !== 'object')
    : [];
  const rest = isObj(data)
    ? Object.fromEntries(Object.entries(data).filter(([k]) => k !== 'summary'))
    : data;
  // Setiap tabel di laporan menjadi satu sheet Excel. CSV hanya memuat tabel utama.
  const exportReport = async fmt => {
    const sheets = [];
    if (isObj(data?.summary)) {
      sheets.push({
        name: 'Ringkasan',
        rows: [data.summary],
        columns: Object.keys(data.summary).map(k => ({ key: k, label: label(k) })),
      });
    }
    Object.entries(data || {}).forEach(([k, v]) => {
      if (k !== 'summary' && Array.isArray(v) && v.length && isObj(v[0])) {
        const columns = Object.keys(v[0])
          .filter(c => !isObj(v[0][c]))
          .map(c => ({ key: c, label: label(c) }));
        sheets.push({ name: label(k), rows: v, columns });
      }
    });
    if (!sheets.length) throw new Error('Tidak ada data untuk diekspor');

    if (fmt === 'xlsx') return exportXLSX(sheets, report.slug);
    const main = sheets.find(s => s.name !== 'Ringkasan') || sheets[0];
    return exportCSV(main.rows, main.columns, report.slug);
  };

  return (
    <>
      <div className="report-hero" style={{ '--c': m.color || '#2563eb' }}>
        <Link to="/reports" className="back"><ArrowLeft size={16} /> Semua laporan</Link>
        <div className="hero-main">
          <div className="report-icon hero-icon"><Icon size={28} /></div>
          <div>
            <h2>{report.title}</h2>
            <p>{m.desc}</p>
          </div>
        </div>
      </div>

      <div className="card filter-bar">
        <Calendar size={18} className="muted" />
        <input type="date" value={start} onChange={e => setStart(e.target.value)} />
        <span className="muted">s/d</span>
        <input type="date" value={end} onChange={e => setEnd(e.target.value)} />
        <ExportMenu onExport={exportReport} disabled={!data} />
        {busy && <Spinner size={16} />}
      </div>

      {err && <div className="card error">{err}</div>}

      {!data && busy && (
        <>
          <div className="stat-grid">
            {Array.from({ length: 4 }).map((_, i) => (
              <div className="stat-tile" key={i}>
                <span className="skeleton" style={{ width: '60%' }} />
                <span className="skeleton" style={{ width: '40%', height: 20 }} />
              </div>
            ))}
          </div>
          <div className="card"><SkeletonTable rows={5} cols={4} /></div>
        </>
      )}

      {summary.length > 0 && (
        <div className={`stat-grid${busy ? ' dimmed' : ''}`}>
          {summary.map(([k, v], i) => (
            <div className="stat-tile" key={k} style={{ '--d': `${i * 60}ms` }}>
              <span className="muted">{label(k)}</span>
              <b>{fmt(v)}</b>
            </div>
          ))}
        </div>
      )}

      {rest && (
        <div className={`card${busy ? ' dimmed' : ''}`}>
          <DataView data={rest} />
        </div>
      )}
    </>
  );
}