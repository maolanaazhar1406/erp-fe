import { useEffect, useRef, useState } from 'react';
import { api, errMsg } from '../api/client';
import { resources } from '../config/resources';
import { Spinner } from './Loading';

const flatten = (fs, out = []) => {
  fs.forEach(f => { out.push(f); if (f.fields) flatten(f.fields, out); });
  return out;
};

const emptyLine = f => Object.fromEntries(f.fields.map(sf => [sf.name, sf.default ?? '']));

function initialValues(fields, row) {
  return Object.fromEntries(fields.map(f => {
    if (f.type === 'lines') {
      const items = row?.[f.name];
      return [f.name, items?.length
        ? items.map(it => Object.fromEntries(f.fields.map(sf => [sf.name, it[sf.name] ?? ''])))
        : [emptyLine(f)]];
    }
    if (f.type === 'permissions') return [f.name, row?.permissions?.map(p => p.id) ?? []];
    const val = row?.[f.name];
    return [f.name, val ?? f.default ?? ''];
  }));
}

const toPayload = (f, val) => {
  if (f.type === 'number') return val === '' ? null : Number(val);
  if (f.type === 'lines') return val.map(line => Object.fromEntries(f.fields.map(sf => [sf.name, toPayload(sf, line[sf.name])])));
  if (f.type === 'select') return val === '' ? null : (isNaN(val) ? val : Number(val));
  return val;
};

