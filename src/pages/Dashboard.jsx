import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { resources, permFor } from '../config/resources';
import { useAuth } from '../context/AuthContext';
import { Spinner } from '../components/Loading';

const STATS = ['users', 'products', 'customers', 'suppliers', 'purchase-orders', 'sales-orders'];

export default function Dashboard() {
  const { can } = useAuth();
  const [counts, setCounts] = useState({});
  const [health, setHealth] = useState(null);

  // Hanya modul yang bisa dibaca user yang ditampilkan
  const stats = STATS.filter(k => can(permFor(k, 'read')));

  useEffect(() => {
    let cancelled = false;
    api.get('/health')
      .then(() => !cancelled && setHealth('Online'))
      .catch(() => !cancelled && setHealth('Offline'));
    stats.forEach(k => {
      api.get(resources[k].path, { params: { page: 1, per_page: 1 } })
        .then(({ data }) => !cancelled && setCounts(c => ({ ...c, [k]: data.meta?.total ?? data.data?.length ?? 0 })))
        .catch(() => !cancelled && setCounts(c => ({ ...c, [k]: '-' })));
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <h2>Dashboard</h2>
      <p className="muted">Status server: {health ?? <Spinner size={12} />}</p>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}>
        {stats.map(k => (
          <div className="card" key={k}>
            <div className="muted">{resources[k].title}</div>
            <div className="stat">
              {counts[k] ?? <span className="skeleton" style={{ width: 60, height: 24 }} />}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}