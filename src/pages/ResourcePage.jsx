import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Eye, Pencil, Trash2, Search, X, Inbox, Printer } from 'lucide-react';
import { api, errMsg } from '../api/client';
import { resources, permFor } from '../config/resources';
import { useAuth } from '../context/AuthContext';
import { useConfirm, useToast } from '../context/FeedbackContext';
import { fmt, label } from '../components/DataView';
import DetailView, { colorFor } from '../components/DetailView';
import FormModal from '../components/FormModal';
import StatusControl from '../components/StatusControl';
import Forbidden from '../components/Forbidden';
import ExportMenu from '../components/ExportMenu';
import { fetchAll, exportCSV, exportXLSX } from '../utils/export';
import { SkeletonLines, SkeletonTable, Spinner, useDelayed } from '../components/Loading';

// Kolom yang tidak ditampilkan di list: ID, foreign key, dan id pembuat
const HIDDEN_AUTO = /^id$|_id$|_by$/;

const PRINTABLE = ['purchase-orders', 'sales-orders', 'payments'];

function autoColumns(row, hasStatus) {
  return Object.keys(row)
    .filter(c => row[c] === null || typeof row[c] !== 'object')
    .filter(c => !HIDDEN_AUTO.test(c))
    .filter(c => !(hasStatus && c === 'status'))
    .slice(0, 8)
    .map(c => ({ key: c, label: label(c) }));
}

// Nama dokumen untuk judul dialog dan toast
const rowLabel = row =>
  row.po_number || row.so_number || row.gr_number || row.payment_number || row.code || row.name || `#${row.id}`;

