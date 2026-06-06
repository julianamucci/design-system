import type { Meta, StoryObj } from '@storybook/svelte';

import { userEvent, within, expect, fn } from 'storybook/test';
import { Button } from './index';
import ButtonStory from './ButtonStory.svelte';

const meta = {
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
  },
  title: 'UI/Button/Estados',
  component: Button,
  tags: ['form'],
  args: {
    onclick: fn(),
  } as never,
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Disabled: Story = {
  render: (args) => ({
    Component: ButtonStory,
    props: {
      variant: 'default',
      label: 'Salvar',
      disabled: true,
      onclick: (args as { onclick: ReturnType<typeof fn> }).onclick,
    },
  }),
  parameters: { docs: { description: { story: 'Estado desabilitado. Previne cliques e reduz opacidade para 50%.' } } },
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button');

    await step('Botão possui atributo disabled', async () => {
      await expect(button).toBeDisabled();
    });

    await step('Clique não dispara onclick quando disabled', async () => {
      await userEvent.click(button, { pointerEventsCheck: 0 });
      await expect((args as { onclick: ReturnType<typeof fn> }).onclick).not.toHaveBeenCalled();
    });
  },
};

export const Loading: Story = {
  render: () => ({
    Component: ButtonStory,
    props: {
      variant: 'default',
      label: 'Salvando…',
      disabled: true,
      ariaBusy: true,
      iconStart: 'loader',
      spinIcon: true,
    },
  }),
  parameters: { docs: { description: { story: 'Estado de carregamento. Use disabled + aria-busy e substitua o label por estado progressivo.' } } },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button');

    await step('Botão tem aria-busy durante loading', async () => {
      await expect(button).toHaveAttribute('aria-busy', 'true');
    });

    await step('Botão está desabilitado durante loading', async () => {
      await expect(button).toBeDisabled();
    });
  },
};

export const FocusVisible: Story = {
  render: () => ({
    Component: ButtonStory,
    props: { variant: 'default', label: 'Foco visível' },
  }),
  parameters: { docs: { description: { story: 'Estado de foco via teclado. Use Tab para navegar e verificar o ring-[3px] de foco.' } } },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button') as HTMLElement;

    await step('Botão recebe foco via teclado', async () => {
      button.focus();
      await expect(button).toHaveFocus();
    });
  },
};

export const Invalid: Story = {
  render: () => ({
    Component: ButtonStory,
    props: { variant: 'outline', label: 'Formulário inválido', ariaInvalid: true },
  }),
  parameters: { docs: { description: { story: 'Estado inválido. Use aria-invalid="true" para sinalizar problemas de validação.' } } },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button');

    await step('Botão tem aria-invalid=true', async () => {
      await expect(button).toHaveAttribute('aria-invalid', 'true');
    });
  },
};
