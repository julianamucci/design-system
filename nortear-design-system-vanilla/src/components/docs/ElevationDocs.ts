import { createFoundationsDocs } from './shared/foundationsRenderer';
import translations from '@shared/content/foundations/elevacao-bordas-sombras/translations.json';

const ELEVATIONS: Array<{ token: string | null; label: string }> = [
  { token: null, label: '0 — Plano' },
  { token: '--elevation-sm', label: '1 — Card' },
  { token: '--elevation-md', label: '2 — Dropdown' },
  { token: '--elevation-lg', label: '3 — Dialog' },
  { token: '--elevation-xl', label: '4 — Tooltip' },
];

const RADII: Array<{ token: string | null; label: string }> = [
  { token: '--radius-none', label: 'none' },
  { token: '--radius-xs', label: 'xs' },
  { token: '--radius-sm', label: 'sm' },
  { token: '--radius-md', label: 'md' },
  { token: '--radius-lg', label: 'lg' },
  { token: '--radius-xl', label: 'xl' },
  { token: '--radius-full', label: 'full' },
];

export function createElevationDocs(): HTMLElement {
  return createFoundationsDocs({
    translations: translations as Record<string, unknown>,
    componentSlug: 'elevacao-bordas-sombras',
    extraSection: ({ addText }) => {
      const section = document.createElement('section');
      section.className = 'nds-stack nds-docs-section-divider';
      section.dataset.spacing = 'md';

      const head = document.createElement('div');
      head.className = 'nds-stack';
      head.dataset.spacing = 'xs';
      const title = document.createElement('h2');
      title.className = 'nds-text-h2 nds-text-foreground';
      addText(title, 'specimens.title');
      const subtitle = document.createElement('p');
      subtitle.className = 'nds-text-body';
      addText(subtitle, 'specimens.subtitle');
      head.append(title, subtitle);
      section.appendChild(head);

      // Sombras
      const shadowsBlock = document.createElement('div');
      shadowsBlock.className = 'nds-stack';
      shadowsBlock.dataset.spacing = 'sm';
      const shadowsTitle = document.createElement('h3');
      shadowsTitle.className = 'nds-text-body nds-font-medium';
      addText(shadowsTitle, 'specimens.shadows');
      const shadowsGrid = document.createElement('div');
      shadowsGrid.className = 'nds-grid nds-p-6 nds-rounded-lg';
      shadowsGrid.dataset.spacing = 'lg';
      shadowsGrid.style.setProperty('--grid-min', '8rem');
      shadowsGrid.style.backgroundColor = 'hsl(var(--muted) / 0.2)';
      for (const el of ELEVATIONS) {
        const card = document.createElement('div');
        card.className = 'nds-bg-card nds-border-soft nds-rounded-lg nds-p-4 nds-text-caption nds-text-muted-foreground nds-text-center';
        if (el.token) card.style.boxShadow = `var(${el.token})`;
        const label = document.createElement('div');
        label.className = 'nds-font-medium nds-text-foreground nds-mb-1';
        label.textContent = el.label;
        const code = document.createElement('code');
        code.style.fontSize = '10px';
        code.textContent = el.token ?? '—';
        card.append(label, code);
        shadowsGrid.appendChild(card);
      }
      shadowsBlock.append(shadowsTitle, shadowsGrid);
      section.appendChild(shadowsBlock);

      // Radius
      const radiusBlock = document.createElement('div');
      radiusBlock.className = 'nds-stack';
      radiusBlock.dataset.spacing = 'sm';
      const radiusTitle = document.createElement('h3');
      radiusTitle.className = 'nds-text-body nds-font-medium';
      addText(radiusTitle, 'specimens.radius');
      const radiusGrid = document.createElement('div');
      radiusGrid.className = 'nds-grid';
      radiusGrid.dataset.spacing = 'md';
      radiusGrid.style.setProperty('--grid-min', '8rem');
      for (const r of RADII) {
        const card = document.createElement('div');
        card.className = 'nds-bg-primary-soft nds-border-primary-soft nds-p-6 nds-text-caption nds-text-muted-foreground nds-text-center';
        if (r.token) card.style.borderRadius = `var(${r.token})`;
        else card.classList.add('nds-rounded-full');
        const code = document.createElement('code');
        code.textContent = r.token ?? '.nds-rounded-full';
        card.appendChild(code);
        radiusGrid.appendChild(card);
      }
      radiusBlock.append(radiusTitle, radiusGrid);
      section.appendChild(radiusBlock);

      // Raio aninhado — Rᵢ = Rₑ − E: 14 → 10 → 6 com inset p-1 (4px) por nível
      const nestedBlock = document.createElement('div');
      nestedBlock.className = 'nds-stack';
      nestedBlock.dataset.spacing = 'sm';
      const nestedTitle = document.createElement('h3');
      nestedTitle.className = 'nds-text-body nds-font-medium';
      addText(nestedTitle, 'specimens.nested');
      const nestedGrid = document.createElement('div');
      nestedGrid.className = 'nds-grid';
      nestedGrid.dataset.spacing = 'md';
      nestedGrid.style.setProperty('--grid-min', '12rem');

      const nestedDemo = (radii: [string, string, string], labelKey: string) => {
        const wrap = document.createElement('div');
        wrap.className = 'nds-stack';
        wrap.dataset.spacing = 'xs';
        const outer = document.createElement('div');
        outer.className = 'nds-bg-primary-soft nds-p-1';
        outer.style.borderRadius = `var(${radii[0]})`;
        const mid = document.createElement('div');
        mid.className = 'nds-bg-card nds-p-1';
        mid.style.borderRadius = `var(${radii[1]})`;
        const inner = document.createElement('div');
        inner.className = 'nds-bg-primary-soft nds-p-6';
        inner.style.borderRadius = `var(${radii[2]})`;
        mid.appendChild(inner);
        outer.appendChild(mid);
        const label = document.createElement('span');
        label.className = 'nds-text-caption nds-text-muted-foreground';
        addText(label, labelKey);
        wrap.append(outer, label);
        return wrap;
      };
      nestedGrid.append(
        nestedDemo(['--radius-xl', '--radius', '--radius-sm'], 'specimens.nestedOk'),
        nestedDemo(['--radius-xl', '--radius-xl', '--radius-xl'], 'specimens.nestedBad'),
      );
      nestedBlock.append(nestedTitle, nestedGrid);
      section.appendChild(nestedBlock);

      return section;
    },
  });
}
