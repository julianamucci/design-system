import type { Meta, StoryObj } from '@storybook/html';
import { userEvent, within, expect } from 'storybook/test';
import { createRadioGroup } from './radio-group';

const meta: Meta = {
  tags: ['form'],
  title: 'UI/RadioGroup/Estados',
  parameters: {
    actions: { disable: true },
    layout: 'centered',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Estados do RadioGroup: Default (nenhum selecionado), Checked (uma opção marcada), Disabled (grupo inteiro), DisabledItem (apenas 1 item bloqueado), Invalid (aria-invalid + mensagem) e Focus (anel `--ring`).',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function withLegend(group: HTMLElement, labelText: string, id: string): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'nds-stack';
  wrap.dataset.spacing = 'xs';
  const legend = document.createElement('p');
  legend.id = id;
  legend.className = 'nds-text-body nds-font-semibold';
  legend.textContent = labelText;
  group.setAttribute('role', 'radiogroup');
  group.setAttribute('aria-labelledby', id);
  wrap.append(legend, group);
  return wrap;
}

// ─── Default ──────────────────────────────────────────────────────────────────

export const Default: Story = {
  render: () =>
    withLegend(
      createRadioGroup({
        name: 'rg-default',
        items: [
          { value: 'card', label: 'Cartão de crédito' },
          { value: 'pix', label: 'Pix' },
          { value: 'boleto', label: 'Boleto bancário' },
        ],
      }),
      'Forma de pagamento',
      'rg-default-legend',
    ),
  parameters: {
    docs: {
      description: {
        story: 'Nenhum item pré-selecionado — comportamento recomendado para forçar confirmação explícita.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Todos os radios têm aria-checked="false"', async () => {
      const radios = canvas.getAllByRole('radio');
      for (const r of radios) await expect(r).toHaveAttribute('aria-checked', 'false');
    });
  },
};

// ─── Checked ──────────────────────────────────────────────────────────────────

export const Checked: Story = {
  render: () =>
    withLegend(
      createRadioGroup({
        name: 'rg-checked',
        defaultValue: 'pix',
        items: [
          { value: 'card', label: 'Cartão de crédito' },
          { value: 'pix', label: 'Pix' },
          { value: 'boleto', label: 'Boleto bancário' },
        ],
      }),
      'Forma de pagamento',
      'rg-checked-legend',
    ),
  parameters: {
    docs: {
      description: {
        story: 'Item "Pix" marcado via `defaultValue`. Indicador interno visível, `aria-checked="true"`.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Apenas o segundo radio está marcado', async () => {
      const radios = canvas.getAllByRole('radio');
      await expect(radios[0]).toHaveAttribute('aria-checked', 'false');
      await expect(radios[1]).toHaveAttribute('aria-checked', 'true');
      await expect(radios[2]).toHaveAttribute('aria-checked', 'false');
    });
  },
};

// ─── Disabled (grupo inteiro) ─────────────────────────────────────────────────

export const Disabled: Story = {
  render: () =>
    withLegend(
      createRadioGroup({
        name: 'rg-disabled',
        items: [
          { value: 'card', label: 'Cartão de crédito', disabled: true },
          { value: 'pix', label: 'Pix', disabled: true },
          { value: 'boleto', label: 'Boleto bancário', disabled: true },
        ],
      }),
      'Forma de pagamento',
      'rg-disabled-legend',
    ),
  parameters: {
    docs: {
      description: {
        story:
          'Todos os itens com `disabled: true` — `opacity-50`, cursor bloqueado, não recebe foco nem responde a clique. O factory custom do Basecoat não expõe prop `disabled` no grupo: aplique item-a-item.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Todos os radios estão desabilitados', async () => {
      const radios = canvas.getAllByRole('radio');
      for (const r of radios) await expect(r).toBeDisabled();
    });
    await step('Clique não altera o estado', async () => {
      const radios = canvas.getAllByRole('radio');
      await userEvent.click(radios[0]);
      await expect(radios[0]).toHaveAttribute('aria-checked', 'false');
    });
  },
};

// ─── DisabledItem (apenas 1 item) ─────────────────────────────────────────────

export const DisabledItem: Story = {
  render: () =>
    withLegend(
      createRadioGroup({
        name: 'rg-disabled-item',
        items: [
          { value: 'card', label: 'Cartão de crédito' },
          { value: 'pix', label: 'Pix' },
          { value: 'boleto', label: 'Boleto (temporariamente indisponível)', disabled: true },
        ],
      }),
      'Forma de pagamento',
      'rg-disabled-item-legend',
    ),
  parameters: {
    docs: {
      description: {
        story: 'Apenas o terceiro item desabilitado. Útil para indicar opções temporariamente indisponíveis.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Apenas o terceiro radio está desabilitado', async () => {
      const radios = canvas.getAllByRole('radio');
      await expect(radios[0]).not.toBeDisabled();
      await expect(radios[1]).not.toBeDisabled();
      await expect(radios[2]).toBeDisabled();
    });
  },
};

// ─── Invalid ──────────────────────────────────────────────────────────────────

export const Invalid: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.className = 'nds-stack';
    wrap.dataset.spacing = 'xs';

    const legend = document.createElement('p');
    legend.id = 'rg-invalid-legend';
    legend.className = 'nds-text-body nds-font-semibold';
    legend.textContent = 'Forma de pagamento';

    const group = createRadioGroup({
      name: 'rg-invalid',
      items: [
        { value: 'card', label: 'Cartão de crédito' },
        { value: 'pix', label: 'Pix' },
        { value: 'boleto', label: 'Boleto bancário' },
      ],
    });
    group.setAttribute('role', 'radiogroup');
    group.setAttribute('aria-labelledby', 'rg-invalid-legend');
    group.setAttribute('aria-invalid', 'true');
    group.setAttribute('aria-describedby', 'rg-invalid-msg');

    // Estiliza visualmente todos os botões como inválidos
    group.querySelectorAll<HTMLButtonElement>('[data-slot="radio-group-item"]').forEach((btn) => {
      btn.setAttribute('aria-invalid', 'true');
      btn.classList.add('nds-border-destructive');
      btn.style.boxShadow = '0 0 0 2px rgb(var(--destructive) / 0.2)';
    });

    const msg = document.createElement('p');
    msg.id = 'rg-invalid-msg';
    msg.className = 'nds-text-body nds-text-destructive';
    msg.textContent = 'Selecione uma forma de pagamento para continuar.';

    wrap.append(legend, group, msg);
    return wrap;
  },
  parameters: {
    docs: {
      description: {
        story:
          'Estado de erro via `aria-invalid="true"` no grupo. Borda `--destructive` em cada item, mensagem associada via `aria-describedby`.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Grupo possui aria-invalid', async () => {
      const group = canvasElement.querySelector('[role="radiogroup"]');
      await expect(group).toHaveAttribute('aria-invalid', 'true');
    });
    await step('Mensagem de erro associada via aria-describedby', async () => {
      const group = canvasElement.querySelector('[role="radiogroup"]');
      await expect(group).toHaveAttribute('aria-describedby', 'rg-invalid-msg');
      await expect(canvas.getByText(/Selecione uma forma de pagamento/)).toBeVisible();
    });
  },
};

// ─── FocoVisivel ──────────────────────────────────────────────────────────────

export const FocoVisivel: Story = {
  render: () =>
    withLegend(
      createRadioGroup({
        name: 'rg-focus',
        items: [
          { value: 'card', label: 'Cartão de crédito' },
          { value: 'pix', label: 'Pix' },
          { value: 'boleto', label: 'Boleto bancário' },
        ],
      }),
      'Forma de pagamento',
      'rg-focus-legend',
    ),
  parameters: {
    docs: {
      description: {
        story: 'Estado de foco via teclado. Anel `ring-1 ring-ring` ao redor do item focado.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Primeiro radio recebe foco', async () => {
      const radios = canvas.getAllByRole('radio');
      (radios[0] as HTMLElement).focus();
      await expect(radios[0]).toHaveFocus();
    });
  },
};
