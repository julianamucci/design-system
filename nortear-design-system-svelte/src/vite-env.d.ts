/// <reference types="vite/client" />

// TS 6 (TS2882) exige declaração para side-effect imports de CSS
// (.storybook/preview.ts → globals.css)
declare module '*.css';
