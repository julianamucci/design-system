import type { Meta, StoryObj } from '@storybook/html';
import { userEvent, within, expect } from 'storybook/test';
import { createSelect } from './select';

const meta: Meta = {
  tags: ['form'],
  title: 'UI/Select/Estados',
  parameters: {
    actions: { disable: true },
    layout: 'centered',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Estados do Select: Default (placeholder visível), Selected (valor escolhido via defaultValue), Disabled (todo o select bloqueado), DisabledItem (apenas 1 option bloqueada), Invalid (aria-invalid + mensagem) e Focus (anel `--ring`). NOTA: estado "Open" não tem story dedicada — o dropdown é o popup nativo do navegador, controlado pelo SO.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function withLabel(select: HTMLSelectElement, labelText: string, id: string): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'nds-stack';
  wrap.dataset.spacing = 'sm';
  wrap.style.width = '20rem';

  const label = document.createElement('label');
  label.htmlFor = id;
  label.className = 'nds-text-body nds-font-semibold';
  label.textContent = labelText;

  select.id = id;
  wrap.append(label, select);
  return wrap;
}

const BASIC_ITEMS = [
  { value: 'sp', label: 'São Paulo' },
  { value: 'rj', label: 'Rio de Janeiro' },
  { value: 'mg', label: 'Minas Gerais' },
];

// ─── Default ──────────────────────────────────────────────────────────────────

export const Default: Story = {
  render: () =>
    withLabel(
      createSelect({
        placeholder: 'Selecione...',
        items: BASIC_ITEMS,
      }),
      'Estado',
      'st-default',
    ),
  parameters: {
    docs: {
      description: {
        story: 'Estado inicial — placeholder visível, nenhum valor selecionado. Recomendado para forçar confirmação explícita do usuário.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Select vazio (placeholder visível)', async () => {
      const select = canvas.getByRole('combobox') as HTMLSelectElement;
      await expect(select.value).toBe('');
    });
  },
};

// ─── Selected ─────────────────────────────────────────────────────────────────

export const Selected: Story = {
  render: () =>
    withLabel(
      createSelect({
        placeholder: 'Selecione...',
        defaultValue: 'rj',
        items: BASIC_ITEMS,
      }),
      'Estado',
      'st-selected',
    ),
  parameters: {
    docs: {
      description: {
        story: '`defaultValue: "rj"` — Rio de Janeiro selecionado inicialmente, placeholder oculto.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Valor "rj" selecionado', async () => {
      const select = canvas.getByRole('combobox') as HTMLSelectElement;
      await expect(select.value).toBe('rj');
    });
  },
};

// ─── Disabled ─────────────────────────────────────────────────────────────────

export const Disabled: Story = {
  render: () =>
    withLabel(
      createSelect({
        placeholder: 'Selecione...',
        disabled: true,
        items: BASIC_ITEMS,
      }),
      'Estado',
      'st-disabled',
    ),
  parameters: {
    docs: {
      description: {
        story: '`disabled: true` no factory — `opacity-50`, cursor bloqueado, não recebe foco nem abre o dropdown.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Select está desabilitado', async () => {
      const select = canvas.getByRole('combobox') as HTMLSelectElement;
      await expect(select).toBeDisabled();
    });
  },
};

// ─── DisabledItem ─────────────────────────────────────────────────────────────

export const DisabledItem: Story = {
  render: () =>
    withLabel(
      createSelect({
        placeholder: 'Selecione...',
        items: [
          { value: 'sp', label: 'São Paulo' },
          { value: 'rj', label: 'Rio de Janeiro' },
          { value: 'mg', label: 'Minas Gerais (indisponível)', disabled: true },
        ],
      }),
      'Estado',
      'st-disabled-item',
    ),
  parameters: {
    docs: {
      description: {
        story: 'Apenas o terceiro item desabilitado via `items[2].disabled = true`. Útil para indicar opções temporariamente indisponíveis.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Terceira <option> está desabilitada', async () => {
      const select = canvas.getByRole('combobox') as HTMLSelectElement;
      const options = Array.from(select.querySelectorAll('option')).filter((o) => !o.hidden);
      const mg = options.find((o) => o.value === 'mg');
      await expect(mg?.disabled).toBe(true);
    });
  },
};

// ─── Invalid ──────────────────────────────────────────────────────────────────

export const Invalid: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.className = 'nds-stack';
    wrap.dataset.spacing = 'sm';
    wrap.style.width = '20rem';

    const label = document.createElement('label');
    label.htmlFor = 'st-invalid';
    label.className = 'nds-text-body nds-font-semibold';
    label.textContent = 'Estado';

    const select = createSelect({
      placeholder: 'Selecione...',
      items: BASIC_ITEMS,
    });
    select.id = 'st-invalid';
    select.setAttribute('aria-invalid', 'true');
    select.setAttribute('aria-describedby', 'st-invalid-msg');
    select.classList.add('nds-border-destructive');

    const msg = document.createElement('p');
    msg.id = 'st-invalid-msg';
    msg.className = 'nds-text-body nds-text-destructive';
    msg.textContent = 'Selecione um estado para continuar.';

    wrap.append(label, select, msg);
    return wrap;
  },
  parameters: {
    docs: {
      description: {
        story:
          'Estado de erro via `aria-invalid="true"` no `<select>`. Borda `--destructive`, mensagem associada via `aria-describedby`.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Select possui aria-invalid', async () => {
      const select = canvas.getByRole('combobox');
      await expect(select).toHaveAttribute('aria-invalid', 'true');
    });
    await step('Mensagem de erro associada', async () => {
      const select = canvas.getByRole('combobox');
      await expect(select).toHaveAttribute('aria-describedby', 'st-invalid-msg');
      await expect(canvas.getByText(/Selecione um estado para continuar/)).toBeVisible();
    });
  },
};

// ─── FocoVisivel ──────────────────────────────────────────────────────────────

export const FocoVisivel: Story = {
  render: () =>
    withLabel(
      createSelect({
        placeholder: 'Selecione...',
        items: BASIC_ITEMS,
      }),
      'Estado',
      'st-focus',
    ),
  parameters: {
    docs: {
      description: {
        story: 'Estado de foco via teclado — anel `--ring` ao redor do `<select>`.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Select recebe foco via Tab', async () => {
      const select = canvas.getByRole('combobox');
      await userEvent.tab();
      await expect(select).toHaveFocus();
    });
  },
};
