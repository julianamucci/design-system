import { figmaDesign } from '@shared/figma/design-links';
import type { Meta, StoryObj } from '@storybook/html-vite';
import { createButton } from './button';
import { within, expect } from 'storybook/test';

const meta: Meta = {
  tags: ['form'],
  parameters: {
    design: figmaDesign('button'),
    controls: { disable: true },
    actions: { disable: true },
  },
  title: 'UI/Button/Variantes',
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => createButton({ variant: 'default', label: 'Salvar' }),
  parameters: {
    covers: ['visual.item2'],
    docs: { description: { story: 'Variante primária. Use para a ação principal de uma seção.' } },
  },

  play: async ({ canvasElement }) => {
    const btn = within(canvasElement).getByRole('button', { name: /salvar/i });
    await expect(btn).toHaveClass('nds-button-default');
  },
};

export const Destructive: Story = {
  render: () => createButton({ variant: 'destructive', label: 'Excluir conta' }),
  parameters: { docs: { description: { story: 'Variante destrutiva. Use para ações irreversíveis como excluir ou remover.' } } },

  play: async ({ canvasElement }) => {
    const btn = within(canvasElement).getByRole('button', { name: /excluir conta/i });
    await expect(btn).toHaveClass('nds-button-destructive');
  },
};

export const Outline: Story = {
  render: () => createButton({ variant: 'outline', label: 'Cancelar' }),
  parameters: { docs: { description: { story: 'Variante secundária com borda. Use ao lado da ação primária em pares de ações.' } } },

  play: async ({ canvasElement }) => {
    const btn = within(canvasElement).getByRole('button', { name: /cancelar/i });
    await expect(btn).toHaveClass('nds-button-outline');
  },
};

export const Secondary: Story = {
  render: () => createButton({ variant: 'secondary', label: 'Ver detalhes' }),
  parameters: { docs: { description: { story: 'Variante secundária sólida. Use para ações complementares de menor ênfase.' } } },

  play: async ({ canvasElement }) => {
    const btn = within(canvasElement).getByRole('button', { name: /ver detalhes/i });
    await expect(btn).toHaveClass('nds-button-secondary');
  },
};

export const Ghost: Story = {
  render: () => createButton({ variant: 'ghost', label: 'Fechar' }),
  parameters: { docs: { description: { story: 'Variante sem borda ou fundo. Use em toolbars e menus para reduzir ruído visual.' } } },

  play: async ({ canvasElement }) => {
    const btn = within(canvasElement).getByRole('button', { name: /fechar/i });
    await expect(btn).toHaveClass('nds-button-ghost');
  },
};

export const Link: Story = {
  render: () => createButton({ variant: 'link', label: 'Saiba mais' }),
  parameters: { docs: { description: { story: 'Variante com aparência de link. Use quando a ação for navegacional em contexto textual.' } } },

  play: async ({ canvasElement }) => {
    const btn = within(canvasElement).getByRole('button', { name: /saiba mais/i });
    await expect(btn).toHaveClass('nds-button-link');
  },
};
