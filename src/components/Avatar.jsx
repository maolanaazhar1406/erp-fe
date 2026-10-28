export const initials = name =>
    (name || '?').split(/[\s._-]+/).filter(Boolean).slice(0, 2).map(s => s[0].toUpperCase()).join('') || '?';

export default function Avatar({ name = '', size = 36, className = '' }) {
    return (
        <span
            className={`avatar ${className}`.trim()}
            style={{ width: size, height: size, fontSize: Math.round(size * 0.38) }}
        >
            {initials(name)}
        </span>
    );
}