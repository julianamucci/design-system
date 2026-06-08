import type { Meta, StoryObj } from '@storybook/vue3';
import { userEvent, within, expect } from 'storybook/test';
import { Checkbox } from './index';

const meta = {
  title: 'UI/Checkbox/Composicoes',
  component: Checkbox,
  tags: ['form'],
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    layout: 'centered',
    docs: {
      description: {
        component:
          'Padrões de composição do Checkbox: com label, com descrição auxiliar, grupo em fieldset e integração em formulário.',
      },
    },
  },
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ComLabel: Story = {
  render: () => ({
    components: { Checkbox },
    setup() { return {}; },
    template: `
      <div class="flex items-center gap-2">
        <Checkbox id="with-label" />
        <label
          for="with-label"
          class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Aceito os termos e condições
        </label>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Checkbox está presente e associado à label', async () => {
      const checkbox = canvas.getByRole('checkbox', { name: 'Aceito os termos e condições' });
      await expect(checkbox).toBeInTheDocument();
    });

    await step('Label está visível no DOM', async () => {
      const label = canvas.getByText('Aceito os termos e condições');
      await expect(label).toBeVisible();
    });

    await step('Checkbox começa desmarcado', async () => {
      const checkbox = canvas.getByRole('checkbox');
      await expect(checkbox).not.toBeChecked();
    });

    await step('Clicar na label marca o checkbox', async () => {
      const label = canvas.getByText('Aceito os termos e condições');
      await userEvent.click(label);
      const checkbox = canvas.getByRole('checkbox');
      await expect(checkbox).toBeChecked();
    });
  },
};

export const ComDescricao: Story = {
  render: () => ({
    components: { Checkbox },
    setup() { return {}; },
    template: `
      <div class="flex items-start gap-2">
        <Checkbox id="with-description" class="mt-0.5" aria-describedby="desc-help" />
        <div class="space-y-1">
          <label
            for="with-description"
            class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Receber novidades por email
          </label>
          <p id="desc-help" class="text-sm text-muted-foreground">
            Enviaremos atualizações mensais sobre o produto.
          </p>
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Checkbox está presente e associado à label', async () => {
      const checkbox = canvas.getByRole('checkbox', { name: 'Receber novidades por email' });
      await expect(checkbox).toBeInTheDocument();
    });

    await step('Texto de descrição auxiliar está visível', async () => {
      const desc = canvas.getByText('Enviaremos atualizações mensais sobre o produto.');
      await expect(desc).toBeVisible();
    });

    await step('Checkbox tem aria-describedby apontando para a descrição', async () => {
      const checkbox = canvas.getByRole('checkbox');
      await expect(checkbox).toHaveAttribute('aria-describedby', 'desc-help');
    });

    await step('Checkbox começa desmarcado', async () => {
      const checkbox = canvas.getByRole('checkbox');
      await expect(checkbox).not.toBeChecked();
    });
  },
};

