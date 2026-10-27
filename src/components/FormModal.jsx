import { useEffect, useState } from 'react';
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

function FieldInput({ f, value, onChange, opts }) {
  if (f.type === 'permissions') {
    const list = opts.permissions || [];
    const toggle = id => onChange(value.includes(id) ? value.filter(x => x !== id) : [...value, id]);
    return (
      <div className="row">
        {list.map(p => (
          <label key={p.id} style={{ flexDirection: 'row', alignItems: 'center' }}>
            <input type="checkbox" style={{ width: 'auto' }} checked={value.includes(p.id)} onChange={() => toggle(p.id)} />
            {p.name}
          </label>
        ))}
        {!list.length && <span className="muted">Memuat permission...</span>}
      </div>
    );
  }
  if (f.type === 'select') {
    const list = f.options
      ? f.options.map(o => ({ value: o, label: o }))
      : (opts[f.optionsFrom] || []).map(o => ({ value: o.id, label: o[f.optionLabel || 'name'] }));
    return (
      <select value={value ?? ''} onChange={e => onChange(e.target.value)} required={f.required}>
        <option value="">-- pilih --</option>
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
  const [err, setErr] = useState('');

  // Ambil data pilihan (dropdown) dari endpoint resource terkait
  useEffect(() => {
    flatten(fields).forEach(f => {
      if (f.optionsFrom) {
        api.get(resources[f.optionsFrom].path, { params: { per_page: 100 } })
          .then(({ data }) => setOpts(o => ({ ...o, [f.optionsFrom]: data.data || [] })))
          .catch(() => { });
      }
      if (f.type === 'permissions') {
        api.get(resources.roles.path)
          .then(({ data }) => {
            const map = new Map();
            (data.data || []).forEach(role => role.permissions?.forEach(p => map.set(p.id, p)));
            setOpts(o => ({ ...o, permissions: [...map.values()] }));
          })
          .catch(() => { });
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setField = (name, val) => setV(s => ({ ...s, [name]: val }));
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
              {f.label}{f.required && ' *'}
              <FieldInput f={f} value={v[f.name]} opts={opts} onChange={val => setField(f.name, val)} />
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
