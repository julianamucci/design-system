import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { userEvent, within, expect } from 'storybook/test';
import { RadioGroup } from './index';
import RadioGroupStory from './RadioGroupStory.svelte';
import {
  radioGroupDisabledSource,
  radioGroupFocusSource,
  radioGroupInvalidoSource,
  radioGroupItemDisabledSource,
  radioGroupDefaultSource,
  radioGroupSelectedSource,
  radioGroupSource,
} from './radio-group.source';

const meta: Meta = {
  title: 'Components/Form/RadioGroup/States',
  component: RadioGroup,
  tags: ['form'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    docs: {
      // Cascateia para todas as stories do arquivo; cada uma sobrescreve com o
      // seu próprio estado logo abaixo.
      source: { transform: radioGroupSource },
      description: {
        component:
          'Estados do RadioGroup: default, checked, focus, disabled (grupo inteiro), itemDisabled (somente um item) e invalid (aria-invalid).',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

/**
 * Razão de contraste da WCAG entre duas cores computadas opacas. Comparar nome
 * de token não responde a pergunta do critério — a razão responde.
 */
function ratioContrast(a: string, b: string): number {
  const luminancia = (cor: string): number => {
    const [r, g, bl] = cor
      .match(/[\d.]+/g)!
      .slice(0, 3)
      .map(Number)
      .map((v) => {
        const x = v / 255;
        return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
      });
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [light, escuro] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
  return (light + 0.05) / (escuro + 0.05);
}

const defaultOptions = [
  { value: 'cartao', label: 'Cartão de crédito' },
  { value: 'pix', label: 'Pix' },
];

export const Default: Story = {
  parameters: {
    covers: ['visual.item1', 'accessibility.item2'],
    docs: { source: { transform: radioGroupDefaultSource } },
  },
  render: () => ({
    Component: RadioGroupStory,
    props: {
      ariaLabel: 'Forma de pagamento',
      idPrefix: 'est-def',
      options: defaultOptions,
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const radios = canvas.getAllByRole('radio');
    await step('Nenhum item selecionado por padrão', async () => {
      for (const r of radios) await expect(r).toHaveAttribute('aria-checked', 'false');
    });

    await step('Borda contra fundo e rótulo contra fundo passam na WCAG', async () => {
      // 3:1 é o piso de componente de interface (1.4.11); 4.5:1 é o de texto
      // normal (1.4.3) — o rótulo tem 14px, não é texto grande.
      const styleItem = getComputedStyle(radios[0] as HTMLElement);
      await expect(
        ratioContrast(styleItem.borderTopColor, styleItem.backgroundColor),
      ).toBeGreaterThanOrEqual(3);

      const label = canvas.getByText('Cartão de crédito');
      const backgroundPage = getComputedStyle(canvasElement.ownerDocument.body).backgroundColor;
      await expect(
        ratioContrast(getComputedStyle(label).color, backgroundPage),
      ).toBeGreaterThanOrEqual(4.5);
    });
  },
};

export const Checked: Story = {
  parameters: {
    covers: ['visual.item2'],
    docs: { source: { transform: radioGroupSelectedSource } },
  },
  render: () => ({
    Component: RadioGroupStory,
    props: {
      value: 'pix',
      ariaLabel: 'Forma de pagamento',
      idPrefix: 'est-chk',
      options: defaultOptions,
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const radios = canvas.getAllByRole('radio');
    const pix = canvas.getByRole('radio', { name: /Pix/ });
    await step('Só a opção do valor inicial aparece marcada', async () => {
      await expect(pix).toHaveAttribute('aria-checked', 'true');
      await expect(radios[0]).toHaveAttribute('aria-checked', 'false');
    });
    await step('O data-state acompanha o aria-checked', async () => {
      // `data-state` é o contrato de markup que as cinco stacks compartilham e
      // é o seletor da animação do dot no CSS.
      await expect(pix).toHaveAttribute('data-state', 'checked');
      await expect(radios[0]).toHaveAttribute('data-state', 'unchecked');
    });
  },
};

export const FocusVisible: Story = {
  parameters: {
    covers: ['accessibility.item3'],
    docs: {
      source: { transform: radioGroupFocusSource },
      description: {
        story:
          'Foco por teclado: Tab entra no grupo e as setas movem entre os itens, com a seleção acompanhando o foco no desktop. O anel sai de `:focus-visible`.',
      },
    },
  },
  render: () => ({
    Component: RadioGroupStory,
    props: {
      ariaLabel: 'Forma de pagamento',
      idPrefix: 'est-foc',
      options: defaultOptions,
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const radios = canvas.getAllByRole('radio');
    await step('Um Tab entra no grupo e para no primeiro item', async () => {
      // Tab de verdade, não `.focus()`: `:focus-visible` só casa quando o foco
      // chega por teclado, e é dele que sai o anel.
      (canvasElement.ownerDocument.activeElement as HTMLElement | null)?.blur();
      await userEvent.tab();
      await expect(radios[0]).toHaveFocus();
    });

    await step('O item focado por teclado desenha anel visível', async () => {
      // Afirma o efeito, não a classe: sobrevive a troca de vocabulário no CSS
      // e reprova se o anel sumir.
      const estilo = getComputedStyle(radios[0] as HTMLElement);
      await expect(estilo.boxShadow !== 'none' || estilo.outlineStyle !== 'none').toBe(true);
    });
  },
};

export const Disabled: Story = {
  parameters: {
    covers: ['functional.item4', 'visual.item3'],
    docs: { source: { transform: radioGroupDisabledSource } },
  },
  render: () => ({
    Component: RadioGroupStory,
    props: {
      disabled: true,
      ariaLabel: 'Forma de pagamento',
      idPrefix: 'est-dis',
      options: defaultOptions,
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const radios = canvas.getAllByRole('radio');
    await step('Todos os itens estão desabilitados', async () => {
      for (const r of radios) {
        await expect(r).toBeDisabled();
      }
    });
    await step('Clicar não altera seleção', async () => {
      await userEvent.click(radios[0], { pointerEventsCheck: 0 });
      await expect(radios[0]).toHaveAttribute('aria-checked', 'false');
    });
  },
};

export const ItemDisabled: Story = {
  parameters: {
    docs: { source: { transform: radioGroupItemDisabledSource } },
  },
  render: () => ({
    Component: RadioGroupStory,
    props: {
      ariaLabel: 'Forma de pagamento',
      idPrefix: 'est-itd',
      options: [
        { value: 'cartao', label: 'Cartão de crédito' },
        { value: 'pix', label: 'Pix (indisponível)', disabled: true },
        { value: 'boleto', label: 'Boleto bancário' },
      ],
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const radios = canvas.getAllByRole('radio');
    const pix = canvas.getByRole('radio', { name: /Pix/i });
    await step('Apenas o item Pix está desabilitado', async () => {
      await expect(pix).toBeDisabled();
      await expect(radios[0]).not.toBeDisabled();
      await expect(radios[2]).not.toBeDisabled();
    });
    await step('O item bloqueado não entra na ordem de tabulação', async () => {
      // Sem isso o Tab pararia numa opção que a pessoa não pode escolher.
      await expect((pix as HTMLElement).tabIndex).toBe(-1);
    });
  },
};

export const Invalid: Story = {
  render: () => ({
    Component: RadioGroupStory,
    props: {
      ariaInvalid: true,
      ariaLabel: 'Forma de pagamento',
      idPrefix: 'est-inv',
      options: defaultOptions,
    },
  }),
  parameters: {
    covers: ['visual.item4'],
    docs: {
      source: { transform: radioGroupInvalidoSource },
      description: {
        story:
          'Grupo com `aria-invalid="true"`; o mesmo atributo em cada item é o que troca a cor da borda para `--destructive` no CSS compartilhado.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const group = canvas.getByRole('radiogroup');
    await step('Grupo está marcado como aria-invalid', async () => {
      await expect(group).toHaveAttribute('aria-invalid', 'true');
    });
    await step('O grupo continua sendo um radiogroup com as duas opções', async () => {
      // Estado de erro não pode custar a semântica: o leitor de tela ainda
      // precisa anunciar o conjunto exclusivo.
      await expect(canvas.getAllByRole('radio')).toHaveLength(2);
    });
  },
};
