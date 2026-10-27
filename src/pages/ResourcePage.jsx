import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, errMsg } from '../api/client';
import { resources } from '../config/resources';
import { fmt, label } from '../components/DataView';
import DetailView, { colorFor } from '../components/DetailView';
import FormModal from '../components/FormModal';
import { SkeletonLines, SkeletonTable, Spinner, useDelayed } from '../components/Loading';
import { Eye, Pencil, Trash2 } from 'lucide-react';

export default function ResourcePage() {
  const { key, id } = useParams();
  const r = resources[key];
  if (!r) return <p>Resource tidak ditemukan.</p>;
  // key di sini memastikan state di-reset saat pindah modul
  return id
    ? <Detail key={`${key}-${id}`} k={key} r={r} id={id} />
    : <List key={key} k={key} r={r} />;
}

function List({ k, r }) {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [refresh, setRefresh] = useState(0);
  const [modal, setModal] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [err, setErr] = useState('');

  const busy = useDelayed(loading, 200);

  useEffect(() => {
    if (r.list === false) return;
    let cancelled = false;
    setLoading(true);
    setErr('');
    api.get(r.path, { params: { page, per_page: 10 } })
      .then(({ data }) => {
        if (cancelled) return;
        setRows(data.data || []);
        setMeta(data.meta || null);
      })
      .catch(e => { if (!cancelled) setErr(errMsg(e)); })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
        setLoaded(true);
      });
    return () => { cancelled = true; };
  }, [r, page, refresh]);

  const remove = async row => {
    if (!window.confirm('Hapus data ini?')) return;
    setDeletingId(row.id);
    try {
      await api.delete(`${r.path}/${row.id}`);
      setRefresh(x => x + 1);
    } catch (e) {
      alert(errMsg(e));
    } finally {
      setDeletingId(null);
    }
  };

  const first = rows[0] || {};
  const cols = Object.keys(first).filter(c => first[c] === null || typeof first[c] !== 'object').slice(0, 8);
  const totalPages = meta ? Math.max(1, Math.ceil(meta.total / meta.per_page)) : 1;

  let content;
  if (r.list === false) {
    content = <p className="muted">Klik "Tambah" untuk membuat data baru.</p>;
  } else if (rows.length === 0 && busy) {
    content = <SkeletonTable rows={6} cols={5} />;
  } else if (rows.length === 0 && loaded) {
    content = <p className="muted">Tidak ada data.</p>;
  } else if (rows.length === 0) {
    content = null; // menunggu, belum 200ms
  } else {
    content = (
      <div className={`table-wrap${busy ? ' dimmed' : ''}`}>
        <table>
          <thead>
            <tr>{cols.map(c => <th key={c}>{label(c)}</th>)}<th>Aksi</th></tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row.id}>
                {cols.map(c => <td key={c}>{fmt(row[c])}</td>)}
                <td>
                  <div className="actions">
                    {r.detail && (
                      <Link to={`/r/${k}/${row.id}`} className="act act-view" title="Lihat detail">
                        <Eye size={15} /> Detail
                      </Link>
                    )}
                    {r.update && (
                      <button className="act act-edit" title="Edit data" onClick={() => setModal({ row })}>
                        <Pencil size={15} /> Edit
                      </button>
                    )}
                    {r.remove && (
                      <button
                        className="act act-del"
                        title="Hapus data"
                        disabled={deletingId === row.id}
                        onClick={() => remove(row)}
                      >
                        {deletingId === row.id ? <Spinner size={13} /> : <Trash2 size={15} />} Hapus
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <>
      <div className="topbar">
        <h2>{r.title}</h2>
        {r.create && <button onClick={() => setModal({})}>+ Tambah</button>}
      </div>
      <div className="card">
        {err && <p className="error">{err}</p>}
        {content}
        {meta && r.list !== false && (
          <div className="row" style={{ marginTop: 12, justifyContent: 'flex-end' }}>
            {busy && <Spinner size={14} />}
            <span className="muted">Total {meta.total} • Halaman {page} / {totalPages}</span>
            <button className="ghost" disabled={page <= 1 || loading} onClick={() => setPage(p => p - 1)}>‹ Prev</button>
            <button className="ghost" disabled={page >= totalPages || loading} onClick={() => setPage(p => p + 1)}>Next ›</button>
          </div>
        )}
      </div>
      {modal && (
        <FormModal
          r={r}
          row={modal.row}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); setRefresh(x => x + 1); }}
        />
      )}
    </>
  );
}

function Detail({ k, r, id }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [edit, setEdit] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const busy = useDelayed(loading, 200);
  const color = colorFor(k);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setErr('');
    api.get(`${r.path}/${id}`)
      .then(({ data }) => { if (!cancelled) setData(data.data); })
      .catch(e => { if (!cancelled) setErr(errMsg(e)); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [r.path, id, refresh]);

  const changeStatus = async status => {
    setSaving(true);
    try {
      await api.patch(`${r.path}/${id}/status`, { status });
      setRefresh(x => x + 1);
    } catch (e) {
      alert(errMsg(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="topbar">
        <Link to={`/r/${k}`} className="back-link">← Kembali ke {r.title}</Link>
        <div className="row">
          {r.statuses && data && (
            <select
              value={data.status}
              disabled={saving}
              onChange={e => changeStatus(e.target.value)}
              className="status-select"
            >
              {r.statuses.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          )}
          {saving && <Spinner size={14} />}
          {r.update && data && <button disabled={saving} onClick={() => setEdit(true)}>Edit</button>}
        </div>
      </div>

      {err && <div className="card"><p className="error">{err}</p></div>}
      {!data && !err && busy && <div className="card"><SkeletonLines /></div>}
      {data && (
        <div className={busy ? 'dimmed' : ''}>
          <DetailView data={data} color={color} />
        </div>
      )}

      {edit && (
        <FormModal
          r={r}
          row={data}
          onClose={() => setEdit(false)}
          onSaved={() => { setEdit(false); setRefresh(x => x + 1); }}
        />
      )}
    </>
  );
}