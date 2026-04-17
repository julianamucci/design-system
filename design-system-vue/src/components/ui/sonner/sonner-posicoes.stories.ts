import type { Meta, StoryObj } from '@storybook/vue3';
import { Toaster } from './index';
import { Button } from '../button';
import { toast } from 'vue-sonner';
import { onMounted } from 'vue';

const meta = {
  title: 'UI/Sonner/Posições',
  component: Toaster,
  args: {
    richColors: false,
    closeButton: true,
  },
} satisfies Meta<typeof Toaster>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TopRight: Story = {
  args: { position: 'top-right' },
  render: (args) => ({
    components: { Toaster, Button },
    setup() {
      onMounted(() => setTimeout(() => toast('Posição: top-right (padrão)'), 300));
      return { args, trigger: () => toast('Posição: top-right') };
    },
    template: `
      <div style="min-height: 400px; display: flex; align-items: center; justify-content: center;">
        <Toaster v-bind="args" />
        <Button @click="trigger">Top Right</Button>
      </div>
    `,
  }),
  parameters: { docs: { description: { story: 'Posição padrão, recomendada para a maioria das aplicações desktop.' } } },
};

export const TopCenter: Story = {
  args: { position: 'top-center' },
  render: (args) => ({
    components: { Toaster, Button },
    setup() {
      onMounted(() => setTimeout(() => toast('Posição: top-center'), 300));
      return { args, trigger: () => toast('Posição: top-center') };
    },
    template: `
      <div style="min-height: 400px; display: flex; align-items: center; justify-content: center;">
        <Toaster v-bind="args" />
        <Button @click="trigger">Top Center</Button>
      </div>
    `,
  }),
  parameters: { docs: { description: { story: 'Centralizado no topo. Ideal para aplicações com foco central.' } } },
};

export const TopLeft: Story = {
  args: { position: 'top-left' },
  render: (args) => ({
    components: { Toaster, Button },
    setup() {
      onMounted(() => setTimeout(() => toast('Posição: top-left'), 300));
      return { args, trigger: () => toast('Posição: top-left') };
    },
    template: `
      <div style="min-height: 400px; display: flex; align-items: center; justify-content: center;">
        <Toaster v-bind="args" />
        <Button @click="trigger">Top Left</Button>
      </div>
    `,
  }),
  parameters: { docs: { description: { story: 'Alinhado ao topo esquerdo. Use em layouts RTL ou sidebar à direita.' } } },
};

export const BottomRight: Story = {
  args: { position: 'bottom-right' },
  render: (args) => ({
    components: { Toaster, Button },
    setup() {
      onMounted(() => setTimeout(() => toast('Posição: bottom-right'), 300));
      return { args, trigger: () => toast('Posição: bottom-right') };
    },
    template: `
      <div style="min-height: 400px; display: flex; align-items: center; justify-content: center;">
        <Toaster v-bind="args" />
        <Button @click="trigger">Bottom Right</Button>
      </div>
    `,
  }),
  parameters: { docs: { description: { story: 'Inferior direito. Bom para formulários e ações na parte inferior.' } } },
};

export const BottomCenter: Story = {
  args: { position: 'bottom-center' },
  render: (args) => ({
    components: { Toaster, Button },
    setup() {
      onMounted(() => setTimeout(() => toast('Posição: bottom-center'), 300));
      return { args, trigger: () => toast('Posição: bottom-center') };
    },
    template: `
      <div style="min-height: 400px; display: flex; align-items: center; justify-content: center;">
        <Toaster v-bind="args" />
        <Button @click="trigger">Bottom Center</Button>
      </div>
    `,
  }),
  parameters: { docs: { description: { story: 'Centralizado na parte inferior. Recomendado para apps mobile-first.' } } },
};

export const BottomLeft: Story = {
  args: { position: 'bottom-left' },
  render: (args) => ({
    components: { Toaster, Button },
    setup() {
      onMounted(() => setTimeout(() => toast('Posição: bottom-left'), 300));
      return { args, trigger: () => toast('Posição: bottom-left') };
    },
    template: `
      <div style="min-height: 400px; display: flex; align-items: center; justify-content: center;">
        <Toaster v-bind="args" />
        <Button @click="trigger">Bottom Left</Button>
      </div>
    `,
  }),
  parameters: { docs: { description: { story: 'Inferior esquerdo. Use em layouts com sidebar à direita.' } } },
};
