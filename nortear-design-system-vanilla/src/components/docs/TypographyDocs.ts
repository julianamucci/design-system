import { createFoundationsDocs } from './shared/foundationsRenderer';
import translations from '@shared/content/foundations/tipografia/translations.json';

// Specimens visuais usando os elementos HTML padrão — as regras `.nds-type-specimen` (typography.css) aplicam o type scale ativo.
// Textos vêm de translations.json (specimens.*), registrados via addText para
// reagirem à troca de locale; nds-m-0 zera as margens NATIVAS dos elementos base.
export function createTypographyDocs(): HTMLElement {
  return createFoundationsDocs({
    translations: translations as Record<string, unknown>,
    componentSlug: 'tipografia',
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
      card.className = 'nds-type-specimen nds-stack nds-rounded-lg nds-border-default nds-p-6 nds-bg-card';
      card.dataset.spacing = 'md';
      for (const [tag, key] of [
        ['h1', 'specimens.h1'],
        ['h2', 'specimens.h2'],
        ['h3', 'specimens.h3'],
        ['h4', 'specimens.h4'],
      ] as const) {
        const el = document.createElement(tag);
        el.className = 'nds-m-0';
        addText(el, key);
        card.appendChild(el);
      }
      const body = document.createElement('p');
      body.className = 'nds-m-0 nds-text-foreground';
      addText(body, 'specimens.body', true);
      const label = document.createElement('label');
      label.className = 'nds-block nds-text-foreground';
      addText(label, 'specimens.label');
      card.append(body, label);

      section.append(head, card);
      return section;
    },
  });
}
