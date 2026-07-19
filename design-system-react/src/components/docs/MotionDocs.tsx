import { FoundationPage } from './shared/FoundationPage';
import { Button } from '@/components/ui/button';
import translations from '@shared/content/foundations/motion/translations.json';

const DURATIONS = [
  { token: '--transition-fast', label: 'fast — 150ms' },
  { token: '--transition-normal', label: 'normal — 300ms' },
  { token: '--transition-slow', label: 'slow — 500ms' },
];

// Specimens: botões com hover demonstrando cada duração. O timing-function é
// o token padrão do sistema (cubic-bezier(.4,0,.2,1)). prefers-reduced-motion
// é tratado globalmente pelo motion.css — não precisa de tratamento aqui.
function MotionSpecimens() {
  return (
    <section className="nds-stack nds-docs-section-divider" data-spacing="lg">
      <div className="nds-stack" data-spacing="xs">
        <h2 className="nds-text-h3 nds-font-semibold nds-text-foreground">Specimens</h2>
        <p className="nds-text-body nds-text-muted-foreground">
          Passe o mouse sobre cada botão para sentir as três durações do sistema.
        </p>
      </div>

      <div className="nds-cluster nds-p-6 nds-bg-card nds-rounded-lg nds-border-soft" data-spacing="md">
        {DURATIONS.map((d) => (
          <Button
            key={d.token}
            variant="outline"
            className="hover:bg-primary hover:text-primary-foreground hover:scale-105"
            style={{
              transitionProperty: 'background-color, color, transform',
              transitionDuration: `var(${d.token})`,
              transitionTimingFunction: 'var(--transition-timing, cubic-bezier(0.4, 0, 0.2, 1))',
            }}
          >
            {d.label}
          </Button>
        ))}
      </div>
    </section>
  );
}

export function MotionDocs() {
  return (
    <FoundationPage
      slug="motion"
      translations={translations}
      extraSection={<MotionSpecimens />}
    />
  );
}
