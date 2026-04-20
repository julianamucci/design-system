import type { Meta, StoryObj } from '@storybook/vue3';
import { Alert, AlertTitle, AlertDescription } from './index';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle2, Info, TriangleAlert } from 'lucide-vue-next';

const meta = {
  title: 'UI/Alert/Composições',
  component: Alert,
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ComIcone: Story = {
  render: () => ({
    components: { Alert, AlertTitle, AlertDescription, Info },
    setup() { return {}; },
    template: `
      <Alert>
        <Info class="h-4 w-4" aria-hidden="true" />
        <AlertTitle>Informação</AlertTitle>
        <AlertDescription>Ícone posicionado automaticamente via CSS grid.</AlertDescription>
      </Alert>
    `,
  }),
};

export const ComAcao: Story = {
  render: () => ({
    components: { Alert, AlertTitle, AlertDescription, Button, Info },
    setup() { return {}; },
    template: `
      <Alert>
        <Info class="h-4 w-4" aria-hidden="true" />
        <AlertTitle>Sessão expira em 5 minutos</AlertTitle>
        <AlertDescription class="flex items-center justify-between gap-4 mt-1">
          <span>Salve seu trabalho para não perder as alterações.</span>
          <Button size="sm" variant="outline">Salvar agora</Button>
        </AlertDescription>
      </Alert>
    `,
  }),
};

export const MultiplosTipos: Story = {
  render: () => ({
    components: { Alert, AlertTitle, AlertDescription, Info, AlertCircle, CheckCircle2, TriangleAlert },
    setup() { return {}; },
    template: `
      <div class="space-y-3">
        <Alert>
          <Info class="h-4 w-4" aria-hidden="true" />
          <AlertTitle>Informação</AlertTitle>
          <AlertDescription>Mensagem informativa e neutra.</AlertDescription>
        </Alert>
        <Alert variant="destructive">
          <AlertCircle class="h-4 w-4" aria-hidden="true" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>Erro crítico que bloqueia o fluxo.</AlertDescription>
        </Alert>
        <Alert class="bg-success/10 text-success border-success/30">
          <CheckCircle2 class="h-4 w-4" aria-hidden="true" />
          <AlertTitle>Sucesso</AlertTitle>
          <AlertDescription>Ação concluída com sucesso.</AlertDescription>
        </Alert>
        <Alert class="bg-warning/10 text-warning border-warning/30">
          <TriangleAlert class="h-4 w-4" aria-hidden="true" />
          <AlertTitle>Aviso</AlertTitle>
          <AlertDescription>Aviso que requer atenção.</AlertDescription>
        </Alert>
      </div>
    `,
  }),
};

export const SemTituloCompacto: Story = {
  render: () => ({
    components: { Alert, AlertDescription, AlertCircle },
    setup() { return {}; },
    template: `
      <Alert>
        <AlertCircle class="h-4 w-4" aria-hidden="true" />
        <AlertDescription>Formulário incompleto — preencha todos os campos obrigatórios.</AlertDescription>
      </Alert>
    `,
  }),
};
