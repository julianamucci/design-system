import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { within, userEvent, expect } from 'storybook/test';
import { RadioGroup, RadioGroupItem } from './index';
import { Label } from '@/components/ui/label';

const meta = {
  title: 'UI/RadioGroup/States',
  component: RadioGroup,
  tags: ['form'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          'Estados do RadioGroup: default, checked, focus, disabled (grupo inteiro), itemDisabled (somente um item) e invalid (aria-invalid).',
      },
    },
  },
} satisfies Meta<typeof RadioGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Razão de contraste da WCAG entre duas cores computadas opacas. Comparar nome
 * de token não responde a pergunta do critério — a razão responde.
 */
function razaoContraste(a: string, b: string): number {
  const luminancia = (cor: string): number => {
    const [r, g, bl] = cor
      .match(/[\d.]+/g)!
      .slice(0, 3)
      .map(Number)
      .map((v) => {
        const s = v / 255;
        return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
      });
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [claro, escuro] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
  return (claro + 0.05) / (escuro + 0.05);
}

export const Default: Story = {
  parameters: { covers: ['visual.item1', 'accessibility.item2'] },
  render: () => ({
    components: { RadioGroup, RadioGroupItem, Label },
    setup() { return {}; },
    template: `
      <RadioGroup aria-label="Forma de pagamento" class="nds-grid" data-spacing="sm" style="width: 18rem">
        <div class="nds-cluster" data-spacing="sm">
          <RadioGroupItem value="cartao" id="est-def-cartao" />
          <Label :for="'est-def-cartao'">Cartão de crédito</Label>
        </div>
        <div class="nds-cluster" data-spacing="sm">
          <RadioGroupItem value="pix" id="est-def-pix" />
          <Label :for="'est-def-pix'">Pix</Label>
        </div>
      </RadioGroup>
    `,
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
      const estiloItem = getComputedStyle(radios[0]);
      await expect(
        razaoContraste(estiloItem.borderTopColor, estiloItem.backgroundColor),
      ).toBeGreaterThanOrEqual(3);

      const rotulo = canvas.getByText('Cartão de crédito');
      const fundoPagina = getComputedStyle(canvasElement.ownerDocument.body).backgroundColor;
      await expect(
        razaoContraste(getComputedStyle(rotulo).color, fundoPagina),
      ).toBeGreaterThanOrEqual(4.5);
    });
  },
};

