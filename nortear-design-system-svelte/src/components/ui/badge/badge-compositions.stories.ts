import { figmaDesign } from '@shared/figma/design-links';
import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { within, expect } from 'storybook/test';
import { backgroundEffective, noTransicao, ratio } from '@shared/testing/cor';
import { Badge } from './index';
import BadgeStory from './BadgeStory.svelte';
import BadgeWithCounterStory from './BadgeWithCounterStory.svelte';
import {
  badgeWithIconSource,
  badgeWithCounterSource,
  buttonBadgeSource,
  badgeSource,
} from './badge.source';

const meta: Meta = {
  title: 'Primitives/Feedback/Badge/Compositions',
  component: Badge,
  tags: ['feedback'],
  parameters: {
    design: figmaDesign('badge'),
    controls: { disable: true },
    actions: { disable: true },
    layout: 'centered',
    docs: {
      // Cascateia como piso; as três composições sobrescrevem com a marcação
      // que cada uma ensina.
      source: { transform: badgeSource },
      description: {
        component:
          'Configuracoes contextuais do Badge: combinado com ícone, com contador dentro da própria etiqueta e envolvido em <button> para trigger clicável.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const WithIcon: Story = {
  parameters: {
    covers: ['functional.item5', 'accessibility.item2', 'visual.item3'],
    docs: { source: { transform: badgeWithIconSource } },
  },
  render: () => ({
    Component: BadgeStory,
    props: { caso: 'comIcone', variant: 'default', label: 'Ativo' },
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const badge = canvas.getByText('Ativo');

    // accessibility.item2 — o ícone é reforço visual: quem nomeia é o texto.
    const icon = badge.querySelector('svg');
    await expect(icon).not.toBeNull();
    await expect(icon).toHaveAttribute('aria-hidden', 'true');
    await expect(badge.textContent?.trim()).toBe('Ativo');

    // functional.item5 — o espaço entre ícone e texto é do container, não uma
    // margem na story: o .nds-badge declara gap, e o data-icon encurta o padding
    // daquele lado. Margem manual somaria ao gap e dobraria o respiro.
    const styles = getComputedStyle(badge);
    await expect(styles.display).toBe('inline-flex');
    await expect(parseFloat(styles.columnGap)).toBeGreaterThan(0);
    await expect(getComputedStyle(icon!).marginRight).toBe('0px');
    await expect(parseFloat(styles.paddingInlineStart)).toBeLessThan(
      parseFloat(styles.paddingInlineEnd),
    );
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
    const badge = canvasElement.querySelector<HTMLElement>('[data-slot="badge"]');
    await expect(badge).not.toBeNull();
    const counter = badge!.querySelector<HTMLElement>('[data-slot="badge-counter"]');

    // A peça sai com o slot E com a classe da folha compartilhada: sem a classe
    // o número renderiza como texto solto e nada mais na play notaria.
    await expect(counter).not.toBeNull();
    await expect(counter!.classList.contains('nds-badge-counter')).toBe(true);

    // Dentro da etiqueta, e não ao lado dela.
    await expect(badge!.contains(counter!)).toBe(true);

    // À DIREITA do texto. O rótulo é um nó de texto solto, sem elemento próprio
    // para medir, então o retângulo sai de um Range sobre ele — comparar com o
    // retângulo da etiqueta inteira não distinguiria antes de depois.
    const labelNode = [...badge!.childNodes].find(
      (n) => n.nodeType === Node.TEXT_NODE && (n.textContent ?? '').trim().length > 0,
    );
    await expect(labelNode).toBeDefined();
    const range = document.createRange();
    range.selectNodeContents(labelNode!);
    const labelRect = range.getBoundingClientRect();
    const counterRect = counter!.getBoundingClientRect();
    await expect(labelRect.width).toBeGreaterThan(0);
    await expect(counterRect.width).toBeGreaterThan(0);
    await expect(counterRect.left).toBeGreaterThanOrEqual(labelRect.right - 1);

    // O número é LIDO: fica no texto acessível da etiqueta, sem aria-hidden.
    // "Urgente 12" se lê inteiro, e é por isso que o número não pede rótulo.
    await expect(counter!.hasAttribute('aria-hidden')).toBe(false);
    await expect(counter!.textContent?.trim()).toBe('12');
    await expect(badge!.textContent?.replace(/\s+/g, ' ').trim()).toBe('Urgente 12');

    // A pílula precisa se separar do fundo da etiqueta para existir na tela.
    const counterStyles = getComputedStyle(counter!);
    await expect(counterStyles.backgroundColor).not.toBe(
      getComputedStyle(badge!).backgroundColor,
    );

    // E o número precisa alcançar 4.5:1 CONTRA O FUNDO DA PRÓPRIA PEÇA — é o
    // número que a decisão de mantê-la neutra comprou. Pintá-la com a cor da
    // variante reprova aqui, que é o ponto.
    const contrast = noTransicao(counter!, () => {
      const background = backgroundEffective(counter!);
      return background ? ratio(counterStyles.color, background) : null;
    });
    await expect(contrast).not.toBeNull();
    await expect(contrast!.ratio).toBeGreaterThanOrEqual(4.5);
  },
};

export const AsButton: Story = {
  parameters: {
    covers: ['functional.item6', 'accessibility.item4', 'visual.item4'],
    docs: { source: { transform: buttonBadgeSource } },
  },
  render: () => ({
    Component: BadgeStory,
    props: {
      caso: 'botao',
      variant: 'info',
      label: 'Acessibilidade',
      ariaLabel: 'Filtrar por acessibilidade',
    },
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button', { name: /Filtrar por acessibilidade/i });
    // functional.item6 — o pai recebe o foco e o badge não compete por ele.
    const badge = button.querySelector('[data-slot="badge"]');
    await expect(badge).not.toBeNull();
    await expect(badge!.hasAttribute('tabindex')).toBe(false);
    button.focus();
    await expect(document.activeElement).toBe(button);
  },
};
