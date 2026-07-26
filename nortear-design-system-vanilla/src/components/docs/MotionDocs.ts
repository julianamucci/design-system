import { animate, stagger } from 'motion';
import { createFoundationsDocs } from './shared/foundationsRenderer';
import { createButton } from '@/components/ui/button';
import translations from '@shared/content/foundations/motion/translations.json';

const DURATIONS = [
  { token: '--transition-fast', label: 'fast — 150ms' },
  { token: '--transition-normal', label: 'normal — 300ms' },
  { token: '--transition-slow', label: 'slow — 500ms' },
];

const STAGGER_ITEMS = ['Item 1', 'Item 2', 'Item 3', 'Item 4', 'Item 5'];

const CODE_SPRING = `// npm i motion
import { animate } from 'motion';

// ao soltar o elemento arrastado:
animate(el, { x: 0, y: 0 }, { type: 'spring', stiffness: 400, damping: 22 });`;

const CODE_STAGGER = `import { animate, stagger } from 'motion';

animate(
  itens,
  { opacity: [0, 1], y: [8, 0] },
  { duration: 0.2, delay: stagger(0.06) },
);`;

const CODE_PRESENCE = `import { animate } from 'motion';

const saida = animate(el, { opacity: 0, scale: 0.95 }, { duration: 0.15 });
saida.finished.then(() => { el.hidden = true; });`;

type AddText = (el: HTMLElement, key: string) => void;

function demoCard(
  addText: AddText,
  keys: { title: string; desc: string },
  code: string,
  demo: HTMLElement,
): HTMLElement {
  const block = document.createElement('div');
  block.className = 'nds-stack';
  block.dataset.spacing = 'sm';

  const h3 = document.createElement('h3');
  h3.className = 'nds-text-body nds-font-medium';
  addText(h3, keys.title);
  const p = document.createElement('p');
  p.className = 'nds-text-body';
  addText(p, keys.desc);

  const pre = document.createElement('pre');
  pre.className = 'nds-code-block';
  const codeEl = document.createElement('code');
  codeEl.textContent = code;
  pre.appendChild(codeEl);

  block.append(h3, p, demo, pre);
  return block;
}

