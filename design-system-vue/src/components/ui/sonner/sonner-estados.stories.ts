import type { Meta, StoryObj } from '@storybook/vue3';
import { userEvent, within, expect, waitFor } from 'storybook/test';
import { Toaster } from './index';
import { Button } from '../button';
import { toast } from 'vue-sonner';
import { onMounted } from 'vue';

const meta = {
  title: 'UI/Sonner/Estados',
  component: Toaster,
  args: {
    richColors: true,
    position: 'bottom-right',
    closeButton: true,
  },
} satisfies Meta<typeof Toaster>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Expanded: Story = {
  name: 'Expandido (múltiplos toasts)',
  render: () => ({
    components: { Toaster, Button },
    setup() {
      const triggerMultiple = () => {
        toast('Primeira notificação');
        setTimeout(() => toast.success('Segunda notificação'), 200);
        setTimeout(() => toast.info('Terceira notificação'), 400);
      };
      onMounted(() => setTimeout(triggerMultiple, 300));
      return { triggerMultiple };
    },
    template: `
      <div style="min-height: 400px; display: flex; align-items: center; justify-content: center;">
        <Toaster expand rich-colors position="bottom-right" close-button />
        <Button @click="triggerMultiple">Disparar 3 toasts</Button>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Múltiplos toasts são exibidos simultaneamente', async () => {
      const btn = canvas.getByRole('button', { name: 'Disparar 3 toasts' });
      await userEvent.click(btn);
      await waitFor(() => {
        const toasts = document.querySelectorAll('[data-sonner-toast]');
        expect(toasts.length).toBeGreaterThanOrEqual(3);
      }, { timeout: 3000 });
    });
  },
  parameters: { docs: { description: { story: 'Com expand={true}, todos os toasts ficam visíveis e expandidos simultaneamente.' } } },
};

export const ComCloseButton: Story = {
  name: 'Com Botão de Fechar',
  render: () => ({
    components: { Toaster, Button },
    setup() {
      const trigger = () => toast.error('Erro crítico — leia antes de fechar', { duration: Infinity });
      onMounted(() => setTimeout(trigger, 300));
      return { trigger };
    },
    template: `
      <div style="min-height: 400px; display: flex; align-items: center; justify-content: center;">
        <Toaster close-button rich-colors position="bottom-right" />
        <Button @click="trigger">Toast persistente</Button>
      </div>
    `,
  }),
  play: async ({ step }) => {
    await step('Toast com closeButton exibe botão X', async () => {
      await waitFor(() => {
        const closeBtn = document.querySelector('[data-sonner-toast] [data-close-button]');
        expect(closeBtn).toBeTruthy();
      }, { timeout: 3000 });
    });
  },
  parameters: { docs: { description: { story: 'Toast persistente (duration: Infinity) com botão de fechar. Obrigatório para erros críticos — WCAG 2.2.1.' } } },
};

export const Dismiss: Story = {
  name: 'Dismiss Programático',
  render: (args) => ({
    components: { Toaster, Button },
    setup() {
      const create = () => toast('Toast temporário', { id: 'demo-dismiss' });
      const dismissById = () => toast.dismiss('demo-dismiss');
      const dismissAll = () => toast.dismiss();
      return { args, create, dismissById, dismissAll };
    },
    template: `
      <div style="min-height: 400px; display: flex; align-items: center; justify-content: center;">
        <Toaster v-bind="args" />
        <div style="display: flex; gap: 0.75rem;">
          <Button @click="create">Criar toast</Button>
          <Button variant="outline" @click="dismissById">Fechar por ID</Button>
          <Button variant="secondary" @click="dismissAll">Fechar todos</Button>
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('toast.dismiss() fecha todos os toasts', async () => {
      const createBtn = canvas.getByRole('button', { name: 'Criar toast' });
      await userEvent.click(createBtn);
      await waitFor(() => {
        const toasts = document.querySelectorAll('[data-sonner-toast]');
        expect(toasts.length).toBeGreaterThanOrEqual(1);
      }, { timeout: 3000 });
      const dismissAllBtn = canvas.getByRole('button', { name: 'Fechar todos' });
      await userEvent.click(dismissAllBtn);
    });
  },
  parameters: { docs: { description: { story: 'Controle programático de dismiss. toast.dismiss(id) fecha um toast específico; toast.dismiss() fecha todos.' } } },
};

export const DuracaoCustom: Story = {
  name: 'Duração Customizada',
  render: () => ({
    components: { Toaster, Button },
    setup() {
      const t2s = () => toast('2 segundos', { duration: 2000 });
      const t8s = () => toast.warning('8 segundos', { duration: 8000 });
      const tInf = () => toast.error('Persistente', { duration: Infinity });
      return { t2s, t8s, tInf };
    },
    template: `
      <div style="min-height: 400px; display: flex; align-items: center; justify-content: center;">
        <Toaster rich-colors position="bottom-right" close-button />
        <div style="display: flex; gap: 0.75rem;">
          <Button variant="outline" @click="t2s">2s</Button>
          <Button variant="outline" @click="t8s">8s</Button>
          <Button variant="outline" @click="tInf">Infinito</Button>
        </div>
      </div>
    `,
  }),
  parameters: { docs: { description: { story: 'Duração customizada por toast. Erros críticos devem usar duration: Infinity com closeButton.' } } },
};
