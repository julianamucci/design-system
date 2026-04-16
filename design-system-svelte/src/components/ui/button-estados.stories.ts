import type { Meta, StoryObj } from '@storybook/svelte';
import { fn, userEvent, within, expect } from 'storybook/test';
import ButtonStory from './ButtonStory.svelte';

const meta = {
  title: 'UI/Button/Estados',
  component: ButtonStory,
  args: {
    variant: 'default',
    size: 'default',
    label: 'Botão',
    onClick: fn(),
  },
} satisfies Meta<typeof ButtonStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Disabled: Story = {
  args: { disabled: true },
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button');

    await step('Botão possui atributo disabled no DOM', async () => {
      await expect(button).toBeDisabled();
      await expect(button).toHaveAttribute('disabled');
    });

    await step('Clicar no botão disabled não dispara onClick', async () => {
      await userEvent.click(button, { pointerEventsCheck: 0 });
      await expect(args.onClick).not.toHaveBeenCalled();
    });
  },
  parameters: {
    docs: {
      description: {
        story: 'Estado desabilitado — remove pointer-events e aplica opacidade 50%. Não use como único feedback de validação; combine com mensagens de erro contextuais.',
      },
    },
  },
};

export const Loading: Story = {
  name: 'Loading',
  args: {
    disabled: true,
    label: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4 animate-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> Aguarde…`,
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button');
    await step('Botão em loading possui atributo disabled', async () => {
      await expect(button).toBeDisabled();
    });
  },
  parameters: {
    docs: {
      description: {
        story: 'Estado de carregamento. Combine `disabled` com um ícone animado via `animate-spin`. Impede cliques duplos e dá feedback visual.',
      },
    },
  },
};