export const GrupoFieldset: Story = {
  render: () => ({
    components: { Checkbox },
    setup() { return {}; },
    template: `
      <fieldset class="space-y-3 border rounded-lg p-4">
        <legend class="text-sm font-semibold px-1">Preferências de notificação</legend>
        <div class="flex items-center gap-2">
          <Checkbox id="notif-email" />
          <label for="notif-email" class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            Receber novidades por email
          </label>
        </div>
        <div class="flex items-center gap-2">
          <Checkbox id="notif-push" />
          <label for="notif-push" class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            Receber notificações push
          </label>
        </div>
        <div class="flex items-center gap-2">
          <Checkbox id="notif-session" />
          <label for="notif-session" class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            Manter sessão ativa
          </label>
        </div>
      </fieldset>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Fieldset com legend está renderizado', async () => {
      const legend = canvas.getByText('Preferências de notificação');
      await expect(legend).toBeVisible();
    });

    await step('Três checkboxes estão presentes', async () => {
      const checkboxes = canvas.getAllByRole('checkbox');
      await expect(checkboxes).toHaveLength(3);
    });

    await step('Cada checkbox está associado à sua label', async () => {
      await expect(canvas.getByRole('checkbox', { name: 'Receber novidades por email' })).toBeInTheDocument();
      await expect(canvas.getByRole('checkbox', { name: 'Receber notificações push' })).toBeInTheDocument();
      await expect(canvas.getByRole('checkbox', { name: 'Manter sessão ativa' })).toBeInTheDocument();
    });

    await step('Checkboxes começam desmarcados', async () => {
      const checkboxes = canvas.getAllByRole('checkbox');
      for (const checkbox of checkboxes) {
        await expect(checkbox).not.toBeChecked();
      }
    });
  },
};

export const SelecionarTodos: Story = {
  render: () => ({
    components: { Checkbox },
    setup() {
      const { ref, computed } = (window as any).Vue ?? {};
      // Fallback for Storybook environment
      const items = ['Receber novidades por email', 'Receber notificações push', 'Manter sessão ativa'];
      const checked = [false, false, false];
      return { items, checked };
    },
    template: `
      <fieldset class="space-y-3 border rounded-lg p-4">
        <legend class="text-sm font-semibold px-1">Preferências</legend>
        <div class="flex items-center gap-2 pb-2 border-b">
          <Checkbox id="select-all" />
          <label for="select-all" class="text-sm font-semibold leading-none">
            Selecionar todos os itens
          </label>
        </div>
        <div class="flex items-center gap-2">
          <Checkbox id="item-email" />
          <label for="item-email" class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            Receber novidades por email
          </label>
        </div>
        <div class="flex items-center gap-2">
          <Checkbox id="item-push" />
          <label for="item-push" class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            Receber notificações push
          </label>
        </div>
        <div class="flex items-center gap-2">
          <Checkbox id="item-session" />
          <label for="item-session" class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            Manter sessão ativa
          </label>
        </div>
      </fieldset>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Checkbox "Selecionar todos" está presente', async () => {
      const selectAll = canvas.getByRole('checkbox', { name: 'Selecionar todos os itens' });
      await expect(selectAll).toBeInTheDocument();
    });

    await step('Quatro checkboxes estão presentes (1 select-all + 3 itens)', async () => {
      const checkboxes = canvas.getAllByRole('checkbox');
      await expect(checkboxes).toHaveLength(4);
    });

    await step('Todos os checkboxes começam desmarcados', async () => {
      const checkboxes = canvas.getAllByRole('checkbox');
      for (const checkbox of checkboxes) {
        await expect(checkbox).not.toBeChecked();
      }
    });

    await step('Itens individuais estão associados às suas labels', async () => {
      await expect(canvas.getByRole('checkbox', { name: 'Receber novidades por email' })).toBeInTheDocument();
      await expect(canvas.getByRole('checkbox', { name: 'Receber notificações push' })).toBeInTheDocument();
      await expect(canvas.getByRole('checkbox', { name: 'Manter sessão ativa' })).toBeInTheDocument();
    });
  },
};

export const EmFormulario: Story = {
  render: () => ({
    components: { Checkbox },
    setup() { return {}; },
    template: `
      <form class="space-y-4 w-72" @submit.prevent>
        <div class="space-y-2">
          <label class="text-sm font-medium">Nome</label>
          <input
            type="text"
            placeholder="Seu nome"
            class="w-full h-(--height-default) px-3 rounded-md border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <div class="space-y-2">
          <label class="text-sm font-medium">Email</label>
          <input
            type="email"
            placeholder="seu@email.com"
            class="w-full h-(--height-default) px-3 rounded-md border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <div class="flex items-start gap-2">
          <Checkbox id="form-terms" value="accepted" required class="mt-0.5" />
          <div class="space-y-1">
            <label for="form-terms" class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Aceito os termos e condições
            </label>
            <p class="text-xs text-muted-foreground">
              Campo obrigatório para criar a conta.
            </p>
          </div>
        </div>
        <button
          type="submit"
          class="w-full h-(--height-default) px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          Criar conta
        </button>
      </form>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Checkbox de termos está presente no formulário', async () => {
      const checkbox = canvas.getByRole('checkbox', { name: 'Aceito os termos e condições' });
      await expect(checkbox).toBeInTheDocument();
    });

    await step('Checkbox é obrigatório (required)', async () => {
      const checkbox = canvas.getByRole('checkbox');
      await expect(checkbox).toBeRequired();
    });

    await step('Texto auxiliar do campo está visível', async () => {
      const hint = canvas.getByText('Campo obrigatório para criar a conta.');
      await expect(hint).toBeVisible();
    });

    await step('Botão de submit está presente', async () => {
      const button = canvas.getByRole('button', { name: 'Criar conta' });
      await expect(button).toBeInTheDocument();
    });
  },
};