function useDebounced(value, delay = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

export default function ResourcePage() {
  const { key, id } = useParams();
  const { can } = useAuth();
  const r = resources[key];
  if (!r) return <p>Resource tidak ditemukan.</p>;
  if (!can(permFor(key, 'read'))) return <Forbidden />;
  // key di sini memastikan state di-reset saat pindah modul
  return id
    ? <Detail key={`${key}-${id}`} k={key} r={r} id={id} />
    : <List key={key} k={key} r={r} />;
}

function List({ k, r }) {
  const { can } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();

  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const qd = useDebounced(q.trim(), 300);
  const [refresh, setRefresh] = useState(0);
  const [modal, setModal] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [err, setErr] = useState('');

  const busy = useDelayed(loading, 200);
  const hasStatus = Boolean(r.statuses);
  const canCreate = Boolean(r.create) && can(permFor(k, 'create'));
  const canUpdate = Boolean(r.update) && can(permFor(k, 'update'));
  const canRemove = Boolean(r.remove) && can(permFor(k, 'delete'));
  const canStatus = hasStatus && can(permFor(k, 'update'));

  // Kata kunci berubah: kembali ke halaman pertama
  useEffect(() => { setPage(1); }, [qd]);

  useEffect(() => {
    if (r.list === false) return;
    let cancelled = false;
    setLoading(true);
    setErr('');
    api.get(r.path, { params: { page, per_page: 10, q: qd || undefined } })
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
  }, [r, page, refresh, qd]);

  const remove = async row => {
    const ok = await confirm({
      title: 'Hapus data?',
      message: `"${rowLabel(row)}" akan dihapus permanen dan tidak bisa dikembalikan.`,
      confirmText: 'Hapus',
      danger: true,
    });
    if (!ok) return;

    setDeletingId(row.id);
    try {
      await api.delete(`${r.path}/${row.id}`);
      toast.success(`${rowLabel(row)} berhasil dihapus`);
      setRefresh(x => x + 1);
    } catch (e) {
      toast.error(errMsg(e), { title: 'Gagal menghapus' });
    } finally {
      setDeletingId(null);
    }
  };

  // Ekspor mengambil semua data sesuai kata kunci pencarian, bukan hanya halaman ini
  const exportList = async fmt => {
    const all = await fetchAll(r.path, { q: qd || undefined });
    if (!all.length) throw new Error('Tidak ada data untuk diekspor');
    const cols = r.listColumns || autoColumns(all[0], hasStatus);
    if (fmt === 'csv') exportCSV(all, cols, r.title);
    else await exportXLSX([{ name: r.title, rows: all, columns: cols }], r.title);
  };

  const columns = r.listColumns || autoColumns(rows[0] || {}, hasStatus);
  const totalPages = meta ? Math.max(1, Math.ceil(meta.total / meta.per_page)) : 1;

  let content;
  if (r.list === false) {
    content = <p className="muted">{canCreate ? 'Klik "Tambah" untuk membuat data baru.' : 'Tidak ada data untuk ditampilkan.'}</p>;
  } else if (rows.length === 0 && busy) {
    content = <SkeletonTable rows={6} cols={5} />;
  } else if (rows.length === 0 && loaded) {
    content = qd ? (
      <div className="empty">
        <Inbox size={28} />
        <b>Tidak ada hasil</b>
        <span>Coba kata kunci lain untuk "{qd}".</span>
      </div>
    ) : (
      <div className="empty">
        <Inbox size={28} />
        <b>Belum ada data</b>
        {canCreate && <button onClick={() => setModal({})}>+ Tambah pertama</button>}
      </div>
    );
  } else if (rows.length === 0) {
    content = null;
  } else {
    content = (
      <div className={`table-wrap${busy ? ' dimmed' : ''}`}>
        <table>
          <thead>
            <tr>
              {columns.map(c => <th key={c.key}>{c.label}</th>)}
              {hasStatus && <th className="col-fit">{canStatus ? 'Ubah status' : 'Status'}</th>}
              <th className="col-actions">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row.id}>
                {columns.map(c => <td key={c.key}>{fmt(row[c.key])}</td>)}
                {hasStatus && (
                  <td className="col-fit">
                    {canStatus ? (
                      <StatusControl
                        basePath={r.path}
                        id={row.id}
                        current={row.status}
                        options={r.statuses}
                        title={rowLabel(row)}
                        compact
                        onChanged={() => setRefresh(x => x + 1)}
                      />
                    ) : (
                      <span className="muted">{row.status}</span>
                    )}
                  </td>
                )}
                <td className="col-actions">
                  <div className="actions">
                    {r.detail && (
                      <Link to={`/r/${k}/${row.id}`} className="act act-view" title="Lihat detail">
                        <Eye size={15} /> Detail
                      </Link>
                    )}
                    {PRINTABLE.includes(k) && (
                      <button className="act act-print" onClick={() => window.open(`/print/${k}/${row.id}`, '_blank')}>
                        <Printer size={15} /> PDF
                      </button>
                    )}
                    {canUpdate && (
                      <button className="act act-edit" title="Edit data" onClick={() => setModal({ row })}>
                        <Pencil size={15} /> Edit
                      </button>
                    )}
                    {canRemove && (
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
        {canCreate && <button onClick={() => setModal({})}>+ Tambah</button>}
      </div>

      <div className="card">
        {r.list !== false && (
          <div className="table-tools">
            <div className="tbl-search">
              <Search size={16} />
              <input
                value={q}
                onChange={e => setQ(e.target.value)}
                placeholder={`Cari ${r.title.toLowerCase()}...`}
                aria-label="Cari data"
              />
              {q && (
                <button className="tbl-clear" onClick={() => setQ('')} aria-label="Hapus pencarian">
                  <X size={14} />
                </button>
              )}
            </div>
            <ExportMenu onExport={exportList} disabled={!meta || rows.length === 0} />
            {qd && meta && (
              <span className="muted">{meta.total} hasil untuk "{qd}"</span>
            )}
          </div>
        )}

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
          onSaved={() => {
            const wasEdit = Boolean(modal?.row);
            setModal(null);
            setRefresh(x => x + 1);
            toast.success(wasEdit ? 'Perubahan berhasil disimpan' : 'Data berhasil ditambahkan');
          }}
        />
      )}
    </>
  );
}

function Detail({ k, r, id }) {
  const { can } = useAuth();
  const toast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [edit, setEdit] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [err, setErr] = useState('');

  const busy = useDelayed(loading, 200);
  const color = colorFor(k);
  const canUpdate = Boolean(r.update) && can(permFor(k, 'update'));

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

  return (
    <>
      <div className="topbar">
        <Link to={`/r/${k}`} className="back-link">← Kembali ke {r.title}</Link>
        <div className="row">
          {r.statuses && data && (
            canUpdate ? (
              <StatusControl
                basePath={r.path}
                id={id}
                current={data.status}
                options={r.statuses}
                title={rowLabel(data)}
                onChanged={() => setRefresh(x => x + 1)}
              />
            ) : (
              <span className="muted">Status: {data.status}</span>
            )
          )}
          {PRINTABLE.includes(k) && data && (
            <button className="ghost" onClick={() => window.open(`/print/${k}/${id}`, '_blank')}>
              <Printer size={15} /> Cetak PDF
            </button>
          )}
          {canUpdate && data && <button onClick={() => setEdit(true)}>Edit</button>}
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
          onSaved={() => {
            setEdit(false);
            setRefresh(x => x + 1);
            toast.success('Perubahan berhasil disimpan');
          }}
        />
      )}
    </>
  );
}