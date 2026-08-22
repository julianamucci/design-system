import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { within, expect } from 'storybook/test';
import { Switch } from './index';
import { definir } from './switch.fixtures';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  switchEmFormularioSource,
  switchItemDeMenuSource,
  switchListaDePreferenciasSource,
  switchPainelDeConfiguracoesSource,
} from './switch.source';

const meta = {
  title: 'UI/Switch/Compositions',
  component: Switch,
  tags: ['form'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: switchPainelDeConfiguracoesSource },
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
      <div class="nds-stack nds-w-md" data-spacing="sm">
        <div class="nds-cluster nds-rounded-lg nds-border-default nds-p-4" data-align="center" data-justify="between">
          <div class="nds-stack" data-spacing="xs">
            <Label :for="'pc-marketing'">Emails de marketing</Label>
            <p class="nds-text-body">
              Receba novidades e promoções da plataforma.
            </p>
          </div>
          <Switch id="pc-marketing" :default-value="true" />
        </div>

        <div class="nds-cluster nds-rounded-lg nds-border-default nds-p-4" data-align="center" data-justify="between">
          <div class="nds-stack" data-spacing="xs">
            <Label :for="'pc-security'">Alertas de segurança</Label>
            <p class="nds-text-body">
              Notificações sobre acessos suspeitos à sua conta.
            </p>
          </div>
          <Switch id="pc-security" :default-value="true" />
        </div>

        <div class="nds-cluster nds-rounded-lg nds-border-default nds-p-4" data-align="center" data-justify="between">
          <div class="nds-stack" data-spacing="xs">
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

    await step('Três controles independentes no painel', async () => {
      await expect(switches).toHaveLength(3);
    });

    await step('Cada linha nasce no seu próprio estado', async () => {
      await expect(switches[0]).toHaveAttribute('aria-checked', 'true');
      await expect(switches[1]).toHaveAttribute('aria-checked', 'true');
      await expect(switches[2]).toHaveAttribute('aria-checked', 'false');
    });
  },
};

export const PreferenceList: Story = {
  parameters: {
    docs: {
      // Três preferências relacionadas são uma lista de verdade: `ul`/`li` em
      // vez das `div` empilhadas do painel, e sem texto de apoio.
      source: { transform: switchListaDePreferenciasSource },
    },
  },
  render: () => ({
    components: { Switch, Label },
    setup() { return {}; },
    template: `
      <ul class="nds-w-sm nds-rounded-lg nds-border-default">
        <li class="nds-cluster nds-p-4" data-align="center" data-justify="between">
          <Label :for="'lp-push'">Notificações push</Label>
          <Switch id="lp-push" :default-value="true" />
        </li>
        <li class="nds-cluster nds-p-4 nds-border-t" data-align="center" data-justify="between">
          <Label :for="'lp-email'">Notificações por email</Label>
          <Switch id="lp-email" />
        </li>
        <li class="nds-cluster nds-p-4 nds-border-t" data-align="center" data-justify="between">
          <Label :for="'lp-sms'">SMS</Label>
          <Switch id="lp-sms" />
        </li>
      </ul>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const email = canvas.getByRole('switch', { name: /Notificações por email/i });
    const rotulo = canvas.getByText('Notificações por email');

    await step('A lista tem três controles, cada um no seu estado', async () => {
      const switches = canvas.getAllByRole('switch');
      await expect(switches).toHaveLength(3);
      const ligados = switches.filter((s) => s.getAttribute('aria-checked') === 'true');
      await expect(ligados).toHaveLength(1);
    });

    await step('Clicar no rótulo alterna só o controle daquela linha', async () => {
      const push = canvas.getByRole('switch', { name: /Notificações push/i });
      const antesPush = push.getAttribute('aria-checked');
      await definir(email, true, rotulo);
      await expect(push.getAttribute('aria-checked')).toBe(antesPush);
      await definir(email, false, rotulo);
    });
  },
};

export const InForm: Story = {
  parameters: {
    docs: {
      // O `form` traz outros dois componentes e o `name`, que é o que faz o
      // switch entrar no envio nativo — nada disso está no painel do meta.
      source: { transform: switchEmFormularioSource },
    },
  },
  render: () => ({
    components: { Switch, Label, Input, Button },
    setup() { return {}; },
    template: `
      <form class="nds-stack nds-w-md" data-spacing="sm" @submit.prevent>
        <div class="nds-stack" data-spacing="sm">
          <Label :for="'form-email'">Email</Label>
          <Input id="form-email" type="email" placeholder="seu@email.com" />
        </div>

        <div class="nds-cluster nds-rounded-lg nds-border-default nds-p-4" data-align="center" data-justify="between">
          <div class="nds-stack" data-spacing="xs">
            <Label :for="'form-public'">Perfil público</Label>
            <p class="nds-text-body">
              Qualquer pessoa pode visualizar seu perfil.
            </p>
          </div>
          <Switch id="form-public" name="public" />
        </div>

        <Button type="submit">Salvar preferências</Button>
      </form>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('O formulário reúne campo de texto, switch e envio', async () => {
      await expect(canvas.getByLabelText(/Email/i)).toBeInTheDocument();
      await expect(canvas.getByRole('switch', { name: /Perfil público/i })).toBeInTheDocument();
      await expect(canvas.getByRole('button', { name: 'Salvar preferências' })).toBeInTheDocument();
    });

    await step('O switch entra no envio nativo pelo nome do campo', async () => {
      const sw = canvas.getByRole('switch', { name: /Perfil público/i });
      await definir(sw, true);
      const campo = canvasElement.querySelector<HTMLInputElement>('input[name="public"]');
      await expect(campo).not.toBeNull();
      await expect(campo!.checked).toBe(true);
      await definir(sw, false);
    });
  },
};

export const CompactMenuItem: Story = {
  parameters: {
    docs: {
      // Degrau `sm` em todas as linhas, sem texto de apoio e com o rótulo na
      // escala de legenda: outra densidade, outra composição.
      source: { transform: switchItemDeMenuSource },
    },
  },
  render: () => ({
    components: { Switch, Label },
    setup() { return {}; },
    template: `
      <div class="nds-stack nds-w-xs nds-rounded-md nds-border-default nds-p-2" data-spacing="xs">
        <div class="nds-cluster nds-rounded nds-px-2 nds-py-1 nds-hover-bg-muted-40" data-align="center" data-justify="between">
          <Label :for="'menu-darkmode'" class="nds-text-caption">Modo escuro</Label>
          <Switch id="menu-darkmode" size="sm" />
        </div>
        <div class="nds-cluster nds-rounded nds-px-2 nds-py-1 nds-hover-bg-muted-40" data-align="center" data-justify="between">
          <Label :for="'menu-autosave'" class="nds-text-caption">Salvar automaticamente</Label>
          <Switch id="menu-autosave" size="sm" :default-value="true" />
        </div>
        <div class="nds-cluster nds-rounded nds-px-2 nds-py-1 nds-hover-bg-muted-40" data-align="center" data-justify="between">
          <Label :for="'menu-compact'" class="nds-text-caption">Visualização compacta</Label>
          <Switch id="menu-compact" size="sm" />
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const switches = canvas.getAllByRole('switch');

    await step('O menu tem três itens, todos no degrau compacto', async () => {
      await expect(switches).toHaveLength(3);
      for (const s of switches) await expect(s).toHaveAttribute('data-size', 'sm');
    });
  },
};
