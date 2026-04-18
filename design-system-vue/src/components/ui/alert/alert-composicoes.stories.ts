import type { Meta, StoryObj } from '@storybook/vue3';
import { Alert, AlertTitle, AlertDescription } from './index';
import { Button } from '@/components/ui/button';

const meta = {
  title: 'UI/Alert/Composições',
  component: Alert,
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ComIconeSVG: Story = {
  render: () => ({
    components: { Alert, AlertTitle, AlertDescription },
    setup() { return {}; },
    template: `
      <Alert>
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>
        </svg>
        <AlertTitle>Informação</AlertTitle>
        <AlertDescription>Ícone SVG posicionado automaticamente via CSS grid.</AlertDescription>
      </Alert>
    `,
  }),
};

export const ComAcao: Story = {
  render: () => ({
    components: { Alert, AlertTitle, AlertDescription, Button },
    setup() { return {}; },
    template: `
      <Alert>
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>
        </svg>
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
    components: { Alert, AlertTitle, AlertDescription },
    setup() { return {}; },
    template: `
      <div class="space-y-3">
        <Alert>
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>
          </svg>
          <AlertTitle>Informação</AlertTitle>
          <AlertDescription>Mensagem informativa e neutra.</AlertDescription>
        </Alert>
        <Alert variant="destructive">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>Erro crítico que bloqueia o fluxo.</AlertDescription>
        </Alert>
        <Alert class="bg-success/10 text-success border-success/30">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
          <AlertTitle>Sucesso</AlertTitle>
          <AlertDescription>Ação concluída com sucesso.</AlertDescription>
        </Alert>
        <Alert class="bg-warning/10 text-warning border-warning/30">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>
          </svg>
          <AlertTitle>Aviso</AlertTitle>
          <AlertDescription>Aviso que requer atenção.</AlertDescription>
        </Alert>
      </div>
    `,
  }),
};

export const SemTituloCompacto: Story = {
  render: () => ({
    components: { Alert, AlertDescription },
    setup() { return {}; },
    template: `
      <Alert>
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <AlertDescription>Formulário incompleto — preencha todos os campos obrigatórios.</AlertDescription>
      </Alert>
    `,
  }),
};
