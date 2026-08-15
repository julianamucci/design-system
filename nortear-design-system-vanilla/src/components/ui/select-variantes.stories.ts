import type { Meta, StoryObj } from '@storybook/html-vite';
import { within, expect } from 'storybook/test';
import { createSelect } from './select';

const meta: Meta = {
  tags: ['form'],
  title: 'UI/Select/Variants',
  parameters: {
    actions: { disable: true },
    layout: 'centered',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Variantes do Select: lista plana e lista agrupada por categoria (`<optgroup>`). A variante com ícone não existe aqui: o campo é o `<select>` do navegador, e `<option>` não aceita elemento filho — para listas com ícone, use `Combobox`.',
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
    await step('Lista plana: quatro opções e nenhum agrupamento', async () => {
      const select = canvas.getByRole('combobox') as HTMLSelectElement;
      const opcoes = Array.from(select.querySelectorAll('option')).filter((o) => !o.hidden);
      await expect(opcoes).toHaveLength(4);
      await expect(opcoes[0].textContent).toBe('São Paulo');
      await expect(select.querySelectorAll('optgroup')).toHaveLength(0);
    });
    await step('Nenhum valor pré-escolhido', async () => {
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
    // reaproveitando as classes do tema Vanilla.
    const select = document.createElement('select');
    // A classe leva o prefixo do design system. Antes era "select", sem
    // prefixo — classe que não existe em folha nenhuma, e o campo montado à
    // mão saía SEM estilo, ao lado de outros idênticos que tinham estilo.
    select.className = 'nds-select';
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
          'Opções agrupadas por categoria com `<optgroup>`. NOTA: o factory `createSelect` (Vanilla) só aceita uma lista plana — para grupos, monte o `<select>` + `<optgroup>` manualmente como mostrado no código.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Cada categoria vira um grupo nomeado', async () => {
      const select = canvas.getByRole('combobox') as HTMLSelectElement;
      const grupos = Array.from(select.querySelectorAll('optgroup'));
      await expect(grupos).toHaveLength(2);
      await expect(grupos.map((g) => g.label)).toEqual(['Sudeste', 'Sul']);
    });
    await step('As opções continuam todas no mesmo campo', async () => {
      const select = canvas.getByRole('combobox') as HTMLSelectElement;
      const opcoes = Array.from(select.querySelectorAll('option')).filter((o) => !o.hidden);
      await expect(opcoes).toHaveLength(7);
    });
  },
};

// A variante com ícone não tem story aqui: o campo desta stack é o `<select>`
// do navegador, e `<option>` não aceita elemento filho — a limitação é do HTML,
// não do design system. A story anterior renderizava um cartão de aviso, com uma
// asserção que não podia falhar: documentação disfarçada de demonstração. O
// aviso vive na descrição do arquivo, que é onde o leitor o procura; para listas
// com ícone, o caminho é o Combobox.
