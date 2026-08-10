import '../src/lib/reload-on-chunk-error';
import { getThemeFromSubdomain } from '@shared/themes/theme-config';
import type { Preview } from '@storybook/angular-vite';
import { applicationConfig } from '@storybook/angular-vite';
import { provideZonelessChangeDetection } from '@angular/core';
import { withThemeByClassName } from '@storybook/addon-themes';
import { useEffect } from 'storybook/preview-api';
import '../src/styles/globals.css';
import '../src/styles/storybook-docs.css';

function applyClasses(
  brand: string,
  density: string,
  font: string,
  typescale: string,
  typebase: string,
) {
  const html = document.documentElement;
  const ours = new Set([
    'tema-default', 'tema-warm', 'tema-cold',
    'densidade-default', 'densidade-condensado', 'densidade-confortavel',
    'fonte-default', 'fonte-lexend', 'fonte-pt-serif', 'fonte-lxgw-wenkai',
    'escala-minor-second', 'escala-major-second', 'escala-minor-third', 'escala-major-third',
    'escala-perfect-fourth', 'escala-augmented-fourth', 'escala-perfect-fifth', 'escala-golden',
    'base-tipo-s', 'base-tipo-m', 'base-tipo-l',
  ]);
  const preserved = Array.from(html.classList).filter((c) => !ours.has(c));
  html.className = [
    ...preserved,
    `tema-${brand}`,
    `densidade-${density}`,
    `fonte-${font}`,
    `escala-${typescale}`,
    `base-tipo-${typebase}`,
  ].join(' ');
}

function applyMotion(motion: string) {
  const html = document.documentElement;
  if (motion === 'reduce') html.dataset['reducedMotion'] = 'true';
  else delete html.dataset['reducedMotion'];
}

