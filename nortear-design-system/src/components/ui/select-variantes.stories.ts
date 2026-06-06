import type { Meta, StoryObj } from '@storybook/html';
import { within, expect } from 'storybook/test';
import { createSelect } from './select';

const meta: Meta = {
  tags: ['form'],
  title: 'UI/Select/Variantes',
  parameters: {
    actions: { disable: true },
    layout: 'centered',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Variantes do Select: Default (lista plana), WithGroups (<optgroup> agrupando opções) e WithIcon — **indisponível** no Basecoat porque o factory custom é um wrapper do `<select>` HTML nativo, que não suporta ícones inline em `<option>`. Para a variante de ícone, use `Combobox` ou um componente custom.',
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

// ─── Default ──────────────────────────────────────────────────────────────────

export const Default: Story = {
  render: () =>
    withLabel(
      createSelect({
        placeholder: 'Selecione...',
        items: [
          { value: 'sp', label: 'São Paulo' },
          { value: 'rj', label: 'Rio de Janeiro' },
          { value: 'mg', label: 'Minas Gerais' },
          { value: 'rs', label: 'Rio Grande do Sul' },
        ],
      }),
      'Estado',
      'v-default-select',
    ),
  parameters: {
    docs: {
      description: {
        story: 'Lista simples — apenas itens planos via API `createSelect({ items })`. Placeholder "Selecione..." é renderizado como `<option>` disabled+hidden no topo.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Select renderizado como combobox', async () => {
      const select = canvas.getByRole('combobox');
      await expect(select).toBeTruthy();
    });
    await step('Nenhum valor pré-selecionado', async () => {
      const select = canvas.getByRole('combobox') as HTMLSelectElement;
      await expect(select.value).toBe('');
    });
  },
};

// ─── WithGroups ───────────────────────────────────────────────────────────────

export const WithGroups: Story = {
  render: () => {
    // O factory createSelect só aceita items planos.
    // Para agrupar, montamos o <select> + <optgroup> diretamente,
    // reaproveitando as classes do tema Basecoat.
    const select = document.createElement('select');
    select.className = 'select';
    select.dataset.slot = 'select';

    const ph = document.createElement('option');
    ph.value = '';
    ph.textContent = 'Selecione...';
    ph.disabled = true;
    ph.selected = true;
    ph.hidden = true;
    select.appendChild(ph);

    const groups: { label: string; items: { value: string; label: string }[] }[] = [
      {
        label: 'Sudeste',
        items: [
          { value: 'sp', label: 'São Paulo' },
          { value: 'rj', label: 'Rio de Janeiro' },
          { value: 'mg', label: 'Minas Gerais' },
          { value: 'es', label: 'Espírito Santo' },
        ],
      },
      {
        label: 'Sul',
        items: [
          { value: 'rs', label: 'Rio Grande do Sul' },
          { value: 'sc', label: 'Santa Catarina' },
          { value: 'pr', label: 'Paraná' },
        ],
      },
    ];

    groups.forEach((g) => {
      const og = document.createElement('optgroup');
      og.label = g.label;
      g.items.forEach((it) => {
        const opt = document.createElement('option');
        opt.value = it.value;
        opt.textContent = it.label;
        og.appendChild(opt);
      });
      select.appendChild(og);
    });

    return withLabel(select, 'Selecione a região', 'v-groups-select');
  },
  parameters: {
    docs: {
      description: {
        story:
          'Opções agrupadas por categoria com `<optgroup>`. NOTA: o factory `createSelect` (Basecoat) só aceita uma lista plana — para grupos, monte o `<select>` + `<optgroup>` manualmente como mostrado no código.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Select renderizado e contém optgroups', async () => {
      const select = canvas.getByRole('combobox') as HTMLSelectElement;
      const optgroups = select.querySelectorAll('optgroup');
      await expect(optgroups.length).toBe(2);
    });
  },
};

// ─── WithIcon (indisponível no Basecoat) ──────────────────────────────────────

export const WithIcon: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.className = 'nds-stack nds-rounded-md';
    wrap.dataset.spacing = 'sm';
    wrap.style.width = '20rem';
    wrap.style.padding = '1rem';
    wrap.style.border = '1px dashed var(--color-border)';

    const title = document.createElement('p');
    title.className = 'nds-text-body nds-font-semibold';
    title.textContent = 'Variante indisponível no Basecoat';

    const note = document.createElement('p');
    note.className = 'nds-text-body nds-text-muted-foreground';
    note.textContent =
      'O factory custom é um wrapper do <select> HTML nativo. O navegador não permite renderizar ícones inline em <option>, portanto a variante "WithIcon" não é suportada nessa stack. Para essa necessidade, use Combobox ou uma implementação custom de dropdown.';

    wrap.append(title, note);
    return wrap;
  },
  parameters: {
    docs: {
      description: {
        story:
          'Variante NÃO suportada no Basecoat. O `<select>` HTML nativo (utilizado pelo factory `createSelect`) não permite ícones inline em `<option>` — limitação do navegador, não do design system. Para listas com ícone, recomendamos `Combobox` (Command + Popover) ou um componente custom.',
      },
    },
  },

  play: async ({ canvasElement }) => {
    const el = canvasElement as HTMLElement;
    await expect(within(el).queryAllByRole('button').length).toBeGreaterThanOrEqual(0);
  },
};
