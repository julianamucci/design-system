import type { Meta, StoryObj } from '@storybook/vue3';
import { Toaster } from './index';
import { Button } from '../button';
import { toast } from 'vue-sonner';
import { onMounted } from 'vue';

const meta = {
  title: 'UI/Sonner/Composições',
  component: Toaster,
  args: {
    richColors: true,
    position: 'bottom-right',
    closeButton: true,
  },
} satisfies Meta<typeof Toaster>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ComAcao: Story = {
  name: 'Com Ação',
  render: (args) => ({
    components: { Toaster, Button },
    setup() {
      const trigger = () => toast('Item excluído', { action: { label: 'Desfazer', onClick: () => toast.success('Ação desfeita!') } });
      onMounted(() => setTimeout(trigger, 300));
      return { args, trigger };
    },
    template: `
      <div style="min-height: 300px; display: flex; align-items: center; justify-content: center;">
        <Toaster v-bind="args" />
        <Button @click="trigger">Excluir item</Button>
      </div>
    `,
  }),
  parameters: { docs: { description: { story: 'Toast com botão de ação inline. O padrão mais comum é "Desfazer" para ações destrutivas reversíveis.' } } },
};

export const ComDescricao: Story = {
  name: 'Com Descrição',
  render: (args) => ({
    components: { Toaster, Button },
    setup() {
      const trigger = () => toast('Relatório gerado', { description: 'O arquivo estará disponível para download em instantes.' });
      onMounted(() => setTimeout(trigger, 300));
      return { args, trigger };
    },
    template: `
      <div style="min-height: 300px; display: flex; align-items: center; justify-content: center;">
        <Toaster v-bind="args" />
        <Button @click="trigger">Gerar relatório</Button>
      </div>
    `,
  }),
  parameters: { docs: { description: { story: 'Toast com texto de descrição abaixo do título. Use para fornecer detalhes adicionais.' } } },
};

export const Promise: Story = {
  name: 'Promise (async)',
  render: (args) => ({
    components: { Toaster, Button },
    setup() {
      const trigger = () => toast.promise(new window.Promise((resolve) => setTimeout(resolve, 2500)), { loading: 'Salvando dados...', success: 'Dados salvos com sucesso!', error: 'Erro ao salvar dados' });
      return { args, trigger };
    },
    template: `
      <div style="min-height: 300px; display: flex; align-items: center; justify-content: center;">
        <Toaster v-bind="args" />
        <Button @click="trigger">Salvar dados</Button>
      </div>
    `,
  }),
  parameters: { docs: { description: { story: 'toast.promise() gerencia automaticamente loading → success/error. Ideal para operações assíncronas.' } } },
};

export const RichColors: Story = {
  name: 'Rich Colors',
  render: () => ({
    components: { Toaster, Button },
    setup() {
      const triggerAll = () => {
        toast.success('Sucesso com rich colors');
        toast.error('Erro com rich colors');
        toast.warning('Aviso com rich colors');
        toast.info('Info com rich colors');
      };
      onMounted(() => setTimeout(triggerAll, 300));
      return { triggerAll };
    },
    template: `
      <div style="min-height: 300px; display: flex; align-items: center; justify-content: center;">
        <Toaster rich-colors position="bottom-right" close-button />
        <Button @click="triggerAll">Todos os tipos</Button>
      </div>
    `,
  }),
  parameters: { docs: { description: { story: 'Com richColors ativado, cada tipo de toast exibe cores vibrantes e distintas.' } } },
};

export const ComAcaoEDescricao: Story = {
  name: 'Ação + Descrição',
  render: (args) => ({
    components: { Toaster, Button },
    setup() {
      const trigger = () => toast.error('Falha ao enviar e-mail', { description: 'Verifique o endereço e tente novamente.', action: { label: 'Tentar novamente', onClick: () => toast.loading('Reenviando...') } });
      onMounted(() => setTimeout(trigger, 300));
      return { args, trigger };
    },
    template: `
      <div style="min-height: 300px; display: flex; align-items: center; justify-content: center;">
        <Toaster v-bind="args" />
        <Button @click="trigger">Enviar e-mail</Button>
      </div>
    `,
  }),
  parameters: { docs: { description: { story: 'Combinação de descrição e ação em um toast de erro. Padrão recomendado para erros recuperáveis.' } } },
};
