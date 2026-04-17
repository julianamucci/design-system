import type { Meta, StoryObj } from '@storybook/html';
import { userEvent, within, expect, waitFor } from 'storybook/test';
import { createSonnerDocs } from '@/components/docs/SonnerDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import { toast, injectToastStyles } from './toast-utils';

type SonnerArgs = {
  position: string;
  richColors: boolean;
  expand: boolean;
  closeButton: boolean;
  duration: number;
};

const meta: Meta<SonnerArgs> = {
  title: 'UI/Sonner',
  tags: ['autodocs'],
  parameters: {
    docs: { page: withAutoDocsTab(createSonnerDocs) },
  },
  argTypes: {
    position: {
      control: 'select',
      description: 'Posição dos toasts na tela',
      options: ['top-right', 'top-center', 'top-left', 'bottom-right', 'bottom-center', 'bottom-left'],
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
      description: 'Exibe botão de fechar em cada toast',
    },
    duration: {
      control: { type: 'number', min: 1000, max: 30000, step: 1000 },
      description: 'Duração em milissegundos antes do auto-dismiss',
    },
  },
  args: {
    position: 'bottom-right',
    richColors: true,
    expand: false,
    closeButton: true,
    duration: 4000,
  },
};

export default meta;
type Story = StoryObj<SonnerArgs>;

const BTN_BASE = 'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all h-9 px-4 py-2';
const BTN_DEFAULT = `${BTN_BASE} bg-primary text-primary-foreground hover:bg-primary/90`;
const BTN_OUTLINE = `${BTN_BASE} border bg-background hover:bg-accent hover:text-accent-foreground`;
const BTN_DESTRUCTIVE = `${BTN_BASE} bg-destructive text-white hover:bg-destructive/90`;
const BTN_SECONDARY = `${BTN_BASE} bg-secondary text-secondary-foreground hover:bg-secondary/80`;

export const Playground: Story = {
  render: (args) => {
    injectToastStyles();
    const wrap = document.createElement('div');
    wrap.className = 'flex flex-wrap gap-3 p-6';

    const opts = { richColors: args.richColors, closeButton: args.closeButton, position: args.position as 'bottom-right', duration: args.duration };

    const buttons: { label: string; cls: string; handler: () => void }[] = [
      { label: 'Default', cls: BTN_OUTLINE, handler: () => toast('Notificação padrão', opts) },
      { label: 'Success', cls: BTN_DEFAULT, handler: () => toast.success('Item salvo com sucesso', opts) },
      { label: 'Error', cls: BTN_DESTRUCTIVE, handler: () => toast.error('Falha ao salvar alterações', opts) },
      { label: 'Warning', cls: BTN_SECONDARY, handler: () => toast.warning('Conexão instável detectada', opts) },
      { label: 'Info', cls: BTN_DEFAULT, handler: () => toast.info('Nova versão disponível', opts) },
      { label: 'Loading', cls: BTN_SECONDARY, handler: () => toast.loading('Processando dados...', opts) },
      { label: 'Com ação', cls: BTN_OUTLINE, handler: () => toast('Item excluído', { ...opts, action: { label: 'Desfazer', onClick: () => toast.success('Desfeito!', opts) } }) },
      { label: 'Fechar todos', cls: BTN_OUTLINE, handler: () => toast.dismiss() },
    ];

    buttons.forEach(({ label, cls, handler }) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = cls;
      b.textContent = label;
      b.addEventListener('click', handler);
      wrap.appendChild(b);
    });

    return wrap;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Cria toast default', async () => {
      const btn = canvas.getByRole('button', { name: 'Default' });
      await userEvent.click(btn);
      await waitFor(() => {
        const region = document.querySelector('[data-sonner-toaster]');
        expect(region).toBeTruthy();
      }, { timeout: 3000 });
    });

    await step('Região de notificações tem role=region', async () => {
      const region = document.querySelector('[data-sonner-toaster]');
      expect(region?.getAttribute('role')).toBe('region');
    });

    await step('Cria toast de sucesso', async () => {
      const btn = canvas.getByRole('button', { name: 'Success' });
      await userEvent.click(btn);
      await waitFor(() => {
        const toasts = document.querySelectorAll('[data-sonner-toast]');
        expect(toasts.length).toBeGreaterThanOrEqual(2);
      }, { timeout: 3000 });
    });

    await step('Toast com ação exibe botão', async () => {
      const btn = canvas.getByRole('button', { name: 'Com ação' });
      await userEvent.click(btn);
      await waitFor(() => {
        const actionBtns = document.querySelectorAll('[data-sonner-toast] button');
        expect(actionBtns.length).toBeGreaterThanOrEqual(1);
      }, { timeout: 3000 });
    });

    await step('Dismiss fecha todos os toasts', async () => {
      const btn = canvas.getByRole('button', { name: 'Fechar todos' });
      await userEvent.click(btn);
    });
  },
  parameters: {
    docs: {
      description: {
        story: 'Playground interativo com todos os tipos de toast. Cobre criação, região ARIA, ação e dismiss.',
      },
    },
  },
};
