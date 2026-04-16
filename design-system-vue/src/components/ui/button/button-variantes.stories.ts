import type { Meta, StoryObj } from '@storybook/vue3';
import { Button } from './index';

const meta = {
  title: 'UI/Button/Variantes',
  component: Button,
  args: {
    variant: 'default',
    disabled: false,
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { variant: 'default' },
  render: (args) => ({
    components: { Button },
    setup() { return { args }; },
    template: '<Button v-bind="args">Botão</Button>',
  }),
  parameters: {
    docs: {
      description: {
        story: 'A variante padrão para ações primárias que devem chamar a atenção do usuário.',
      },
    },
  },
};

export const Secondary: Story = {
  args: { variant: 'secondary' },
  render: (args) => ({
    components: { Button },
    setup() { return { args }; },
    template: '<Button v-bind="args">Botão</Button>',
  }),
  parameters: {
    docs: {
      description: {
        story: 'Alternativa de menor hierarquia visual. Usar para ações de suporte à ação primária.',
      },
    },
  },
};

export const Outline: Story = {
  args: { variant: 'outline' },
  render: (args) => ({
    components: { Button },
    setup() { return { args }; },
    template: '<Button v-bind="args">Botão</Button>',
  }),
  parameters: {
    docs: {
      description: {
        story: 'Ideal para ações secundárias ou botões que não devem competir visualmente com a ação primária.',
      },
    },
  },
};

export const Ghost: Story = {
  args: { variant: 'ghost' },
  render: (args) => ({
    components: { Button },
    setup() { return { args }; },
    template: '<Button v-bind="args">Botão</Button>',
  }),
  parameters: {
    docs: {
      description: {
        story: 'Ações sutis, comumente usadas em toolbars ou botões de fechar/cancelar.',
      },
    },
  },
};

export const Link: Story = {
  args: { variant: 'link' },
  render: (args) => ({
    components: { Button },
    setup() { return { args }; },
    template: '<Button v-bind="args">Botão</Button>',
  }),
  parameters: {
    docs: {
      description: {
        story: 'Para ações que parecem links. Use quando o botão está embutido em texto corrido ou em listas de ações inline.',
      },
    },
  },
};

export const Destructive: Story = {
  args: { variant: 'destructive' },
  render: (args) => ({
    components: { Button },
    setup() { return { args }; },
    template: '<Button v-bind="args">Botão</Button>',
  }),
  parameters: {
    docs: {
      description: {
        story: 'Para ações irreversíveis. Deve sempre ser precedida de um AlertDialog de confirmação — nunca dispare a ação diretamente no onClick.',
      },
    },
  },
};
