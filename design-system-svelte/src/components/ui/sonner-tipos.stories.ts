import type { Meta, StoryObj } from '@storybook/svelte';
import SonnerStory from './SonnerStory.svelte';

const meta = {
  title: 'UI/Sonner/Tipos',
  component: SonnerStory,
  args: {
    richColors: true,
    position: 'bottom-right',
    closeButton: true,
    mode: 'single',
    autoTrigger: true,
  },
} satisfies Meta<typeof SonnerStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { toastType: 'default', toastMessage: 'Notificação padrão' },
  parameters: { docs: { description: { story: 'Toast padrão sem ícone. Use para feedback geral.' } } },
};

export const Success: Story = {
  args: { toastType: 'success', toastMessage: 'Item salvo com sucesso' },
  parameters: { docs: { description: { story: 'Toast de sucesso com ícone verde. Confirma ações concluídas.' } } },
};

export const Error: Story = {
  args: { toastType: 'error', toastMessage: 'Falha ao salvar alterações' },
  parameters: { docs: { description: { story: 'Toast de erro com ícone vermelho. Combine com duration maior para erros críticos.' } } },
};

export const Warning: Story = {
  args: { toastType: 'warning', toastMessage: 'Conexão instável detectada' },
  parameters: { docs: { description: { story: 'Toast de aviso com ícone amarelo. Situações que requerem atenção.' } } },
};

export const Info: Story = {
  args: { toastType: 'info', toastMessage: 'Nova versão disponível' },
  parameters: { docs: { description: { story: 'Toast informativo com ícone azul. Informações não-críticas.' } } },
};

export const Loading: Story = {
  args: { toastType: 'loading', toastMessage: 'Processando dados...' },
  parameters: { docs: { description: { story: 'Toast de carregamento com spinner. Prefira toast.promise() para async.' } } },
};
