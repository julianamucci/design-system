import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { within, expect } from 'storybook/test';
import { Alert, AlertTitle, AlertDescription } from './index';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle2, Info, TriangleAlert } from 'lucide-vue-next';

const meta = {
  title: 'UI/Alert/Composicoes',
  component: Alert,
  tags: ['feedback'],
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
  },
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ComIcone: Story = {
  render: () => ({
    components: { Alert, AlertTitle, AlertDescription, Info },
    setup() { return {}; },
    template: `
      <Alert>
        <Info class="nds-icon" aria-hidden="true" />
        <AlertTitle>Informação</AlertTitle>
        <AlertDescription>Ícone posicionado automaticamente via CSS grid.</AlertDescription>
      </Alert>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const alert = canvas.getByRole('alert');
    await expect(alert.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    await expect(canvas.getByText('Informação')).toBeVisible();
  },
};

export const ComAcao: Story = {
  render: () => ({
    components: { Alert, AlertTitle, AlertDescription, Button, Info },
    setup() { return {}; },
    template: `
      <Alert>
        <Info class="nds-icon" aria-hidden="true" />
        <AlertTitle>Sessão expira em 5 minutos</AlertTitle>
        <AlertDescription class="nds-cluster nds-mt-1" data-align="center" data-justify="between" data-spacing="md">
          <span>Salve seu trabalho para não perder as alterações.</span>
          <Button size="sm" variant="outline">Salvar agora</Button>
        </AlertDescription>
      </Alert>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const alert = canvas.getByRole('alert');
    await expect(within(alert).getByRole('button')).toBeVisible();
  },
};

export const MultiplosTipos: Story = {
  render: () => ({
    components: { Alert, AlertTitle, AlertDescription, Info, AlertCircle, CheckCircle2, TriangleAlert },
    setup() { return {}; },
    template: `
      <div class="nds-stack" data-spacing="sm">
        <Alert>
          <Info class="nds-icon" aria-hidden="true" />
          <AlertTitle>Informação</AlertTitle>
          <AlertDescription>Mensagem informativa e neutra.</AlertDescription>
        </Alert>
        <Alert variant="destructive">
          <AlertCircle class="nds-icon" aria-hidden="true" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>Erro crítico que bloqueia o fluxo.</AlertDescription>
        </Alert>
        <Alert class="nds-alert-success">
          <CheckCircle2 class="nds-icon" aria-hidden="true" />
          <AlertTitle>Sucesso</AlertTitle>
          <AlertDescription>Ação concluída com sucesso.</AlertDescription>
        </Alert>
        <Alert class="nds-alert-warning">
          <TriangleAlert class="nds-icon" aria-hidden="true" />
          <AlertTitle>Aviso</AlertTitle>
          <AlertDescription>Aviso que requer atenção.</AlertDescription>
        </Alert>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const alerts = canvas.getAllByRole('alert');
    await expect(alerts).toHaveLength(4);
    await expect(alerts[1]).toHaveClass('nds-alert-destructive');
    await expect(alerts[2]).toHaveClass('nds-alert-success');
    await expect(alerts[3]).toHaveClass('nds-alert-warning');
  },
};

export const SemTituloCompacto: Story = {
  render: () => ({
    components: { Alert, AlertDescription, AlertCircle },
    setup() { return {}; },
    template: `
      <Alert variant="destructive">
        <AlertCircle class="nds-icon" aria-hidden="true" />
        <AlertDescription>Formulário incompleto — preencha todos os campos obrigatórios.</AlertDescription>
      </Alert>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const alert = canvas.getByRole('alert');
    await expect(alert).toHaveClass('nds-alert-destructive');
    await expect(alert.querySelector('[data-slot="alert-title"]')).toBeNull();
  },
};
