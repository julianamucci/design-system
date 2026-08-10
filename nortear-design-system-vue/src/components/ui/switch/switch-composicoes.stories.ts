import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { within, userEvent, expect } from 'storybook/test';
import { Switch } from './index';
import { Label } from '@/components/ui/label';

const meta = {
  title: 'UI/Switch/Compositions',
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

export const SettingsPanel: Story = {
  render: () => ({
    components: { Switch, Label },
    setup() { return {}; },
    template: `
      <div class="" data-spacing="md" style="width: 24rem">
        <div class="nds-cluster nds-rounded-lg nds-border-default nds-p-4" data-align="center" data-justify="between">
          <div class="" data-spacing="xs">
            <Label :for="'pc-marketing'">Emails de marketing</Label>
            <p class="nds-text-body">
              Receba novidades e promoções da plataforma.
            </p>
          </div>
          <Switch id="pc-marketing" :default-value="true" />
        </div>

        <div class="nds-cluster nds-rounded-lg nds-border-default nds-p-4" data-align="center" data-justify="between">
          <div class="" data-spacing="xs">
            <Label :for="'pc-security'">Alertas de segurança</Label>
            <p class="nds-text-body">
              Notificações sobre acessos suspeitos à sua conta.
            </p>
          </div>
          <Switch id="pc-security" :default-value="true" />
        </div>

        <div class="nds-cluster nds-rounded-lg nds-border-default nds-p-4" data-align="center" data-justify="between">
          <div class="" data-spacing="xs">
            <Label :for="'pc-news'">Resumo semanal</Label>
            <p class="nds-text-body">
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
      <ul class="divide-y nds-rounded-lg nds-border-default" style="width: 20rem">
        <li class="nds-cluster nds-p-4" data-align="center" data-justify="between">
          <Label :for="'lp-push'">Notificações push</Label>
          <Switch id="lp-push" :default-value="true" />
        </li>
        <li class="nds-cluster nds-p-4" data-align="center" data-justify="between">
          <Label :for="'lp-email'">Notificações por email</Label>
          <Switch id="lp-email" />
        </li>
        <li class="nds-cluster nds-p-4" data-align="center" data-justify="between">
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

export const InForm: Story = {
  render: () => ({
    components: { Switch, Label },
    setup() { return {}; },
    template: `
      <form class="" data-spacing="md" style="width: 24rem" @submit.prevent>
        <div class="nds-stack" data-spacing="sm">
          <label for="form-email" class="nds-text-body nds-font-medium">Email</label>
          <input
            id="form-email"
            type="email"
            placeholder="seu@email.com"
            class="nds-w-full nds-rounded-md nds-border-default nds-border-default nds-bg-background nds-text-body nds-focus-ring" style="height: var(--height-default); padding-inline: 0.75rem" 
          />
        </div>

        <div class="nds-cluster nds-rounded-lg nds-border-default nds-p-4" data-align="center" data-justify="between">
          <div class="" data-spacing="xs">
            <Label :for="'form-public'">Perfil público</Label>
            <p class="nds-text-body">
              Qualquer pessoa pode visualizar seu perfil.
            </p>
          </div>
          <Switch id="form-public" name="public" />
        </div>

        <button
          type="submit"
          class="nds-w-full nds-px-4 nds-rounded-md nds-bg-primary text-primary-foreground nds-text-body nds-font-medium nds-hover-bg-primary-90 transition-colors" style="height: var(--height-default)"
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
      <div class="nds-rounded-md nds-border-default nds-p-2" data-spacing="xs" style="width: 16rem">
        <div class="nds-cluster nds-rounded nds-px-2 nds-hover-bg-muted-40" data-align="center" data-justify="between" style="padding-block: 0.375rem">
          <Label :for="'menu-darkmode'" class="nds-text-caption">Modo escuro</Label>
          <Switch id="menu-darkmode" size="sm" />
        </div>
        <div class="nds-cluster nds-rounded nds-px-2 nds-hover-bg-muted-40" data-align="center" data-justify="between" style="padding-block: 0.375rem">
          <Label :for="'menu-autosave'" class="nds-text-caption">Salvar automaticamente</Label>
          <Switch id="menu-autosave" size="sm" :default-value="true" />
        </div>
        <div class="nds-cluster nds-rounded nds-px-2 nds-hover-bg-muted-40" data-align="center" data-justify="between" style="padding-block: 0.375rem">
          <Label :for="'menu-compact'" class="nds-text-caption">Visualização compacta</Label>
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
