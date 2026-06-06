import type { Meta, StoryObj } from '@storybook/vue3';
import { userEvent, within, expect } from 'storybook/test';
import { toast } from 'vue-sonner';
import { Toaster } from './index';
import { Button } from '@/components/ui/button';
import SonnerDocs from '@/components/docs/SonnerDocs.vue';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

const meta = {
  title: 'UI/Sonner',
  component: Toaster,
  tags: ['autodocs', 'feedback'],
  parameters: {
    docs: { page: withAutoDocsTab(SonnerDocs) },
  },
  argTypes: {
    position: {
      control: 'select',
      options: [
        'top-left', 'top-center', 'top-right',
        'bottom-left', 'bottom-center', 'bottom-right',
      ],
      description: 'Posição dos toasts na tela.',
    },
    richColors: {
      control: 'boolean',
      description: 'Aplica cores semânticas do tema para cada tipo.',
    },
    expand: {
      control: 'boolean',
      description: 'Exibe todos os toasts empilhados em vez de condensados.',
    },
    duration: {
      control: 'number',
      description: 'Duração padrão em ms antes de fechar automaticamente.',
    },
  },
  args: {
    position: 'top-right',
    richColors: true,
    expand: false,
    duration: 4000,
  },
} satisfies Meta<typeof Toaster>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => ({
    components: { Toaster, Button },
    setup() {
      function fireDefault() { toast('Código copiado.'); }
      function fireSuccess() { toast.success('Alterações salvas.'); }
      function fireError() { toast.error('Não foi possível salvar. Tente novamente.'); }
      function fireWarning() { toast.warning('Sua sessão expira em 5 minutos.'); }
      function fireInfo() { toast.info('Nova versão disponível.'); }
      function fireLoading() { toast.loading('Enviando arquivo...'); }
      return { args, fireDefault, fireSuccess, fireError, fireWarning, fireInfo, fireLoading };
    },
    template: `
      <div style="contain: layout; position: relative; min-height: 160px;">
        <Toaster v-bind="args" />
        <div class="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" @click="fireDefault">Disparar default</Button>
          <Button variant="outline" size="sm" @click="fireSuccess">Disparar success</Button>
          <Button variant="outline" size="sm" @click="fireError">Disparar error</Button>
          <Button variant="outline" size="sm" @click="fireWarning">Disparar warning</Button>
          <Button variant="outline" size="sm" @click="fireInfo">Disparar info</Button>
          <Button variant="outline" size="sm" @click="fireLoading">Disparar loading</Button>
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Botão "Disparar success" está presente', async () => {
      const btn = canvas.getByRole('button', { name: /Disparar success/i });
      await expect(btn).toBeInTheDocument();
    });

    await step('Clicar no botão "Disparar success" dispara o toast', async () => {
      const btn = canvas.getByRole('button', { name: /Disparar success/i });
      await userEvent.click(btn);
    });
  },
};
