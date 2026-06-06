import type { Meta, StoryObj } from '@storybook/vue3';
import { expect } from 'storybook/test';
import { toast } from 'vue-sonner';
import { Toaster } from './index';
import { Button } from '@/components/ui/button';

const meta = {
  title: 'UI/Sonner/Tipos',
  component: Toaster,
  tags: ['feedback'],
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
  },
} satisfies Meta<typeof Toaster>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    components: { Toaster, Button },
    setup() {
      function fire() { toast('Código copiado.'); }
      return { fire };
    },
    template: `
      <div style="contain: layout; position: relative; min-height: 100px;">
        <Toaster position="top-right" rich-colors />
        <Button variant="outline" size="sm" @click="fire">Disparar default</Button>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.firstElementChild).toBeTruthy();
  },
};

export const Success: Story = {
  render: () => ({
    components: { Toaster, Button },
    setup() {
      function fire() { toast.success('Alterações salvas.'); }
      return { fire };
    },
    template: `
      <div style="contain: layout; position: relative; min-height: 100px;">
        <Toaster position="top-right" rich-colors />
        <Button variant="outline" size="sm" @click="fire">Disparar success</Button>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.firstElementChild).toBeTruthy();
  },
};

export const Error: Story = {
  render: () => ({
    components: { Toaster, Button },
    setup() {
      function fire() { toast.error('Não foi possível salvar. Tente novamente.'); }
      return { fire };
    },
    template: `
      <div style="contain: layout; position: relative; min-height: 100px;">
        <Toaster position="top-right" rich-colors />
        <Button variant="outline" size="sm" @click="fire">Disparar error</Button>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.firstElementChild).toBeTruthy();
  },
};

export const Warning: Story = {
  render: () => ({
    components: { Toaster, Button },
    setup() {
      function fire() { toast.warning('Sua sessão expira em 5 minutos.'); }
      return { fire };
    },
    template: `
      <div style="contain: layout; position: relative; min-height: 100px;">
        <Toaster position="top-right" rich-colors />
        <Button variant="outline" size="sm" @click="fire">Disparar warning</Button>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.firstElementChild).toBeTruthy();
  },
};

export const Info: Story = {
  render: () => ({
    components: { Toaster, Button },
    setup() {
      function fire() { toast.info('Nova versão disponível.'); }
      return { fire };
    },
    template: `
      <div style="contain: layout; position: relative; min-height: 100px;">
        <Toaster position="top-right" rich-colors />
        <Button variant="outline" size="sm" @click="fire">Disparar info</Button>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.firstElementChild).toBeTruthy();
  },
};

export const Loading: Story = {
  render: () => ({
    components: { Toaster, Button },
    setup() {
      function fire() { toast.loading('Enviando arquivo...'); }
      return { fire };
    },
    template: `
      <div style="contain: layout; position: relative; min-height: 100px;">
        <Toaster position="top-right" rich-colors />
        <Button variant="outline" size="sm" @click="fire">Disparar loading</Button>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.firstElementChild).toBeTruthy();
  },
};
