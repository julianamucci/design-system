import type { Meta, StoryObj } from '@storybook/html';
import { toast, injectToastStyles } from './toast-utils';

type SonnerArgs = {
  richColors: boolean;
  closeButton: boolean;
};

const meta: Meta<SonnerArgs> = {
  title: 'UI/Sonner/Composições',
  args: {
    richColors: true,
    closeButton: true,
  },
};

export default meta;
type Story = StoryObj<SonnerArgs>;

const BTN_BASE = 'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all h-9 px-4 py-2';
const BTN_DEFAULT = `${BTN_BASE} bg-primary text-primary-foreground hover:bg-primary/90`;

export const ComAcao: Story = {
  name: 'Com Ação',
  render: (args) => {
    injectToastStyles();
    const wrap = document.createElement('div');
    wrap.className = 'p-6 min-h-[100px]';
    wrap.textContent = 'Toast com ação';

    setTimeout(() => {
      toast('Item excluído', {
        richColors: args.richColors,
        closeButton: args.closeButton,
        position: 'top-right',
        duration: 999999,
        action: { label: 'Desfazer', onClick: () => toast.success('Desfeito!', { position: 'top-right' }) },
      });
    }, 300);

    return wrap;
  },
  parameters: { docs: { description: { story: 'Toast com botão de ação inline. Padrão para ações destrutivas reversíveis.' } } },
};

export const ComDescricao: Story = {
  name: 'Com Descrição',
  render: (args) => {
    injectToastStyles();
    const wrap = document.createElement('div');
    wrap.className = 'p-6 min-h-[100px]';
    wrap.textContent = 'Toast com descrição';

    setTimeout(() => {
      toast.success('Relatório gerado', {
        richColors: args.richColors,
        closeButton: args.closeButton,
        position: 'top-right',
        duration: 999999,
        description: 'O arquivo estará disponível em instantes.',
      });
    }, 300);

    return wrap;
  },
  parameters: { docs: { description: { story: 'Toast com texto de descrição abaixo do título.' } } },
};

export const PromiseStory: Story = {
  name: 'Promise (async)',
  render: (args) => {
    injectToastStyles();
    const wrap = document.createElement('div');
    wrap.className = 'p-6';

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = BTN_DEFAULT;
    btn.textContent = 'Simular Promise';
    btn.addEventListener('click', () => {
      const fakePromise = new Promise<void>((resolve: () => void) => setTimeout(resolve, 2000));
      toast.promise(fakePromise, {
        loading: 'Salvando dados...',
        success: 'Dados salvos!',
        error: 'Falha ao salvar',
      }, { richColors: args.richColors, closeButton: args.closeButton, position: 'top-right' });
    });

    wrap.appendChild(btn);
    return wrap;
  },
  parameters: { docs: { description: { story: 'toast.promise() gerencia loading → success/error automaticamente.' } } },
};

export const RichColors: Story = {
  name: 'Rich Colors',
  render: () => {
    injectToastStyles();
    const wrap = document.createElement('div');
    wrap.className = 'p-6 min-h-[100px]';
    wrap.textContent = 'Toast com rich colors';

    setTimeout(() => {
      toast.success('Sucesso com rich colors', { richColors: true, closeButton: true, position: 'top-right', duration: 999999 });
    }, 300);

    return wrap;
  },
  parameters: { docs: { description: { story: 'Com richColors, cada tipo exibe cores vibrantes e distintas.' } } },
};

export const ComAcaoEDescricao: Story = {
  name: 'Com Ação e Descrição',
  render: (args) => {
    injectToastStyles();
    const wrap = document.createElement('div');
    wrap.className = 'p-6 min-h-[100px]';
    wrap.textContent = 'Toast com ação + descrição';

    setTimeout(() => {
      toast('Arquivo movido para lixeira', {
        richColors: args.richColors,
        closeButton: args.closeButton,
        position: 'top-right',
        duration: 999999,
        description: 'O arquivo será excluído permanentemente em 30 dias.',
        action: { label: 'Desfazer', onClick: () => toast.success('Restaurado!', { position: 'top-right' }) },
      });
    }, 300);

    return wrap;
  },
  parameters: { docs: { description: { story: 'Combinação de descrição e ação no mesmo toast.' } } },
};
