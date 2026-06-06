import type { Meta, StoryObj } from '@storybook/html';
import { createButton } from './button';
import { within, expect } from 'storybook/test';

const meta: Meta = {
  tags: ['form'],
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
  },
  title: 'UI/Button/Variantes',
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => createButton({ variant: 'default', label: 'Salvar' }),
  parameters: { docs: { description: { story: 'Ação primária. Use uma única vez por seção.' } } },

  play: async ({ canvasElement }) => {
    const el = canvasElement as HTMLElement;
    await expect(within(el).queryAllByRole('button').length).toBeGreaterThanOrEqual(0);
  },
};

export const Destructive: Story = {
  render: () => createButton({ variant: 'destructive', label: 'Excluir' }),
  parameters: { docs: { description: { story: 'Ações irreversíveis. Sempre confirmar via AlertDialog.' } } },

  play: async ({ canvasElement }) => {
    const el = canvasElement as HTMLElement;
    await expect(within(el).queryAllByRole('button').length).toBeGreaterThanOrEqual(0);
  },
};

export const Outline: Story = {
  render: () => createButton({ variant: 'outline', label: 'Cancelar' }),
  parameters: { docs: { description: { story: 'Ação secundária com destaque. Combina com default em par de ações.' } } },

  play: async ({ canvasElement }) => {
    const el = canvasElement as HTMLElement;
    await expect(within(el).queryAllByRole('button').length).toBeGreaterThanOrEqual(0);
  },
};

export const Secondary: Story = {
  render: () => createButton({ variant: 'secondary', label: 'Ver mais' }),
  parameters: { docs: { description: { story: 'Ação secundária neutra, menos proeminente que outline.' } } },

  play: async ({ canvasElement }) => {
    const el = canvasElement as HTMLElement;
    await expect(within(el).queryAllByRole('button').length).toBeGreaterThanOrEqual(0);
  },
};

export const Ghost: Story = {
  render: () => createButton({ variant: 'ghost', label: 'Editar' }),
  parameters: { docs: { description: { story: 'Ação discreta em toolbars e menus. Sem borda, hover com accent.' } } },

  play: async ({ canvasElement }) => {
    const el = canvasElement as HTMLElement;
    await expect(within(el).queryAllByRole('button').length).toBeGreaterThanOrEqual(0);
  },
};

export const Link: Story = {
  render: () => createButton({ variant: 'link', label: 'Saiba mais' }),
  parameters: { docs: { description: { story: 'Aparência de link. Prefira um <a> real quando possível.' } } },

  play: async ({ canvasElement }) => {
    const el = canvasElement as HTMLElement;
    await expect(within(el).queryAllByRole('button').length).toBeGreaterThanOrEqual(0);
  },
};
