import type { Meta, StoryObj } from '@storybook/html-vite';
import { within, expect } from 'storybook/test';
import { createRadioGroup } from './radio-group';
import {
  radioGroupSource,
  radioGroupSourceWith,
  radioGroupSourceDescription,
} from './radio-group.source';

const meta: Meta = {
  tags: ['form'],
  title: 'Components/Form/RadioGroup/Variants',
  parameters: {
    actions: { disable: true },
    layout: 'centered',
    controls: { disable: true },
    docs: {
      source: { transform: radioGroupSource },
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

// ─── Vertical ─────────────────────────────────────────────────────────────────

export const Vertical: Story = {
  render: () =>
    createRadioGroup({
      name: 'rg-vertical',
      legend: 'Forma de pagamento',
      items: [
        { value: 'card', label: 'Cartão de crédito' },
        { value: 'pix', label: 'Pix' },
        { value: 'boleto', label: 'Boleto bancário' },
      ],
    }),
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
    createRadioGroup({
      name: 'rg-horizontal',
      legend: 'Forma de entrega',
      orientation: 'horizontal',
      items: [
        { value: 'standard', label: 'Padrão (5 dias)' },
        { value: 'express', label: 'Expressa (1 dia)' },
        { value: 'pickup', label: 'Retirar na loja' },
      ],
    }),
  parameters: {
    // Override de story: `orientation` é o assunto, e o snippet do meta cai no
    // empilhado, que é como o grupo já nasce.
    docs: {
      source: {
        transform: radioGroupSourceWith({
          name: 'delivery',
          legend: 'Forma de entrega',
          orientation: 'horizontal',
          items: [
            { value: 'standard', label: 'Padrão (5 dias)' },
            { value: 'express', label: 'Expressa (1 dia)' },
            { value: 'pickup', label: 'Retirar na loja' },
          ],
        }),
      },
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
    wrap.className = 'nds-stack nds-w-sm';
    wrap.dataset.spacing = 'xs';

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

    // O grupo é o da factory, legenda incluída — a story só acrescenta a
    // descrição por item, que é o único ponto que a factory não cobre. Antes
    // daqui ela remontava um `<fieldset role="radiogroup">` à mão para pendurar
    // um `<p>` como rótulo: uma segunda implementação do mesmo componente, que
    // envelhece à parte da primeira.
    const group = createRadioGroup({
      name: 'rg-with-desc',
      legend: 'Forma de entrega',
      items: items.map((i) => ({ value: i.value, label: i.label })),
    });

    const baseRows = Array.from(group.querySelectorAll<HTMLElement>('.nds-radio-row'));
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
    });

    wrap.appendChild(group);
    return wrap;
  },
  parameters: {
    // Override de story: a fábrica não tem campo de descrição, e a composição
    // que a acrescenta é outra FORMA de snippet.
    docs: {
      source: {
        transform: radioGroupSourceDescription(
          [
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
          ],
          { name: 'delivery', legend: 'Forma de entrega' },
        ),
      },
      description: {
        story:
          'Cada par item + Label acompanha um texto auxiliar abaixo, útil quando o nome da opção sozinho não comunica o critério de escolha. A descrição é acrescentada pela composição — a factory não expõe campo `description` por item.',
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
      const target = padrao.getAttribute('aria-describedby');
      await expect(target).toBe('rg-with-desc-standard-desc');
      await expect(
        canvasElement.ownerDocument.getElementById(target!)?.textContent ?? '',
      ).toContain('5 dias úteis');
    });
  },
};
