import type { Meta, StoryObj } from '@storybook/vue3';
import { userEvent, within, expect } from 'storybook/test';
import { toast } from 'vue-sonner';
import { Toaster } from './index';
import { Button } from '@/components/ui/button';

const meta = {
  title: 'UI/Sonner/Composicoes',
  component: Toaster,
  tags: ['feedback'],
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
  },
} satisfies Meta<typeof Toaster>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithDescription: Story = {
  render: () => ({
    components: { Toaster, Button },
    setup() {
      function fire() {
        toast.success('Preferências atualizadas.', {
          description: 'Suas configurações foram salvas e entrarão em vigor na próxima sessão.',
        });
      }
      return { fire };
    },
    template: `
      <div style="contain: layout; position: relative; min-height: 100px;">
        <Toaster position="top-right" rich-colors />
        <Button variant="outline" size="sm" @click="fire">Com descrição</Button>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Botão "Com descrição" está presente', async () => {
      await expect(canvas.getByRole('button', { name: /Com descrição/i })).toBeInTheDocument();
    });
    await step('Clicar dispara o toast', async () => {
      await userEvent.click(canvas.getByRole('button', { name: /Com descrição/i }));
    });
  },
};

export const WithAction: Story = {
  render: () => ({
    components: { Toaster, Button },
    setup() {
      function fire() {
        toast('Item excluído.', {
          action: {
            label: 'Desfazer',
            onClick: () => toast.success('Ação desfeita.'),
          },
        });
      }
      return { fire };
    },
    template: `
      <div style="contain: layout; position: relative; min-height: 100px;">
        <Toaster position="top-right" rich-colors />
        <Button variant="outline" size="sm" @click="fire">Com ação</Button>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Botão "Com ação" está presente', async () => {
      await expect(canvas.getByRole('button', { name: /Com ação/i })).toBeInTheDocument();
    });
    await step('Clicar dispara o toast com ação', async () => {
      await userEvent.click(canvas.getByRole('button', { name: /Com ação/i }));
    });
  },
};

export const WithPromise: Story = {
  render: () => ({
    components: { Toaster, Button },
    setup() {
      function fire() {
        const promise = new Promise<void>((resolve) => setTimeout(resolve, 2000));
        toast.promise(promise, {
          loading: 'Enviando arquivo...',
          success: 'Arquivo enviado com sucesso.',
          error: 'Erro ao enviar. Tente novamente.',
        });
      }
      return { fire };
    },
    template: `
      <div style="contain: layout; position: relative; min-height: 100px;">
        <Toaster position="top-right" rich-colors />
        <Button variant="outline" size="sm" @click="fire">Com promise</Button>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Botão "Com promise" está presente', async () => {
      await expect(canvas.getByRole('button', { name: /Com promise/i })).toBeInTheDocument();
    });
    await step('Clicar dispara o toast promise', async () => {
      await userEvent.click(canvas.getByRole('button', { name: /Com promise/i }));
    });
  },
};

export const Persistent: Story = {
  render: () => ({
    components: { Toaster, Button },
    setup() {
      function fire() {
        toast.error('Falha crítica no servidor.', {
          duration: Infinity,
          dismissible: true,
        });
      }
      return { fire };
    },
    template: `
      <div style="contain: layout; position: relative; min-height: 100px;">
        <Toaster position="top-right" rich-colors />
        <Button variant="outline" size="sm" @click="fire">Persistente</Button>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Botão "Persistente" está presente', async () => {
      await expect(canvas.getByRole('button', { name: /Persistente/i })).toBeInTheDocument();
    });
    await step('Clicar dispara o toast persistente', async () => {
      await userEvent.click(canvas.getByRole('button', { name: /Persistente/i }));
    });
  },
};
