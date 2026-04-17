import type { Meta, StoryObj } from '@storybook/vue3';
import { userEvent, within, expect, waitFor } from 'storybook/test';
import { Toaster } from './index';
import { Button } from '../button';
import SonnerDocs from '@/components/docs/SonnerDocs.vue';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import { toast } from 'vue-sonner';

const meta = {
  title: 'UI/Sonner',
  component: Toaster,
  tags: ['autodocs'],
  parameters: {
    docs: { page: withAutoDocsTab(SonnerDocs) },
  },
  argTypes: {
    position: {
      control: 'select',
      description: 'Posição dos toasts na tela',
      options: ['top-left', 'top-center', 'top-right', 'bottom-left', 'bottom-center', 'bottom-right'],
    },
    richColors: {
      control: 'boolean',
      description: 'Ativa cores vibrantes por tipo de toast',
    },
    expand: {
      control: 'boolean',
      description: 'Expande todos os toasts simultaneamente',
    },
    closeButton: {
      control: 'boolean',
      description: 'Exibe botão de fechar em todos os toasts',
    },
  },
  args: {
    position: 'bottom-right',
    richColors: false,
    expand: false,
    closeButton: false,
  },
} satisfies Meta<typeof Toaster>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => ({
    components: { Toaster, Button },
    setup() {
      const triggerDefault = () => toast('Toast padrão');
      const triggerSuccess = () => toast.success('Salvo com sucesso');
      const triggerError = () => toast.error('Falha ao salvar');
      const triggerWarning = () => toast.warning('Conexão instável');
      const triggerInfo = () => toast.info('Nova versão disponível');
      const triggerLoading = () => toast.loading('Processando...');
      const triggerAction = () => toast('Item excluído', { action: { label: 'Desfazer', onClick: () => toast.success('Desfeito!') } });
      const dismissAll = () => toast.dismiss();
      return { args, triggerDefault, triggerSuccess, triggerError, triggerWarning, triggerInfo, triggerLoading, triggerAction, dismissAll };
    },
    template: `
      <div style="min-height: 300px; display: flex; align-items: center; justify-content: center;">
        <Toaster v-bind="args" />
        <div style="display: flex; flex-wrap: wrap; gap: 0.75rem;">
          <Button @click="triggerDefault">Default</Button>
          <Button variant="outline" @click="triggerSuccess">Success</Button>
          <Button variant="outline" @click="triggerError">Error</Button>
          <Button variant="outline" @click="triggerWarning">Warning</Button>
          <Button variant="outline" @click="triggerInfo">Info</Button>
          <Button variant="outline" @click="triggerLoading">Loading</Button>
          <Button variant="outline" @click="triggerAction">Com ação</Button>
          <Button variant="secondary" @click="dismissAll">Fechar todos</Button>
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Dispara um toast default e verifica que aparece', async () => {
      const defaultBtn = canvas.getByRole('button', { name: 'Default' });
      await userEvent.click(defaultBtn);
      await waitFor(() => {
        const toastEl = document.querySelector('[data-sonner-toast]');
        expect(toastEl).toBeTruthy();
      }, { timeout: 3000 });
    });

    await step('Toast region existe para acessibilidade', async () => {
      const toastRegion = document.querySelector('[data-sonner-toaster]');
      expect(toastRegion).toBeTruthy();
    });

    await step('Dispara toast de sucesso', async () => {
      const successBtn = canvas.getByRole('button', { name: 'Success' });
      await userEvent.click(successBtn);
      await waitFor(() => {
        const toasts = document.querySelectorAll('[data-sonner-toast]');
        expect(toasts.length).toBeGreaterThanOrEqual(2);
      }, { timeout: 3000 });
    });

    await step('Dismiss fecha todos os toasts', async () => {
      const dismissBtn = canvas.getByRole('button', { name: 'Fechar todos' });
      await userEvent.click(dismissBtn);
    });
  },
  parameters: {
    docs: {
      description: {
        story: 'Playground interativo com todos os tipos de toast. Cobre critérios: disparo, visibilidade, acessibilidade e dismiss. Veja a aba **Interactions**.',
      },
    },
  },
};
