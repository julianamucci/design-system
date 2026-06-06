import type { Meta, StoryObj } from '@storybook/svelte';

import { userEvent, within, expect, fn } from 'storybook/test';
import { RadioGroup } from './index';
import RadioGroupStory from './RadioGroupStory.svelte';
import RadioGroupDocs from '@/components/docs/RadioGroupDocs.svelte';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

const meta = {
  title: 'UI/RadioGroup',
  component: RadioGroup,
  tags: ['autodocs', 'form'],
  parameters: {
    docs: { page: withAutoDocsTab(RadioGroupDocs) },
    layout: 'centered',
  },
  argTypes: {
    value: {
      control: 'text',
      description: 'Valor selecionado (controlado).',
    },
    disabled: {
      control: 'boolean',
      description: 'Desabilita todos os itens do grupo.',
    },
    orientation: {
      control: 'select',
      options: ['vertical', 'horizontal'],
      description: 'Direção da navegação por setas.',
    },
    name: {
      control: 'text',
      description: 'Nome do campo no formulário HTML.',
    },
  },
  args: {
    value: '',
    disabled: false,
    orientation: 'vertical',
    onValueChange: fn(),
  },
} satisfies Meta<typeof RadioGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => ({
    Component: RadioGroupStory,
    props: {
      value: args.value,
      disabled: args.disabled,
      orientation: args.orientation,
      name: args.name,
      ariaLabel: 'Forma de pagamento',
      idPrefix: 'pg',
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const radios = canvas.getAllByRole('radio');

    await step('RadioGroup renderiza 3 itens com role=radio', async () => {
      await expect(radios).toHaveLength(3);
    });

    await step('Nenhum item começa selecionado', async () => {
      for (const r of radios) await expect(r).toHaveAttribute('aria-checked', 'false');
    });

    await step('Clicar no primeiro item seleciona-o', async () => {
      await userEvent.click(radios[0]);
      await expect(radios[0]).toHaveAttribute('aria-checked', 'true');
      await expect(radios[1]).toHaveAttribute('aria-checked', 'false');
    });

    await step('ArrowDown move e seleciona o próximo', async () => {
      (radios[0] as HTMLElement).focus();
      await userEvent.keyboard('{ArrowDown}');
      await expect(radios[1]).toHaveAttribute('aria-checked', 'true');
      await expect(radios[0]).toHaveAttribute('aria-checked', 'false');
    });

    await step('ArrowUp volta ao item anterior', async () => {
      await userEvent.keyboard('{ArrowUp}');
      await expect(radios[0]).toHaveAttribute('aria-checked', 'true');
    });
  },
};
