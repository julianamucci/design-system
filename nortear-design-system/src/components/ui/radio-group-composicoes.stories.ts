import type { Meta, StoryObj } from '@storybook/html';
import { userEvent, within, expect } from 'storybook/test';
import { createRadioGroup } from './radio-group';

const meta: Meta = {
  tags: ['form'],
  title: 'UI/RadioGroup/Composicoes',
  parameters: {
    actions: { disable: true },
    layout: 'centered',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Composicoes de uso do RadioGroup: FormaDePagamento (vertical, 3 opções), FormaDeEntrega (horizontal, 3 opções curtas), ComDescricao (cada item com texto auxiliar) e EmFormulario (integrado a um `<form>` com submit).',
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

// ─── FormaDePagamento ─────────────────────────────────────────────────────────

export const FormaDePagamento: Story = {
  render: () =>
    withLegend(
      createRadioGroup({
        name: 'payment',
        items: [
          { value: 'card', label: 'Cartão de crédito' },
          { value: 'pix', label: 'Pix' },
          { value: 'boleto', label: 'Boleto bancário' },
        ],
      }),
      'Forma de pagamento',
      'comp-payment-legend',
    ),
  parameters: {
    docs: {
      description: {
        story: 'Caso padrão: 3 opções mutuamente exclusivas em layout vertical. Nenhuma pré-seleção.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Três radios renderizados sem pré-seleção', async () => {
      const radios = canvas.getAllByRole('radio');
      await expect(radios).toHaveLength(3);
      for (const r of radios) await expect(r).toHaveAttribute('aria-checked', 'false');
    });
    await step('Selecionar "Pix" troca o estado', async () => {
      const radios = canvas.getAllByRole('radio');
      await userEvent.click(radios[1]);
      await expect(radios[1]).toHaveAttribute('aria-checked', 'true');
    });
  },
};

// ─── FormaDeEntrega (horizontal) ──────────────────────────────────────────────

export const FormaDeEntrega: Story = {
  render: () => {
    const group = createRadioGroup({
      name: 'delivery',
      items: [
        { value: 'standard', label: 'Padrão (5 dias)' },
        { value: 'express', label: 'Expressa (1 dia)' },
        { value: 'pickup', label: 'Retirar na loja' },
      ],
    });
    group.style.gridAutoFlow = 'column';
    group.style.gridAutoColumns = 'max-content';
    group.style.gap = '1.5rem';
    return withLegend(group, 'Forma de entrega', 'comp-delivery-legend');
  },
  parameters: {
    docs: {
      description: {
        story: 'Layout horizontal para 3 opções curtas. Aplique `grid-flow-col auto-cols-max gap-6` no `<fieldset>` raiz.',
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

// ─── ComDescricao ─────────────────────────────────────────────────────────────

export const ComDescricao: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.className = 'nds-stack';
    wrap.dataset.spacing = 'xs';
    wrap.style.width = '20rem';

    const legend = document.createElement('p');
    legend.id = 'comp-desc-legend';
    legend.className = 'nds-text-body nds-font-semibold';
    legend.textContent = 'Forma de entrega';

    const items = [
      { value: 'standard', label: 'Padrão', description: 'Entrega em 5 dias úteis — frete grátis acima de R$ 199.' },
      { value: 'express', label: 'Expressa', description: 'Receba em 1 dia útil — taxa adicional de R$ 19,90.' },
      { value: 'pickup', label: 'Retirar na loja', description: 'Disponível em 2h — sem custo de frete.' },
    ];

    // Factory base + ajuste manual: o factory não expõe campo `description`.
    const base = createRadioGroup({
      name: 'delivery-desc',
      items: items.map((i) => ({ value: i.value, label: i.label })),
    });
    base.setAttribute('role', 'radiogroup');
    base.setAttribute('aria-labelledby', 'comp-desc-legend');

    items.forEach((item, idx) => {
      const row = base.children[idx] as HTMLElement;
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
        desc.className = 'nds-text-body nds-text-muted-foreground';
        desc.textContent = item.description;
        textGroup.append(label, desc);
      }
    });

    wrap.append(legend, base);
    return wrap;
  },
  parameters: {
    docs: {
      description: {
        story:
          'Cada item acompanha um texto auxiliar abaixo do Label. Útil quando o nome da opção sozinho não comunica o critério de escolha. NOTA: o factory custom (Basecoat) não expõe campo `description` por item — o layout é composto manualmente.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Três descrições visíveis', async () => {
      await expect(canvas.getByText(/Entrega em 5 dias úteis/)).toBeVisible();
      await expect(canvas.getByText(/Receba em 1 dia útil/)).toBeVisible();
      await expect(canvas.getByText(/Disponível em 2h/)).toBeVisible();
    });
  },
};

// ─── EmFormulario ─────────────────────────────────────────────────────────────

export const EmFormulario: Story = {
  render: () => {
    const form = document.createElement('form');
    form.className = 'nds-stack nds-p-4 nds-border-default nds-rounded-lg';
    form.dataset.spacing = 'md';
    form.style.width = '20rem';
    form.noValidate = true;

    // Fieldset semântico com legend nativo
    const fs = document.createElement('fieldset');
    fs.className = 'nds-stack';
    fs.dataset.spacing = 'xs';
    fs.style.border = '0';
    fs.style.padding = '0';
    fs.style.margin = '0';

    const legend = document.createElement('legend');
    legend.className = 'nds-text-body nds-font-semibold nds-mb-2';
    legend.textContent = 'Forma de pagamento';
    fs.appendChild(legend);

    const group = createRadioGroup({
      name: 'payment',
      items: [
        { value: 'card', label: 'Cartão de crédito' },
        { value: 'pix', label: 'Pix' },
        { value: 'boleto', label: 'Boleto bancário' },
      ],
    });
    group.setAttribute('role', 'radiogroup');
    fs.appendChild(group);

    form.appendChild(fs);

    const submit = document.createElement('button');
    submit.type = 'submit';
    submit.className = 'btn btn-primary';
    submit.style.alignSelf = 'flex-end';
    submit.textContent = 'Continuar';
    form.appendChild(submit);

    const out = document.createElement('p');
    out.className = 'nds-text-body nds-text-muted-foreground';
    out.dataset.testid = 'form-output';
    form.appendChild(out);

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const data = new FormData(form);
      out.textContent = `Selecionado: ${data.get('payment') ?? '(nenhum)'}`;
    });

    return form;
  },
  parameters: {
    docs: {
      description: {
        story:
          'RadioGroup dentro de `<form>` com `<fieldset>` + `<legend>` nativos. O `<input type="radio">` interno (com `name`) participa do `FormData` no submit.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Submit sem seleção mostra "(nenhum)"', async () => {
      const submit = canvas.getByRole('button', { name: 'Continuar' });
      await userEvent.click(submit);
      const out = canvasElement.querySelector('[data-testid="form-output"]');
      await expect(out?.textContent).toContain('(nenhum)');
    });

    await step('Selecionar "Pix" e submeter envia o valor', async () => {
      const radios = canvas.getAllByRole('radio');
      await userEvent.click(radios[1]);
      const submit = canvas.getByRole('button', { name: 'Continuar' });
      await userEvent.click(submit);
      const out = canvasElement.querySelector('[data-testid="form-output"]');
      await expect(out?.textContent).toContain('pix');
    });
  },
};
