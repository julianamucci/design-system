import type { Meta, StoryObj } from '@storybook/vue3';
import { Toaster } from './index';
import { Button } from '../button';
import { toast } from 'vue-sonner';
import { onMounted } from 'vue';

const meta = {
  title: 'UI/Sonner/Tipos',
  component: Toaster,
  args: {
    richColors: true,
    position: 'bottom-right',
    closeButton: true,
  },
} satisfies Meta<typeof Toaster>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => ({
    components: { Toaster, Button },
    setup() {
      onMounted(() => setTimeout(() => toast('Notificação padrão'), 300));
      return { args, trigger: () => toast('Notificação padrão') };
    },
    template: `
      <div style="min-height: 300px; display: flex; align-items: center; justify-content: center;">
        <Toaster v-bind="args" />
        <Button @click="trigger">Mostrar toast</Button>
      </div>
    `,
  }),
  parameters: { docs: { description: { story: 'Toast padrão sem ícone. Use para feedback geral.' } } },
};

export const Success: Story = {
  render: (args) => ({
    components: { Toaster, Button },
    setup() {
      onMounted(() => setTimeout(() => toast.success('Item salvo com sucesso'), 300));
      return { args, trigger: () => toast.success('Item salvo com sucesso') };
    },
    template: `
      <div style="min-height: 300px; display: flex; align-items: center; justify-content: center;">
        <Toaster v-bind="args" />
        <Button @click="trigger">Sucesso</Button>
      </div>
    `,
  }),
  parameters: { docs: { description: { story: 'Toast de sucesso com ícone verde. Use para confirmar ações concluídas.' } } },
};

export const Error: Story = {
  render: (args) => ({
    components: { Toaster, Button },
    setup() {
      onMounted(() => setTimeout(() => toast.error('Falha ao salvar alterações'), 300));
      return { args, trigger: () => toast.error('Falha ao salvar alterações') };
    },
    template: `
      <div style="min-height: 300px; display: flex; align-items: center; justify-content: center;">
        <Toaster v-bind="args" />
        <Button @click="trigger">Erro</Button>
      </div>
    `,
  }),
  parameters: { docs: { description: { story: 'Toast de erro com ícone vermelho. Para erros críticos, combine com duration maior ou closeButton.' } } },
};

export const Warning: Story = {
  render: (args) => ({
    components: { Toaster, Button },
    setup() {
      onMounted(() => setTimeout(() => toast.warning('Conexão instável detectada'), 300));
      return { args, trigger: () => toast.warning('Conexão instável detectada') };
    },
    template: `
      <div style="min-height: 300px; display: flex; align-items: center; justify-content: center;">
        <Toaster v-bind="args" />
        <Button @click="trigger">Aviso</Button>
      </div>
    `,
  }),
  parameters: { docs: { description: { story: 'Toast de aviso com ícone amarelo. Use para alertar sobre situações que requerem atenção.' } } },
};

export const Info: Story = {
  render: (args) => ({
    components: { Toaster, Button },
    setup() {
      onMounted(() => setTimeout(() => toast.info('Nova versão disponível'), 300));
      return { args, trigger: () => toast.info('Nova versão disponível') };
    },
    template: `
      <div style="min-height: 300px; display: flex; align-items: center; justify-content: center;">
        <Toaster v-bind="args" />
        <Button @click="trigger">Informação</Button>
      </div>
    `,
  }),
  parameters: { docs: { description: { story: 'Toast informativo com ícone azul. Use para informações contextuais não-críticas.' } } },
};

export const Loading: Story = {
  render: (args) => ({
    components: { Toaster, Button },
    setup() {
      onMounted(() => setTimeout(() => toast.loading('Processando dados...'), 300));
      return { args, trigger: () => toast.loading('Processando dados...') };
    },
    template: `
      <div style="min-height: 300px; display: flex; align-items: center; justify-content: center;">
        <Toaster v-bind="args" />
        <Button @click="trigger">Carregando</Button>
      </div>
    `,
  }),
  parameters: { docs: { description: { story: 'Toast de carregamento com spinner animado. Prefira toast.promise() para operações assíncronas.' } } },
};
