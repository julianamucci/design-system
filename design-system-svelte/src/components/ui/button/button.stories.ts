import type { Meta, StoryObj } from '@storybook/svelte';
import { fn, userEvent, within, expect } from 'storybook/test';
import { Button } from '@/components/ui/button';
import ButtonStory from './ButtonStory.svelte';
import ButtonDocs from '@/components/docs/ButtonDocs.svelte';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

const meta = {
  title: 'UI/Button',
  component: Button,
  tags: ['autodocs'],
  parameters: {
    docs: { page: withAutoDocsTab(ButtonDocs) },
  },
  argTypes: {
    variant: {
      control: 'select',
      description: 'Define o estilo visual do botão',
      options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'],
    },
    size: {
      control: 'select',
      description: 'Define o tamanho e o preenchimento',
      options: ['default', 'xs', 'sm', 'lg', 'icon', 'icon-xs', 'icon-sm', 'icon-lg'],
    },
    disabled: {
      control: 'boolean',
      description: 'Desabilita o botão — remove interatividade e aplica opacidade 50%',
    },
    onClick: { action: 'clicked' },
  },
  args: {
    variant: 'default',
    size: 'default',
    disabled: false,
    onClick: fn(),
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * O Playground é a story principal onde todas as propriedades podem ser testadas interativamente.
 *
 * @summary Demonstração interativa do componente Button.
 */
export const Playground: Story = {
  args: { class: undefined },
  render: (args) => ({
    Component: ButtonStory,
    props: { ...args, label: 'Button' },
  }),
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button');

    await step('Clica no botão habilitado', async () => {
      await userEvent.click(button);
      await expect(args.onClick).toHaveBeenCalledTimes(1);
    });

    await step('Botão permanece habilitado após interação', async () => {
      await expect(button).toBeEnabled();
      await expect(button).not.toHaveAttribute('disabled');
    });

    await step('Botão recebe foco → focus-visible disponível', async () => {
      button.focus();
      await expect(button).toHaveFocus();
    });

    await step('Pressiona Enter com foco → onClick dispara', async () => {
      button.focus();
      const countBefore = (args.onClick as ReturnType<typeof fn>).mock.calls.length;
      await userEvent.keyboard('{Enter}');
      await expect(args.onClick).toHaveBeenCalledTimes(countBefore + 1);
    });

    await step('Pressiona Space com foco → onClick dispara', async () => {
      button.focus();
      const countBefore = (args.onClick as ReturnType<typeof fn>).mock.calls.length;
      await userEvent.keyboard(' ');
      await expect(args.onClick).toHaveBeenCalledTimes(countBefore + 1);
    });
  },
  parameters: {
    docs: {
      description: {
        story: 'Cobre os 5 critérios de teste: clique, estado habilitado, foco, Enter e Space. Veja a aba **Interactions**.',
      },
    },
  },
};
