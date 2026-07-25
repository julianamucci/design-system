import { createFoundationsDocs } from './shared/foundationsRenderer';
import { createButton } from '@/components/ui/button';
import translations from '@shared/content/foundations/motion/translations.json';

const DURATIONS = [
  { token: '--transition-fast', label: 'fast — 150ms' },
  { token: '--transition-normal', label: 'normal — 300ms' },
  { token: '--transition-slow', label: 'slow — 500ms' },
];

// Specimens: botões com hover demonstrando cada duração. O timing-function é
// o token padrão do sistema (cubic-bezier(.4,0,.2,1)). prefers-reduced-motion
// é tratado globalmente pelo motion.css — não precisa de tratamento aqui.
export function createMotionDocs(): HTMLElement {
  return createFoundationsDocs({
    translations: translations as Record<string, unknown>,
    componentSlug: 'motion',
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

      const cluster = document.createElement('div');
      cluster.className = 'nds-cluster nds-p-6 nds-bg-card nds-rounded-lg nds-border-soft';
      cluster.dataset.spacing = 'md';
      for (const d of DURATIONS) {
        const btn = createButton({
          variant: 'outline',
          label: d.label,
          class: 'nds-hover-bg-primary nds-hover-text-primary-foreground nds-hover-scale-105',
        });
        btn.style.transitionProperty = 'background-color, color, transform';
        btn.style.transitionDuration = `var(${d.token})`;
        btn.style.transitionTimingFunction = 'var(--transition-timing, cubic-bezier(0.4, 0, 0.2, 1))';
        cluster.appendChild(btn);
      }

      section.append(head, cluster);
      return section;
    },
  });
}
