import type { Meta, StoryObj } from '@storybook/svelte';
import { fn, userEvent, within, expect } from 'storybook/test';
import { Button } from './index';
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
      options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'],
      description: 'Variante visual do botão',
    },
    size: {
      control: 'select',
      options: ['default', 'sm', 'lg', 'icon', 'icon-sm', 'icon-lg'],
      description: 'Tamanho do botão',
    },
    disabled: {
      control: 'boolean',
      description: 'Desabilita interação com o botão',
    },
  },
  args: {
    variant: 'default',
    size: 'default',
    disabled: false,
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: {
    onclick: fn(),
  } as never,
  render: (args) => ({
    Component: ButtonStory,
    props: {
      variant: args.variant,
      size: args.size,
      disabled: args.disabled,
      label: 'Botão',
      onclick: (args as { onclick: ReturnType<typeof fn> }).onclick,
    },
  }),
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button');

    await step('Botão está presente e visível', async () => {
      await expect(button).toBeInTheDocument();
      await expect(button).toBeVisible();
    });

    await step('Clique dispara onclick', async () => {
      await userEvent.click(button);
      await expect((args as { onclick: ReturnType<typeof fn> }).onclick).toHaveBeenCalledTimes(1);
    });

    await step('Focus via teclado', async () => {
      (button as HTMLElement).focus();
      await expect(button).toHaveFocus();
    });

    await step('Enter dispara onclick', async () => {
      (button as HTMLElement).focus();
      await userEvent.keyboard('{Enter}');
      await expect((args as { onclick: ReturnType<typeof fn> }).onclick).toHaveBeenCalledTimes(2);
    });

    await step('Space dispara onclick', async () => {
      (button as HTMLElement).focus();
      await userEvent.keyboard(' ');
      await expect((args as { onclick: ReturnType<typeof fn> }).onclick).toHaveBeenCalledTimes(3);
    });
  },
};
