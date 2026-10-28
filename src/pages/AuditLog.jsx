import { useEffect, useState } from 'react';
import { Search, ScrollText, ChevronLeft, ChevronRight } from 'lucide-react';
import { api, errMsg } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { resources } from '../config/resources';
import { formatDate } from '../utils/date';
import Forbidden from '../components/Forbidden';
import { SkeletonTable, Spinner } from '../components/Loading';

const METHODS = ['', 'POST', 'PUT', 'PATCH', 'DELETE'];
const ACTION = { POST: 'Membuat', PUT: 'Mengubah', PATCH: 'Mengubah', DELETE: 'Menghapus' };

export default function AuditLog() {
    const { can } = useAuth();
    const [rows, setRows] = useState([]);
    const [meta, setMeta] = useState(null);
    const [page, setPage] = useState(1);
    const [q, setQ] = useState('');
    const [qd, setQd] = useState('');
    const [method, setMethod] = useState('');
    const [loading, setLoading] = useState(false);
    const [loaded, setLoaded] = useState(false);
    const [err, setErr] = useState('');

    // Jeda 300 ms agar tidak request setiap ketikan
    useEffect(() => {
        const t = setTimeout(() => { setQd(q.trim()); setPage(1); }, 300);
        return () => clearTimeout(t);
    }, [q]);

    useEffect(() => {
        if (!can('audit:read')) return;
        let cancelled = false;
        setLoading(true);
        setErr('');
        api.get('/api/v1/audit-logs', {
            params: { page, per_page: 15, q: qd || undefined, method: method || undefined },
        })
            .then(({ data }) => { if (!cancelled) { setRows(data.data || []); setMeta(data.meta); } })
            .catch(e => { if (!cancelled) setErr(errMsg(e)); })
            .finally(() => { if (!cancelled) { setLoading(false); setLoaded(true); } });
        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, qd, method]);

    if (!can('audit:read')) return <Forbidden />;

    const totalPages = meta ? Math.max(1, Math.ceil(meta.total / meta.per_page)) : 1;

    return (
        <>
            <div className="topbar">
                <div>
                    <h2>Audit log</h2>
                    <p className="muted">Riwayat perubahan data oleh pengguna.</p>
                </div>
            </div>

            <div className="card">
                <div className="table-tools">
                    <div className="tbl-search">
                        <Search size={16} />
                        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Cari pengguna, path, modul..." />
                    </div>
                    <div className="seg">
                        {METHODS.map(m => (
                            <button
                                key={m || 'all'}
                                className={method === m ? 'on' : ''}
                                onClick={() => { setMethod(m); setPage(1); }}
                            >
                                {m || 'Semua'}
                            </button>
                        ))}
                    </div>
                    {loading && <Spinner size={14} />}
                </div>

                {err && <p className="error">{err}</p>}

                {!loaded ? (
                    <SkeletonTable rows={6} cols={5} />
                ) : rows.length === 0 ? (
                    <div className="empty">
                        <ScrollText size={28} />
                        <b>Belum ada aktivitas</b>
                    </div>
                ) : (
                    <div className={`table-wrap${loading ? ' dimmed' : ''}`}>
                        <table>
                            <thead>
                                <tr><th>Waktu</th><th>Pengguna</th><th>Aksi</th><th>Modul</th><th>Data</th><th>Hasil</th></tr>
                            </thead>
                            <tbody>
                                {rows.map(a => (
                                    <tr key={a.id}>
                                        <td>
                                            {formatDate(a.created_at)}{' '}
                                            <small className="muted">{new Date(a.created_at).toLocaleTimeString('id-ID')}</small>
                                        </td>
                                        <td>{a.username || '-'}</td>
                                        <td>
                                            <span className={`method method-${a.method}`}>{a.method}</span>{' '}
                                            {ACTION[a.method] || ''}
                                        </td>
                                        <td>{resources[a.resource]?.title || a.resource || '-'}</td>
                                        <td>{a.record_id ? `#${a.record_id}` : '-'}</td>
                                        <td>
                                            <span className={a.status_code < 400 ? 'st-ok' : 'st-fail'}>
                                                {a.status_code < 400 ? 'Berhasil' : `Gagal (${a.status_code})`}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {meta && (
                    <div className="row" style={{ marginTop: 12, justifyContent: 'flex-end' }}>
                        <span className="muted">Total {meta.total} • Halaman {page} / {totalPages}</span>
                        <button className="ghost" disabled={page <= 1 || loading} onClick={() => setPage(p => p - 1)}>
                            <ChevronLeft size={14} /> Prev
                        </button>
                        <button className="ghost" disabled={page >= totalPages || loading} onClick={() => setPage(p => p + 1)}>
                            Next <ChevronRight size={14} />
                        </button>
                    </div>
                )}
            </div>
        </>
    );
}