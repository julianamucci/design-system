import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FoundationPage } from './shared/FoundationPage';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/i18n';
import translations from '@shared/content/foundations/motion/translations.json';

const LADDER = [
  { token: '--duration-instant', label: 'instant — 0ms' },
  { token: '--duration-fast', label: 'fast — 120ms' },
  { token: '--duration-base', label: 'base — 200ms' },
  { token: '--duration-moderate', label: 'moderate — 320ms' },
  { token: '--duration-slow', label: 'slow — 500ms' },
  { token: '--duration-stately', label: 'stately — 800ms' },
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

// Specimens: cada barra percorre a mesma distância em um degrau da escada
// --duration-* — a comparação lado a lado torna a diferença perceptível.
// prefers-reduced-motion zera as durações globalmente via motion.css.
function MotionSpecimens() {
  const { t } = useTranslation(translations);
  const [played, setPlayed] = useState(false);

  return (
    <section className="nds-stack nds-docs-section-divider" data-spacing="md">
      <div className="nds-stack" data-spacing="xs">
        <h2 className="nds-text-h2 nds-text-foreground">{t('specimens.title')}</h2>
        <p className="nds-text-body">{t('specimens.subtitle')}</p>
      </div>

      <div className="nds-stack nds-p-6 nds-bg-card nds-rounded-lg nds-border-soft" data-spacing="sm">
        <div>
          <Button variant="outline" size="sm" onClick={() => setPlayed((p) => !p)}>
            {t('specimens.advanced.labels.replay')}
          </Button>
        </div>
        {LADDER.map((d) => (
          <div key={d.token} className="nds-bg-muted-30 nds-rounded-lg nds-p-1 nds-overflow-hidden">
            <div
              className="nds-bg-primary-soft nds-border-primary-soft nds-rounded-sm nds-px-4 nds-py-1 nds-text-caption nds-whitespace-nowrap"
              style={{
                width: 'fit-content',
                transform: played ? 'translateX(12rem)' : 'translateX(0)',
                transitionProperty: 'transform',
                transitionDuration: `var(${d.token})`,
                transitionTimingFunction: 'var(--ease-standard)',
              }}
            >
              {d.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

interface DemoCardProps {
  title: string;
  desc: string;
  code: string;
  /** Centraliza o conteúdo da área de demo (spring/drag). Default: stack
      ancorado ao topo — evita que o conteúdo pule quando um filho sai. */
  center?: boolean;
  children: React.ReactNode;
}

function DemoCard({ title, desc, code, center = false, children }: DemoCardProps) {
  return (
    <div className="nds-stack" data-spacing="sm">
      <h3 className="nds-text-body nds-font-medium">{title}</h3>
      <p className="nds-text-body">{desc}</p>
      <div
        className={`nds-bg-card nds-border-soft nds-rounded-lg nds-p-6 ${center ? 'nds-cluster' : 'nds-stack'}`}
        data-align={center ? 'center' : undefined}
        data-justify={center ? 'center' : undefined}
        data-spacing={center ? undefined : 'sm'}
        style={{ minHeight: '9rem', overflow: center ? 'hidden' : undefined }}
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
        center
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

      <div className="nds-stack" data-spacing="sm">
        <h3 className="nds-text-body nds-font-medium">{t('specimens.advanced.touch.title')}</h3>
        <ul className="nds-stack nds-list-none" data-spacing="md">
          <li className="nds-accent-start nds-text-body">{t('specimens.advanced.touch.tap')}</li>
          <li className="nds-accent-start nds-text-body">{t('specimens.advanced.touch.hover')}</li>
          <li className="nds-accent-start nds-text-body">{t('specimens.advanced.touch.drag')}</li>
        </ul>
      </div>
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
