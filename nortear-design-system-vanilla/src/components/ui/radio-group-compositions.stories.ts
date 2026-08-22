import type { Meta, StoryObj } from '@storybook/html-vite';
import { userEvent, within, expect } from 'storybook/test';
import { createRadioGroup } from './radio-group';
import {
  radioGroupSource,
  radioGroupSourceWith,
  radioGroupSourceDescription,
  radioGroupSourceForm,
} from './radio-group.source';
import { createButton } from './button';

const meta: Meta = {
  tags: ['form'],
  title: 'UI/RadioGroup/Compositions',
  parameters: {
    actions: { disable: true },
    layout: 'centered',
    controls: { disable: true },
    docs: {
      source: { transform: radioGroupSource },
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

/** Idempotente — ver a nota em `radio-group.stories.ts`. */
const choose = async (alvo: HTMLElement): Promise<void> => {
  if (alvo.getAttribute('aria-checked') !== 'true') await userEvent.click(alvo);
  await expect(alvo).toHaveAttribute('aria-checked', 'true');
};

// ─── FormaDePagamento ─────────────────────────────────────────────────────────

export const PaymentMethod: Story = {
  render: () =>
    createRadioGroup({
      name: 'payment',
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
        story: 'Caso padrão: 3 opções mutuamente exclusivas em layout vertical. Nenhuma pré-seleção.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const radios = canvas.getAllByRole('radio') as HTMLElement[];

    await step('Três radios renderizados', async () => {
      // A ausência de pré-seleção é asserção de MONTAGEM e mora na story
      // `States/Default`, que não interage: nenhum replay a alcançaria aqui.
      await expect(radios).toHaveLength(3);
    });

    await step('Selecionar "Pix" marca só ele', async () => {
      await choose(canvas.getByRole('radio', { name: 'Pix' }));
      await expect(radios[0]).toHaveAttribute('aria-checked', 'false');
      await expect(radios[2]).toHaveAttribute('aria-checked', 'false');
    });

    await step('Clicar no rótulo escolhe a opção', async () => {
      // O rótulo faz parte do alvo de clique — teste que não depende do markup
      // interno do item.
      await userEvent.click(canvas.getByText('Boleto bancário'));
      await expect(radios[2]).toHaveAttribute('aria-checked', 'true');
      await expect(radios[1]).toHaveAttribute('aria-checked', 'false');
    });
  },
};

// ─── FormaDeEntrega (horizontal) ──────────────────────────────────────────────

export const DeliveryMethod: Story = {
  render: () =>
    createRadioGroup({
      name: 'delivery',
      legend: 'Forma de entrega',
      items: [
        { value: 'standard', label: 'Padrão (5 dias)' },
        { value: 'express', label: 'Expressa (1 dia)' },
        { value: 'pickup', label: 'Retirar na loja' },
      ],
      // Dispara `.nds-radio-group[aria-orientation="horizontal"]`, que já traz o
      // grid em coluna com `gap: var(--spacing-6)` — e alinha o anúncio do
      // leitor de tela ao layout, coisa que as três declarações inline não faziam.
      orientation: 'horizontal',
    }),
  parameters: {
    // Override de story: `orientation` é o assunto.
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

export const WithDescription: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.className = 'nds-stack nds-w-sm';
    wrap.dataset.spacing = 'xs';

    const items = [
      { value: 'standard', label: 'Padrão', description: 'Entrega em 5 dias úteis — frete grátis acima de R$ 199.' },
      { value: 'express', label: 'Expressa', description: 'Receba em 1 dia útil — taxa adicional de R$ 19,90.' },
      { value: 'pickup', label: 'Retirar na loja', description: 'Disponível em 2h — sem custo de frete.' },
    ];

    // Factory base + ajuste manual: o factory não expõe campo `description`.
    // O papel e o nome do grupo são dele — a legenda vem da opção `legend`, e
    // não de um `<p>` amarrado por fora.
    const base = createRadioGroup({
      name: 'delivery-desc',
      legend: 'Forma de entrega',
      items: items.map((i) => ({ value: i.value, label: i.label })),
    });

    const linhas = Array.from(base.querySelectorAll<HTMLElement>('.nds-radio-row'));
    items.forEach((item, idx) => {
      const row = linhas[idx];
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
        desc.className = 'nds-text-body';
        desc.textContent = item.description;
        textGroup.append(label, desc);
      }
    });

    wrap.appendChild(base);
    return wrap;
  },
  parameters: {
    // Override de story: a descrição por item não é opção da fábrica — a
    // composição que a acrescenta é outra FORMA de snippet.
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
          'Cada item acompanha um texto auxiliar abaixo do Label. Útil quando o nome da opção sozinho não comunica o critério de escolha. NOTA: o factory custom (Vanilla) não expõe campo `description` por item — o layout é composto manualmente.',
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

export const InForm: Story = {
  render: () => {
    const form = document.createElement('form');
    form.className = 'nds-stack nds-p-4 nds-border-default nds-rounded-lg nds-w-sm';
    form.dataset.spacing = 'md';
    form.noValidate = true;

    // O `<fieldset>` com `<legend>` nativo é o do próprio grupo. Antes daqui a
    // story embrulhava o grupo num SEGUNDO fieldset só para ter onde pôr a
    // legenda — dois agrupamentos aninhados anunciando o mesmo campo.
    const group = createRadioGroup({
      name: 'payment',
      legend: 'Forma de pagamento',
      items: [
        { value: 'card', label: 'Cartão de crédito' },
        { value: 'pix', label: 'Pix' },
        { value: 'boleto', label: 'Boleto bancário' },
      ],
    });

    form.appendChild(group);

    // `createButton`, não um `<button>` cru com as classes do framework
    // utilitário antigo: elas não existem no CSS `.nds-*` e o botão de submit
    // vinha sem estilo nenhum.
    const submit = createButton({ type: 'submit', label: 'Continuar' });
    form.appendChild(submit);

    const out = document.createElement('p');
    out.className = 'nds-text-body';
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
    // Override de story: o `<form>` e o `FormData` do submit são o assunto, e
    // o snippet do meta mostraria o grupo sozinho.
    docs: {
      source: { transform: radioGroupSourceForm({ name: 'payment' }) },
      description: {
        story:
          'RadioGroup dentro de `<form>` com `<fieldset>` + `<legend>` nativos. O `<input type="radio">` interno (com `name`) participa do `FormData` no submit.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const submit = canvas.getByRole('button', { name: 'Continuar' });
    const saida = () => canvasElement.querySelector('[data-testid="form-output"]')?.textContent ?? '';

    // O caso "formulário sem escolha" é asserção de MONTAGEM — depois do
    // primeiro clique nenhum replay volta a ele. Ele mora em `States/Default`.
    await step('Selecionar "Pix" e submeter envia o valor escolhido', async () => {
      await choose(canvas.getByRole('radio', { name: 'Pix' }));
      await userEvent.click(submit);
      await expect(saida()).toContain('pix');
    });

    await step('Trocar a escolha troca o que o formulário envia', async () => {
      // Segunda rodada com valor diferente: prova que o input escondido
      // acompanha a seleção, e não que ele foi preenchido uma vez.
      await choose(canvas.getByRole('radio', { name: 'Boleto bancário' }));
      await userEvent.click(submit);
      await expect(saida()).toContain('boleto');
    });
  },
};
