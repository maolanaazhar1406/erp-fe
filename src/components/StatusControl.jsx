import { useState } from 'react';
import { api, errMsg } from '../api/client';
import { Spinner } from './Loading';

// Dropdown ubah status yang dipakai di list dan detail.
// Opsi yang bisa dipilih ditentukan oleh `options`; status saat ini tetap tampil meski tidak ada di opsi.
export default function StatusControl({ basePath, id, current, options, title, compact = false, onChanged }) {
    const [saving, setSaving] = useState(false);
    const list = options.includes(current) ? options : [current, ...options];

    const change = async next => {
        const name = title ? ` ${title}` : '';
        if (!window.confirm(`Ubah status${name} dari "${current}" menjadi "${next}"?`)) return;

        setSaving(true);
        try {
            await api.patch(`${basePath}/${id}/status`, { status: next });
            onChanged?.(next);
        } catch (e) {
            alert(errMsg(e));
        } finally {
            setSaving(false);
        }
    };

    return (
        <span className="status-control">
            <select
                value={current ?? ''}
                data-status={current}
                disabled={saving}
                onChange={e => change(e.target.value)}
                className={`status-select${compact ? ' compact' : ''}`}
            >
                {list.map(s => (
                    <option key={s} value={s} disabled={!options.includes(s)}>
                        {s}
                    </option>
                ))}
            </select>
            {saving && <Spinner size={14} />}
        </span>
    );
}