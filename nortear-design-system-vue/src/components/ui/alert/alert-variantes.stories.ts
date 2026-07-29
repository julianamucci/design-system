import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { within, expect } from 'storybook/test';
import { Alert, AlertTitle, AlertDescription } from './index';
import { AlertCircle, CheckCircle2, Info, TriangleAlert } from 'lucide-vue-next';

const meta = {
  title: 'UI/Alert/Variantes',
  component: Alert,
  tags: ['feedback'],
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
  },
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    components: { Alert, AlertTitle, AlertDescription, Info },
    setup() { return {}; },
    template: `
      <Alert>
        <Info class="nds-icon" aria-hidden="true" />
        <AlertTitle>Atenção</AlertTitle>
        <AlertDescription>Suas alterações serão aplicadas na próxima sessão.</AlertDescription>
      </Alert>
    `,
  }),
  play: async ({ canvasElement }) => {
    const alert = within(canvasElement).getByRole('alert');
    await expect(alert).toHaveClass('nds-alert');
    await expect(alert).not.toHaveClass('nds-alert-destructive');
    await expect(within(canvasElement).getByText('Atenção')).toBeVisible();
  },
};

export const Destructive: Story = {
  render: () => ({
    components: { Alert, AlertTitle, AlertDescription, AlertCircle },
    setup() { return {}; },
    template: `
      <Alert variant="destructive">
        <AlertCircle class="nds-icon" aria-hidden="true" />
        <AlertTitle>Erro ao salvar</AlertTitle>
        <AlertDescription>Não foi possível salvar. Verifique sua conexão e tente novamente.</AlertDescription>
      </Alert>
    `,
  }),
  play: async ({ canvasElement }) => {
    const alert = within(canvasElement).getByRole('alert');
    await expect(alert).toHaveClass('nds-alert-destructive');
    await expect(within(canvasElement).getByText('Erro ao salvar')).toBeVisible();
  },
};

export const Success: Story = {
  render: () => ({
    components: { Alert, AlertTitle, AlertDescription, CheckCircle2 },
    setup() { return {}; },
    template: `
      <Alert class="nds-alert-success">
        <CheckCircle2 class="nds-icon" aria-hidden="true" />
        <AlertTitle>Perfil atualizado</AlertTitle>
        <AlertDescription>Suas informações foram salvas com sucesso.</AlertDescription>
      </Alert>
    `,
  }),
  play: async ({ canvasElement }) => {
    const alert = within(canvasElement).getByRole('alert');
    await expect(alert).toHaveClass('nds-alert-success');
    await expect(within(canvasElement).getByText('Perfil atualizado')).toBeVisible();
  },
};

export const Warning: Story = {
  render: () => ({
    components: { Alert, AlertTitle, AlertDescription, TriangleAlert },
    setup() { return {}; },
    template: `
      <Alert class="nds-alert-warning">
        <TriangleAlert class="nds-icon" aria-hidden="true" />
        <AlertTitle>Assinatura expirando</AlertTitle>
        <AlertDescription>Sua assinatura expira em 3 dias. Renove para evitar interrupções.</AlertDescription>
      </Alert>
    `,
  }),
  play: async ({ canvasElement }) => {
    const alert = within(canvasElement).getByRole('alert');
    await expect(alert).toHaveClass('nds-alert-warning');
    await expect(within(canvasElement).getByText('Assinatura expirando')).toBeVisible();
  },
};
