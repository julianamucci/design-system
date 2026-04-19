import type { Meta, StoryObj } from '@storybook/svelte';
import { Button } from './index';
import ButtonStory from './ButtonStory.svelte';

const meta = {
  title: 'UI/Button/Tamanhos',
  component: Button,
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({ Component: ButtonStory, props: { size: 'default', label: 'Padrão' } }),
  parameters: { docs: { description: { story: 'Tamanho padrão. Use em formulários e diálogos como default.' } } },
};

export const Small: Story = {
  render: () => ({ Component: ButtonStory, props: { size: 'sm', label: 'Pequeno' } }),
  parameters: { docs: { description: { story: 'Tamanho pequeno. Use em toolbars e áreas densas.' } } },
};

export const Large: Story = {
  render: () => ({ Component: ButtonStory, props: { size: 'lg', label: 'Grande' } }),
  parameters: { docs: { description: { story: 'Tamanho grande. Use em CTAs de destaque e hero sections.' } } },
};

export const Icon: Story = {
  render: () => ({ Component: ButtonStory, props: { size: 'icon', iconOnly: 'plus', ariaLabel: 'Adicionar item' } }),
  parameters: { docs: { description: { story: 'Botão ícone padrão. Sempre forneça aria-label descritivo.' } } },
};

export const IconSmall: Story = {
  render: () => ({ Component: ButtonStory, props: { size: 'icon-sm', iconOnly: 'plus', ariaLabel: 'Adicionar item' } }),
  parameters: { docs: { description: { story: 'Botão ícone pequeno. Use em toolbars compactas.' } } },
};

export const IconLarge: Story = {
  render: () => ({ Component: ButtonStory, props: { size: 'icon-lg', iconOnly: 'plus', ariaLabel: 'Adicionar item' } }),
  parameters: { docs: { description: { story: 'Botão ícone grande. Use como FAB ou CTAs visuais.' } } },
};