// Specimens: botões com hover demonstrando cada duração + demos interativas
// da biblioteca Motion (MIT) — springs, stagger e presence. Micro-interações
// dos componentes continuam CSS-first (ver motion.css).
export function createMotionDocs(): HTMLElement {
  return createFoundationsDocs({
    translations: translations as Record<string, unknown>,
    componentSlug: 'motion',
    extraSection: ({ addText }) => {
      const wrapper = document.createElement('div');
      wrapper.className = 'nds-stack';
      wrapper.dataset.spacing = 'xl';

      // ── Escada de durações ────────────────────────────────────────────────
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
      wrapper.appendChild(section);

      // ── Recursos avançados (biblioteca Motion) ────────────────────────────
      const adv = document.createElement('section');
      adv.className = 'nds-stack nds-docs-section-divider';
      adv.dataset.spacing = 'md';

      const advHead = document.createElement('div');
      advHead.className = 'nds-stack';
      advHead.dataset.spacing = 'xs';
      const advTitle = document.createElement('h2');
      advTitle.className = 'nds-text-h2 nds-text-foreground';
      addText(advTitle, 'specimens.advanced.title');
      const advSub = document.createElement('p');
      advSub.className = 'nds-text-body';
      addText(advSub, 'specimens.advanced.subtitle');
      advHead.append(advTitle, advSub);
      adv.appendChild(advHead);

      // Demo 1 — spring + drag
      const springArea = document.createElement('div');
      springArea.className = 'nds-bg-card nds-border-soft nds-rounded-lg nds-p-6 nds-cluster';
      springArea.dataset.align = 'center';
      springArea.dataset.justify = 'center';
      springArea.style.minHeight = '9rem';
      springArea.style.overflow = 'hidden';

      const chip = document.createElement('div');
      chip.className = 'nds-bg-primary-soft nds-border-primary-soft nds-rounded-lg nds-p-4 nds-text-caption nds-font-medium nds-cursor-pointer';
      chip.style.touchAction = 'none';
      chip.style.userSelect = 'none';
      addText(chip, 'specimens.advanced.labels.drag');

      let dragging = false;
      let x = 0;
      let y = 0;
      chip.addEventListener('pointerdown', (e) => {
        dragging = true;
        chip.setPointerCapture(e.pointerId);
        chip.style.scale = '1.05';
      });
      chip.addEventListener('pointermove', (e) => {
        if (!dragging) return;
        x += e.movementX;
        y += e.movementY;
        chip.style.transform = `translate(${x}px, ${y}px)`;
      });
      chip.addEventListener('pointerup', () => {
        dragging = false;
        chip.style.scale = '';
        animate(chip, { x: [x, 0], y: [y, 0] }, { type: 'spring', stiffness: 400, damping: 22 })
          .finished.then(() => {
            chip.style.transform = '';
          });
        x = 0;
        y = 0;
      });
      springArea.appendChild(chip);
      adv.appendChild(demoCard(addText, { title: 'specimens.advanced.spring.title', desc: 'specimens.advanced.spring.desc' }, CODE_SPRING, springArea));

      // Demo 2 — stagger
      const staggerArea = document.createElement('div');
      staggerArea.className = 'nds-bg-card nds-border-soft nds-rounded-lg nds-p-6 nds-stack';
      staggerArea.dataset.spacing = 'sm';
      staggerArea.style.minHeight = '9rem';

      const replayWrap = document.createElement('div');
      const replayBtn = createButton({ variant: 'outline', size: 'sm', label: '' });
      addText(replayBtn, 'specimens.advanced.labels.replay');
      replayWrap.appendChild(replayBtn);

      const list = document.createElement('ul');
      list.className = 'nds-cluster nds-list-none';
      list.dataset.spacing = 'sm';
      for (const item of STAGGER_ITEMS) {
        const li = document.createElement('li');
        li.className = 'nds-bg-muted-50 nds-rounded-md nds-px-4 nds-py-2 nds-text-caption';
        li.textContent = item;
        list.appendChild(li);
      }
      const playStagger = () => {
        animate(
          Array.from(list.children) as HTMLElement[],
          { opacity: [0, 1], y: [8, 0] },
          { duration: 0.2, delay: stagger(0.06) },
        );
      };
      replayBtn.addEventListener('click', playStagger);
      staggerArea.append(replayWrap, list);
      adv.appendChild(demoCard(addText, { title: 'specimens.advanced.stagger.title', desc: 'specimens.advanced.stagger.desc' }, CODE_STAGGER, staggerArea));

      // Demo 3 — presence (anima antes de remover)
      const presenceArea = document.createElement('div');
      presenceArea.className = 'nds-bg-card nds-border-soft nds-rounded-lg nds-p-6 nds-stack';
      presenceArea.dataset.spacing = 'sm';
      presenceArea.style.minHeight = '9rem';
      presenceArea.style.alignItems = 'center';

      const toggleBtn = createButton({ variant: 'outline', size: 'sm', label: '' });
      const card = document.createElement('div');
      card.className = 'nds-bg-primary-soft nds-border-primary-soft nds-rounded-lg nds-p-4 nds-text-caption';
      card.textContent = 'Presence';

      let visible = true;
      const syncLabel = () => addText(toggleBtn, visible ? 'specimens.advanced.labels.hide' : 'specimens.advanced.labels.show');
      syncLabel();
      toggleBtn.addEventListener('click', () => {
        if (visible) {
          visible = false;
          syncLabel();
          animate(card, { opacity: 0, scale: 0.95 }, { duration: 0.15 })
            .finished.then(() => {
              card.hidden = true;
            });
        } else {
          visible = true;
          syncLabel();
          card.hidden = false;
          animate(card, { opacity: [0, 1], scale: [0.95, 1] }, { duration: 0.2 });
        }
      });
      presenceArea.append(toggleBtn, card);
      adv.appendChild(demoCard(addText, { title: 'specimens.advanced.presence.title', desc: 'specimens.advanced.presence.desc' }, CODE_PRESENCE, presenceArea));

      const note = document.createElement('p');
      note.className = 'nds-text-body nds-accent-start';
      addText(note, 'specimens.advanced.note');
      adv.appendChild(note);

      wrapper.appendChild(adv);
      return wrapper;
    },
  });
}
