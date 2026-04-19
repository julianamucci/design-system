import type { Meta, StoryObj } from '@storybook/svelte';
import { Button } from './index';
import ButtonStory from './ButtonStory.svelte';

const meta = {
  title: 'UI/Button/Variantes',
  component: Button,
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({ Component: ButtonStory, props: { variant: 'default', label: 'Salvar' } }),
  parameters: { docs: { description: { story: 'Variante primária. Use para a ação principal de uma seção.' } } },
};

export const Destructive: Story = {
  render: () => ({ Component: ButtonStory, props: { variant: 'destructive', label: 'Excluir conta' } }),
  parameters: { docs: { description: { story: 'Variante destrutiva. Use para ações irreversíveis como excluir ou remover.' } } },
};

export const Outline: Story = {
  render: () => ({ Component: ButtonStory, props: { variant: 'outline', label: 'Cancelar' } }),
  parameters: { docs: { description: { story: 'Variante secundária com borda. Use ao lado da ação primária em pares de ações.' } } },
};

export const Secondary: Story = {
  render: () => ({ Component: ButtonStory, props: { variant: 'secondary', label: 'Ver detalhes' } }),
  parameters: { docs: { description: { story: 'Variante secundária sólida. Use para ações complementares de menor ênfase.' } } },
};

export const Ghost: Story = {
  render: () => ({ Component: ButtonStory, props: { variant: 'ghost', label: 'Fechar' } }),
  parameters: { docs: { description: { story: 'Variante sem borda ou fundo. Use em toolbars e menus para reduzir ruído visual.' } } },
};

export const Link: Story = {
  render: () => ({ Component: ButtonStory, props: { variant: 'link', label: 'Saiba mais' } }),
  parameters: { docs: { description: { story: 'Variante com aparência de link. Use quando a ação for navegacional em contexto textual.' } } },
};
