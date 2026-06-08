import type { Meta, StoryObj } from '@storybook/svelte';
import { waitForPortal } from '@/lib/wait-for-portal';

import { userEvent, within, expect } from 'storybook/test';
import { Select } from './index';
import SelectStory from './SelectStory.svelte';

const meta = {
  title: 'UI/Select/Composicoes',
  component: Select,
  tags: ['form'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Composicoes do Select: tamanho compacto (sm) para formulários densos, seleção por região com grupos e Select com ícones por item.',
      },
    },
  },
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TamanhoCompacto: Story = {
  render: () => ({
    Component: SelectStory,
    props: {
      size: 'sm',
      placeholder: 'Selecione...',
      ariaLabel: 'Selecionar estado',
      triggerClass: 'w-48',
    },
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Variante compacta (`size="sm"`) — recomendada para formulários densos e toolbars. Aplica `--height-sm`.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Trigger usa data-size="sm"', async () => {
      const trigger = canvas.getByRole('combobox', { name: /Selecionar estado/i });
      await expect(trigger).toHaveAttribute('data-size', 'sm');
    });
  },
};

export const SelecaoPorRegiao: Story = {
  render: () => ({
    Component: SelectStory,
    props: {
      variant: 'withGroups',
      placeholder: 'Selecione...',
      ariaLabel: 'Selecionar estado',
      triggerClass: 'w-64',
    },
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Lista de estados agrupada por região via SelectGroup + SelectGroupHeading. Útil para listas médias (8–15 itens) com categorias naturais.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);
    await step('Selecionar item dentro de grupo atualiza valor', async () => {
      const trigger = canvas.getByRole('combobox', { name: /Selecionar estado/i });
      await userEvent.click(trigger);
      await waitForPortal('listbox');
      const option = await waitForPortal('option', { name: /Paraná/i });
      await userEvent.click(option);
      await expect(canvas.getByText('Paraná')).toBeInTheDocument();
    });
  },
};

export const ComIcones: Story = {
  render: () => ({
    Component: SelectStory,
    props: {
      variant: 'withIcon',
      placeholder: 'Selecione...',
      ariaLabel: 'Selecionar estado',
      triggerClass: 'w-56',
    },
  }),
  parameters: {
    docs: {
      description: {
        story:
          'SelectItem com ícone (MapPin) inline antes do label. O ícone fica decorativo (aria-hidden).',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);
    await step('Ícones aparecem em cada opção', async () => {
      const trigger = canvas.getByRole('combobox', { name: /Selecionar estado/i });
      await userEvent.click(trigger);
      const listbox = await waitForPortal('listbox');
      const icons = listbox.querySelectorAll('svg.lucide-map-pin');
      await expect(icons.length).toBeGreaterThanOrEqual(4);
    });
  },
};
