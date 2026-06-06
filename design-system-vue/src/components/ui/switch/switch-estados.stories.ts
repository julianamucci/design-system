import type { Meta, StoryObj } from '@storybook/vue3';
import { userEvent, within, expect } from 'storybook/test';
import { Switch } from './index';
import { Label } from '@/components/ui/label';

const meta = {
  title: 'UI/Switch/Estados',
  component: Switch,
  tags: ['form'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          'Estados do Switch: unchecked, checked, focus, disabled e invalid (aria-invalid).',
      },
    },
  },
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Unchecked: Story = {
  render: () => ({
    components: { Switch, Label },
    setup() { return {}; },
    template: `
      <div class="flex items-center space-x-2">
        <Switch id="est-unchecked" />
        <Label :for="'est-unchecked'">Receber notificações</Label>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const sw = canvas.getByRole('switch');
    await step('aria-checked=false por padrão', async () => {
      await expect(sw).toHaveAttribute('aria-checked', 'false');
    });
  },
};

export const Checked: Story = {
  render: () => ({
    components: { Switch, Label },
    setup() { return {}; },
    template: `
      <div class="flex items-center space-x-2">
        <Switch id="est-checked" :default-value="true" />
        <Label :for="'est-checked'">Receber notificações</Label>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const sw = canvas.getByRole('switch');
    await step('aria-checked=true', async () => {
      await expect(sw).toHaveAttribute('aria-checked', 'true');
    });
  },
};

export const FocoVisivel: Story = {
  render: () => ({
    components: { Switch, Label },
    setup() { return {}; },
    template: `
      <div class="flex items-center space-x-2">
        <Switch id="est-focus" />
        <Label :for="'est-focus'">Modo escuro</Label>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story: 'Foco via teclado: Tab move o foco ao Switch; o anel ring-3 ring-ring/50 fica visível.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const sw = canvas.getByRole('switch');
    await step('Switch recebe foco programaticamente', async () => {
      (sw as HTMLElement).focus();
      await expect(sw).toHaveFocus();
    });
  },
};

export const Disabled: Story = {
  render: () => ({
    components: { Switch, Label },
    setup() { return {}; },
    template: `
      <div class="flex items-center space-x-2">
        <Switch id="est-disabled" :disabled="true" />
        <Label :for="'est-disabled'">Receber notificações</Label>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const sw = canvas.getByRole('switch');
    await step('Switch tem data-disabled', async () => {
      await expect(sw).toHaveAttribute('data-disabled');
    });
    await step('Clicar não altera o estado', async () => {
      await userEvent.click(sw, { pointerEventsCheck: 0 });
      await expect(sw).toHaveAttribute('aria-checked', 'false');
    });
  },
};

export const Invalid: Story = {
  render: () => ({
    components: { Switch, Label },
    setup() { return {}; },
    template: `
      <div class="space-y-2 w-80">
        <div class="flex items-center justify-between rounded-lg border border-destructive p-4">
          <div class="space-y-0.5">
            <Label :for="'est-invalid'">Aceitar termos</Label>
            <p class="text-sm text-muted-foreground">
              Você precisa aceitar para continuar.
            </p>
          </div>
          <Switch id="est-invalid" aria-invalid="true" aria-describedby="est-invalid-err" />
        </div>
        <p id="est-invalid-err" class="text-sm text-destructive">
          Este campo é obrigatório.
        </p>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const sw = canvas.getByRole('switch');
    await step('Switch tem aria-invalid=true', async () => {
      await expect(sw).toHaveAttribute('aria-invalid', 'true');
    });
    await step('Mensagem de erro visível', async () => {
      await expect(canvas.getByText('Este campo é obrigatório.')).toBeVisible();
    });
  },
};
