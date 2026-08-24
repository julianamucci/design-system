import type { Meta, StoryObj } from '@storybook/html-vite';
import { userEvent, within, expect, waitFor } from 'storybook/test';
import { createCombobox, type ComboboxItem } from './combobox';
import { comboboxSourceWith } from './combobox.source';

const COUNTRIES: ComboboxItem[] = [
  { value: 'brasil', label: 'Brasil' },
  { value: 'argentina', label: 'Argentina' },
  { value: 'chile', label: 'Chile' },
  { value: 'portugal', label: 'Portugal' },
];

// Grupos da spec de exemplos: Frutas e Legumes.
const GROCERIES: ComboboxItem[] = [
  { value: 'maca', label: 'Maçã', group: 'Frutas' },
  { value: 'banana', label: 'Banana', group: 'Frutas' },
  { value: 'laranja', label: 'Laranja', group: 'Frutas' },
  { value: 'cenoura', label: 'Cenoura', group: 'Legumes' },
  { value: 'batata', label: 'Batata', group: 'Legumes' },
  { value: 'abobrinha', label: 'Abobrinha', group: 'Legumes' },
];

// ─── Snippet ──────────────────────────────────────────────────────────────────
//
// Os dados do painel Code SAEM das listas acima, e não de literais repetidos:
// divergir aqui faria o snippet ensinar uma lista que a story não mostra.

/** Rótulos da lista plana, na ordem em que aparecem. */
const COUNTRY_LABELS = COUNTRIES.map((item) => item.label);

/** Os mesmos itens agrupados, na forma que o snippet monta. */
const GROCERY_GROUPS = GROCERIES.reduce<Record<string, string[]>>((groups, item) => {
  (groups[item.group!] ??= []).push(item.label);
  return groups;
}, {});

const meta: Meta = {
  title: 'UI/Combobox/Variants',
  tags: ['form'],
  parameters: {
    layout: 'padded',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      // Cascateia para todas as stories do arquivo. Sem transform no meta, o
      // painel Code despeja o `outerHTML` do campo em vez da chamada da fábrica.
      source: {
        transform: comboboxSourceWith({
          label: 'País',
          placeholder: 'Buscar país',
          items: COUNTRY_LABELS,
        }),
      },
      description: {
        component: 'Formas do Combobox: lista aberta com opção ativa e lista agrupada.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const OpenWithActiveOption: Story = {
  parameters: {
    covers: ['functional.item2', 'accessibility.item4', 'accessibility.item7', 'visual.item3'],
    docs: {
      description: {
        story:
          'Lista aberta com uma opção ativa. O foco fica no campo; a opção é apontada, não focada.',
      },
    },
  },
  render: () =>
    createCombobox({
      items: COUNTRIES,
      label: 'País',
      placeholder: 'Buscar país',
    }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByRole('combobox');

    await step('A seta abre a lista e ativa a primeira opção', async () => {
      await userEvent.clear(field);
      field.focus();
      await userEvent.keyboard('{ArrowDown}');
      await waitFor(async () => {
        await expect(field).toHaveAttribute('aria-expanded', 'true');
      });
      const options = canvas.getAllByRole('option');
      await expect(options[0]).toHaveAttribute('data-highlighted');
    });

    await step('A seta move a opção ativa, e o foco não sai do campo', async () => {
      // É o coração do padrão: se o foco fosse para a opção, a digitação
      // pararia de funcionar no meio da navegação.
      await userEvent.keyboard('{ArrowDown}');
      const options = canvas.getAllByRole('option');
      await expect(options[1]).toHaveAttribute('data-highlighted');
      await expect(field).toHaveAttribute('aria-activedescendant', options[1].id);
      await expect(field).toHaveFocus();
    });

    await step('O campo em foco mostra anel visível', async () => {
      // Um `outline: 0` sem substituto passaria em qualquer teste de estado —
      // é preciso olhar o estilo computado do WRAPPER, que é quem desenha o
      // anel, porque o foco real vive no input por dentro dele.
      const wrapper = canvasElement.querySelector<HTMLElement>(
        '[data-slot="combobox-input-wrapper"]',
      )!;
      const styles = getComputedStyle(wrapper);
      await expect(styles.outlineStyle !== 'none' || styles.boxShadow !== 'none').toBe(true);
    });

    await step('Escape fecha e devolve a lista ao estado inicial', async () => {
      // Devolve a story ao que o Chromatic fotografa e deixa a play idempotente.
      await userEvent.keyboard('{Escape}');
      await expect(field).toHaveAttribute('aria-expanded', 'false');
    });
  },
};

export const Grouped: Story = {
  parameters: {
    covers: ['visual.item4'],
    docs: {
      source: {
        transform: comboboxSourceWith({
          label: 'Ingrediente',
          placeholder: 'Buscar ingrediente',
          groups: GROCERY_GROUPS,
        }),
      },
      description: {
        story: 'Itens agrupados: cada grupo traz um cabeçalho que nomeia o conjunto.',
      },
    },
  },
  render: () =>
    createCombobox({
      items: GROCERIES,
      label: 'Ingrediente',
      placeholder: 'Buscar ingrediente',
    }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByRole('combobox');

    await step('A lista abre com os dois grupos', async () => {
      await userEvent.clear(field);
      field.focus();
      await userEvent.keyboard('{ArrowDown}');
      await waitFor(async () => {
        await expect(canvas.getAllByRole('option').length).toBeGreaterThan(0);
      });
      const groups = canvasElement.querySelectorAll('[data-slot="combobox-group"]');
      await expect(groups).toHaveLength(2);
    });

    await step('Cada grupo é nomeado pelo próprio cabeçalho', async () => {
      // `role="group"` sem nome não agrupa nada para quem usa leitor de tela:
      // é o `aria-labelledby` apontando o cabeçalho que faz o trabalho.
      const groups = [
        ...canvasElement.querySelectorAll<HTMLElement>('[data-slot="combobox-group"]'),
      ];
      for (const group of groups) {
        const labelId = group.getAttribute('aria-labelledby');
        await expect(labelId).toBeTruthy();
        await expect(canvasElement.querySelector(`#${CSS.escape(labelId!)}`)).not.toBeNull();
      }
      await expect(groups[0]).toHaveTextContent('Frutas');
      await expect(groups[1]).toHaveTextContent('Legumes');
    });

    await step('Escape fecha a lista', async () => {
      await userEvent.keyboard('{Escape}');
      await expect(field).toHaveAttribute('aria-expanded', 'false');
    });
  },
};
