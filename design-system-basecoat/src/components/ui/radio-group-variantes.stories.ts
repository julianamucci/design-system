import type { Meta, StoryObj } from '@storybook/html';
import { within, expect } from 'storybook/test';
import { createRadioGroup } from './radio-group';

const meta: Meta = {
  title: 'UI/RadioGroup/Variantes',
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Variantes de layout do RadioGroup: Vertical (padrão, grid gap-2), Horizontal (flex gap-6 para 2-3 opções curtas) e WithDescription (Label + texto auxiliar abaixo). O factory custom do Basecoat não expõe prop `orientation` — a orientação é aplicada via classe utilitária no `<fieldset>`.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function withLegend(group: HTMLElement, labelText: string, id: string): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'flex flex-col gap-2';
  const legend = document.createElement('p');
  legend.id = id;
  legend.className = 'text-sm font-semibold';
  legend.textContent = labelText;
  group.setAttribute('role', 'radiogroup');
  group.setAttribute('aria-labelledby', id);
  wrap.append(legend, group);
  return wrap;
}

// ─── Vertical ─────────────────────────────────────────────────────────────────

export const Vertical: Story = {
  render: () =>
    withLegend(
      createRadioGroup({
        name: 'rg-vertical',
        items: [
          { value: 'card', label: 'Cartão de crédito' },
          { value: 'pix', label: 'Pix' },
          { value: 'boleto', label: 'Boleto bancário' },
        ],
      }),
      'Forma de pagamento',
      'rg-vertical-legend',
    ),
  parameters: {
    docs: {
      description: {
        story:
          'Layout padrão — itens empilhados com `grid gap-2`. Recomendado para 4+ opções e para qualquer caso em que a verticalização melhore a leitura.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Três radios renderizados', async () => {
      const radios = canvas.getAllByRole('radio');
      await expect(radios).toHaveLength(3);
    });
  },
};

// ─── Horizontal ───────────────────────────────────────────────────────────────

export const Horizontal: Story = {
  render: () => {
    const group = createRadioGroup({
      name: 'rg-horizontal',
      items: [
        { value: 'standard', label: 'Padrão (5 dias)' },
        { value: 'express', label: 'Expressa (1 dia)' },
        { value: 'pickup', label: 'Retirar na loja' },
      ],
      class: 'grid-flow-col auto-cols-max gap-6',
    });
    return withLegend(group, 'Forma de entrega', 'rg-horizontal-legend');
  },
  parameters: {
    docs: {
      description: {
        story:
          'Layout inline — para 2 a 3 opções curtas. Aplicado via `grid-flow-col auto-cols-max gap-6` sobre o `<fieldset>` raiz (o factory não expõe prop `orientation`).',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Três radios renderizados', async () => {
      const radios = canvas.getAllByRole('radio');
      await expect(radios).toHaveLength(3);
    });
  },
};

// ─── WithDescription ──────────────────────────────────────────────────────────

export const WithDescription: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.className = 'flex flex-col gap-2 w-80';

    const legend = document.createElement('p');
    legend.id = 'rg-desc-legend';
    legend.className = 'text-sm font-semibold';
    legend.textContent = 'Forma de entrega';

    // Custom factory não suporta description por item — construímos o layout
    // manualmente reaproveitando o item visual do createRadioGroup e injetando
    // um <p> de descrição ao lado do label.
    const fieldset = document.createElement('fieldset');
    fieldset.className = 'grid gap-3 border-0 p-0 m-0';
    fieldset.setAttribute('role', 'radiogroup');
    fieldset.setAttribute('aria-labelledby', 'rg-desc-legend');

    const items = [
      {
        value: 'standard',
        label: 'Padrão',
        description: 'Entrega em 5 dias úteis — frete grátis acima de R$ 199.',
      },
      {
        value: 'express',
        label: 'Expressa',
        description: 'Receba em 1 dia útil — taxa adicional de R$ 19,90.',
      },
      {
        value: 'pickup',
        label: 'Retirar na loja',
        description: 'Disponível em 2h — sem custo de frete.',
      },
    ];

    // Reaproveita o factory para obter a estrutura base de cada item,
    // mas anexamos a descrição ao lado do label.
    const base = createRadioGroup({
      name: 'rg-with-desc',
      items: items.map((i) => ({ value: i.value, label: i.label })),
    });

    items.forEach((item, idx) => {
      const row = base.children[idx] as HTMLElement;
      if (!row) return;
      row.classList.remove('items-center');
      row.classList.add('items-start');

      const label = row.querySelector('label');
      if (label) {
        const textGroup = document.createElement('div');
        textGroup.className = 'flex flex-col gap-1';
        label.replaceWith(textGroup);
        label.className = 'text-sm font-medium leading-none cursor-pointer';
        const desc = document.createElement('p');
        desc.className = 'text-sm text-muted-foreground';
        desc.textContent = item.description;
        textGroup.append(label, desc);
      }

      fieldset.appendChild(row);
    });

    wrap.append(legend, fieldset);
    return wrap;
  },
  parameters: {
    docs: {
      description: {
        story:
          'Cada par item + Label acompanha um texto auxiliar abaixo, útil quando o nome da opção sozinho não comunica o critério de escolha. Layout construído manualmente — o factory `createRadioGroup` (Basecoat) não expõe campo `description` por item.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Três radios renderizados', async () => {
      const radios = canvas.getAllByRole('radio');
      await expect(radios).toHaveLength(3);
    });
    await step('Descrição auxiliar visível', async () => {
      await expect(canvas.getByText(/Entrega em 5 dias úteis/)).toBeVisible();
    });
  },
};
