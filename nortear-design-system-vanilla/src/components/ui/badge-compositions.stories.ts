import { figmaDesign } from '@shared/figma/design-links';
import type { Meta, StoryObj } from '@storybook/html-vite';
import { within, expect, userEvent } from 'storybook/test';
import { Check, createElement } from 'lucide';
import { noTransicao } from '@shared/testing/cor';
import {
  badgeCounterMeasure,
  badgeLinkHover,
  badgeRoot,
  iconPadding,
} from '@shared/testing/badge-probe';
import { createBadge, createBadgeCounter } from './badge';
import { createButton } from './button';
import {
  badgeLinkSourceWith,
  badgeSource,
  badgeSourceWith,
  badgeTriggerSourceWith,
  badgeWithCounterSourceWith,
} from './badge.source';
import badgeTranslations from '@shared/content/badge/translations.json';

/** Os mesmos rótulos que os construtores do painel leem — uma fonte só. */
const LABELS = badgeTranslations['pt-BR'].demonstration.labels;

const meta: Meta = {
  tags: ['feedback'],
  title: 'Components/Feedback/Badge/Compositions',
  parameters: {
    design: figmaDesign('badge'),
    controls: { disable: true },
    actions: { disable: true },
    layout: 'centered',
    docs: {
      source: { transform: badgeSource },
      description: {
        component:
          'Configurações contextuais do Badge: com ícone, com contador à direita do rótulo, ' +
          'dentro do Button do design system como gatilho, ou dentro de um link.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Composições ──────────────────────────────────────────────────────────────

export const WithIcon: Story = {
  // Override de story: o ícone entra no MESMO `children`, junto com o texto —
  // é a lista que o snippet do meta não mostraria.
  parameters: {
    covers: ['functional.item5', 'accessibility.item2', 'visual.item3'],
    docs: {
      source: { transform: badgeSourceWith({ withIcon: true, label: LABELS.statusLabel }) },
    },
  },
  render: () => {
    // O mesmo ícone que o snippet ensina a construir — sem tamanho e sem margem:
    // `.nds-badge > svg` dimensiona e o gap do container espaça.
    const icon = createElement(Check);
    icon.setAttribute('aria-hidden', 'true');
    icon.setAttribute('data-icon', 'inline-start');
    return createBadge({ children: [icon, LABELS.statusLabel] });
  },
  play: async ({ canvasElement }) => {
    const badge = badgeRoot(within(canvasElement).getByText(LABELS.statusLabel));

    // accessibility.item2 — o ícone é reforço visual: quem nomeia é o texto.
    const icon = badge.querySelector('svg');
    await expect(icon).not.toBeNull();
    await expect(icon).toHaveAttribute('aria-hidden', 'true');
    await expect(icon).toHaveAttribute('data-icon', 'inline-start');
    await expect((badge.textContent ?? '').trim()).toBe(LABELS.statusLabel);

    // functional.item5 — o respiro do lado do ícone é mais curto: é o
    // `data-icon="inline-start"` que a folha lê, e não uma margem na story.
    const padding = iconPadding(badge);
    await expect(padding.start).toBeLessThan(padding.end);
    await expect(getComputedStyle(icon!).marginRight).toBe('0px');
  },
};

/**
 * Contador DENTRO da etiqueta — a peça que qualquer variante aceita. O número
 * entra na etiqueta, à direita do rótulo que lhe dá sentido.
 */
export const WithCounter: Story = {
  // Override de story: a FORMA é outra — `children` recebe a lista rótulo +
  // contador, e o contador vem da subfábrica, não de uma classe escrita à mão.
  parameters: {
    covers: ['visual.item6'],
    docs: {
      source: {
        transform: badgeWithCounterSourceWith({
          variant: 'destructive',
          label: LABELS.destructiveLabel,
          count: '12',
        }),
      },
      description: {
        story:
          'O contador é neutro de propósito: a cor da variante fica na borda ao redor. Preenchê-lo com a cor semântica derruba o número abaixo de 4.5:1 em parte dos temas.',
      },
    },
  },
  render: () =>
    createBadge({
      variant: 'destructive',
      children: [LABELS.destructiveLabel, createBadgeCounter({ text: '12' })],
    }),
  play: async ({ canvasElement }) => {
    const counter = within(canvasElement).getByText('12');
    const badge = badgeRoot(counter.closest<HTMLElement>('[data-slot="badge"]')!);

    // A peça publicada, e não uma classe solta na story.
    await expect(counter).toHaveAttribute('data-slot', 'badge-counter');
    await expect(badge.contains(counter)).toBe(true);

    // O número é lido: texto de verdade no DOM, sem aria-hidden.
    await expect(counter.hasAttribute('aria-hidden')).toBe(false);
    await expect((counter.textContent ?? '').trim()).toBe('12');

    // A transição sai do caminho antes de medir: ler no primeiro quadro devolve
    // a cor anterior, e é assim que se inventa um contraste de ~1.0.
    const measure = noTransicao(counter, () => badgeCounterMeasure(badge));

    // Neutro, e não tingido pela variante — decisão medida de contraste.
    await expect(measure.background).toBe(measure.expectedBackground);
    await expect(measure.textRatio).toBeGreaterThanOrEqual(4.5);

    // À direita do rótulo, na mesma linha.
    await expect(measure.rightOfLabel).toBe(true);
    await expect(measure.sameLine).toBe(true);
  },
};

export const AsButton: Story = {
  // Override de story: quem recebe o clique e o foco é o Button em volta, e é
  // dele o nome acessível — outra FORMA de snippet.
  parameters: {
    covers: ['functional.item6', 'accessibility.item4', 'visual.item4'],
    docs: {
      source: {
        transform: badgeTriggerSourceWith({
          label: LABELS.categoryLabel,
          accessibleName: LABELS.categoryFilterLabel,
        }),
      },
    },
  },
  render: () =>
    createButton({
      variant: 'ghost',
      size: 'sm',
      'aria-label': LABELS.categoryFilterLabel,
      children: createBadge({ variant: 'info', children: LABELS.categoryLabel }),
    }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button', { name: LABELS.categoryFilterLabel });
    const badge = badgeRoot(button);

    await step('O gatilho é o Button do design system, ghost e sm', async () => {
      await expect(button.classList.contains('nds-button-ghost')).toBe(true);
      await expect(button.classList.contains('nds-button-sm')).toBe(true);
      await expect(badge).toHaveAttribute('data-variant', 'info');
      await expect((badge.textContent ?? '').trim()).toBe(LABELS.categoryLabel);
    });

    await step('O foco é do botão; a etiqueta não compete por ele', async () => {
      // functional.item6 / accessibility.item4 — Tab chega ao botão, e a
      // etiqueta dentro dele não tem tabindex.
      await expect(badge.hasAttribute('tabindex')).toBe(false);
      (document.activeElement as HTMLElement | null)?.blur();
      await userEvent.tab();
      await expect(button).toHaveFocus();
    });
  },
};

export const AsLink: Story = {
  // Override de story: quem recebe foco e Enter é o <a> em volta.
  parameters: {
    covers: ['functional.item8', 'visual.item7'],
    docs: {
      source: { transform: badgeLinkSourceWith({ label: LABELS.categoryLabel }) },
    },
  },
  render: () => {
    const link = document.createElement('a');
    link.href = '#';
    link.append(createBadge({ variant: 'info', children: LABELS.categoryLabel }));
    return link;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const link = canvas.getByRole('link', { name: LABELS.categoryLabel });
    const badge = badgeRoot(link);

    await step('O foco é do link; a etiqueta não compete por ele', async () => {
      await expect(badge).toHaveAttribute('data-variant', 'info');
      await expect(badge.hasAttribute('tabindex')).toBe(false);
      (document.activeElement as HTMLElement | null)?.blur();
      await userEvent.tab();
      await expect(link).toHaveFocus();
    });

    await step('Com o ponteiro em cima, o fundo da etiqueta vai para --secondary', async () => {
      // functional.item8 / visual.item7 — a medida NÃO é o fundo computado depois
      // de um `userEvent.hover`: `:hover` só acende com ponteiro real, e o evento
      // sintético deixa o fundo neutro (medido no angular em 2026-09-14). A sonda
      // confere a estrutura que o seletor `a > .nds-badge:hover` exige e o fundo
      // que a regra declara, resolvido pelo navegador na árvore da etiqueta.
      const hover = badgeLinkHover(badge);
      await expect(hover.insideLink).toBe(true);
      await expect(hover.declared, 'a regra de hover da etiqueta dentro de link sumiu').not.toBeNull();
      await expect(hover.resolved).toBe(hover.expected);
    });
  },
};
