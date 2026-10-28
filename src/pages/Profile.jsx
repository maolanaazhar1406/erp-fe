import { ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/Avatar';
import { formatDate } from '../utils/date';

const ACTIONS = { read: 'Lihat', create: 'Tambah', update: 'Ubah', delete: 'Hapus' };
const MODULES = {
    users: 'Pengguna', roles: 'Role', products: 'Produk', customers: 'Pelanggan', suppliers: 'Supplier',
    purchases: 'Pengadaan', inventory: 'Inventori', sales: 'Penjualan', finance: 'Keuangan', reports: 'Laporan',
};

// "products:read" -> { mod: 'products', label: 'Produk', acts: ['read', ...] }
function groupPermissions(perms) {
    const map = {};
    perms.forEach(p => {
        const [mod, act] = p.split(':');
        map[mod] = map[mod] || [];
        map[mod].push(act);
    });
    const order = Object.keys(ACTIONS);
    return Object.entries(map).map(([mod, acts]) => ({
        mod,
        label: MODULES[mod] || mod,
        acts: acts.sort((a, b) => order.indexOf(a) - order.indexOf(b)),
    }));
}

export default function Profile() {
    const { user } = useAuth();
    const perms = user?.permissions || [];
    const groups = groupPermissions(perms);
    const expires = user?.exp ? new Date(user.exp * 1000) : null;
    const hoursLeft = expires ? Math.max(0, Math.round((expires - Date.now()) / 3600000)) : null;
    const canAdd = groups.filter(g => g.acts.includes('create')).length;

    return (
        <div className="profile">
            <section className="profile-hero">
                <Avatar name={user?.username} size={84} className="xl" />
                <div>
                    <span className="kicker">Akun</span>
                    <h2>{user?.username}</h2>
                    <div className="row">
                        <span className="role-badge">{user?.role}</span>
                        {expires && (
                            <span className="muted">
                                Sesi berakhir {formatDate(expires.toISOString())}
                                {hoursLeft !== null && ` • ±${hoursLeft} jam lagi`}
                            </span>
                        )}
                    </div>
                </div>
                <div className="profile-stats">
                    <div><b>{perms.length}</b><span>Izin</span></div>
                    <div><b>{groups.length}</b><span>Modul</span></div>
                    <div><b>{canAdd}</b><span>Bisa menambah</span></div>
                </div>
            </section>

            <section className="card">
                <h3>Hak akses</h3>
                <p className="muted">Izin yang diberikan kepada akun Anda berdasarkan role.</p>
                <div className="perm-cards">
                    {groups.map((g, i) => (
                        <div className="perm-card" key={g.mod} style={{ '--d': `${i * 50}ms` }}>
                            <div className="perm-card-head"><ShieldCheck size={16} /> {g.label}</div>
                            <div className="chips">
                                {g.acts.map(a => (
                                    <span key={a} className={`chip chip-${a}`}>{ACTIONS[a] || a}</span>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
                {groups.length === 0 && <p className="muted">Belum ada izin yang terdaftar.</p>}
            </section>
        </div>
    );
}