import type { Meta, StoryObj } from '@storybook/vue3';
import { Button } from './index';

const meta = {
  title: 'UI/Button/Variantes',
  component: Button,
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    components: { Button },
    template: '<Button>Salvar</Button>',
  }),
  parameters: {
    docs: { description: { story: 'Variante primária. Use para a ação principal de uma seção.' } },
  },
};

export const Destructive: Story = {
  render: () => ({
    components: { Button },
    template: '<Button variant="destructive">Excluir conta</Button>',
  }),
  parameters: {
    docs: { description: { story: 'Variante destrutiva. Use para ações irreversíveis como excluir ou remover.' } },
  },
};

export const Outline: Story = {
  render: () => ({
    components: { Button },
    template: '<Button variant="outline">Cancelar</Button>',
  }),
  parameters: {
    docs: { description: { story: 'Variante secundária com borda. Use ao lado da ação primária em pares de ações.' } },
  },
};

export const Secondary: Story = {
  render: () => ({
    components: { Button },
    template: '<Button variant="secondary">Ver detalhes</Button>',
  }),
  parameters: {
    docs: { description: { story: 'Variante secundária sólida. Use para ações complementares de menor ênfase.' } },
  },
};

export const Ghost: Story = {
  render: () => ({
    components: { Button },
    template: '<Button variant="ghost">Fechar</Button>',
  }),
  parameters: {
    docs: { description: { story: 'Variante sem borda ou fundo. Use em toolbars e menus para reduzir ruído visual.' } },
  },
};

export const Link: Story = {
  render: () => ({
    components: { Button },
    template: '<Button variant="link">Saiba mais</Button>',
  }),
  parameters: {
    docs: { description: { story: 'Variante com aparência de link. Use quando a ação for navegacional em contexto textual.' } },
  },
};
