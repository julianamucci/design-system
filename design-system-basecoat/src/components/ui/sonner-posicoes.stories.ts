import type { Meta, StoryObj } from '@storybook/html';
import { toast, injectToastStyles } from './toast-utils';

type SonnerArgs = {
  position: string;
  toastMessage: string;
};

const meta: Meta<SonnerArgs> = {
  title: 'UI/Sonner/Posições',
  args: {
    toastMessage: 'Notificação',
  },
};

export default meta;
type Story = StoryObj<SonnerArgs>;

function renderPositionToast(position: string, message: string): HTMLElement {
  injectToastStyles();
  const wrap = document.createElement('div');
  wrap.className = 'p-6 min-h-[100px]';
  wrap.textContent = `Posição: ${position}`;

  setTimeout(() => {
    toast(message, { position: position as 'bottom-right', closeButton: true, duration: 999999 });
  }, 300);

  return wrap;
}

export const TopRight: Story = {
  render: () => renderPositionToast('top-right', 'Posição: top-right'),
  parameters: { docs: { description: { story: 'Posição padrão para desktop.' } } },
};

export const TopCenter: Story = {
  render: () => renderPositionToast('top-center', 'Posição: top-center'),
  parameters: { docs: { description: { story: 'Centralizado no topo. Apps com foco central.' } } },
};

export const TopLeft: Story = {
  render: () => renderPositionToast('top-left', 'Posição: top-left'),
  parameters: { docs: { description: { story: 'Topo esquerdo. Layouts RTL ou sidebar à direita.' } } },
};

export const BottomRight: Story = {
  render: () => renderPositionToast('bottom-right', 'Posição: bottom-right'),
  parameters: { docs: { description: { story: 'Inferior direito. Formulários e ações na parte inferior.' } } },
};

export const BottomCenter: Story = {
  render: () => renderPositionToast('bottom-center', 'Posição: bottom-center'),
  parameters: { docs: { description: { story: 'Centralizado embaixo. Apps mobile-first.' } } },
};

export const BottomLeft: Story = {
  render: () => renderPositionToast('bottom-left', 'Posição: bottom-left'),
  parameters: { docs: { description: { story: 'Inferior esquerdo. Layouts com sidebar à direita.' } } },
};
