import type { Meta, StoryObj } from "@storybook/react";
import { AlertCircle, CheckCircle2, Info, TriangleAlert, X } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "./alert";
import { Button } from "./button";

const meta = {
  title: "UI/Alert/Composições",
  component: Alert,
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ComIconeLucide: Story = {
  render: () => (
    <Alert>
      <Info aria-hidden="true" className="h-4 w-4" />
      <AlertTitle>Informação</AlertTitle>
      <AlertDescription>
        Ícone Lucide posicionado automaticamente via seletor CSS{" "}
        <code>[&gt;svg]:absolute</code>.
      </AlertDescription>
    </Alert>
  ),
};

export const ComAcao: Story = {
  render: () => (
    <Alert>
      <Info aria-hidden="true" className="h-4 w-4" />
      <AlertTitle>Sessão expira em 5 minutos</AlertTitle>
      <AlertDescription className="flex items-center justify-between gap-4 mt-1">
        <span>Salve seu trabalho para não perder as alterações.</span>
        <Button size="sm" variant="outline">
          Salvar agora
        </Button>
      </AlertDescription>
    </Alert>
  ),
};

export const MultiplosTipos: Story = {
  render: () => (
    <div className="space-y-3">
      <Alert>
        <Info aria-hidden="true" className="h-4 w-4" />
        <AlertTitle>Informação</AlertTitle>
        <AlertDescription>Mensagem informativa e neutra.</AlertDescription>
      </Alert>
      <Alert variant="destructive">
        <AlertCircle aria-hidden="true" className="h-4 w-4" />
        <AlertTitle>Erro</AlertTitle>
        <AlertDescription>Erro crítico que bloqueia o fluxo.</AlertDescription>
      </Alert>
      <Alert className="bg-success/10 text-success border-success/30">
        <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
        <AlertTitle>Sucesso</AlertTitle>
        <AlertDescription>Ação concluída com sucesso.</AlertDescription>
      </Alert>
      <Alert className="bg-warning/10 text-warning border-warning/30">
        <TriangleAlert aria-hidden="true" className="h-4 w-4" />
        <AlertTitle>Aviso</AlertTitle>
        <AlertDescription>Aviso que requer atenção.</AlertDescription>
      </Alert>
    </div>
  ),
};

export const SemTituloCompacto: Story = {
  render: () => (
    <Alert>
      <AlertCircle aria-hidden="true" className="h-4 w-4" />
      <AlertDescription>
        Formulário incompleto — preencha todos os campos obrigatórios.
      </AlertDescription>
    </Alert>
  ),
};
