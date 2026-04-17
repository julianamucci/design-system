import type { Meta, StoryObj } from '@storybook/svelte';
import SonnerStory from './SonnerStory.svelte';

const meta = {
  title: 'UI/Sonner/Posições',
  component: SonnerStory,
  args: {
    richColors: false,
    closeButton: true,
    mode: 'single',
    autoTrigger: true,
    toastType: 'default',
  },
} satisfies Meta<typeof SonnerStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TopRight: Story = {
  args: { position: 'top-right', toastMessage: 'Posição: top-right' },
  parameters: { docs: { description: { story: 'Posição padrão para desktop.' } } },
};

export const TopCenter: Story = {
  args: { position: 'top-center', toastMessage: 'Posição: top-center' },
  parameters: { docs: { description: { story: 'Centralizado no topo. Apps com foco central.' } } },
};

export const TopLeft: Story = {
  args: { position: 'top-left', toastMessage: 'Posição: top-left' },
  parameters: { docs: { description: { story: 'Topo esquerdo. Layouts RTL ou sidebar à direita.' } } },
};

export const BottomRight: Story = {
  args: { position: 'bottom-right', toastMessage: 'Posição: bottom-right' },
  parameters: { docs: { description: { story: 'Inferior direito. Formulários e ações na parte inferior.' } } },
};

export const BottomCenter: Story = {
  args: { position: 'bottom-center', toastMessage: 'Posição: bottom-center' },
  parameters: { docs: { description: { story: 'Centralizado embaixo. Apps mobile-first.' } } },
};

export const BottomLeft: Story = {
  args: { position: 'bottom-left', toastMessage: 'Posição: bottom-left' },
  parameters: { docs: { description: { story: 'Inferior esquerdo. Layouts com sidebar à direita.' } } },
};
