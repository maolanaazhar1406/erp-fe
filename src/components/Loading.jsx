import { useEffect, useState } from 'react';
import { subscribe } from '../api/loading';

// Mengembalikan true hanya jika `active` bertahan lebih lama dari `delay`.
// Ini mencegah loading muncul-hilang untuk respons yang sangat cepat.
export function useDelayed(active, delay = 200) {
    const [show, setShow] = useState(false);
    useEffect(() => {
        if (!active) {
            setShow(false);
            return;
        }
        const t = setTimeout(() => setShow(true), delay);
        return () => clearTimeout(t);
    }, [active, delay]);
    return show;
}

export function TopProgress() {
    const [pending, setPending] = useState(0);
    useEffect(() => subscribe(setPending), []);
    const show = useDelayed(pending > 0, 120);
    return show ? <div className="top-progress" /> : null;
}

export function Spinner({ size = 18 }) {
    return <span className="spinner" style={{ width: size, height: size }} />;
}

export function SkeletonTable({ rows = 6, cols = 5 }) {
    return (
        <div className="table-wrap">
            <table>
                <tbody>
                    {Array.from({ length: rows }).map((_, r) => (
                        <tr key={r}>
                            {Array.from({ length: cols }).map((_, c) => (
                                <td key={c}>
                                    <span className="skeleton" style={{ width: `${55 + ((r + c) % 3) * 15}%` }} />
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export function SkeletonLines() {
    return (
        <div className="skel-lines">
            {[70, 90, 60, 80, 50].map((w, i) => (
                <span key={i} className="skeleton" style={{ width: `${w}%` }} />
            ))}
        </div>
    );
}