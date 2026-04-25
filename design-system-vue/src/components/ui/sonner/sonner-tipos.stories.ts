import type { Meta, StoryObj } from '@storybook/vue3';
import { toast } from 'vue-sonner';
import { Toaster } from './index';
import { Button } from '@/components/ui/button';

const meta = {
  title: 'UI/Sonner/Tipos',
  component: Toaster,
  parameters: {
    controls: { disable: true },
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
};
