import type { Meta, StoryObj } from '@storybook/vue3';
import { Alert, AlertTitle, AlertDescription } from './index';

const meta = {
  title: 'UI/Alert/Variantes',
  component: Alert,
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    components: { Alert, AlertTitle, AlertDescription },
    setup() { return {}; },
    template: `
      <Alert>
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>
        </svg>
        <AlertTitle>Atenção</AlertTitle>
        <AlertDescription>Suas alterações serão aplicadas na próxima sessão.</AlertDescription>
      </Alert>
    `,
  }),
};

export const Destructive: Story = {
  render: () => ({
    components: { Alert, AlertTitle, AlertDescription },
    setup() { return {}; },
    template: `
      <Alert variant="destructive">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <AlertTitle>Erro ao salvar</AlertTitle>
        <AlertDescription>Não foi possível salvar. Verifique sua conexão e tente novamente.</AlertDescription>
      </Alert>
    `,
  }),
};

export const Success: Story = {
  render: () => ({
    components: { Alert, AlertTitle, AlertDescription },
    setup() { return {}; },
    template: `
      <Alert class="bg-success/10 text-success border-success/30">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
        <AlertTitle>Perfil atualizado</AlertTitle>
        <AlertDescription>Suas informações foram salvas com sucesso.</AlertDescription>
      </Alert>
    `,
  }),
};

export const Warning: Story = {
  render: () => ({
    components: { Alert, AlertTitle, AlertDescription },
    setup() { return {}; },
    template: `
      <Alert class="bg-warning/10 text-warning border-warning/30">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>
        </svg>
        <AlertTitle>Assinatura expirando</AlertTitle>
        <AlertDescription>Sua assinatura expira em 3 dias. Renove para evitar interrupções.</AlertDescription>
      </Alert>
    `,
  }),
};
