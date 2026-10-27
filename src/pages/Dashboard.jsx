import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { resources } from '../config/resources';

const STATS = ['users', 'products', 'customers', 'suppliers', 'purchase-orders', 'sales-orders'];

export default function Dashboard() {
  const [counts, setCounts] = useState({});
  const [health, setHealth] = useState('memeriksa...');

  useEffect(() => {
    api.get('/health').then(() => setHealth('Online')).catch(() => setHealth('Offline'));
    STATS.forEach(k => {
      api.get(resources[k].path, { params: { page: 1, per_page: 1 } })
        .then(({ data }) => setCounts(c => ({ ...c, [k]: data.meta?.total ?? data.data?.length ?? 0 })))
        .catch(() => setCounts(c => ({ ...c, [k]: '-' })));
    });
  }, []);

  return (
    <>
      <h2>Dashboard</h2>
      <p className="muted">Status server: {health}</p>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}>
        {STATS.map(k => (
          <div className="card" key={k}>
            <div className="muted">{resources[k].title}</div>
            <div className="stat">{counts[k] ?? '…'}</div>
          </div>
        ))}
      </div>
    </>
  );
}
