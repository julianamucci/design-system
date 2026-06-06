import type { Meta, StoryObj } from '@storybook/svelte';
import { waitForPortal } from '@/lib/wait-for-portal';

import { userEvent, within, expect } from 'storybook/test';
import { Select } from './index';
import SelectStory from './SelectStory.svelte';

const meta = {
  title: 'UI/Select/Variantes',
  component: Select,
  tags: ['form'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Variantes do Select: default (lista plana), withGroups (SelectGroup + SelectGroupHeading) e withIcon (SelectItem com ícone inline).',
      },
    },
  },
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

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
      description: {
        story: 'Lista simples — apenas SelectItem dentro de SelectContent.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Trigger é um combobox com placeholder', async () => {
      const trigger = canvas.getByRole('combobox', { name: /Selecionar estado/i });
      await expect(trigger).toBeInTheDocument();
      await expect(canvas.getByText('Selecione...')).toBeInTheDocument();
    });
  },
};

export const WithGroups: Story = {
  render: () => ({
    Component: SelectStory,
    props: {
      variant: 'withGroups',
      placeholder: 'Selecione...',
      ariaLabel: 'Selecionar região',
    },
  }),
  parameters: {
    docs: {
      description: {
        story: 'SelectGroup + SelectGroupHeading agrupam opções por categoria (Sudeste, Sul).',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);
    await step('Abrir dropdown exibe cabeçalhos de grupo', async () => {
      const trigger = canvas.getByRole('combobox', { name: /Selecionar região/i });
      await userEvent.click(trigger);
      await waitForPortal('listbox');
      await expect(body.getByText('Sudeste')).toBeVisible();
      await expect(body.getByText('Sul')).toBeVisible();
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
      description: {
        story: 'SelectItem com ícone inline antes do texto via snippet `children`.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);
    await step('Cada item possui ícone inline', async () => {
      const trigger = canvas.getByRole('combobox', { name: /Selecionar estado/i });
      await userEvent.click(trigger);
      const listbox = await waitForPortal('listbox');
      const icons = listbox.querySelectorAll('svg.lucide-map-pin');
      await expect(icons.length).toBeGreaterThanOrEqual(1);
    });
  },
};