const preview: Preview = {
  decorators: [
    // Zoneless: o Radix NG é signals-first e o Angular 21+ não precisa de
    // zone.js. Declarado aqui (e não em cada story) para que todas as stories
    // e o bridge do withAutoDocsTab rodem sob o mesmo modo de detecção.
    applicationConfig({
      providers: [provideZonelessChangeDetection()],
    }),

    withThemeByClassName({
      themes: { light: '', dark: 'dark' },
      defaultTheme: 'light',
      parentSelector: 'html',
    }),

    // Varre portais órfãos deixados pela story anterior. O Storybook troca o
    // canvas sem destruir o que foi projetado em document.body — mesma
    // necessidade das outras stacks.
    (Story) => {
      if (typeof document !== 'undefined') {
        const stalePortalSelectors = [
          '[data-slot="popover-content"]',
          '[data-slot="sheet-content"]',
          '[data-slot="sheet-overlay"]',
          '[data-slot="tooltip-content"]',
          '[data-slot="hover-card-content"]',
          '[data-slot="dropdown-menu-content"]',
          '[data-slot="dialog-content"]',
          '[data-slot="dialog-overlay"]',
          '.nds-dropdown-menu-content',
          '.nds-hover-card-content',
          '.nds-popover-content',
          '.nds-tooltip-content',
          '.nds-context-menu-content',
          '[role="menu"]',
          '[role="dialog"]',
          '[role="tooltip"]',
          '[role="listbox"]',
        ];
        document.querySelectorAll(stalePortalSelectors.join(',')).forEach((node) => {
          const root = document.getElementById('storybook-root');
          if (!root || !root.contains(node)) node.remove();
        });
      }
      return Story();
    },

    (Story, context) => {
      const brand = (context.globals['brand'] as string) || 'default';
      const density = (context.globals['density'] as string) || 'default';
      const font = (context.globals['font'] as string) || 'default';
      const typescale = (context.globals['typescale'] as string) || 'minor-third';
      const typebase = (context.globals['typebase'] as string) || 'm';
      const motion = (context.globals['motion'] as string) || 'default';
      useEffect(() => {
        applyClasses(brand, density, font, typescale, typebase);
        applyMotion(motion);
      }, [brand, density, font, typescale, typebase, motion]);
      return Story();
    },
  ],

  parameters: {
    options: {
      storySort: {
        order: [
          'About', ['Overview', 'Accessibility', 'Analytics', 'SEO and GEO', 'Tone of Voice'],
          'Foundations', ['Getting Started', 'Colors and Themes', 'Typography', 'Spacing', 'Elevation, Borders and Shadows', 'Icons', 'Motion', 'Densities', 'Theme System', 'Internationalization', 'Cross-Stack Divergences'],
          'UI', ['*', ['Docs', 'Playground', 'Variants', 'Sizes', 'Compositions', 'States', '*']],
          '*',
        ],
      },
    },
    a11y: {
      test: 'error',
      config: { rules: [{ id: 'target-size', enabled: true }] },
    },
    docs: {
      codePanel: true,
      canvas: { sourceState: 'shown' },
      source: { type: 'dynamic', excludeDecorators: true },
    },
  },

  globalTypes: {
    brand: {
      description: 'Tema de cor (Default / Warm / Cold)',
      defaultValue: getThemeFromSubdomain(),
      toolbar: {
        title: 'Theme',
        icon: 'paintbrush',
        items: [
          { value: 'default', title: 'Default' },
          { value: 'warm', title: 'Warm' },
          { value: 'cold', title: 'Cold' },
        ],
        // @ts-expect-error — showName is valid at runtime but missing in some type definitions
        showName: true,
      },
    },
    density: {
      description: 'Densidade (afeta padding, gap, margin e alturas)',
      defaultValue: 'default',
      toolbar: {
        title: 'Density',
        icon: 'grow',
        items: [
          { value: 'condensado', title: 'Condensado' },
          { value: 'default', title: 'Default' },
          { value: 'confortavel', title: 'Confortável' },
        ],
        // @ts-expect-error — showName is valid at runtime but missing in some type definitions
        showName: true,
      },
    },
    font: {
      description: 'Fonte da interface',
      defaultValue: 'default',
      toolbar: {
        title: 'Font',
        icon: 'type',
        items: [
          { value: 'default', title: 'Inter (padrão)' },
          { value: 'lexend', title: 'Lexend' },
          { value: 'pt-serif', title: 'PT Serif' },
          { value: 'lxgw-wenkai', title: 'LXGW WenKai TC' },
        ],
        // @ts-expect-error — showName is valid at runtime but missing in some type definitions
        showName: true,
      },
    },
    typescale: {
      description: 'Type scale — ratio entre os degraus tipográficos (modelo typescale.com)',
      defaultValue: 'minor-third',
      toolbar: {
        title: 'Type scale',
        icon: 'ruler',
        items: [
          { value: 'minor-second', title: '1.067 — Minor Second' },
          { value: 'major-second', title: '1.125 — Major Second' },
          { value: 'minor-third', title: '1.200 — Minor Third (padrão)' },
          { value: 'major-third', title: '1.250 — Major Third' },
          { value: 'perfect-fourth', title: '1.333 — Perfect Fourth' },
          { value: 'augmented-fourth', title: '1.414 — Augmented Fourth' },
          { value: 'perfect-fifth', title: '1.500 — Perfect Fifth' },
          { value: 'golden', title: '1.618 — Golden Ratio' },
        ],
        // @ts-expect-error — showName is valid at runtime but missing in some type definitions
        showName: true,
      },
    },
    typebase: {
      description: 'Base do type scale (rem — respeita a preferência de fonte do navegador)',
      defaultValue: 'm',
      toolbar: {
        title: 'Type base',
        icon: 'zoom',
        items: [
          { value: 's', title: 'S — 0.875rem' },
          { value: 'm', title: 'M — 1rem (padrão)' },
          { value: 'l', title: 'L — 1.125rem' },
        ],
        // @ts-expect-error — showName is valid at runtime but missing in some type definitions
        showName: true,
      },
    },
    motion: {
      description: 'Reduced motion — força animações instantâneas (WCAG 2.3.3)',
      defaultValue: 'default',
      toolbar: {
        title: 'Motion',
        icon: 'play',
        items: [
          { value: 'default', title: 'Respeita SO' },
          { value: 'reduce', title: 'Reduzido (forçado)' },
        ],
        // @ts-expect-error — showName is valid at runtime but missing in some type definitions
        showName: true,
      },
    },
  },
};

export default preview;
