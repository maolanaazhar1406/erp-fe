// Penghitung request yang sedang berjalan, dipakai oleh progress bar global
let pending = 0;
const listeners = new Set();

const emit = () => listeners.forEach(fn => fn(pending));

export const loadingState = {
    start() { pending++; emit(); },
    end() { pending = Math.max(0, pending - 1); emit(); },
};

export function subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
}