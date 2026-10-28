import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, Users, ClipboardList, ShoppingCart, AlertTriangle } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { resources } from '../config/resources';
import { formatDate } from '../utils/date';
import { label } from '../components/DataView';
import { SkeletonLines } from '../components/Loading';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const rp = n => `Rp ${Number(n || 0).toLocaleString('id-ID')}`;
const isMoney = k => /amount|total|price|sales|revenue|profit|balance|cost|value|debit|credit/i.test(k);
const safe = p => p.then(r => r.data).catch(() => null);

const greet = () => {
  const h = new Date().getHours();
  return h < 11 ? 'Selamat pagi' : h < 15 ? 'Selamat siang' : h < 18 ? 'Selamat sore' : 'Selamat malam';
};

// Susun total per bulan dari detail laporan penjualan (kolom tanggal dan total)
function buildMonthly(details) {
  const sums = Array(12).fill(0);
  (Array.isArray(details) ? details : []).forEach(row => {
    const dk = Object.keys(row).find(k => /date/i.test(k));
    const tk = Object.keys(row).find(k => /total|amount/i.test(k));
    if (!dk || !tk || !row[dk]) return;
    const d = new Date(String(row[dk]).slice(0, 10) + 'T00:00:00');
    if (!isNaN(d)) sums[d.getMonth()] += Number(row[tk]) || 0;
  });
  return MONTHS.map((lbl, i) => ({ label: lbl, value: sums[i] }));
}

