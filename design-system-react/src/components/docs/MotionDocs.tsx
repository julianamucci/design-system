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
    <section className="space-y-6 border-t border-border/50 pt-8">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold text-foreground m-0">Specimens</h2>
        <p className="text-sm text-muted-foreground m-0">
          Passe o mouse sobre cada botão para sentir as três durações do sistema.
        </p>
      </div>

      <div className="flex flex-wrap gap-4 p-6 bg-card rounded-lg border border-border/50">
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
