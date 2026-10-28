import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, Sun, Moon, User, Settings, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePrefs } from '../context/PrefsContext';
import { resources, menu, permFor } from '../config/resources';
import Avatar from './Avatar';

// Daftar pencarian: semua menu yang bisa dibuka user
const SEARCH_ITEMS = [
    { label: 'Dashboard', to: '/', group: 'Menu' },
    ...menu.flatMap(g => g.items.map(k => ({
        label: resources[k].title, to: `/r/${k}`, group: g.group, perm: permFor(k, 'read'),
    }))),
    { label: 'Laporan', to: '/reports', group: 'Menu', perm: 'reports:read' },
    { label: 'Profil saya', to: '/profile', group: 'Akun' },
    { label: 'Pengaturan', to: '/settings', group: 'Akun' },
];

function crumbOf(pathname) {
    if (pathname === '/') return 'Dashboard';
    if (pathname.startsWith('/r/')) return resources[pathname.split('/')[2]]?.title || 'Data';
    if (pathname.startsWith('/reports')) return 'Laporan';
    if (pathname === '/profile') return 'Profil';
    if (pathname === '/settings') return 'Pengaturan';
    return '';
}

export default function Topbar() {
    const { user, logout, can } = useAuth();
    const { dark, update } = usePrefs();
    const { pathname } = useLocation();
    const nav = useNavigate();

    const [q, setQ] = useState('');
    const [searchOpen, setSearchOpen] = useState(false);
    const [userOpen, setUserOpen] = useState(false);
    const searchRef = useRef(null);
    const userRef = useRef(null);
    const inputRef = useRef(null);

    const term = q.trim().toLowerCase();
    const results = term
        ? SEARCH_ITEMS
            .filter(it => !it.perm || can(it.perm))
            .filter(it => it.label.toLowerCase().includes(term) || it.group.toLowerCase().includes(term))
            .slice(0, 8)
        : [];

    // Klik di luar menutup popover, Escape menutup semua, Ctrl/Cmd+K fokus ke pencarian
    useEffect(() => {
        const onDown = e => {
            if (searchRef.current && !searchRef.current.contains(e.target)) setSearchOpen(false);
            if (userRef.current && !userRef.current.contains(e.target)) setUserOpen(false);
        };
        const onKey = e => {
            if (e.key === 'Escape') { setSearchOpen(false); setUserOpen(false); }
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                inputRef.current?.focus();
                setSearchOpen(true);
            }
        };
        document.addEventListener('mousedown', onDown);
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('mousedown', onDown);
            document.removeEventListener('keydown', onKey);
        };
    }, []);

    const go = to => {
        nav(to);
        setQ('');
        setSearchOpen(false);
    };

    const onSearchKey = e => {
        if (e.key === 'Enter' && results[0]) go(results[0].to);
    };

    const onLogout = () => {
        setUserOpen(false);
        logout();
        nav('/login');
    };

    const toggleTheme = () => update({ theme: dark ? 'light' : 'dark' });

    return (
        <header className="app-header">
            <div className="crumbs">
                <span>Small ERP</span>
                <span className="sep">/</span>
                <b>{crumbOf(pathname)}</b>
            </div>

            <div className="search" ref={searchRef}>
                <Search size={16} />
                <input
                    ref={inputRef}
                    placeholder="Cari menu..."
                    value={q}
                    onChange={e => { setQ(e.target.value); setSearchOpen(true); }}
                    onFocus={() => setSearchOpen(true)}
                    onKeyDown={onSearchKey}
                />
                <kbd>Ctrl K</kbd>
                {searchOpen && term && (
                    <div className="pop">
                        {results.length === 0 && <div className="pop-empty">Menu "{q}" tidak ditemukan</div>}
                        {results.map(it => (
                            <button key={it.to} className="pop-item" onClick={() => go(it.to)}>
                                <span>{it.label}</span>
                                <small>{it.group}</small>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div className="header-actions">
                <button className="icon-btn-round" onClick={toggleTheme} title={dark ? 'Mode terang' : 'Mode gelap'}>
                    {dark ? <Sun size={18} /> : <Moon size={18} />}
                </button>

                <div className="user-menu" ref={userRef}>
                    <button className="user-btn" onClick={() => setUserOpen(o => !o)} aria-expanded={userOpen}>
                        <Avatar name={user?.username} size={34} />
                        <span className="user-btn-text">
                            <b>{user?.username}</b>
                            <small>{user?.role}</small>
                        </span>
                        <ChevronDown size={16} className={userOpen ? 'rot' : ''} />
                    </button>

                    {userOpen && (
                        <div className="pop user-pop">
                            <div className="pop-head">
                                <Avatar name={user?.username} size={44} />
                                <div>
                                    <b>{user?.username}</b>
                                    <small>{user?.role}</small>
                                </div>
                            </div>
                            <div className="pop-sep" />
                            <Link to="/profile" className="pop-item" onClick={() => setUserOpen(false)}>
                                <User size={16} /> Profil saya
                            </Link>
                            <Link to="/settings" className="pop-item" onClick={() => setUserOpen(false)}>
                                <Settings size={16} /> Pengaturan
                            </Link>
                            <div className="pop-sep" />
                            <button className="pop-item danger" onClick={onLogout}>
                                <LogOut size={16} /> Keluar
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}