import tw from 'twin.macro';
import { createGlobalStyle } from 'styled-components/macro';
// @ts-expect-error untyped font file
import sans from '@fontsource-variable/geist/files/geist-latin-wght-normal.woff2';
// @ts-expect-error untyped font file
import sansExt from '@fontsource-variable/geist/files/geist-latin-ext-wght-normal.woff2';
// @ts-expect-error untyped font file
import mono from '@fontsource-variable/geist-mono/files/geist-mono-latin-wght-normal.woff2';

export default createGlobalStyle`
    @font-face {
        font-family: 'Geist Variable';
        font-style: normal;
        font-display: swap;
        font-weight: 100 900;
        src: url(${sans}) format('woff2-variations');
        unicode-range: U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD;
    }

    @font-face {
        font-family: 'Geist Variable';
        font-style: normal;
        font-display: swap;
        font-weight: 100 900;
        src: url(${sansExt}) format('woff2-variations');
        unicode-range: U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF;
    }

    @font-face {
        font-family: 'Geist Mono Variable';
        font-style: normal;
        font-display: swap;
        font-weight: 100 900;
        src: url(${mono}) format('woff2-variations');
    }

    html {
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        text-rendering: optimizeLegibility;
    }

    body {
        ${tw`font-sans bg-app text-fg`};
        font-feature-settings: 'ss01', 'cv11';
        letter-spacing: -0.005em;
    }

    h1, h2, h3, h4, h5, h6 {
        ${tw`font-medium font-header text-fg`};
        letter-spacing: -0.02em;
    }

    p {
        ${tw`text-fg-muted leading-snug font-sans`};
    }

    a {
        ${tw`transition-colors duration-150`};
    }

    code, pre, kbd {
        ${tw`font-mono`};
    }

    form {
        ${tw`m-0`};
    }

    textarea, select, input, button, button:focus, button:focus-visible {
        ${tw`outline-none`};
    }

    :focus-visible {
        outline: 2px solid rgb(var(--ink) / 0.55);
        outline-offset: 2px;
    }

    input[type=number]::-webkit-outer-spin-button,
    input[type=number]::-webkit-inner-spin-button {
        -webkit-appearance: none !important;
        margin: 0;
    }

    input[type=number] {
        -moz-appearance: textfield !important;
    }

    /* Scroll Bar Style */
    * {
        scrollbar-width: thin;
        scrollbar-color: rgb(var(--line-strong)) transparent;
    }

    ::-webkit-scrollbar {
        background: none;
        width: 12px;
        height: 12px;
    }

    ::-webkit-scrollbar-thumb {
        border: 3px solid transparent;
        border-radius: 999px;
        background-clip: padding-box;
        background-color: rgb(var(--line-strong));
    }

    ::-webkit-scrollbar-thumb:hover {
        background-color: rgb(var(--fg-subtle));
    }

    ::-webkit-scrollbar-corner {
        background: transparent;
    }
`;