export const Checked: Story = {
  parameters: { covers: ['visual.item2'] },
  render: () => ({
    components: { RadioGroup, RadioGroupItem, Label },
    setup() { return {}; },
    template: `
      <RadioGroup default-value="pix" aria-label="Forma de pagamento" class="nds-grid" data-spacing="sm" style="width: 18rem">
        <div class="nds-cluster" data-spacing="sm">
          <RadioGroupItem value="cartao" id="est-chk-cartao" />
          <Label :for="'est-chk-cartao'">Cartão de crédito</Label>
        </div>
        <div class="nds-cluster" data-spacing="sm">
          <RadioGroupItem value="pix" id="est-chk-pix" />
          <Label :for="'est-chk-pix'">Pix</Label>
        </div>
      </RadioGroup>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const radios = canvas.getAllByRole('radio');
    const pix = canvas.getByRole('radio', { name: /Pix/ });
    await step('Só a opção do defaultValue aparece marcada', async () => {
      await expect(pix).toHaveAttribute('aria-checked', 'true');
      await expect(radios[0]).toHaveAttribute('aria-checked', 'false');
    });
    await step('A bolinha do item marcado está visível', async () => {
      // O indicador só existe no DOM quando o item está escolhido — é o que
      // separa "marcado" de "marcado só no atributo".
      const indicador = pix.querySelector('.nds-radio-indicator');
      await expect(indicador).toBeVisible();
      await expect(radios[0].querySelector('.nds-radio-indicator')).toBeNull();
    });
  },
};

export const FocusVisible: Story = {
  parameters: {
    covers: ['accessibility.item3'],
    docs: {
      description: {
        story:
          'Foco por teclado: Tab entra no grupo e as setas movem entre os itens, com a seleção acompanhando o foco no desktop. O anel sai de `:focus-visible`.',
      },
    },
  },
  render: () => ({
    components: { RadioGroup, RadioGroupItem, Label },
    setup() { return {}; },
    template: `
      <RadioGroup aria-label="Forma de pagamento" class="nds-grid" data-spacing="sm" style="width: 18rem">
        <div class="nds-cluster" data-spacing="sm">
          <RadioGroupItem value="cartao" id="est-foc-cartao" />
          <Label :for="'est-foc-cartao'">Cartão de crédito</Label>
        </div>
        <div class="nds-cluster" data-spacing="sm">
          <RadioGroupItem value="pix" id="est-foc-pix" />
          <Label :for="'est-foc-pix'">Pix</Label>
        </div>
      </RadioGroup>
    `,
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
  parameters: { covers: ['functional.item4', 'visual.item3'] },
  render: () => ({
    components: { RadioGroup, RadioGroupItem, Label },
    setup() { return {}; },
    template: `
      <RadioGroup :disabled="true" aria-label="Forma de pagamento" class="nds-grid" data-spacing="sm" style="width: 18rem">
        <div class="nds-cluster" data-spacing="sm">
          <RadioGroupItem value="cartao" id="est-dis-cartao" />
          <Label :for="'est-dis-cartao'">Cartão de crédito</Label>
        </div>
        <div class="nds-cluster" data-spacing="sm">
          <RadioGroupItem value="pix" id="est-dis-pix" />
          <Label :for="'est-dis-pix'">Pix</Label>
        </div>
      </RadioGroup>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const radios = canvas.getAllByRole('radio');
    await step('Todos os itens estão desabilitados', async () => {
      for (const r of radios) {
        await expect(r).toHaveAttribute('data-disabled');
      }
    });
    await step('Clicar não altera seleção', async () => {
      await userEvent.click(radios[0], { pointerEventsCheck: 0 });
      await expect(radios[0]).toHaveAttribute('aria-checked', 'false');
    });
  },
};

export const ItemDisabled: Story = {
  render: () => ({
    components: { RadioGroup, RadioGroupItem, Label },
    setup() { return {}; },
    template: `
      <RadioGroup aria-label="Forma de pagamento" class="nds-grid" data-spacing="sm" style="width: 18rem">
        <div class="nds-cluster" data-spacing="sm">
          <RadioGroupItem value="cartao" id="est-itd-cartao" />
          <Label :for="'est-itd-cartao'">Cartão de crédito</Label>
        </div>
        <div class="nds-cluster" data-spacing="sm">
          <RadioGroupItem value="pix" id="est-itd-pix" :disabled="true" />
          <Label :for="'est-itd-pix'">Pix (indisponível)</Label>
        </div>
        <div class="nds-cluster" data-spacing="sm">
          <RadioGroupItem value="boleto" id="est-itd-boleto" />
          <Label :for="'est-itd-boleto'">Boleto bancário</Label>
        </div>
      </RadioGroup>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const radios = canvas.getAllByRole('radio');
    const pix = canvas.getByRole('radio', { name: /Pix/i });
    await step('Apenas o item Pix está desabilitado', async () => {
      await expect(pix).toHaveAttribute('data-disabled');
      await expect(radios[0]).not.toHaveAttribute('data-disabled');
      await expect(radios[2]).not.toHaveAttribute('data-disabled');
    });
    await step('O item bloqueado não entra na ordem de tabulação', async () => {
      // Sem isso o Tab pararia numa opção que a pessoa não pode escolher.
      await expect((pix as HTMLElement).tabIndex).toBe(-1);
    });
  },
};

export const Invalid: Story = {
  parameters: { covers: ['visual.item4'] },
  render: () => ({
    components: { RadioGroup, RadioGroupItem, Label },
    setup() { return {}; },
    template: `
      <div class="nds-stack" data-spacing="sm" style="width: 20rem">
        <fieldset class="nds-stack" data-spacing="sm">
          <legend class="nds-text-body nds-font-semibold">Forma de pagamento *</legend>
          <RadioGroup aria-label="Forma de pagamento" aria-invalid="true" aria-describedby="est-inv-err" class="nds-stack" data-spacing="sm">
            <div class="nds-cluster" data-spacing="sm">
              <RadioGroupItem value="cartao" id="est-inv-cartao" aria-invalid="true" />
              <Label :for="'est-inv-cartao'">Cartão de crédito</Label>
            </div>
            <div class="nds-cluster" data-spacing="sm">
              <RadioGroupItem value="pix" id="est-inv-pix" aria-invalid="true" />
              <Label :for="'est-inv-pix'">Pix</Label>
            </div>
          </RadioGroup>
        </fieldset>
        <p id="est-inv-err" class="nds-text-body nds-text-destructive">
          Selecione uma forma de pagamento para continuar.
        </p>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const radios = canvas.getAllByRole('radio');
    await step('Itens estão marcados como aria-invalid', async () => {
      for (const r of radios) await expect(r).toHaveAttribute('aria-invalid', 'true');
    });
    await step('Mensagem de erro visível', async () => {
      await expect(canvas.getByText(/Selecione uma forma de pagamento/)).toBeVisible();
    });
  },
};
