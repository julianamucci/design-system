import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { userEvent, within, expect, waitFor } from "storybook/test";
import { Info, Settings, Shield, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";

const meta: Meta = {
  title: "UI/Tabs/Composicoes",
  tags: ["navigation"],
  component: Tabs,
  parameters: {
    layout: "padded",
    controls: { disable: true },
    docs: {
      description: {
        component:
          "Composicoes reais do Tabs: com ícones, badges, modo controlado e activationMode manual.",
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Com ícones ───────────────────────────────────────────────────────────────

export const ComIcones: Story = {
  name: "Com ícones",
  render: () => (
    <Tabs defaultValue="profile" className="w-full max-w-lg">
      <TabsList aria-label="Configuracoes da conta">
        <TabsTrigger value="profile">
          <User aria-hidden="true" />
          Perfil
        </TabsTrigger>
        <TabsTrigger value="account">
          <Settings aria-hidden="true" />
          Conta
        </TabsTrigger>
        <TabsTrigger value="security">
          <Shield aria-hidden="true" />
          Segurança
        </TabsTrigger>
      </TabsList>
      <TabsContent value="profile">Dados do perfil.</TabsContent>
      <TabsContent value="account">Configuracoes da conta.</TabsContent>
      <TabsContent value="security">Configuracoes de segurança.</TabsContent>
    </Tabs>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Ícone à esquerda do label. Use aria-hidden="true" no ícone — o texto do trigger já descreve a tab para leitores de tela.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const tabs = canvas.getAllByRole("tab");
    await expect(tabs).toHaveLength(3);
    await expect(tabs[0]).toHaveAttribute("aria-selected", "true");
  },
};

// ─── Com badge ────────────────────────────────────────────────────────────────

export const ComBadge: Story = {
  name: "Com badge",
  render: () => (
    <Tabs defaultValue="overview" className="w-full max-w-lg">
      <TabsList aria-label="Painel do projeto">
        <TabsTrigger value="overview">Visão geral</TabsTrigger>
        <TabsTrigger value="inbox">
          Inbox
          <Badge variant="secondary" className="text-[10px] h-4">
            12
          </Badge>
        </TabsTrigger>
        <TabsTrigger value="archived">Arquivados</TabsTrigger>
      </TabsList>
      <TabsContent value="overview">Resumo do projeto.</TabsContent>
      <TabsContent value="inbox">12 itens novos.</TabsContent>
      <TabsContent value="archived">Itens arquivados.</TabsContent>
    </Tabs>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Badge no trigger para indicar contagem. O badge é decorativo — o número deve refletir conteúdo dinâmico.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("12")).toBeVisible();
  },
};

// ─── Controlado ───────────────────────────────────────────────────────────────

function ControlledTabs() {
  const [value, setValue] = useState("overview");
  return (
    <div className="space-y-3 w-full max-w-lg">
      <p className="text-xs text-muted-foreground">
        Tab ativa: <code>{value}</code>
      </p>
      <Tabs value={value} onValueChange={setValue}>
        <TabsList aria-label="Seções do componente">
          <TabsTrigger value="overview">Visão geral</TabsTrigger>
          <TabsTrigger value="properties">Propriedades</TabsTrigger>
          <TabsTrigger value="examples">Exemplos</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">Conteúdo da visão geral.</TabsContent>
        <TabsContent value="properties">Lista de propriedades.</TabsContent>
        <TabsContent value="examples">Exemplos de uso.</TabsContent>
      </Tabs>
    </div>
  );
}

export const Controlado: Story = {
  render: () => <ControlledTabs />,
  parameters: {
    docs: {
      description: {
        story:
          "Modo controlado — value + onValueChange gerenciam o estado externamente. Útil para sincronizar com URL ou analytics.",
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const tabs = canvas.getAllByRole("tab");

    await step("Click atualiza estado externo", async () => {
      await userEvent.click(tabs[1]);
      await waitFor(() =>
        expect(canvas.getByText("properties")).toBeVisible()
      );
    });
  },
};

// ─── Manual activation ────────────────────────────────────────────────────────

export const ManualActivation: Story = {
  name: "Activation manual",
  render: () => (
    <Tabs
      defaultValue="overview"
      className="w-full max-w-lg"
    >
      <TabsList aria-label="Seções do componente">
        <TabsTrigger value="overview">
          <Info aria-hidden="true" />
          Visão geral
        </TabsTrigger>
        <TabsTrigger value="properties">Propriedades</TabsTrigger>
        <TabsTrigger value="examples">Exemplos</TabsTrigger>
      </TabsList>
      <TabsContent value="overview">Conteúdo da visão geral.</TabsContent>
      <TabsContent value="properties">Lista de propriedades.</TabsContent>
      <TabsContent value="examples">Exemplos de uso.</TabsContent>
    </Tabs>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'activationMode="manual" — setas movem foco mas só Enter/Space ativa. Útil quando a troca de tab carrega conteúdo pesado.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const tabs = canvas.getAllByRole("tab");

    await step("ArrowRight move foco mas não ativa", async () => {
      tabs[0].focus();
      await userEvent.keyboard("{ArrowRight}");
      // tab 1 não está selecionada ainda — foco moveu mas activation manual
      await expect(tabs[0]).toHaveAttribute("aria-selected", "true");
    });

    await step("Enter ativa a tab focada", async () => {
      await userEvent.keyboard("{Enter}");
      await waitFor(() =>
        expect(tabs[1]).toHaveAttribute("aria-selected", "true")
      );
    });
  },
};
