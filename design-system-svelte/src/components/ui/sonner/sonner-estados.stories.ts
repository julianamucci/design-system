import type { Meta, StoryObj } from '@storybook/svelte';
import { userEvent, within, expect, waitFor } from 'storybook/test';
import SonnerStory from './SonnerStory.svelte';

const meta = {
  title: 'UI/Sonner/Estados',
  component: SonnerStory,
  args: {
    richColors: true,
    position: 'bottom-right',
    closeButton: true,
    mode: 'single',
  },
} satisfies Meta<typeof SonnerStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Expanded: Story = {
  name: 'Expandido (múltiplos toasts)',
  args: { expand: true, toastType: 'default', toastMessage: 'Notificação', autoTrigger: true, mode: 'playground' },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Múltiplos toasts são exibidos', async () => {
      const btn = canvas.getByRole('button', { name: 'Default' });
      await userEvent.click(btn);
      await userEvent.click(btn);
      await waitFor(() => {
        const toasts = document.querySelectorAll('[data-sonner-toast]');
        expect(toasts.length).toBeGreaterThanOrEqual(2);
      }, { timeout: 3000 });
    });
  },
  parameters: { docs: { description: { story: 'Com expand={true}, todos os toasts ficam expandidos simultaneamente.' } } },
};

export const ComCloseButton: Story = {
  name: 'Com Botão de Fechar',
  args: { toastType: 'error', toastMessage: 'Erro crítico', duration: 999999, autoTrigger: true },
  play: async ({ step }) => {
    await step('Toast exibe botão de fechar', async () => {
      await waitFor(() => {
        const closeBtn = document.querySelector('[data-sonner-toast] [data-close-button]');
        expect(closeBtn).toBeTruthy();
      }, { timeout: 3000 });
    });
  },
  parameters: { docs: { description: { story: 'Toast persistente com botão de fechar. Obrigatório para erros críticos — WCAG 2.2.1.' } } },
};

export const Dismiss: Story = {
  name: 'Dismiss Programático',
  args: { toastType: 'default', toastMessage: 'Toast temporário', autoTrigger: false, mode: 'playground' },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Criar e fechar todos os toasts', async () => {
      const createBtn = canvas.getByRole('button', { name: 'Default' });
      await userEvent.click(createBtn);
      await waitFor(() => {
        const toasts = document.querySelectorAll('[data-sonner-toast]');
        expect(toasts.length).toBeGreaterThanOrEqual(1);
      }, { timeout: 3000 });
      const dismissBtn = canvas.getByRole('button', { name: 'Fechar todos' });
      await userEvent.click(dismissBtn);
    });
  },
  parameters: { docs: { description: { story: 'toast.dismiss() fecha todos os toasts programaticamente.' } } },
};

export const DuracaoCustom: Story = {
  name: 'Duração Customizada',
  args: { toastType: 'info', toastMessage: 'Este toast dura 10 segundos', duration: 10000, autoTrigger: true },
  parameters: { docs: { description: { story: 'Toast com duração customizada de 10 segundos. Use duração maior para erros críticos.' } } },
};
