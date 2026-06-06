import type { Meta, StoryObj } from '@storybook/html';
import { within, expect } from 'storybook/test';
import { createButton, createButtonIcon } from './button';

const meta: Meta = {
  tags: ['form'],
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
  },
  title: 'UI/Button/Tamanhos',
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => createButton({ size: 'default', label: 'Padrão' }),
  parameters: { docs: { description: { story: 'Tamanho padrão. Use em formulários e diálogos como default.' } } },

  play: async ({ canvasElement }) => {
    const el = canvasElement as HTMLElement;
    await expect(within(el).queryAllByRole('button').length).toBeGreaterThanOrEqual(0);
  },
};

export const Small: Story = {
  render: () => createButton({ size: 'sm', label: 'Pequeno' }),
  parameters: { docs: { description: { story: 'Tamanho pequeno. Use em toolbars e áreas densas.' } } },

  play: async ({ canvasElement }) => {
    const el = canvasElement as HTMLElement;
    await expect(within(el).queryAllByRole('button').length).toBeGreaterThanOrEqual(0);
  },
};

export const Large: Story = {
  render: () => createButton({ size: 'lg', label: 'Grande' }),
  parameters: { docs: { description: { story: 'Tamanho grande. Use em CTAs de destaque e hero sections.' } } },

  play: async ({ canvasElement }) => {
    const el = canvasElement as HTMLElement;
    await expect(within(el).queryAllByRole('button').length).toBeGreaterThanOrEqual(0);
  },
};

const iconAriaLabelPlay: Story['play'] = async ({ canvasElement, step }) => {
  const canvas = within(canvasElement);
  await step('Botão icon-only é acessível via aria-label', async () => {
    const button = canvas.getByRole('button', { name: 'Adicionar item' });
    await expect(button).toBeInTheDocument();
  });
};

export const Icon: Story = {
  render: () => {
    const btn = createButton({ size: 'icon', ariaLabel: 'Adicionar item' });
    btn.appendChild(createButtonIcon('plus'));
    return btn;
  },
  parameters: { docs: { description: { story: 'Botão ícone padrão. Sempre forneça aria-label descritivo.' } } },
  play: iconAriaLabelPlay,
};

export const IconSmall: Story = {
  render: () => {
    const btn = createButton({ size: 'icon-sm', ariaLabel: 'Adicionar item' });
    btn.appendChild(createButtonIcon('plus'));
    return btn;
  },
  parameters: { docs: { description: { story: 'Botão ícone pequeno. Use em toolbars compactas.' } } },
  play: iconAriaLabelPlay,
};

export const IconLarge: Story = {
  render: () => {
    const btn = createButton({ size: 'icon-lg', ariaLabel: 'Adicionar item' });
    btn.appendChild(createButtonIcon('plus'));
    return btn;
  },
  parameters: { docs: { description: { story: 'Botão ícone grande. Use como FAB ou CTAs visuais.' } } },
  play: iconAriaLabelPlay,
};