export default function Dashboard() {
  const { user, can } = useAuth();
  const [kpi, setKpi] = useState(null);
  const [recent, setRecent] = useState({ so: [], po: [] });
  const [lowStock, setLowStock] = useState([]);
  const [monthly, setMonthly] = useState([]);
  const [summary, setSummary] = useState([]);

  useEffect(() => {
    const range = {
      start_date: `${new Date().getFullYear()}-01-01`,
      end_date: new Date().toISOString().slice(0, 10),
    };
    const count = k => safe(api.get(resources[k].path, { params: { page: 1, per_page: 1 } }))
      .then(b => b?.meta?.total ?? 0);
    const list = (path, params) => safe(api.get(path, { params })).then(b => b?.data || []);

    Promise.all([
      can('products:read') ? count('products') : 0,
      can('customers:read') ? count('customers') : 0,
      can('purchases:read') ? count('purchase-orders') : 0,
      can('sales:read') ? count('sales-orders') : 0,
      can('reports:read') ? safe(api.get('/api/v1/reports/sales', { params: range })) : null,
      can('sales:read') ? list('/api/v1/sales-orders', { per_page: 5 }) : [],
      can('purchases:read') ? list('/api/v1/purchase-orders', { per_page: 5 }) : [],
      can('inventory:read') ? list('/api/v1/inventory', { per_page: 100 }) : [],
    ]).then(([prod, cust, po, so, rep, sos, pos, inv]) => {
      setKpi({ prod, cust, po, so });
      setRecent({ so: sos, po: pos });
      setLowStock(inv.filter(x => Number(x.quantity) <= 5));
      const rd = rep?.data || {};
      setSummary(Object.entries(rd.summary || {}).filter(([, v]) => v === null || typeof v !== 'object'));
      setMonthly(buildMonthly(rd.details));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cards = [
    { key: 'prod', label: 'Produk', to: '/r/products', icon: Package, c: '#2563eb', perm: 'products:read' },
    { key: 'cust', label: 'Pelanggan', to: '/r/customers', icon: Users, c: '#0891b2', perm: 'customers:read' },
    { key: 'po', label: 'Purchase Order', to: '/r/purchase-orders', icon: ClipboardList, c: '#7c3aed', perm: 'purchases:read' },
    { key: 'so', label: 'Sales Order', to: '/r/sales-orders', icon: ShoppingCart, c: '#059669', perm: 'sales:read' },
  ].filter(c => can(c.perm));

  const hasChart = monthly.some(m => m.value > 0);
  const maxVal = Math.max(1, ...monthly.map(m => m.value));

  return (
    <>
      <section className="hero">
        <div>
          <p>{formatDate(new Date().toISOString())}</p>
          <h2>{greet()}, {user?.username}</h2>
          <p>Ringkasan aktivitas bisnis Anda hari ini.</p>
        </div>
        <span className="role-badge">{user?.role}</span>
      </section>

      <div className="kpi-grid">
        {cards.map((c, i) => {
          const Icon = c.icon;
          const val = kpi?.[c.key];
          return (
            <Link to={c.to} key={c.key} className="kpi" style={{ '--c': c.c, '--d': `${i * 60}ms` }}>
              <div className="kpi-icon"><Icon size={20} /></div>
              <div>
                <span>{c.label}</span>
                <b>{val ?? <span className="skeleton" style={{ width: 48, height: 20, display: 'inline-block' }} />}</b>
              </div>
            </Link>
          );
        })}
      </div>

      {summary.length > 0 && (
        <div className="kpi-grid">
          {summary.map(([k, v], i) => (
            <div className="kpi plain" key={k} style={{ '--d': `${i * 60}ms` }}>
              <div>
                <span>{label(k)}</span>
                <b>{isMoney(k) && typeof v === 'number' ? rp(v) : v}</b>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="dash-grid">
        <section className="card">
          <div className="card-title">
            <h4>Penjualan {new Date().getFullYear()}</h4>
          </div>
          {!hasChart ? (
            <p className="muted">Belum ada data penjualan tahun ini.</p>
          ) : (
            <div className="bars">
              {monthly.map((m, i) => (
                <div className="bar-col" key={m.label} title={`${m.label}: ${rp(m.value)}`}>
                  <div
                    className="bar"
                    style={{ height: `${(m.value / maxVal) * 100}%`, animationDelay: `${i * 40}ms` }}
                  />
                  <span>{m.label}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        {can('inventory:read') && (
          <section className="card">
            <div className="card-title">
              <h4><AlertTriangle size={16} className="warn-dot" /> Stok menipis</h4>
              <Link to="/r/inventory">Lihat</Link>
            </div>
            {!kpi ? (
              <SkeletonLines />
            ) : lowStock.length === 0 ? (
              <p className="muted">Semua stok di atas 5 unit.</p>
            ) : (
              <div className="mini-list">
                {lowStock.slice(0, 6).map((x, i) => (
                  <div className="mini-row" key={i}>
                    <b>{x.product_name || x.name || `Produk #${x.product_id}`}</b>
                    <span className="qty-low">{x.quantity}</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </div>

      <div className="two-col">
        {can('sales:read') && (
          <RecentCard title="Sales Order terbaru" to="/r/sales-orders" rows={recent.so}
            numKey="so_number" nameKey="customer_name" loaded={!!kpi} />
        )}
        {can('purchases:read') && (
          <RecentCard title="Purchase Order terbaru" to="/r/purchase-orders" rows={recent.po}
            numKey="po_number" nameKey="supplier_name" loaded={!!kpi} />
        )}
      </div>
    </>
  );
}

function RecentCard({ title, to, rows, numKey, nameKey, loaded }) {
  return (
    <section className="card">
      <div className="card-title">
        <h4>{title}</h4>
        <Link to={to}>Lihat semua</Link>
      </div>
      {!loaded ? (
        <SkeletonLines />
      ) : rows.length === 0 ? (
        <p className="muted">Belum ada data.</p>
      ) : (
        <div className="mini-list">
          {rows.map(r => (
            <Link key={r.id} to={`${to}/${r.id}`} className="mini-row">
              <div>
                <b>{r[numKey]}</b>
                <small>{r[nameKey] || '-'}</small>
              </div>
              <span className="status-pill">{r.status}</span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}