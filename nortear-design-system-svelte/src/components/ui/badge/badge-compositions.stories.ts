import { figmaDesign } from '@shared/figma/design-links';
import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { within, expect, userEvent } from 'storybook/test';
import { noTransicao } from '@shared/testing/cor';
import badgeTranslations from '@shared/content/badge/translations.json';
import {
  badgeCounterMeasure,
  badgeLinkHover,
  badgeRoot,
  iconPadding,
} from '@shared/testing/badge-probe';
import { Badge } from './index';
import BadgeStory from './BadgeStory.svelte';
import BadgeWithCounterStory from './BadgeWithCounterStory.svelte';
import {
  badgeAsButtonSource,
  badgeAsLinkSource,
  badgeSource,
  badgeWithCounterSource,
  badgeWithIconSource,
} from './badge.source';

const meta: Meta = {
  title: 'Components/Feedback/Badge/Compositions',
  component: Badge,
  tags: ['feedback'],
  parameters: {
    design: figmaDesign('badge'),
    controls: { disable: true },
    actions: { disable: true },
    layout: 'centered',
    docs: {
      // Cascateia como piso; cada composição sobrescreve com a marcação que
      // ensina.
      source: { transform: badgeSource },
      description: {
        component:
          'Configurações contextuais do Badge: com ícone, com contador dentro da própria etiqueta, dentro do Button do design system e dentro de um link.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// Rótulos lidos do bloco pt-BR DIRETO, e não por `useTranslation`: a story é
// fixture, e o texto que ela monta e o que ela procura têm de ser o mesmo,
// qualquer que seja o idioma guardado no navegador.
const LABELS = badgeTranslations['pt-BR'].demonstration.labels;

export const WithIcon: Story = {
  parameters: {
    covers: ['functional.item5', 'accessibility.item2', 'visual.item3'],
    docs: { source: { transform: badgeWithIconSource } },
  },
  render: () => ({
    Component: BadgeStory,
    props: { kind: 'withIcon', label: 'Ativo' },
  }),
  play: async ({ canvasElement }) => {
    const badge = badgeRoot(canvasElement);

    // accessibility.item2 — o ícone é reforço visual: quem nomeia é o texto.
    const icon = badge.querySelector('svg');
    await expect(icon).not.toBeNull();
    await expect(icon).toHaveAttribute('aria-hidden', 'true');
    await expect(icon).toHaveAttribute('data-icon', 'inline-start');
    await expect(badge.textContent?.trim()).toBe('Ativo');

    // functional.item5 — o respiro entre ícone e texto é do container: o
    // `data-icon` encurta o padding do lado do ícone.
    const padding = iconPadding(badge);
    await expect(padding.start).toBeLessThan(padding.end);
    await expect(getComputedStyle(icon!).marginRight).toBe('0px');
    await expect(getComputedStyle(badge).display).toBe('inline-flex');
  },
};

/**
 * Contador DENTRO da etiqueta, à direita do texto: é a única forma de contagem
 * que o componente oferece. O rótulo ao lado já diz de que é a contagem, e por
 * isso o número não precisa de nome próprio.
 */
export const WithCounter: Story = {
  parameters: {
    covers: ['visual.item6'],
    docs: {
      source: { transform: badgeWithCounterSource },
      description: {
        story:
          'O contador é neutro de propósito: a cor da variante fica na borda ao redor. Pintá-lo com ela derrubaria o número abaixo de 4.5:1 em parte dos temas.',
      },
    },
  },
  render: () => ({ Component: BadgeWithCounterStory }),
  play: async ({ canvasElement }) => {
    const badge = badgeRoot(canvasElement);
    const counter = badge.querySelector<HTMLElement>('[data-slot="badge-counter"]');

    // A peça sai com o slot E com a classe da folha compartilhada.
    await expect(counter).not.toBeNull();
    await expect(counter!.classList.contains('nds-badge-counter')).toBe(true);

    // Fundo `--secondary` (neutro, não a cor da variante), número a 4.5:1
    // contra ele, à direita do rótulo e na mesma linha. A transição sai do
    // caminho antes de medir: ler no primeiro quadro devolve a cor anterior, e
    // é assim que se inventa um contraste de ~1.0.
    const measure = noTransicao(counter!, () => badgeCounterMeasure(badge));
    await expect(measure.background).toBe(measure.expectedBackground);
    await expect(measure.textRatio).toBeGreaterThanOrEqual(4.5);
    await expect(measure.rightOfLabel).toBe(true);
    await expect(measure.sameLine).toBe(true);

    // O número é LIDO: fica no texto acessível da etiqueta, sem aria-hidden.
    await expect(counter!.hasAttribute('aria-hidden')).toBe(false);
    await expect(counter!.textContent?.trim()).toBe('12');
  },
};

export const AsButton: Story = {
  parameters: {
    covers: ['functional.item6', 'accessibility.item4', 'visual.item4'],
    docs: { source: { transform: badgeAsButtonSource } },
  },
  render: () => ({
    Component: BadgeStory,
    props: {
      kind: 'asButton',
      variant: 'info',
      label: LABELS.categoryLabel,
      ariaLabel: LABELS.categoryFilterLabel,
    },
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button', { name: LABELS.categoryFilterLabel });

    // O gatilho é o Button do design system, ghost e sm — não um <button> cru.
    await expect(button.classList.contains('nds-button')).toBe(true);
    await expect(button.classList.contains('nds-button-ghost')).toBe(true);
    await expect(button.classList.contains('nds-button-sm')).toBe(true);

    // functional.item6 — o pai recebe o foco e a etiqueta não compete por ele.
    const badge = badgeRoot(button);
    await expect(badge).toHaveAttribute('data-variant', 'info');
    await expect(badge.textContent?.trim()).toBe(LABELS.categoryLabel);
    await expect(badge.hasAttribute('tabindex')).toBe(false);

    // accessibility.item4 — foco por Tab chega ao botão, e chega VISÍVEL.
    (document.activeElement as HTMLElement | null)?.blur();
    await userEvent.tab();
    await expect(document.activeElement).toBe(button);
    await expect(button.matches(':focus-visible')).toBe(true);
  },
};

export const AsLink: Story = {
  parameters: {
    covers: ['functional.item8', 'visual.item7'],
    docs: { source: { transform: badgeAsLinkSource } },
  },
  render: () => ({
    Component: BadgeStory,
    props: { kind: 'asLink', variant: 'info', label: LABELS.categoryLabel },
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const link = canvas.getByRole('link', { name: LABELS.categoryLabel });
    await expect(link).toHaveAttribute('href', '#');

    // functional.item8 — o link é focável por Tab; a etiqueta não.
    const badge = badgeRoot(link);
    await expect(badge).toHaveAttribute('data-variant', 'info');
    await expect(badge.hasAttribute('tabindex')).toBe(false);
    (document.activeElement as HTMLElement | null)?.blur();
    await userEvent.tab();
    await expect(document.activeElement).toBe(link);

    // visual.item7 — com o ponteiro em cima, o fundo passa a `--secondary`.
    // Medido pela DECLARAÇÃO da folha, e não pelo fundo depois de um hover:
    // `:hover` não acende por evento sintético (reprovou assim no angular). A
    // sonda confere a estrutura que o seletor `a > .nds-badge:hover` exige e o
    // valor que a regra declara.
    const hover = badgeLinkHover(badge);
    await expect(hover.insideLink).toBe(true);
    await expect(hover.declared).not.toBeNull();
    await expect(hover.resolved).toBe(hover.expected);
  },
};
