import type { Meta, StoryObj } from '@storybook/html-vite';
import { within, expect } from 'storybook/test';
import { createRadioGroup } from './radio-group';

const meta: Meta = {
  tags: ['form'],
  title: 'UI/RadioGroup/Variants',
  parameters: {
    actions: { disable: true },
    layout: 'centered',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Variantes de layout do RadioGroup: Vertical (padrão do grupo), Horizontal (2–3 opções curtas, via `orientation`) e WithDescription (Label + texto auxiliar abaixo).',
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
          'Layout padrão — itens empilhados pelo próprio grupo. Recomendado para 4+ opções e para qualquer caso em que a verticalização melhore a leitura.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const radios = canvas.getAllByRole('radio') as HTMLElement[];

    await step('Três radios renderizados', async () => {
      await expect(radios).toHaveLength(3);
    });

    await step('As linhas ficam empilhadas', async () => {
      const topos = new Set(radios.map((el) => Math.round(el.getBoundingClientRect().top)));
      await expect(topos.size).toBe(3);
    });

    await step('Os alvos têm o espaçamento livre que a WCAG 2.5.8 exige', async () => {
      // O rádio tem 16px de lado, abaixo dos 24px de alvo mínimo. A norma aceita
      // o alvo menor quando há espaçamento: os centros ficam a 24px ou mais um
      // do outro. É o gap do grupo que paga essa conta.
      const [a, b] = radios.map((el) => el.getBoundingClientRect());
      await expect(b.top + b.height / 2 - (a.top + a.height / 2)).toBeGreaterThanOrEqual(24);
    });
  },
};

// ─── Horizontal ───────────────────────────────────────────────────────────────

export const Horizontal: Story = {
  render: () =>
    withLegend(
      createRadioGroup({
        name: 'rg-horizontal',
        orientation: 'horizontal',
        items: [
          { value: 'standard', label: 'Padrão (5 dias)' },
          { value: 'express', label: 'Expressa (1 dia)' },
          { value: 'pickup', label: 'Retirar na loja' },
        ],
      }),
      'Forma de entrega',
      'rg-horizontal-legend',
    ),
  parameters: {
    docs: {
      description: {
        story:
          'Layout em linha — para 2 a 3 opções curtas. Sai de `orientation: "horizontal"`, que escreve `aria-orientation` no grupo: o mesmo atributo anuncia a direção das setas e dispõe as opções lado a lado.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const radios = canvas.getAllByRole('radio') as HTMLElement[];

    await step('Três radios renderizados', async () => {
      await expect(radios).toHaveLength(3);
    });

    await step('O grupo anuncia a orientação horizontal', async () => {
      await expect(canvas.getByRole('radiogroup')).toHaveAttribute('aria-orientation', 'horizontal');
    });

    await step('As três opções ficam na mesma linha', async () => {
      // Sem esta asserção o `aria-orientation` poderia estar certo e o layout
      // continuar empilhado — foi assim que a versão em classe morta passou
      // despercebida em três stacks.
      const topos = new Set(radios.map((el) => Math.round(el.getBoundingClientRect().top)));
      await expect(topos.size).toBe(1);
    });
  },
};

// ─── WithDescription ──────────────────────────────────────────────────────────

export const WithDescription: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.className = 'nds-stack';
    wrap.dataset.spacing = 'xs';
    wrap.style.width = '20rem';

    const legend = document.createElement('p');
    legend.id = 'rg-desc-legend';
    legend.className = 'nds-text-body nds-font-semibold';
    legend.textContent = 'Forma de entrega';

    // Custom factory não suporta description por item — construímos o layout
    // manualmente reaproveitando o item visual do createRadioGroup e injetando
    // um <p> de descrição ao lado do label.
    const fieldset = document.createElement('fieldset');
    fieldset.className = 'nds-grid';
    fieldset.dataset.spacing = 'sm';
    fieldset.style.border = '0';
    fieldset.style.padding = '0';
    fieldset.style.margin = '0';
    fieldset.setAttribute('role', 'radiogroup');
    fieldset.setAttribute('aria-labelledby', 'rg-desc-legend');
    // Este fieldset é montado à mão (o factory não expõe `description` por
    // item), então o `role` precisa ser escrito aqui — nos demais casos quem o
    // escreve é o próprio factory.

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

    const baseRows = Array.from(base.children) as HTMLElement[];
    items.forEach((item, idx) => {
      const row = baseRows[idx];
      if (!row) return;
      row.style.alignItems = 'flex-start';

      const label = row.querySelector('label');
      if (label) {
        const textGroup = document.createElement('div');
        textGroup.className = 'nds-stack';
        textGroup.dataset.spacing = 'xs';
        label.replaceWith(textGroup);
        label.className = 'nds-text-body nds-font-medium nds-leading-none nds-cursor-pointer';
        const desc = document.createElement('p');
        desc.id = `rg-with-desc-${item.value}-desc`;
        desc.className = 'nds-text-caption nds-text-muted-foreground';
        desc.textContent = item.description;
        textGroup.append(label, desc);
        // A descrição precisa chegar ao controle: sem `aria-describedby` ela é
        // texto solto ao lado, e quem usa leitor de tela nunca a ouve.
        row
          .querySelector('[data-slot="radio-group-item"]')
          ?.setAttribute('aria-describedby', desc.id);
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
          'Cada par item + Label acompanha um texto auxiliar abaixo, útil quando o nome da opção sozinho não comunica o critério de escolha. Layout construído manualmente — o factory `createRadioGroup` (Vanilla) não expõe campo `description` por item.',
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
    await step('A descrição chega ao controle por aria-describedby', async () => {
      const padrao = canvas.getByRole('radio', { name: 'Padrão' });
      const alvo = padrao.getAttribute('aria-describedby');
      await expect(alvo).toBe('rg-with-desc-standard-desc');
      await expect(
        canvasElement.ownerDocument.getElementById(alvo!)?.textContent ?? '',
      ).toContain('5 dias úteis');
    });
  },
};
