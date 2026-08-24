import type { Meta, StoryObj } from '@storybook/html-vite';
import { userEvent, within, expect, waitFor } from 'storybook/test';
import { createCombobox, type ComboboxItem } from './combobox';
import { comboboxSourceWith } from './combobox.source';

// Mesma lista da spec de exemplos — divergir aqui faz a story mostrar coisa
// diferente da mesma story nas outras stacks.
const COUNTRIES: ComboboxItem[] = [
  { value: 'brasil', label: 'Brasil' },
  { value: 'argentina', label: 'Argentina' },
  { value: 'chile', label: 'Chile' },
  { value: 'portugal', label: 'Portugal' },
];

/**
 * Rótulos derivados da lista acima: o painel Code mostra a mesma lista que está
 * na tela, e não um literal repetido que envelhece sozinho.
 */
const COUNTRY_LABELS = COUNTRIES.map((item) => item.label);

/** As opções que valem para as três stories — cada uma soma o seu estado. */
const FIELD = {
  label: 'País',
  placeholder: 'Buscar país',
  items: COUNTRY_LABELS,
};

const meta: Meta = {
  title: 'UI/Combobox/States',
  tags: ['form'],
  parameters: {
    layout: 'padded',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      // Cascateia para todas as stories do arquivo — e é o que atende
      // `EmptyResult`, cujo snippet é o campo sem estado nenhum. Sem transform
      // no meta, o painel Code despeja o `outerHTML` do campo.
      source: { transform: comboboxSourceWith(FIELD) },
      description: {
        component: 'Estados do Combobox: desabilitado, inválido e lista sem resultado.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Disabled: Story = {
  parameters: {
    covers: ['visual.item6'],
    docs: {
      source: { transform: comboboxSourceWith({ ...FIELD, disabled: true }) },
      description: {
        story: 'Desabilitado: nada recebe foco e a lista não abre.',
      },
    },
  },
  render: () =>
    createCombobox({
      items: COUNTRIES,
      label: 'País',
      placeholder: 'Buscar país',
      disabled: true,
    }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByRole('combobox') as HTMLInputElement;

    await step('O campo sai da ordem de tabulação', async () => {
      await expect(field.disabled).toBe(true);
    });

    await step('A lista não abre pelo clique', async () => {
      // Sem esta medida, um `disabled` correto no atributo com a guarda ausente
      // no código passaria: o campo pareceria bloqueado e abriria mesmo assim.
      await userEvent.click(field, { pointerEventsCheck: 0 });
      await expect(field).toHaveAttribute('aria-expanded', 'false');
      await expect(canvas.queryAllByRole('option')).toHaveLength(0);
    });
  },
};

export const Invalid: Story = {
  parameters: {
    covers: ['visual.item7'],
    docs: {
      source: { transform: comboboxSourceWith({ ...FIELD, invalid: true }) },
      description: {
        story: 'Inválido: o campo é anunciado com erro e a borda muda de cor.',
      },
    },
  },
  render: () =>
    createCombobox({
      items: COUNTRIES,
      label: 'País',
      placeholder: 'Buscar país',
      invalid: true,
    }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByRole('combobox');

    await step('O erro é anunciado no campo', async () => {
      await expect(field).toHaveAttribute('aria-invalid', 'true');
    });

    await step('O estado inválido deixa marca visual própria', async () => {
      // Sem esta medida, `aria-invalid` correto com a regra de CSS ausente
      // passaria: o leitor de tela anunciaria o erro que ninguém vê.
      const wrapper = canvasElement.querySelector<HTMLElement>(
        '[data-slot="combobox-input-wrapper"]',
      )!;
      const cor = getComputedStyle(wrapper).borderColor;
      await expect(cor).not.toBe('rgba(0, 0, 0, 0)');
      await expect(wrapper).toHaveAttribute('aria-invalid', 'true');
    });
  },
};

export const EmptyResult: Story = {
  parameters: {
    covers: ['functional.item7', 'visual.item5'],
    docs: {
      description: {
        story: 'Busca sem correspondência: a lista mostra a mensagem de vazio.',
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

    await step('Texto sem correspondência esvazia a lista', async () => {
      // `clear` antes de digitar: o painel Interactions reexecuta no mesmo DOM,
      // e sem isso a segunda rodada digitaria por cima do texto da primeira.
      await userEvent.clear(field);
      await userEvent.type(field, 'zzz');
      await waitFor(async () => {
        await expect(field).toHaveAttribute('aria-expanded', 'true');
      });
      await expect(canvas.queryAllByRole('option')).toHaveLength(0);
    });

    await step('A mensagem de vazio aparece no lugar das opções', async () => {
      const emptyEl = canvasElement.querySelector('[data-slot="combobox-empty"]');
      await expect(emptyEl).not.toBeNull();
      await expect(emptyEl).toHaveTextContent('Nenhum resultado');
    });

    await step('Nenhuma opção fica apontada quando não há opção', async () => {
      // `aria-activedescendant` apontando um id que não existe mais é o defeito
      // clássico do padrão: o leitor de tela anuncia uma opção fantasma.
      await expect(field).not.toHaveAttribute('aria-activedescendant');
    });
  },
};
