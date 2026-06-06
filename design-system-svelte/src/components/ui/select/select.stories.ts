import type { Meta, StoryObj } from '@storybook/svelte';
import { waitForPortal } from '@/lib/wait-for-portal';

import { userEvent, within, expect, waitFor, fn } from 'storybook/test';
import { Select } from './index';
import SelectStory from './SelectStory.svelte';
import SelectDocs from '@/components/docs/SelectDocs.svelte';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

const meta = {
  title: 'UI/Select',
  component: Select,
  tags: ['autodocs', 'form'],
  parameters: {
    docs: {
      page: withAutoDocsTab(SelectDocs),
      description: {
        component:
          'Select construído sobre bits-ui. Trigger com role=combobox, Content em portal com role=listbox, navegação por teclado, type-ahead e suporte a grupos via SelectGroup + SelectGroupHeading.',
      },
    },
    layout: 'centered',
  },
  argTypes: {
    value: {
      control: 'text',
      description: 'Valor selecionado (controlado).',
    },
    disabled: {
      control: 'boolean',
      description: 'Desabilita o trigger e impede abertura.',
    },
    name: {
      control: 'text',
      description: 'Nome do campo no formulário HTML.',
    },
  },
  args: {
    value: '',
    disabled: false,
    onValueChange: fn(),
  },
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => ({
    Component: SelectStory,
    props: {
      value: args.value,
      disabled: args.disabled,
      name: args.name,
      placeholder: 'Selecione...',
      ariaLabel: 'Selecionar estado',
      variant: 'default',
      onValueChange: args.onValueChange,
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);

    await step('Trigger renderiza como combobox com placeholder', async () => {
      const trigger = canvas.getByRole('combobox', { name: /Selecionar estado/i });
      await expect(trigger).toBeInTheDocument();
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
      await expect(canvas.getByText('Selecione...')).toBeInTheDocument();
    });

    await step('Clicar no trigger abre o listbox em portal', async () => {
      const trigger = canvas.getByRole('combobox', { name: /Selecionar estado/i });
      await userEvent.click(trigger);
      const listbox = await waitForPortal('listbox');
      await expect(listbox).toBeVisible();
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    });

    await step('Selecionar item atualiza valor e fecha dropdown', async () => {
      const option = await waitForPortal('option', { name: /Rio de Janeiro/i });
      await userEvent.click(option);
      await waitFor(async () => {
        await expect(body.queryByRole('listbox')).not.toBeInTheDocument();
      });
      await expect(canvas.getByText('Rio de Janeiro')).toBeInTheDocument();
    });

    await step('Escape fecha o dropdown sem alterar seleção', async () => {
      const trigger = canvas.getByRole('combobox', { name: /Selecionar estado/i });
      await userEvent.click(trigger);
      await waitForPortal('listbox');
      await userEvent.keyboard('{Escape}');
      await waitFor(async () => {
        await expect(body.queryByRole('listbox')).not.toBeInTheDocument();
      });
      await expect(canvas.getByText('Rio de Janeiro')).toBeInTheDocument();
    });
  },
};
