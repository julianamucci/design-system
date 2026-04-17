import type { Meta, StoryObj } from '@storybook/html';
import { toast, injectToastStyles } from './toast-utils';

type SonnerArgs = {
  richColors: boolean;
  closeButton: boolean;
  toastType: string;
  toastMessage: string;
};

const meta: Meta<SonnerArgs> = {
  title: 'UI/Sonner/Tipos',
  args: {
    richColors: true,
    closeButton: true,
  },
};

export default meta;
type Story = StoryObj<SonnerArgs>;

function renderAutoToast(type: string, message: string, opts: { richColors: boolean; closeButton: boolean }): HTMLElement {
  injectToastStyles();
  const wrap = document.createElement('div');
  wrap.className = 'p-6 min-h-[100px]';
  wrap.textContent = `Toast: ${type}`;

  setTimeout(() => {
    const toastOpts = { richColors: opts.richColors, closeButton: opts.closeButton, position: 'top-right' as const, duration: 999999 };
    if (type === 'default') toast(message, toastOpts);
    else (toast as unknown as Record<string, (msg: string, o: typeof toastOpts) => void>)[type]?.(message, toastOpts);
  }, 300);

  return wrap;
}

export const Default: Story = {
  render: (args) => renderAutoToast('default', 'Notificação padrão', args),
  parameters: { docs: { description: { story: 'Toast padrão sem ícone. Use para feedback geral.' } } },
};

export const Success: Story = {
  render: (args) => renderAutoToast('success', 'Item salvo com sucesso', args),
  parameters: { docs: { description: { story: 'Toast de sucesso com ícone verde. Confirma ações concluídas.' } } },
};

export const Error: Story = {
  render: (args) => renderAutoToast('error', 'Falha ao salvar alterações', args),
  parameters: { docs: { description: { story: 'Toast de erro com ícone vermelho. Combine com duration maior para erros críticos.' } } },
};

export const Warning: Story = {
  render: (args) => renderAutoToast('warning', 'Conexão instável detectada', args),
  parameters: { docs: { description: { story: 'Toast de aviso com ícone amarelo. Situações que requerem atenção.' } } },
};

export const Info: Story = {
  render: (args) => renderAutoToast('info', 'Nova versão disponível', args),
  parameters: { docs: { description: { story: 'Toast informativo com ícone azul. Informações não-críticas.' } } },
};

export const Loading: Story = {
  render: (args) => renderAutoToast('loading', 'Processando dados...', args),
  parameters: { docs: { description: { story: 'Toast de carregamento com spinner. Prefira toast.promise() para async.' } } },
};
