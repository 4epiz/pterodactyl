const colors = require('tailwindcss/colors');

// Theme colours are CSS variables (space separated RGB channels) defined in
// resources/scripts/assets/tailwind.css for both the light and dark themes. The
// function form keeps opacity modifiers working in both Tailwind 3 and the
// Tailwind 2 copy bundled with twin.macro.
const v = (name) => ({ opacityVariable, opacityValue }) => {
    if (opacityValue !== undefined) {
        return `rgb(var(--${name}) / ${opacityValue})`;
    }
    if (opacityVariable !== undefined) {
        return `rgb(var(--${name}) / var(${opacityVariable}, 1))`;
    }
    return `rgb(var(--${name}))`;
};

const scale = (name) =>
    [50, 100, 200, 300, 400, 500, 600, 700, 800, 900].reduce(
        (acc, step) => ({ ...acc, [step]: v(`${name}-${step}`) }),
        {}
    );

const gray = scale('gray');

module.exports = {
    // "dark:" utilities follow the theme switcher rather than the OS setting.
    darkMode: ['selector', '[data-theme="dark"]'],
    content: [
        './resources/scripts/**/*.{js,ts,tsx}',
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['"Geist Variable"', 'system-ui', '-apple-system', '"Segoe UI"', 'sans-serif'],
                header: ['"Geist Variable"', 'system-ui', 'sans-serif'],
                mono: ['"Geist Mono Variable"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
            },
            colors: {
                black: v('black'),
                // "primary" is the ink colour: near black in the light theme and near
                // white in the dark theme.
                primary: scale('primary'),
                gray: gray,
                neutral: gray,
                cyan: colors.cyan,
                // Semantic tokens used by the theme components.
                app: v('app'),
                surface: { DEFAULT: v('surface'), 0: v('surface-0'), 2: v('surface-2'), 3: v('surface-3') },
                line: { DEFAULT: v('line'), strong: v('line-strong') },
                fg: { DEFAULT: v('fg'), muted: v('fg-muted'), subtle: v('fg-subtle') },
                ink: { DEFAULT: v('ink'), fg: v('ink-fg') },
                accent: { DEFAULT: v('accent'), fg: v('accent-fg'), text: v('accent-text') },
            },
            fontSize: {
                '2xs': '0.625rem',
            },
            borderRadius: {
                xl: '1rem',
                '2xl': '1.375rem',
                '3xl': '1.75rem',
            },
            boxShadow: {
                card: 'inset 0 1px 0 rgb(var(--highlight) / var(--highlight-alpha)), 0 0 0 1px rgb(var(--line)), 0 1px 2px rgb(var(--shadow) / 0.05)',
                pop: 'inset 0 1px 0 rgb(var(--highlight) / var(--highlight-alpha)), 0 0 0 1px rgb(var(--line)), 0 24px 48px -16px rgb(var(--shadow) / 0.45)',
            },
            transitionDuration: {
                250: '250ms',
            },
            borderColor: theme => ({
                default: theme('colors.line.DEFAULT', 'currentColor'),
            }),
        },
    },
    plugins: [
        require('@tailwindcss/line-clamp'),
        require('@tailwindcss/forms')({
            strategy: 'class',
        }),
    ]
};
