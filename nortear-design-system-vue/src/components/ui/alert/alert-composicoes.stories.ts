import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { within, expect } from 'storybook/test';
import { Alert, AlertAction, AlertTitle, AlertDescription } from './index';
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
        <AlertDescription>Ícone SVG posicionado automaticamente.</AlertDescription>
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
    components: { Alert, AlertAction, AlertTitle, AlertDescription, Button, Info },
    setup() { return {}; },
    template: `
      <Alert>
        <Info class="nds-icon" aria-hidden="true" />
        <AlertTitle>Atualização disponível</AlertTitle>
        <AlertDescription>Uma nova versão está pronta para instalação.</AlertDescription>
        <AlertAction>
          <Button size="sm" variant="outline">Atualizar</Button>
        </AlertAction>
      </Alert>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('A ação fica acessível como botão dentro do alert', async () => {
      const alert = canvas.getByRole('alert');
      await expect(within(alert).getByRole('button', { name: 'Atualizar' })).toBeVisible();
    });

    await step('O slot de ação usa a classe do componente', async () => {
      const action = canvasElement.querySelector('[data-slot="alert-action"]');
      await expect(action).toHaveClass('nds-alert-action');
    });
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
        <Alert variant="success">
          <CheckCircle2 class="nds-icon" aria-hidden="true" />
          <AlertTitle>Sucesso</AlertTitle>
          <AlertDescription>Ação concluída com sucesso.</AlertDescription>
        </Alert>
        <Alert variant="warning">
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

export const SemIcone: Story = {
  render: () => ({
    components: { Alert, AlertTitle, AlertDescription },
    setup() { return {}; },
    template: `
      <Alert>
        <AlertTitle>Sem ícone</AlertTitle>
        <AlertDescription>Alert sem ícone mantém layout de coluna única.</AlertDescription>
      </Alert>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const alert = canvas.getByRole('alert');
    await expect(alert.querySelector('svg')).toBeNull();
    await expect(canvas.getByText('Sem ícone')).toBeVisible();
  },
};
