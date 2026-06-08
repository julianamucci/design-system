import type { Meta, StoryObj } from '@storybook/vue3';
import { userEvent, within, expect } from 'storybook/test';
import { Switch } from './index';
import { Label } from '@/components/ui/label';

const meta = {
  title: 'UI/Switch/Composicoes',
  component: Switch,
  tags: ['form'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          'Padrões de composição do Switch: painel de configurações, lista de preferências, em formulário e item de menu compacto.',
      },
    },
  },
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const PainelConfiguracoes: Story = {
  render: () => ({
    components: { Switch, Label },
    setup() { return {}; },
    template: `
      <div class="space-y-4 w-96">
        <div class="flex items-center justify-between rounded-lg border p-4">
          <div class="space-y-0.5">
            <Label :for="'pc-marketing'">Emails de marketing</Label>
            <p class="text-sm text-muted-foreground">
              Receba novidades e promoções da plataforma.
            </p>
          </div>
          <Switch id="pc-marketing" :default-value="true" />
        </div>

        <div class="flex items-center justify-between rounded-lg border p-4">
          <div class="space-y-0.5">
            <Label :for="'pc-security'">Alertas de segurança</Label>
            <p class="text-sm text-muted-foreground">
              Notificações sobre acessos suspeitos à sua conta.
            </p>
          </div>
          <Switch id="pc-security" :default-value="true" />
        </div>

        <div class="flex items-center justify-between rounded-lg border p-4">
          <div class="space-y-0.5">
            <Label :for="'pc-news'">Resumo semanal</Label>
            <p class="text-sm text-muted-foreground">
              Receba um resumo das principais novidades toda segunda.
            </p>
          </div>
          <Switch id="pc-news" />
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const switches = canvas.getAllByRole('switch');
    await step('3 switches renderizados', async () => {
      await expect(switches).toHaveLength(3);
    });
    await step('Dois switches iniciam ativos', async () => {
      await expect(switches[0]).toHaveAttribute('aria-checked', 'true');
      await expect(switches[1]).toHaveAttribute('aria-checked', 'true');
      await expect(switches[2]).toHaveAttribute('aria-checked', 'false');
    });
  },
};

export const ListaDePreferencias: Story = {
  render: () => ({
    components: { Switch, Label },
    setup() { return {}; },
    template: `
      <ul class="divide-y rounded-lg border w-80">
        <li class="flex items-center justify-between p-4">
          <Label :for="'lp-push'">Notificações push</Label>
          <Switch id="lp-push" :default-value="true" />
        </li>
        <li class="flex items-center justify-between p-4">
          <Label :for="'lp-email'">Notificações por email</Label>
          <Switch id="lp-email" />
        </li>
        <li class="flex items-center justify-between p-4">
          <Label :for="'lp-sms'">SMS</Label>
          <Switch id="lp-sms" />
        </li>
      </ul>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Clicar no Label alterna o Switch correspondente', async () => {
      await userEvent.click(canvas.getByText('Notificações por email'));
      const email = canvas.getByRole('switch', { name: /Notificações por email/i });
      await expect(email).toHaveAttribute('aria-checked', 'true');
    });
  },
};

export const EmFormulario: Story = {
  render: () => ({
    components: { Switch, Label },
    setup() { return {}; },
    template: `
      <form class="space-y-4 w-96" @submit.prevent>
        <div class="space-y-2">
          <label for="form-email" class="text-sm font-medium">Email</label>
          <input
            id="form-email"
            type="email"
            placeholder="seu@email.com"
            class="w-full h-(--height-default) px-3 rounded-md border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        <div class="flex items-center justify-between rounded-lg border p-4">
          <div class="space-y-0.5">
            <Label :for="'form-public'">Perfil público</Label>
            <p class="text-sm text-muted-foreground">
              Qualquer pessoa pode visualizar seu perfil.
            </p>
          </div>
          <Switch id="form-public" name="public" />
        </div>

        <button
          type="submit"
          class="w-full h-(--height-default) px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          Salvar preferências
        </button>
      </form>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Form possui campo de email e Switch', async () => {
      await expect(canvas.getByLabelText(/Email/i)).toBeInTheDocument();
      await expect(canvas.getByRole('switch')).toBeInTheDocument();
    });
    await step('Botão de submit presente', async () => {
      await expect(canvas.getByRole('button', { name: 'Salvar preferências' })).toBeInTheDocument();
    });
  },
};

export const ItemDeMenuCompacto: Story = {
  render: () => ({
    components: { Switch, Label },
    setup() { return {}; },
    template: `
      <div class="rounded-md border p-2 w-64 space-y-1">
        <div class="flex items-center justify-between rounded px-2 py-1.5 hover:bg-muted/40">
          <Label :for="'menu-darkmode'" class="text-xs">Modo escuro</Label>
          <Switch id="menu-darkmode" size="sm" />
        </div>
        <div class="flex items-center justify-between rounded px-2 py-1.5 hover:bg-muted/40">
          <Label :for="'menu-autosave'" class="text-xs">Salvar automaticamente</Label>
          <Switch id="menu-autosave" size="sm" :default-value="true" />
        </div>
        <div class="flex items-center justify-between rounded px-2 py-1.5 hover:bg-muted/40">
          <Label :for="'menu-compact'" class="text-xs">Visualização compacta</Label>
          <Switch id="menu-compact" size="sm" />
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const switches = canvas.getAllByRole('switch');
    await step('Todos os switches são size=sm', async () => {
      for (const s of switches) await expect(s).toHaveAttribute('data-size', 'sm');
    });
    await step('Renderiza 3 itens de menu', async () => {
      await expect(switches).toHaveLength(3);
    });
  },
};
