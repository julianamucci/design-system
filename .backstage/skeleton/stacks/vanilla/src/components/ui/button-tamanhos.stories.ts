import type { Meta, StoryObj } from '@storybook/html';
import { createButton, createButtonIcon } from './button';

const meta: Meta = {
  title: 'UI/Button/Tamanhos',
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => createButton({ size: 'default', label: 'Padrão' }),
  parameters: { docs: { description: { story: 'Tamanho padrão. Use em formulários e diálogos como default.' } } },
};

export const Small: Story = {
  render: () => createButton({ size: 'sm', label: 'Pequeno' }),
  parameters: { docs: { description: { story: 'Tamanho pequeno. Use em toolbars e áreas densas.' } } },
};

export const Large: Story = {
  render: () => createButton({ size: 'lg', label: 'Grande' }),
  parameters: { docs: { description: { story: 'Tamanho grande. Use em CTAs de destaque e hero sections.' } } },
};

export const Icon: Story = {
  render: () => {
    const btn = createButton({ size: 'icon', ariaLabel: 'Adicionar item' });
    btn.appendChild(createButtonIcon('plus'));
    return btn;
  },
  parameters: { docs: { description: { story: 'Botão ícone padrão. Sempre forneça aria-label descritivo.' } } },
};

export const IconSmall: Story = {
  render: () => {
    const btn = createButton({ size: 'icon-sm', ariaLabel: 'Adicionar item' });
    btn.appendChild(createButtonIcon('plus'));
    return btn;
  },
  parameters: { docs: { description: { story: 'Botão ícone pequeno. Use em toolbars compactas.' } } },
};

export const IconLarge: Story = {
  render: () => {
    const btn = createButton({ size: 'icon-lg', ariaLabel: 'Adicionar item' });
    btn.appendChild(createButtonIcon('plus'));
    return btn;
  },
  parameters: { docs: { description: { story: 'Botão ícone grande. Use como FAB ou CTAs visuais.' } } },
};
