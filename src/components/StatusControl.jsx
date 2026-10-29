import { useState } from 'react';
import { api, errMsg } from '../api/client';
import { Spinner } from './Loading';
import { useConfirm, useToast } from '../context/FeedbackContext';

export default function StatusControl({ basePath, id, current, options, title, compact = false, onChanged }) {
    const [saving, setSaving] = useState(false);
    const confirm = useConfirm();
    const toast = useToast();
    const list = options.includes(current) ? options : [current, ...options];

    const change = async next => {
        const ok = await confirm({
            title: 'Ubah status?',
            message: `${title || 'Dokumen'}: "${current}" → "${next}".`,
            confirmText: 'Ubah status',
        });
        if (!ok) return;

        setSaving(true);
        try {
            await api.patch(`${basePath}/${id}/status`, { status: next });
            toast.success(`Status diubah menjadi ${next}`);
            onChanged?.(next);
        } catch (e) {
            notifyError(toast, e, 'Gagal mengubah status');
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