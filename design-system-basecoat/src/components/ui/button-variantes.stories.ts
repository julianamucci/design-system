import type { Meta, StoryObj } from '@storybook/html';
import { createButton } from './button';

const meta: Meta = {
  title: 'UI/Button/Variantes',
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => createButton({ variant: 'default', label: 'Salvar' }),
  parameters: { docs: { description: { story: 'Ação primária. Use uma única vez por seção.' } } },
};

export const Destructive: Story = {
  render: () => createButton({ variant: 'destructive', label: 'Excluir' }),
  parameters: { docs: { description: { story: 'Ações irreversíveis. Sempre confirmar via AlertDialog.' } } },
};

export const Outline: Story = {
  render: () => createButton({ variant: 'outline', label: 'Cancelar' }),
  parameters: { docs: { description: { story: 'Ação secundária com destaque. Combina com default em par de ações.' } } },
};

export const Secondary: Story = {
  render: () => createButton({ variant: 'secondary', label: 'Ver mais' }),
  parameters: { docs: { description: { story: 'Ação secundária neutra, menos proeminente que outline.' } } },
};

export const Ghost: Story = {
  render: () => createButton({ variant: 'ghost', label: 'Editar' }),
  parameters: { docs: { description: { story: 'Ação discreta em toolbars e menus. Sem borda, hover com accent.' } } },
};

export const Link: Story = {
  render: () => createButton({ variant: 'link', label: 'Saiba mais' }),
  parameters: { docs: { description: { story: 'Aparência de link. Prefira um <a> real quando possível.' } } },
};
