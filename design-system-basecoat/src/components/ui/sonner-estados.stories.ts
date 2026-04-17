import type { Meta, StoryObj } from '@storybook/html';
import { userEvent, within, expect, waitFor } from 'storybook/test';
import { toast, injectToastStyles } from './toast-utils';

type SonnerArgs = {
  richColors: boolean;
  closeButton: boolean;
};

const meta: Meta<SonnerArgs> = {
  title: 'UI/Sonner/Estados',
  args: {
    richColors: true,
    closeButton: true,
  },
};

export default meta;
type Story = StoryObj<SonnerArgs>;

const BTN_BASE = 'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all h-9 px-4 py-2';
const BTN_DEFAULT = `${BTN_BASE} bg-primary text-primary-foreground hover:bg-primary/90`;
const BTN_OUTLINE = `${BTN_BASE} border bg-background hover:bg-accent hover:text-accent-foreground`;

export const Expanded: Story = {
  name: 'Expandido (múltiplos toasts)',
  render: (args) => {
    injectToastStyles();
    const wrap = document.createElement('div');
    wrap.className = 'flex gap-3 p-6';

    const createBtn = document.createElement('button');
    createBtn.type = 'button';
    createBtn.className = BTN_DEFAULT;
    createBtn.textContent = 'Criar toast';
    createBtn.addEventListener('click', () => {
      toast('Notificação', { richColors: args.richColors, closeButton: args.closeButton, position: 'top-right', duration: 999999 });
    });

    wrap.appendChild(createBtn);
    return wrap;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Múltiplos toasts são exibidos', async () => {
      const btn = canvas.getByRole('button', { name: 'Criar toast' });
      await userEvent.click(btn);
      await userEvent.click(btn);
      await userEvent.click(btn);
      await waitFor(() => {
        const toasts = document.querySelectorAll('[data-sonner-toast]');
        expect(toasts.length).toBeGreaterThanOrEqual(2);
      }, { timeout: 3000 });
    });
  },
  parameters: { docs: { description: { story: 'Múltiplos toasts empilhados. Em produção, com expand={true} todos ficam expandidos.' } } },
};

export const ComCloseButton: Story = {
  name: 'Com Botão de Fechar',
  render: () => {
    injectToastStyles();
    const wrap = document.createElement('div');
    wrap.className = 'p-6 min-h-[100px]';
    wrap.textContent = 'Toast com botão de fechar';

    setTimeout(() => {
      toast.error('Erro crítico', { closeButton: true, position: 'top-right', duration: 999999, richColors: true });
    }, 300);

    return wrap;
  },
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
  render: () => {
    injectToastStyles();
    const wrap = document.createElement('div');
    wrap.className = 'flex gap-3 p-6';

    const createBtn = document.createElement('button');
    createBtn.type = 'button';
    createBtn.className = BTN_DEFAULT;
    createBtn.textContent = 'Criar toast';
    createBtn.addEventListener('click', () => {
      toast('Toast temporário', { closeButton: true, position: 'top-right', duration: 999999 });
    });

    const dismissBtn = document.createElement('button');
    dismissBtn.type = 'button';
    dismissBtn.className = BTN_OUTLINE;
    dismissBtn.textContent = 'Fechar todos';
    dismissBtn.addEventListener('click', () => toast.dismiss());

    wrap.append(createBtn, dismissBtn);
    return wrap;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Criar e fechar todos os toasts', async () => {
      const createBtn = canvas.getByRole('button', { name: 'Criar toast' });
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
  render: () => {
    injectToastStyles();
    const wrap = document.createElement('div');
    wrap.className = 'p-6 min-h-[100px]';
    wrap.textContent = 'Toast com duração de 10 segundos';

    setTimeout(() => {
      toast.info('Este toast dura 10 segundos', { closeButton: true, position: 'top-right', duration: 10000, richColors: true });
    }, 300);

    return wrap;
  },
  parameters: { docs: { description: { story: 'Toast com duração customizada de 10 segundos. Use duração maior para erros críticos.' } } },
};
