import { figmaDesign } from '@shared/figma/design-links';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { within, expect, userEvent } from 'storybook/test';
import { Check } from 'lucide-vue-next';
import { noTransicao } from '@shared/testing/cor';
import { badgeCounterMeasure, badgeLinkHover, iconPadding } from '@shared/testing/badge-probe';
import badgeTranslations from '@shared/content/badge/translations.json';
import { Badge, BadgeCounter } from './index';
import { Button } from '@/components/ui/button';
import {
  badgeWithIconSource,
  badgeAsButtonSource,
  badgeAsLinkSource,
  badgeWithCounterSource,
} from './badge.source';

/**
 * Rótulos da categoria: saem do MESMO `translations.json` que a docs page lê,
 * para story, painel Code e página não divergirem.
 */
const { categoryLabel, categoryFilterLabel } = badgeTranslations['pt-BR'].demonstration.labels;

const meta = {
  title: 'Components/Feedback/Badge/Compositions',
  component: Badge,
  tags: ['feedback'],
  parameters: {
    design: figmaDesign('badge'),
    controls: { disable: true },
    actions: { disable: true },
    layout: 'centered',
    docs: {
      source: { transform: badgeWithIconSource },
      description: {
        component:
          'Configurações contextuais do Badge: combinado com ícone, com contador dentro da própria etiqueta, dentro do Button para virar gatilho e dentro de link.',
      },
    },
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithIcon: Story = {
  parameters: { covers: ['functional.item5', 'accessibility.item2', 'visual.item3'] },
  render: () => ({
    components: { Badge, Check },
    template: `
      <Badge>
        <Check aria-hidden="true" data-icon="inline-start" />
        Ativo
      </Badge>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const badge = canvas.getByText('Ativo');

    // accessibility.item2 — o ícone é reforço visual: quem nomeia é o texto.
    const icon = badge.querySelector('svg');
    await expect(icon).not.toBeNull();
    await expect(icon).toHaveAttribute('aria-hidden', 'true');
    await expect(icon).toHaveAttribute('data-icon', 'inline-start');
    await expect(badge.textContent?.trim()).toBe('Ativo');

    // functional.item5 — o respiro entre ícone e texto é do container, e o
    // `data-icon` encurta o padding do lado do ícone.
    await expect(getComputedStyle(badge).display).toBe('inline-flex');
    await expect(getComputedStyle(icon!).marginRight).toBe('0px');
    const padding = iconPadding(badge);
    await expect(padding.start).toBeLessThan(padding.end);
  },
};

/**
 * Contador DENTRO da etiqueta — a peça `BadgeCounter`, que qualquer variante
 * aceita. O número acompanha um rótulo, na mesma caixa.
 */
export const WithCounter: Story = {
  parameters: {
    covers: ['visual.item6'],
    docs: { source: { transform: badgeWithCounterSource } },
  },
  render: () => ({
    components: { Badge, BadgeCounter },
    template: `
      <Badge variant="destructive">
        Urgente
        <BadgeCounter>12</BadgeCounter>
      </Badge>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const badge = canvas.getByText(/Urgente/);
    const counter = badge.querySelector<HTMLElement>('[data-slot="badge-counter"]');

    await step('A peça sai dentro da etiqueta, com o slot que a folha desenha', async () => {
      await expect(counter).not.toBeNull();
      await expect(badge.contains(counter)).toBe(true);
    });

    await step('O número é lido junto do rótulo', async () => {
      // Nada de `aria-hidden`: o contador é conteúdo, e quem ouve a etiqueta
      // ouve "Urgente 12".
      await expect(counter!.textContent?.trim()).toBe('12');
      await expect(badge.textContent?.replace(/\s+/g, ' ').trim()).toBe('Urgente 12');
      await expect(counter!.getAttribute('aria-hidden')).toBeNull();
    });

    await step('Fundo neutro, contraste, à direita e na mesma linha do rótulo', async () => {
      // A transição sai do caminho antes de medir: ler no primeiro quadro devolve
      // a cor anterior, e é assim que se inventa um contraste de ~1.0.
      const m = noTransicao(counter!, () => badgeCounterMeasure(badge));
      await expect(m.expectedBackground).not.toBeNull();
      await expect(m.background).toBe(m.expectedBackground);
      await expect(m.textRatio).toBeGreaterThanOrEqual(4.5);
      await expect(m.rightOfLabel).toBe(true);
      await expect(m.sameLine).toBe(true);
    });
  },
};

/**
 * A etiqueta como GATILHO: dentro do Button do design system, ghost e pequeno.
 * Quem é controle é o botão; o badge é só a aparência.
 */
export const AsButton: Story = {
  parameters: {
    covers: ['functional.item6', 'accessibility.item4', 'visual.item4'],
    // Envolvida: o construtor aceita rótulos, e o transform receberia o código
    // gerado no lugar deles.
    docs: { source: { transform: () => badgeAsButtonSource() } },
  },
  render: () => ({
    components: { Badge, Button },
    setup: () => ({ categoryLabel, categoryFilterLabel }),
    template: `
      <Button variant="ghost" size="sm" :aria-label="categoryFilterLabel">
        <Badge variant="info">{{ categoryLabel }}</Badge>
      </Button>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button', { name: categoryFilterLabel });
    // O gatilho é o Button do design system, ghost e sm — pelas CLASSES que a
    // folha desenha, como na referência.
    await expect(button).toHaveClass('nds-button-ghost');
    await expect(button).toHaveClass('nds-button-sm');

    // functional.item6 — o pai recebe o foco e o badge não compete por ele.
    const badge = button.querySelector<HTMLElement>('[data-slot="badge"]');
    await expect(badge).not.toBeNull();
    await expect(badge).toHaveAttribute('data-variant', 'info');
    await expect(badge!.textContent?.trim()).toBe(categoryLabel);
    await expect(badge!.hasAttribute('tabindex')).toBe(false);

    (document.activeElement as HTMLElement | null)?.blur();
    await userEvent.tab();
    await expect(button).toHaveFocus();
    // accessibility.item4 — foco por teclado acende o anel do botão.
    await expect(button.matches(':focus-visible')).toBe(true);
  },
};

/**
 * A etiqueta dentro de link: foco e navegação são do `<a>`, e o único estado de
 * interação que a folha dá à etiqueta é o hover ali dentro.
 */
export const AsLink: Story = {
  parameters: {
    covers: ['functional.item8', 'visual.item7'],
    docs: { source: { transform: () => badgeAsLinkSource() } },
  },
  render: () => ({
    components: { Badge },
    setup: () => ({ categoryLabel }),
    template: `
      <a href="#">
        <Badge variant="info">{{ categoryLabel }}</Badge>
      </a>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const link = canvas.getByRole('link', { name: categoryLabel });
    const badge = link.querySelector<HTMLElement>('[data-slot="badge"]');
    await expect(badge).not.toBeNull();

    await step('O link é focável por Tab, a etiqueta não', async () => {
      await expect(badge).toHaveAttribute('data-variant', 'info');
      await expect(badge!.hasAttribute('tabindex')).toBe(false);
      (document.activeElement as HTMLElement | null)?.blur();
      await userEvent.tab();
      await expect(link).toHaveFocus();
    });

    await step('Com o ponteiro em cima, o fundo da etiqueta vira --secondary', async () => {
      // Pela DECLARAÇÃO da folha, não pelo estado: `:hover` não acende por
      // evento sintético (medido na `AsLink` do angular — o fundo continuou
      // neutro depois do `userEvent.hover`). Confere a estrutura que o seletor
      // `a > .nds-badge:hover` exige e que o fundo declarado resolve em
      // `--secondary`.
      const hover = badgeLinkHover(badge!);
      await expect(hover.insideLink).toBe(true);
      await expect(hover.declared).not.toBeNull();
      await expect(hover.expected).not.toBeNull();
      await expect(hover.resolved).toBe(hover.expected);
    });
  },
};
