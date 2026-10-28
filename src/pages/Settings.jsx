import { Monitor, Sun, Moon, Check, RotateCcw, Rows3, Rows4 } from 'lucide-react';
import { usePrefs, ACCENTS } from '../context/PrefsContext';

const THEMES = [
    { value: 'light', label: 'Terang', icon: Sun },
    { value: 'dark', label: 'Gelap', icon: Moon },
    { value: 'system', label: 'Sistem', icon: Monitor },
];

export default function Settings() {
    const { prefs, update, reset } = usePrefs();

    return (
        <div className="settings">
            <div className="page-head">
                <h2>Pengaturan</h2>
                <p className="muted">Perubahan langsung tersimpan di perangkat ini.</p>
            </div>

            <section className="card set-section">
                <h4>Tema</h4>
                <div className="theme-grid">
                    {THEMES.map(t => {
                        const Icon = t.icon;
                        const on = prefs.theme === t.value;
                        return (
                            <button
                                key={t.value}
                                className={`theme-card t-${t.value}${on ? ' on' : ''}`}
                                onClick={() => update({ theme: t.value })}
                            >
                                <span className="theme-preview"><span /><span /><span /></span>
                                <span className="theme-label">
                                    <Icon size={16} /> {t.label}
                                    {on && <Check size={14} className="check" />}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </section>

            <section className="card set-section">
                <h4>Warna aksen</h4>
                <div className="swatches">
                    {Object.entries(ACCENTS).map(([key, a]) => (
                        <button
                            key={key}
                            title={a.label}
                            className={`swatch${prefs.accent === key ? ' on' : ''}`}
                            style={{ '--sw': a.color }}
                            onClick={() => update({ accent: key })}
                        >
                            {prefs.accent === key && <Check size={14} />}
                        </button>
                    ))}
                </div>
                <p className="muted">Dipakai untuk tombol, menu aktif, dan highlight.</p>
            </section>

            <section className="card set-section">
                <h4>Kepadatan tabel</h4>
                <div className="seg">
                    <button className={!prefs.compact ? 'on' : ''} onClick={() => update({ compact: false })}>
                        <Rows3 size={15} /> Nyaman
                    </button>
                    <button className={prefs.compact ? 'on' : ''} onClick={() => update({ compact: true })}>
                        <Rows4 size={15} /> Ringkas
                    </button>
                </div>
            </section>

            <section className="card set-section">
                <div className="set-row">
                    <div>
                        <h4>Animasi</h4>
                        <p className="muted">Matikan untuk tampilan yang lebih tenang atau perangkat yang terasa berat.</p>
                    </div>
                    <label className="switch">
                        <input type="checkbox" checked={prefs.motion} onChange={e => update({ motion: e.target.checked })} />
                        <span />
                    </label>
                </div>
            </section>

            <div className="row" style={{ justifyContent: 'flex-end' }}>
                <button className="ghost" onClick={reset}>
                    <RotateCcw size={15} /> Kembalikan default
                </button>
            </div>
        </div>
    );
}