function FieldInput({ f, value, parentValue, onChange, opts }) {
  if (f.type === 'permissions') {
    const list = opts.permissions || [];
    const toggle = id => onChange(value.includes(id) ? value.filter(x => x !== id) : [...value, id]);

    if (opts.permError) return <span className="error">{opts.permError}</span>;
    if (!opts.permLoaded) return <span className="muted">Memuat permission...</span>;
    if (!list.length) return <span className="muted">Belum ada permission.</span>;

    return (
      <div className="perm-grid">
        {list.map(p => (
          <label key={p.id} className="perm-item">
            <input type="checkbox" checked={value.includes(p.id)} onChange={() => toggle(p.id)} />
            <span>{p.name}</span>
          </label>
        ))}
      </div>
    );
  }

  if (f.type === 'select') {
    const ref = f.refBy && parentValue ? f.refBy[parentValue] : null;
    const refKey = `ref:${parentValue}`;
    let list = [];
    let placeholder = '-- pilih --';

    if (f.refBy) {
      if (!ref) placeholder = 'Pilih jenis dulu';
      else if (!opts[refKey]) placeholder = 'Memuat...';
      else list = opts[refKey].map(o => ({ value: o.id, label: ref.label(o) }));
    } else if (f.options) {
      list = f.options.map(o => ({ value: o, label: o }));
    } else {
      list = (opts[f.optionsFrom] || []).map(o => ({
        value: o.id,
        label: typeof f.optionLabel === 'function' ? f.optionLabel(o) : o[f.optionLabel || 'name'],
      }));
    }

    return (
      <select
        value={value ?? ''}
        onChange={e => onChange(e.target.value)}
        required={f.required}
        disabled={!!f.refBy && !ref}
      >
        <option value="">{placeholder}</option>
        {list.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    );
  }

  if (f.type === 'textarea') {
    return <textarea rows={2} value={value ?? ''} onChange={e => onChange(e.target.value)} />;
  }

  return (
    <input
      type={f.type || 'text'}
      step={f.type === 'number' ? 'any' : undefined}
      value={value ?? ''}
      required={f.required}
      onChange={e => onChange(e.target.value)}
    />
  );
}

export default function FormModal({ r, row, onClose, onSaved }) {
  const isEdit = !!row;
  const fields = r.fields.filter(f => !f.only || f.only === (isEdit ? 'edit' : 'create'));
  const [v, setV] = useState(() => initialValues(fields, row));
  const [opts, setOpts] = useState({});
  const [saving, setSaving] = useState(false);
  const [filling, setFilling] = useState('');
  const [err, setErr] = useState('');
  const fillReq = useRef(0);

  // Ambil data pilihan statis dan permission sekali saat modal dibuka
  useEffect(() => {
    // Permission: list role tidak memuat permission, jadi ambil detail tiap role
    const loadPermissions = async f => {
      try {
        const { data } = await api.get(resources.roles.path, { params: { per_page: 100 } });
        const roles = data.data || [];
        const details = await Promise.all(
          roles.map(role =>
            api.get(`${resources.roles.path}/${role.id}`)
              .then(res => res.data.data)
              .catch(() => null)
          )
        );

        const map = new Map();
        details.forEach(d => d?.permissions?.forEach(p => map.set(p.id, p)));
        const all = [...map.values()].sort((a, b) => a.id - b.id);
        setOpts(o => ({ ...o, permissions: all, permLoaded: true, permError: '' }));

        // Saat edit, centang permission milik role yang sedang dibuka
        if (isEdit) {
          const current = details.find(d => d?.id === row.id);
          if (current?.permissions) {
            setV(s => ({ ...s, [f.name]: current.permissions.map(p => p.id) }));
          }
        }
      } catch (e) {
        setOpts(o => ({ ...o, permLoaded: true, permError: errMsg(e) }));
      }
    };

    flatten(fields).forEach(f => {
      if (f.optionsFrom) {
        api.get(resources[f.optionsFrom].path, { params: { per_page: 100 } })
          .then(({ data }) => setOpts(o => ({ ...o, [f.optionsFrom]: data.data || [] })))
          .catch(() => { });
      }
      if (f.type === 'permissions') loadPermissions(f);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Pilihan bergantung (refBy) diambil ulang setiap kali jenis di field induk berubah
  const parentTypes = flatten(fields)
    .filter(f => f.refBy)
    .map(f => v[f.dependsOn] || '')
    .join('|');

  useEffect(() => {
    flatten(fields).forEach(f => {
      if (!f.refBy) return;
      const type = v[f.dependsOn];
      const ref = type && f.refBy[type];
      if (!ref) return;
      const key = `ref:${type}`;
      api.get(resources[ref.resource].path, { params: { per_page: 100 } })
        .then(({ data }) => setOpts(o => ({ ...o, [key]: data.data || [] })))
        .catch(() => setOpts(o => ({ ...o, [key]: [] })));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parentTypes]);

  // Isi baris (lines) otomatis dari detail data yang dipilih
  const fillLines = async (f, val) => {
    const { path, target, map } = f.onSelect;
    const reqId = ++fillReq.current;
    setFilling(f.name);
    try {
      const { data } = await api.get(`${path}/${val}`);
      if (reqId !== fillReq.current) return;
      const lines = map(data.data || {});
      const targetField = fields.find(x => x.name === target);
      setV(s => ({ ...s, [target]: lines.length ? lines : [emptyLine(targetField)] }));
    } catch (e) {
      if (reqId === fillReq.current) setErr(errMsg(e));
    } finally {
      if (reqId === fillReq.current) setFilling('');
    }
  };

  const setField = (name, val) => {
    setV(s => {
      const next = { ...s, [name]: val };
      // Kosongkan field yang bergantung pada field ini, misalnya referensi saat jenis berubah
      flatten(fields).forEach(f => { if (f.dependsOn === name) next[f.name] = ''; });
      return next;
    });
    const f = fields.find(x => x.name === name);
    if (f?.onSelect && val !== '') fillLines(f, val);
  };

  const setLine = (name, i, sub, val) =>
    setV(s => ({ ...s, [name]: s[name].map((ln, idx) => (idx === i ? { ...ln, [sub]: val } : ln)) }));
  const addLine = f => setV(s => ({ ...s, [f.name]: [...s[f.name], emptyLine(f)] }));
  const delLine = (name, i) => setV(s => ({ ...s, [name]: s[name].filter((_, idx) => idx !== i) }));

  const submit = async e => {
    e.preventDefault();
    setSaving(true);
    setErr('');
    const payload = Object.fromEntries(fields.map(f => [f.name, toPayload(f, v[f.name])]));
    try {
      if (isEdit) await api.put(`${r.path}/${row.id}`, payload);
      else await api.post(r.path, payload);
      onSaved();
    } catch (ex) {
      setErr(errMsg(ex));
      setSaving(false);
    }
  };

  return (
    <div className="overlay" onClick={onClose}>
      <form className="modal stack" onClick={e => e.stopPropagation()} onSubmit={submit}>
        <h3>{isEdit ? 'Edit' : 'Tambah'} {r.title}</h3>

        <div className="grid">
          {fields.filter(f => f.type !== 'lines').map(f => (
            <label key={f.name} style={f.type === 'permissions' ? { gridColumn: '1 / -1' } : undefined}>
              <span className="field-label">
                {f.label}{f.required && ' *'}
                {filling === f.name && <Spinner size={12} />}
              </span>
              <FieldInput
                f={f}
                value={v[f.name]}
                parentValue={f.dependsOn ? v[f.dependsOn] : undefined}
                opts={opts}
                onChange={val => setField(f.name, val)}
              />
            </label>
          ))}
        </div>

        {fields.filter(f => f.type === 'lines').map(f => (
          <fieldset key={f.name} className="stack" style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 12 }}>
            <legend>{f.label}</legend>
            {v[f.name].map((ln, i) => (
              <div className="line" key={i}>
                {f.fields.map(sf => (
                  <label key={sf.name}>
                    {sf.label}
                    <FieldInput f={sf} value={ln[sf.name]} opts={opts} onChange={val => setLine(f.name, i, sf.name, val)} />
                  </label>
                ))}
                <button type="button" className="danger" onClick={() => delLine(f.name, i)}>×</button>
              </div>
            ))}
            <div><button type="button" className="ghost" onClick={() => addLine(f)}>+ Tambah baris</button></div>
          </fieldset>
        ))}

        {err && <p className="error">{err}</p>}
        <div className="row" style={{ justifyContent: 'flex-end' }}>
          <button type="button" className="ghost" onClick={onClose}>Batal</button>
          <button disabled={saving} className="btn-loading">
            {saving && <Spinner size={14} />}
            {saving ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </form>
    </div>
  );
}