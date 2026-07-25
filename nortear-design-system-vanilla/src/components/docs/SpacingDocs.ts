import { createFoundationsDocs } from './shared/foundationsRenderer';
import translations from '@shared/content/foundations/espacamento/translations.json';

// Barras coloridas com largura igual a cada token de spacing — visualiza a
// escala em pixels concretos. Width aplicado via var(--spacing-*) reage à
// densidade ativa (condensado / default / confortável).
const SPACING_TOKENS: Array<{ name: string; varName: string; px: string }> = [
  { name: 'spacing-px', varName: '--spacing-px', px: '1px' },
  { name: 'spacing-0-5', varName: '--spacing-0-5', px: '2px' },
  { name: 'spacing-1', varName: '--spacing-1', px: '4px' },
  { name: 'spacing-2', varName: '--spacing-2', px: '8px' },
  { name: 'spacing-4', varName: '--spacing-4', px: '16px' },
  { name: 'spacing-6', varName: '--spacing-6', px: '24px' },
  { name: 'spacing-8', varName: '--spacing-8', px: '32px' },
  { name: 'spacing-10', varName: '--spacing-10', px: '40px' },
  { name: 'spacing-12', varName: '--spacing-12', px: '48px' },
  { name: 'spacing-14', varName: '--spacing-14', px: '56px' },
  { name: 'spacing-16', varName: '--spacing-16', px: '64px' },
  { name: 'spacing-20', varName: '--spacing-20', px: '80px' },
  { name: 'spacing-24', varName: '--spacing-24', px: '96px' },
];

export function createSpacingDocs(): HTMLElement {
  return createFoundationsDocs({
    translations: translations as Record<string, unknown>,
    componentSlug: 'espacamento',
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

      const card = document.createElement('div');
      card.className = 'nds-stack nds-bg-card nds-border-soft nds-rounded-lg nds-p-6';
      card.dataset.spacing = 'sm';
      for (const tok of SPACING_TOKENS) {
        const row = document.createElement('div');
        row.className = 'nds-row';
        row.dataset.align = 'center';
        row.dataset.spacing = 'md';

        const code = document.createElement('code');
        code.className = 'nds-text-caption nds-text-muted-foreground nds-shrink-0';
        code.style.width = '8rem';
        code.textContent = tok.name;

        const bar = document.createElement('div');
        bar.className = 'nds-bg-primary nds-rounded-sm nds-shrink-0';
        bar.style.width = `var(${tok.varName})`;
        bar.style.height = 'var(--spacing-4)';
        bar.setAttribute('aria-hidden', 'true');

        const px = document.createElement('span');
        px.className = 'nds-text-caption nds-text-muted-foreground';
        px.textContent = tok.px;

        row.append(code, bar, px);
        card.appendChild(row);
      }

      section.append(head, card);
      return section;
    },
  });
}
