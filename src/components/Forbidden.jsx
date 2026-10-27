import { ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Forbidden() {
    return (
        <div className="card forbidden">
            <ShieldAlert size={40} />
            <h2>Akses ditolak</h2>
            <p className="muted">Akun Anda tidak punya izin untuk membuka halaman ini.</p>
            <Link to="/" className="back-link">← Kembali ke dashboard</Link>
        </div>
    );
}