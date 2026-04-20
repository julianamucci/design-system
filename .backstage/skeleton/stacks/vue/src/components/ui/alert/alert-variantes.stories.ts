import type { Meta, StoryObj } from '@storybook/vue3';
import { Alert, AlertTitle, AlertDescription } from './index';
import { AlertCircle, CheckCircle2, Info, TriangleAlert } from 'lucide-vue-next';

const meta = {
  title: 'UI/Alert/Variantes',
  component: Alert,
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    components: { Alert, AlertTitle, AlertDescription, Info },
    setup() { return {}; },
    template: `
      <Alert>
        <Info class="h-4 w-4" aria-hidden="true" />
        <AlertTitle>Atenção</AlertTitle>
        <AlertDescription>Suas alterações serão aplicadas na próxima sessão.</AlertDescription>
      </Alert>
    `,
  }),
};

export const Destructive: Story = {
  render: () => ({
    components: { Alert, AlertTitle, AlertDescription, AlertCircle },
    setup() { return {}; },
    template: `
      <Alert variant="destructive">
        <AlertCircle class="h-4 w-4" aria-hidden="true" />
        <AlertTitle>Erro ao salvar</AlertTitle>
        <AlertDescription>Não foi possível salvar. Verifique sua conexão e tente novamente.</AlertDescription>
      </Alert>
    `,
  }),
};

export const Success: Story = {
  render: () => ({
    components: { Alert, AlertTitle, AlertDescription, CheckCircle2 },
    setup() { return {}; },
    template: `
      <Alert class="bg-success/10 text-success border-success/30">
        <CheckCircle2 class="h-4 w-4" aria-hidden="true" />
        <AlertTitle>Perfil atualizado</AlertTitle>
        <AlertDescription>Suas informações foram salvas com sucesso.</AlertDescription>
      </Alert>
    `,
  }),
};

export const Warning: Story = {
  render: () => ({
    components: { Alert, AlertTitle, AlertDescription, TriangleAlert },
    setup() { return {}; },
    template: `
      <Alert class="bg-warning/10 text-warning border-warning/30">
        <TriangleAlert class="h-4 w-4" aria-hidden="true" />
        <AlertTitle>Assinatura expirando</AlertTitle>
        <AlertDescription>Sua assinatura expira em 3 dias. Renove para evitar interrupções.</AlertDescription>
      </Alert>
    `,
  }),
};
