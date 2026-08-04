import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { within, fn, userEvent, expect } from 'storybook/test';
import { Button } from './index';
import ButtonDocs from '@/components/docs/ButtonDocs.vue';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

const meta: Meta<any> = {
  title: 'UI/Button',
  component: Button,
  tags: ['autodocs', 'form'],
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
    onClick: {
      control: false,
      description: 'Callback disparado ao clique. Não dispara quando desabilitado.',
      table: { type: { summary: '(e: MouseEvent) => void' } },
    },
  },
  args: {
    variant: 'default',
    size: 'default',
    disabled: false,
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  parameters: {
    covers: [
      'functional.item1',
      'functional.item3',
      'functional.item4',
      'accessibility.item1',
      'accessibility.item2',
      'accessibility.item5',
      'visual.item1',
    ],
  },
  args: {
    onClick: fn(),
  } as never,
  render: (args) => ({
    components: { Button },
    setup() { return { args }; },
    template: `
      <Button v-bind="args" @click="args.onClick">Botão</Button>
    `,
  }),
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button');

    await step('Botão está presente e visível', async () => {
      await expect(button).toBeInTheDocument();
      await expect(button).toBeVisible();
    });

    await step('Clique dispara onClick', async () => {
      await userEvent.click(button);
      await expect((args as { onClick: ReturnType<typeof fn> }).onClick).toHaveBeenCalledTimes(1);
    });

    await step('Focus via teclado', async () => {
      (button as HTMLElement).focus();
      await expect(button).toHaveFocus();
    });

    await step('Enter dispara onClick', async () => {
      (button as HTMLElement).focus();
      await userEvent.keyboard('{Enter}');
      await expect((args as { onClick: ReturnType<typeof fn> }).onClick).toHaveBeenCalledTimes(2);
    });

    await step('Space dispara onClick', async () => {
      (button as HTMLElement).focus();
      await userEvent.keyboard(' ');
      await expect((args as { onClick: ReturnType<typeof fn> }).onClick).toHaveBeenCalledTimes(3);
    });
  },
};
