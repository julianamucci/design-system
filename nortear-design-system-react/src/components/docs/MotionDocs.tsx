import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FoundationPage } from './shared/FoundationPage';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/i18n';
import translations from '@shared/content/foundations/motion/translations.json';

const DURATIONS = [
  { token: '--transition-fast', label: 'fast — 150ms' },
  { token: '--transition-normal', label: 'normal — 300ms' },
  { token: '--transition-slow', label: 'slow — 500ms' },
];

const STAGGER_ITEMS = ['Item 1', 'Item 2', 'Item 3', 'Item 4', 'Item 5'];

const SPRING = { type: 'spring', stiffness: 400, damping: 22 } as const;

const CODE_SPRING = `// npm i motion
import { motion } from "motion/react";

<motion.div
  drag
  dragSnapToOrigin
  whileDrag={{ scale: 1.05 }}
  transition={{ type: "spring", stiffness: 400, damping: 22 }}
/>`;

const CODE_STAGGER = `{items.map((item, i) => (
  <motion.li
    key={item}
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: i * 0.06 }}
  >
    {item}
  </motion.li>
))}`;

const CODE_PRESENCE = `import { AnimatePresence, motion } from "motion/react";

<AnimatePresence>
  {open && (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
    />
  )}
</AnimatePresence>`;

// Specimens: botões com hover demonstrando cada duração. O timing-function é
// o token padrão do sistema (cubic-bezier(.4,0,.2,1)). prefers-reduced-motion
// é tratado globalmente pelo motion.css — não precisa de tratamento aqui.
function MotionSpecimens() {
  const { t } = useTranslation(translations);

  return (
    <section className="nds-stack nds-docs-section-divider" data-spacing="md">
      <div className="nds-stack" data-spacing="xs">
        <h2 className="nds-text-h2 nds-text-foreground">{t('specimens.title')}</h2>
        <p className="nds-text-body">{t('specimens.subtitle')}</p>
      </div>

      <div className="nds-cluster nds-p-6 nds-bg-card nds-rounded-lg nds-border-soft" data-spacing="md">
        {DURATIONS.map((d) => (
          <Button
            key={d.token}
            variant="outline"
            className="nds-hover-bg-primary nds-hover-text-primary-foreground nds-hover-scale-105"
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

interface DemoCardProps {
  title: string;
  desc: string;
  code: string;
  children: React.ReactNode;
}

function DemoCard({ title, desc, code, children }: DemoCardProps) {
  return (
    <div className="nds-stack" data-spacing="sm">
      <h3 className="nds-text-body nds-font-medium">{title}</h3>
      <p className="nds-text-body">{desc}</p>
      <div
        className="nds-bg-card nds-border-soft nds-rounded-lg nds-p-6 nds-cluster"
        data-align="center"
        data-justify="center"
        style={{ minHeight: '9rem', overflow: 'hidden' }}
      >
        {children}
      </div>
      <pre className="nds-code-block"><code>{code}</code></pre>
    </div>
  );
}

// Demos interativas da biblioteca Motion (MIT) — springs, stagger e presence.
// Micro-interações dos componentes continuam CSS-first (ver motion.css).
function AdvancedMotion() {
  const { t } = useTranslation(translations);
  const [run, setRun] = useState(0);
  const [show, setShow] = useState(true);

  return (
    <section className="nds-stack nds-docs-section-divider" data-spacing="md">
      <div className="nds-stack" data-spacing="xs">
        <h2 className="nds-text-h2 nds-text-foreground">{t('specimens.advanced.title')}</h2>
        <p className="nds-text-body">{t('specimens.advanced.subtitle')}</p>
      </div>

      <DemoCard
        title={t('specimens.advanced.spring.title')}
        desc={t('specimens.advanced.spring.desc')}
        code={CODE_SPRING}
      >
        <motion.div
          drag
          dragSnapToOrigin
          whileDrag={{ scale: 1.05 }}
          transition={SPRING}
          className="nds-bg-primary-soft nds-border-primary-soft nds-rounded-lg nds-p-4 nds-text-caption nds-font-medium nds-cursor-pointer"
          style={{ touchAction: 'none', userSelect: 'none' }}
        >
          {t('specimens.advanced.labels.drag')}
        </motion.div>
      </DemoCard>

      <DemoCard
        title={t('specimens.advanced.stagger.title')}
        desc={t('specimens.advanced.stagger.desc')}
        code={CODE_STAGGER}
      >
        <div className="nds-stack nds-w-full" data-spacing="sm">
          <div>
            <Button variant="outline" size="sm" onClick={() => setRun((n) => n + 1)}>
              {t('specimens.advanced.labels.replay')}
            </Button>
          </div>
          <ul key={run} className="nds-cluster nds-list-none" data-spacing="sm">
            {STAGGER_ITEMS.map((item, i) => (
              <motion.li
                key={item}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="nds-bg-muted-50 nds-rounded-md nds-px-4 nds-py-2 nds-text-caption"
              >
                {item}
              </motion.li>
            ))}
          </ul>
        </div>
      </DemoCard>

      <DemoCard
        title={t('specimens.advanced.presence.title')}
        desc={t('specimens.advanced.presence.desc')}
        code={CODE_PRESENCE}
      >
        <div className="nds-stack" data-spacing="sm" style={{ alignItems: 'center' }}>
          <Button variant="outline" size="sm" onClick={() => setShow((s) => !s)}>
            {show ? t('specimens.advanced.labels.hide') : t('specimens.advanced.labels.show')}
          </Button>
          <AnimatePresence>
            {show && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="nds-bg-primary-soft nds-border-primary-soft nds-rounded-lg nds-p-4 nds-text-caption"
              >
                Presence
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DemoCard>

      <p className="nds-text-body nds-accent-start">{t('specimens.advanced.note')}</p>
    </section>
  );
}

export function MotionDocs() {
  return (
    <FoundationPage
      slug="motion"
      translations={translations}
      extraSection={
        <>
          <MotionSpecimens />
          <AdvancedMotion />
        </>
      }
    />
  );
}
