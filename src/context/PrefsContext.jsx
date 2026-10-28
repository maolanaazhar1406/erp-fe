import { createContext, useContext, useEffect, useState } from 'react';

const KEY = 'erp_prefs';
const SYSTEM_DARK = '(prefers-color-scheme: dark)';

export const ACCENTS = {
    blue: { label: 'Biru', color: '#2563eb' },
    violet: { label: 'Ungu', color: '#7c3aed' },
    emerald: { label: 'Hijau', color: '#059669' },
    rose: { label: 'Merah muda', color: '#e11d48' },
    amber: { label: 'Oranye', color: '#d97706' },
};

const DEFAULTS = { theme: 'system', accent: 'blue', compact: false, motion: true };

const load = () => {
    try {
        return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || '{}') };
    } catch {
        return DEFAULTS;
    }
};

const PrefsContext = createContext(null);

export function PrefsProvider({ children }) {
    const [prefs, setPrefs] = useState(load);
    const [systemDark, setSystemDark] = useState(() => window.matchMedia(SYSTEM_DARK).matches);

    useEffect(() => {
        const mq = window.matchMedia(SYSTEM_DARK);
        const onChange = e => setSystemDark(e.matches);
        mq.addEventListener('change', onChange);
        return () => mq.removeEventListener('change', onChange);
    }, []);

    const dark = prefs.theme === 'dark' || (prefs.theme === 'system' && systemDark);

    useEffect(() => {
        localStorage.setItem(KEY, JSON.stringify(prefs));
        const root = document.documentElement;
        root.dataset.theme = dark ? 'dark' : 'light';
        root.dataset.density = prefs.compact ? 'compact' : 'comfy';
        root.dataset.motion = prefs.motion ? 'on' : 'off';
        root.style.setProperty('--accent', (ACCENTS[prefs.accent] || ACCENTS.blue).color);
    }, [prefs, dark]);

    const update = patch => setPrefs(p => ({ ...p, ...patch }));
    const reset = () => setPrefs(DEFAULTS);

    return (
        <PrefsContext.Provider value={{ prefs, dark, update, reset }}>
            {children}
        </PrefsContext.Provider>
    );
}

export const usePrefs = () => useContext(PrefsContext);