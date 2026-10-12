import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';
export type Accent = 'blue' | 'violet' | 'emerald' | 'amber' | 'rose';

export const ACCENTS: Accent[] = ['blue', 'violet', 'emerald', 'amber', 'rose'];

// Must match the key used by the inline script in templates/wrapper.blade.php,
// which applies the theme before the first paint.
export const THEME_STORAGE_KEY = 'panel:theme';
export const ACCENT_STORAGE_KEY = 'panel:accent';

interface ThemeContextValue {
    mode: ThemeMode;
    resolved: ResolvedTheme;
    setMode: (mode: ThemeMode, origin?: { x: number; y: number }) => void;
    accent: Accent;
    setAccent: (accent: Accent) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
    mode: 'system',
    resolved: 'dark',
    setMode: () => undefined,
    accent: 'blue',
    setAccent: () => undefined,
});

const media = (): MediaQueryList | null =>
    typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

const readStoredMode = (): ThemeMode => {
    try {
        const value = window.localStorage.getItem(THEME_STORAGE_KEY);
        if (value === 'light' || value === 'dark' || value === 'system') {
            return value;
        }
    } catch (e) {
        // Storage can be unavailable (private mode, blocked cookies); fall through.
    }
    return 'system';
};

const readStoredAccent = (): Accent => {
    try {
        const value = window.localStorage.getItem(ACCENT_STORAGE_KEY) as Accent | null;
        if (value && ACCENTS.includes(value)) {
            return value;
        }
    } catch (e) {
        // Fall through to the default accent.
    }
    return 'blue';
};

const resolve = (mode: ThemeMode): ResolvedTheme => {
    if (mode !== 'system') return mode;
    return media()?.matches === false ? 'light' : 'dark';
};

const applyToDocument = (theme: ResolvedTheme) => {
    const root = document.documentElement;
    root.dataset.theme = theme;

    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
        meta.setAttribute('content', `rgb(${getComputedStyle(root).getPropertyValue('--app').trim()})`);
    }

    window.dispatchEvent(new CustomEvent('panel:theme', { detail: theme }));
};

/**
 * Reads a theme token (e.g. "fg-muted") from the document and returns it as an
 * rgba() string. Used where CSS variables cannot be consumed directly, such as
 * canvas based charts.
 */
export const readToken = (name: string, alpha = 1): string => {
    const value = getComputedStyle(document.documentElement).getPropertyValue(`--${name}`).trim();
    const [r, g, b] = value.split(/\s+/);

    return `rgba(${r || 0}, ${g || 0}, ${b || 0}, ${alpha})`;
};

export const ThemeProvider: React.FC = ({ children }) => {
    const [mode, setModeState] = useState<ThemeMode>(readStoredMode);
    const [resolved, setResolved] = useState<ResolvedTheme>(() => resolve(readStoredMode()));
    const [accent, setAccentState] = useState<Accent>(readStoredAccent);

    const setAccent = useCallback((next: Accent) => {
        try {
            window.localStorage.setItem(ACCENT_STORAGE_KEY, next);
        } catch (e) {
            // Not persisted, still applied for this page view.
        }
        document.documentElement.dataset.accent = next;
        setAccentState(next);
        window.dispatchEvent(new CustomEvent('panel:accent', { detail: next }));
    }, []);

    const setMode = useCallback((next: ThemeMode, origin?: { x: number; y: number }) => {
        try {
            window.localStorage.setItem(THEME_STORAGE_KEY, next);
        } catch (e) {
            // Not persisted, still applied for this page view.
        }

        const theme = resolve(next);
        const update = () => {
            applyToDocument(theme);
            setModeState(next);
            setResolved(theme);
        };

        const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown };
        const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

        if (!doc.startViewTransition || reduceMotion || theme === document.documentElement.dataset.theme) {
            update();
            return;
        }

        const x = origin?.x ?? window.innerWidth / 2;
        const y = origin?.y ?? window.innerHeight / 2;
        const root = document.documentElement.style;
        root.setProperty('--reveal-x', `${x}px`);
        root.setProperty('--reveal-y', `${y}px`);
        root.setProperty(
            '--reveal-r',
            `${Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y))}px`
        );

        doc.startViewTransition(update);
    }, []);

    // Keep following the operating system while in "system" mode.
    useEffect(() => {
        const query = media();
        if (!query || mode !== 'system') return;

        const listener = () => {
            const theme = resolve('system');
            applyToDocument(theme);
            setResolved(theme);
        };

        query.addEventListener ? query.addEventListener('change', listener) : query.addListener(listener);

        return () => {
            query.removeEventListener ? query.removeEventListener('change', listener) : query.removeListener(listener);
        };
    }, [mode]);

    // Make sure the document matches state on mount (covers pages rendered
    // without the inline bootstrap script).
    useEffect(() => {
        if (document.documentElement.dataset.theme !== resolved) {
            applyToDocument(resolved);
        }
        document.documentElement.dataset.accent = accent;
    }, []);

    return (
        <ThemeContext.Provider value={{ mode, resolved, setMode, accent, setAccent }}>{children}</ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
