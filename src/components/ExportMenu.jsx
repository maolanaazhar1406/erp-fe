import { useEffect, useRef, useState } from 'react';
import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import { useToast } from '../context/FeedbackContext';
import { errMsg } from '../api/client';

export default function ExportMenu({ onExport, disabled }) {
    const [open, setOpen] = useState(false);
    const [busy, setBusy] = useState(false);
    const ref = useRef(null);
    const toast = useToast();

    useEffect(() => {
        const onDown = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', onDown);
        return () => document.removeEventListener('mousedown', onDown);
    }, []);

    const run = async fmt => {
        setOpen(false);
        setBusy(true);
        try {
            await onExport(fmt);
            toast.success(`File ${fmt.toUpperCase()} berhasil diunduh`);
        } catch (e) {
            toast.error(e.message || errMsg(e), { title: 'Ekspor gagal' });
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="export-menu" ref={ref}>
            <button className="ghost" disabled={disabled || busy} onClick={() => setOpen(o => !o)}>
                <Download size={15} /> {busy ? 'Mengekspor...' : 'Ekspor'}
            </button>
            {open && (
                <div className="pop export-pop">
                    <button className="pop-item" onClick={() => run('csv')}>
                        <FileText size={16} /> CSV
                    </button>
                    <button className="pop-item" onClick={() => run('xlsx')}>
                        <FileSpreadsheet size={16} /> Excel (.xlsx)
                    </button>
                </div>
            )}
        </div>
    );
}