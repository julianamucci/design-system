import { figmaDesign } from '@shared/figma/design-links';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect, userEvent } from 'storybook/test';
import { noTransicao } from '@shared/testing/cor';
import {
  badgeCounterMeasure,
  badgeLinkHover,
  badgeRoot,
  iconPadding,
} from '@shared/testing/badge-probe';
import { NdsBadge, NdsBadgeCounter } from './badge';
import { NdsButton, NdsButtonIcon } from './button';
import {
  badgeAsButtonSource,
  badgeAsLinkSource,
  badgeWithCounterSource,
  badgeWithIconSource,
  LABEL,
} from './badge.source';

const meta: Meta = {
  title: 'Components/Feedback/Badge/Compositions',
  tags: ['feedback'],
  decorators: [moduleMetadata({ imports: [NdsBadge, NdsBadgeCounter, NdsButton, NdsButtonIcon] })],
  parameters: {
    design: figmaDesign('badge'),
    controls: { disable: true },
    actions: { disable: true },
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj;

export const WithIcon: Story = {
  parameters: {
    docs: { source: { transform: badgeWithIconSource } },
    covers: ['functional.item5', 'accessibility.item2', 'visual.item3'],
  },
  render: () => ({
    props: { label: LABEL.status() },
    template: `
      <span ndsBadge>
        <svg ndsButtonIcon kind="check" size="sm" data-icon="inline-start"></svg>
        {{ label }}
      </span>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const badge = badgeRoot(canvasElement);
    const icon = badge.querySelector<SVGElement>('svg');

    await step('O ícone é decorativo — quem nomeia é o texto', async () => {
      // accessibility.item2 — ícone sem aria-hidden faz o leitor anunciar um
      // gráfico sem nome antes do rótulo.
      await expect(icon).not.toBeNull();
      await expect(icon).toHaveAttribute('aria-hidden', 'true');
      await expect(icon).toHaveAttribute('data-icon', 'inline-start');
      await expect(badge.textContent?.trim()).toBe(LABEL.status());
    });

    await step('O ícone vem antes, e encurta o respiro do lado dele', async () => {
      // functional.item5 — `data-icon="inline-start"` reduz o padding inicial.
      await expect(badge.firstElementChild).toBe(icon);
      const padding = iconPadding(badge);
      await expect(padding.start).toBeLessThan(padding.end);
      // O respiro vem do `data-icon`, e não de uma margem no ícone.
      await expect(getComputedStyle(icon!).marginRight).toBe('0px');
    });
  },
};

/**
 * Contador DENTRO da etiqueta — a peça que qualquer variante aceita: o número
 * entra à direita do rótulo que lhe dá sentido.
 */
export const WithCounter: Story = {
  parameters: {
    docs: { source: { transform: badgeWithCounterSource } },
    covers: ['visual.item6'],
  },
  render: () => ({
    props: { label: LABEL.destructive() },
    template: `
      <span ndsBadge variant="destructive">
        {{ label }}
        <span ndsBadgeCounter>12</span>
      </span>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const badge = badgeRoot(canvasElement);
    const counter = within(badge).getByText('12');

    await step('A peça sai com a classe e o slot que a folha documenta', async () => {
      await expect(counter).toHaveAttribute('data-slot', 'badge-counter');
      await expect(counter).toHaveClass(/nds-badge-counter/);
    });

    await step('Neutro, legível, à direita do rótulo e na mesma linha', async () => {
      // A sonda mede o que está na tela: fundo contra `--secondary`, contraste
      // do número e a caixa do rótulo (um Range sobre os nós de texto).
      // A transição sai do caminho antes de medir: ler no primeiro quadro
      // devolve a cor anterior, e é assim que se inventa um contraste de ~1.0.
      const m = noTransicao(counter, () => badgeCounterMeasure(badge));
      await expect(m.background).toBe(m.expectedBackground);
      await expect(m.textRatio).toBeGreaterThanOrEqual(4.5);
      await expect(m.rightOfLabel).toBe(true);
      await expect(m.sameLine).toBe(true);
    });

    await step('O número é lido, não desenhado', async () => {
      await expect(counter.hasAttribute('aria-hidden')).toBe(false);
      await expect(counter.textContent?.trim()).toBe('12');
    });
  },
};

export const AsButton: Story = {
  parameters: {
    docs: { source: { transform: badgeAsButtonSource } },
    covers: ['functional.item6', 'accessibility.item4', 'visual.item4'],
  },
  render: () => ({
    // O Badge não vira o controle: quem carrega a interação é o Button do
    // design system em volta, ghost e sm.
    props: { label: LABEL.category(), filterLabel: LABEL.categoryFilter() },
    template: `
      <button ndsButton variant="ghost" size="sm" [attr.aria-label]="filterLabel">
        <span ndsBadge variant="info">{{ label }}</span>
      </button>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button', { name: LABEL.categoryFilter() });

    await step('O gatilho é o Button do design system, ghost e sm', async () => {
      await expect(button.classList.contains('nds-button-ghost')).toBe(true);
      await expect(button.classList.contains('nds-button-sm')).toBe(true);
      await expect(badgeRoot(button)).toHaveAttribute('data-variant', 'info');
    });

    await step('O Tab alcança o botão, não a etiqueta', async () => {
      // functional.item6 e accessibility.item4 — o foco é do botão.
      await userEvent.tab();
      await expect(button).toHaveFocus();
      await expect(button.matches(':focus-visible')).toBe(true);
    });

    await step('A etiqueta continua fora da ordem de tabulação', async () => {
      const badge = badgeRoot(button);
      await expect(badge.hasAttribute('tabindex')).toBe(false);
      await expect(badge.textContent?.trim()).toBe(LABEL.category());
    });
  },
};

export const AsLink: Story = {
  parameters: {
    docs: { source: { transform: badgeAsLinkSource } },
    covers: ['functional.item8', 'visual.item7'],
  },
  render: () => ({
    props: { label: LABEL.category() },
    template: `
      <a href="#">
        <span ndsBadge variant="info">{{ label }}</span>
      </a>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const link = canvas.getByRole('link', { name: LABEL.category() });
    const badge = badgeRoot(link);

    await step('O Tab alcança o link, não a etiqueta', async () => {
      await expect(badge).toHaveAttribute('data-variant', 'info');
      await userEvent.tab();
      await expect(link).toHaveFocus();
      await expect(badge.hasAttribute('tabindex')).toBe(false);
    });

    await step('Com o ponteiro em cima, o fundo da etiqueta vira --secondary', async () => {
      // functional.item8 — medido pela DECLARAÇÃO da folha, não pelo estado:
      // `:hover` não acende por evento sintético (o `userEvent.hover` deixou o
      // fundo neutro). A sonda confere que a etiqueta é filha direta do `<a>`,
      // que a regra `a > .nds-badge:hover` declara um fundo, e que ele resolve
      // para `--secondary`.
      const hover = badgeLinkHover(badge);
      await expect(hover.insideLink).toBe(true);
      await expect(hover.declared).not.toBeNull();
      await expect(hover.resolved).toBe(hover.expected);
    });
  },
};
