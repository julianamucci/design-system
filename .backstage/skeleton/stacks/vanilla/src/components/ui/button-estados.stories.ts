import type { Meta, StoryObj } from '@storybook/html';
import { fn, userEvent, within, expect } from 'storybook/test';
import { createButton, createButtonIcon } from './button';

const meta: Meta = {
  title: 'UI/Button/Estados',
};

export default meta;
type Story = StoryObj;

export const Disabled: Story = {
  render: () => {
    const handler = fn();
    const btn = createButton({ variant: 'default', label: 'Salvar', disabled: true, onClick: handler });
    (btn as HTMLButtonElement & { __handler: ReturnType<typeof fn> }).__handler = handler;
    return btn;
  },
  parameters: { docs: { description: { story: 'Estado desabilitado. Previne cliques e reduz opacidade para 50%.' } } },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button') as HTMLButtonElement & { __handler: ReturnType<typeof fn> };

    await step('Botão possui atributo disabled', async () => {
      await expect(button).toBeDisabled();
    });

    await step('Clique não dispara onClick quando disabled', async () => {
      await userEvent.click(button, { pointerEventsCheck: 0 });
      await expect(button.__handler).not.toHaveBeenCalled();
    });
  },
};

export const Loading: Story = {
  render: () => {
    const btn = createButton({ variant: 'default', disabled: true, ariaBusy: true });
    btn.appendChild(createButtonIcon('loader', { spin: true }));
    const label = document.createElement('span');
    label.textContent = 'Salvando…';
    btn.appendChild(label);
    return btn;
  },
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
  render: () => createButton({ variant: 'default', label: 'Foco visível' }),
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
  render: () => createButton({ variant: 'outline', label: 'Formulário inválido', ariaInvalid: true }),
  parameters: { docs: { description: { story: 'Estado inválido. Use aria-invalid="true" para sinalizar problemas de validação.' } } },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button');

    await step('Botão tem aria-invalid=true', async () => {
      await expect(button).toHaveAttribute('aria-invalid', 'true');
    });
  },
};
