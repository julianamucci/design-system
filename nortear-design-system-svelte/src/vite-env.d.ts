/// <reference types="vite/client" />

// TS 6 (TS2882) exige declaração para side-effect imports de CSS
// (main.ts/globals.css, .storybook/preview.ts, DocsEditor → quill.snow.css)
declare module '*.css';
