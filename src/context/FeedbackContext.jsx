import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Check, X, Info, AlertTriangle, Trash2 } from 'lucide-react';

const ToastCtx = createContext(null);
const ConfirmCtx = createContext(null);

const ICONS = { success: Check, error: X, info: Info, warning: AlertTriangle };

export function FeedbackProvider({ children }) {
    const [toasts, setToasts] = useState([]);
    const [dialog, setDialog] = useState(null);
    const resolveRef = useRef(null);

    const dismiss = useCallback(id => {
        setToasts(list => list.map(x => (x.id === id ? { ...x, leaving: true } : x)));
        setTimeout(() => setToasts(list => list.filter(x => x.id !== id)), 250);
    }, []);

    const push = useCallback((type, message, opts = {}) => {
        const id = Date.now() + Math.random();
        setToasts(list => [...list.slice(-3), { id, type, message, title: opts.title, leaving: false }]);
        const ttl = opts.duration ?? (type === 'error' ? 5200 : 3400);
        setTimeout(() => dismiss(id), ttl);
    }, [dismiss]);

    const toast = useMemo(() => ({
        success: (m, o) => push('success', m, o),
        error: (m, o) => push('error', m, o),
        info: (m, o) => push('info', m, o),
        warning: (m, o) => push('warning', m, o),
    }), [push]);

    // confirm() mengembalikan Promise<boolean>
    const confirm = useCallback(opts => new Promise(resolve => {
        resolveRef.current = resolve;
        setDialog(opts);
    }), []);

    const answer = useCallback(ok => {
        resolveRef.current?.(ok);
        resolveRef.current = null;
        setDialog(null);
    }, []);

    return (
        <ToastCtx.Provider value={toast}>
            <ConfirmCtx.Provider value={confirm}>
                {children}

                <div className="toast-stack" aria-live="polite">
                    {toasts.map(t => (
                        <Toast key={t.id} t={t} onClose={() => dismiss(t.id)} />
                    ))}
                </div>

                {dialog && <ConfirmDialog d={dialog} onAnswer={answer} />}
            </ConfirmCtx.Provider>
        </ToastCtx.Provider>
    );
}

function Toast({ t, onClose }) {
    const Icon = ICONS[t.type] || Info;
    return (
        <div
            className={`toast toast-${t.type}${t.leaving ? ' leaving' : ''}`}
            role={t.type === 'error' ? 'alert' : 'status'}
        >
            <Icon size={18} />
            <div className="toast-body">
                {t.title && <b>{t.title}</b>}
                <span>{t.message}</span>
            </div>
            <button className="toast-x" onClick={onClose} aria-label="Tutup">
                <X size={14} />
            </button>
        </div>
    );
}

function ConfirmDialog({ d, onAnswer }) {
    const okRef = useRef(null);

    useEffect(() => {
        okRef.current?.focus();
        const onKey = e => { if (e.key === 'Escape') onAnswer(false); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onAnswer]);

    return (
        <div className="overlay confirm-overlay" onClick={() => onAnswer(false)}>
            <div
                className="confirm-box"
                role="alertdialog"
                aria-modal="true"
                onClick={e => e.stopPropagation()}
            >
                <div className={`confirm-icon${d.danger ? ' danger' : ''}`}>
                    {d.danger ? <Trash2 size={22} /> : <Info size={22} />}
                </div>
                <h3>{d.title || 'Yakin?'}</h3>
                {d.message && <p className="muted">{d.message}</p>}
                <div className="row confirm-actions">
                    <button className="ghost" onClick={() => onAnswer(false)}>
                        {d.cancelText || 'Batal'}
                    </button>
                    <button
                        ref={okRef}
                        className={d.danger ? 'danger' : ''}
                        onClick={() => onAnswer(true)}
                    >
                        {d.confirmText || 'Ya'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export const useToast = () => useContext(ToastCtx);
export const useConfirm = () => useContext(ConfirmCtx);