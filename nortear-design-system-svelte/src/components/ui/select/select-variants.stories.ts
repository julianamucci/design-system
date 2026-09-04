import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { waitForPortal } from '@/lib/wait-for-portal';

import { userEvent, within, expect, waitFor } from 'storybook/test';
import { Select } from './index';
import SelectStory from './SelectStory.svelte';
import {
  selectWithGroupsSource,
  selectWithIconSource,
  selectListPlanaSource,
  selectSource,
} from './select.source';

const GROUPS = [
  {
    label: 'Sudeste',
    options: [
      { value: 'sp', label: 'São Paulo' },
      { value: 'rj', label: 'Rio de Janeiro' },
      { value: 'mg', label: 'Minas Gerais' },
    ],
  },
  {
    label: 'Sul',
    options: [
      { value: 'rs', label: 'Rio Grande do Sul' },
      { value: 'sc', label: 'Santa Catarina' },
      { value: 'pr', label: 'Paraná' },
    ],
  },
];

const meta: Meta = {
  title: 'Components/Form/Select/Variants',
  component: Select,
  tags: ['form'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      // Cascateia para todas as stories do arquivo; cada uma sobrescreve com a
      // sua própria composição logo abaixo.
      source: { transform: selectSource },
      description: {
        component:
          'Variantes do Select: lista plana, lista agrupada por categoria (com divisão entre grupos) e opção com ícone inline antes do texto. As três terminam abertas — é a lista que muda entre elas.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => ({
    Component: SelectStory,
    props: {
      variant: 'default',
      placeholder: 'Selecione...',
      ariaLabel: 'Selecionar estado',
    },
  }),
  parameters: {
    docs: {
      source: { transform: selectListPlanaSource },
      description: { story: 'Lista plana — apenas opções, sem cabeçalho nem divisão.' },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('combobox', { name: /Selecionar estado/i });

    await step('Campo exibe o placeholder e o nome acessível', async () => {
      await expect(trigger).toHaveTextContent(/Selecione/);
      await expect(trigger).toHaveAttribute('aria-label', 'Selecionar estado');
    });

    await step('Abrir mostra uma lista plana, sem cabeçalho de grupo', async () => {
      // Idempotente: o clique só acontece com a lista fechada.
      if (trigger.getAttribute('aria-expanded') !== 'true') await userEvent.click(trigger);
      const listbox = await waitForPortal('listbox');
      const options = within(listbox).getAllByRole('option');
      await expect(options).toHaveLength(4);
      await expect(options[0]).toHaveAccessibleName('São Paulo');
      // Nada escolhido ainda: nenhuma opção se anuncia selecionada. A conta é
      // por PAPEL, não por atributo — em lista de escolha única a marca só é
      // exigida na opção escolhida, e cada lib decide se escreve a negativa.
      await expect(
        within(listbox).queryAllByRole('option', { selected: true }),
      ).toHaveLength(0);
      await expect(within(listbox).queryAllByRole('group')).toHaveLength(0);
    });
  },
};

export const WithGroups: Story = {
  render: () => ({
    Component: SelectStory,
    props: {
      variant: 'withGroups',
      groups: GROUPS,
      placeholder: 'Selecione...',
      ariaLabel: 'Selecionar região',
    },
  }),
  parameters: {
    docs: {
      source: { transform: selectWithGroupsSource },
      description: {
        story:
          'Cabeçalho por categoria e divisão entre grupos. O cabeçalho nomeia o grupo — o leitor de tela anuncia "Sudeste, grupo" antes das opções.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('combobox', { name: /Selecionar região/i });

    const open = async () => {
      // Idempotente: o clique só acontece com a lista fechada.
      if (trigger.getAttribute('aria-expanded') !== 'true') await userEvent.click(trigger);
      return await waitForPortal('listbox');
    };

    await step('Cada categoria vira um grupo nomeado pelo cabeçalho', async () => {
      const listbox = await open();
      const groups = within(listbox).getAllByRole('group');
      await expect(groups).toHaveLength(GROUPS.length);
      for (const [i, group] of groups.entries()) {
        await expect(group).toHaveAccessibleName(GROUPS[i].label);
      }
    });

    await step('As opções continuam todas na mesma lista', async () => {
      const listbox = await open();
      const total = GROUPS.reduce((sum, g) => sum + g.options.length, 0);
      await expect(within(listbox).getAllByRole('option')).toHaveLength(total);
    });

    await step('A divisão entre grupos é decorativa', async () => {
      // Linha para o olho, silêncio para o leitor de tela — quem separa
      // semanticamente é o grupo.
      const listbox = await open();
      await expect(listbox.querySelectorAll('.nds-select-separator')).toHaveLength(
        GROUPS.length - 1,
      );
    });
  },
};

export const WithIcon: Story = {
  render: () => ({
    Component: SelectStory,
    props: {
      variant: 'withIcon',
      placeholder: 'Selecione...',
      ariaLabel: 'Selecionar estado',
    },
  }),
  parameters: {
    docs: {
      source: { transform: selectWithIconSource },
      description: { story: 'Opção com ícone inline antes do texto. Ele é decorativo: o nome acessível continua sendo só o rótulo.' },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('combobox', { name: /Selecionar estado/i });

    const open = async () => {
      // Idempotente: o clique só acontece com a lista fechada.
      if (trigger.getAttribute('aria-expanded') !== 'true') await userEvent.click(trigger);
      return await waitForPortal('listbox');
    };

    await step('O ícone entra na opção e fica fora do nome acessível', async () => {
      const listbox = await open();
      const options = within(listbox).getAllByRole('option');
      await expect(options).toHaveLength(4);
      await expect(options[0].querySelector('svg')).toBeTruthy();
      await expect(options[0]).toHaveAccessibleName('São Paulo');
    });

    await step('O ícone é dimensionado pela folha, não pelo tamanho intrínseco', async () => {
      const listbox = await open();
      const icone = within(listbox)
        .getAllByRole('option')[0]
        .querySelector('svg') as SVGElement;
      await waitFor(async () => {
        await expect(getComputedStyle(icone).width).toBe('16px');
      });
    });
  },
};
