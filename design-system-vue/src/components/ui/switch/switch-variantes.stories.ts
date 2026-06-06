import type { Meta, StoryObj } from '@storybook/vue3';
import { within, expect } from 'storybook/test';
import { Switch } from './index';
import { Label } from '@/components/ui/label';

const meta = {
  title: 'UI/Switch/Variantes',
  component: Switch,
  tags: ['form'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          'Variantes do Switch: default (Label à direita), withDescription (painel flex justify-between) e sm (compacto).',
      },
    },
  },
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    components: { Switch, Label },
    setup() { return {}; },
    template: `
      <div class="flex items-center space-x-2">
        <Switch id="var-default" />
        <Label :for="'var-default'">Receber notificações por email</Label>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const sw = canvas.getByRole('switch');
    await step('Switch padrão renderiza com role=switch', async () => {
      await expect(sw).toBeInTheDocument();
      await expect(sw).toHaveAttribute('data-size', 'default');
    });
    await step('Label associado anuncia o estado ativo', async () => {
      await expect(canvas.getByText('Receber notificações por email')).toBeVisible();
    });
  },
};

export const WithDescription: Story = {
  render: () => ({
    components: { Switch, Label },
    setup() { return {}; },
    template: `
      <div class="flex items-center justify-between rounded-lg border p-4 w-80">
        <div class="space-y-0.5">
          <Label :for="'var-marketing'">Emails de marketing</Label>
          <p class="text-sm text-muted-foreground">
            Receba novidades e promoções da plataforma.
          </p>
        </div>
        <Switch id="var-marketing" />
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const sw = canvas.getByRole('switch');
    await step('Switch presente no painel', async () => {
      await expect(sw).toBeInTheDocument();
    });
    await step('Descrição auxiliar visível', async () => {
      await expect(canvas.getByText(/Receba novidades e promoções/)).toBeVisible();
    });
  },
};

export const Small: Story = {
  render: () => ({
    components: { Switch, Label },
    setup() { return {}; },
    template: `
      <div class="flex items-center space-x-2">
        <Switch id="var-sm" size="sm" />
        <Label :for="'var-sm'" class="text-xs">Tamanho compacto</Label>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const sw = canvas.getByRole('switch');
    await step('Switch tem data-size=sm', async () => {
      await expect(sw).toHaveAttribute('data-size', 'sm');
    });
  },
};
