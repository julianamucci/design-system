import type { Meta, StoryObj } from "@storybook/react-vite";
import { userEvent, within, expect } from "storybook/test";
import { ChevronDown, SlidersHorizontal } from "lucide-react";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "./collapsible";
import { buttonVariants } from "./button";
import { cn } from "@/lib/utils";

const meta = {
  title: "UI/Collapsible/Composicoes",
  tags: ["disclosure"],
  component: Collapsible,
  parameters: {
    layout: "centered",
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          "Composicoes do Collapsible: com Button via asChild, com ícone no trigger e com conteúdo estruturado.",
      },
    },
  },
} satisfies Meta<typeof Collapsible>;

export default meta;
type Story = StoryObj<typeof meta>;

// ─── Com Button asChild ───────────────────────────────────────────────────────

export const ComButtonAsChild: Story = {
  name: "Com Button (asChild)",
  render: () => (
    <Collapsible className="nds-stack" data-spacing="sm" style={{ width: "20rem" }}>
      <CollapsibleTrigger
        className={cn(buttonVariants({ variant: "outline" }), "flex w-full items-center justify-between px-4")}
        aria-label="Exibir filtros avançados"
      >
        <span>Exibir filtros avançados</span>
        <ChevronDown
          aria-hidden="true"
          className="transition-transform [[data-state=open]_&]:rotate-180" style={{ height: "1rem", width: "1rem" }}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="nds-rounded-md nds-border-default nds-bg-card nds-px-4 nds-text-body" data-spacing="sm" style={{ paddingBlock: "0.75rem" }}>
        <div className="nds-cluster" data-justify="between">
          <span className="nds-text-muted-foreground">Filtro avançado 1</span>
          <span className="nds-text-caption bg-primary/10 nds-text-primary nds-px-2 nds-rounded-full" style={{ paddingBlock: "0.125rem" }}>ativo</span>
        </div>
        <div className="nds-cluster" data-justify="between">
          <span className="nds-text-muted-foreground">Filtro avançado 2</span>
          <span className="nds-text-caption nds-bg-muted nds-text-muted-foreground nds-px-2 nds-rounded-full" style={{ paddingBlock: "0.125rem" }}>inativo</span>
        </div>
      </CollapsibleContent>
    </Collapsible>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("trigger Button herdou aria-expanded do CollapsibleTrigger", async () => {
      const trigger = canvas.getByRole("button");
      await expect(trigger).toHaveAttribute("aria-expanded", "false");
    });

    await step("clicar no Button expande o conteúdo via asChild", async () => {
      const trigger = canvas.getByRole("button");
      await userEvent.click(trigger);
      await expect(trigger).toHaveAttribute("aria-expanded", "true");
    });
  },
};

// ─── Com ícone no trigger ─────────────────────────────────────────────────────

export const ComIconeNoTrigger: Story = {
  name: "Com Ícone no Trigger",
  render: () => (
    <Collapsible className="nds-stack" data-spacing="sm" style={{ width: "20rem" }}>
      <CollapsibleTrigger
        className={cn(buttonVariants({ variant: "ghost" }), "flex w-full items-center justify-between px-4")}
        aria-label="Filtros avançados"
      >
        <span className="nds-cluster" data-spacing="sm">
          <SlidersHorizontal aria-hidden="true" className="nds-text-muted-foreground" style={{ height: "1rem", width: "1rem" }} />
          Filtros avançados
        </span>
        <ChevronDown
          aria-hidden="true"
          className="nds-text-muted-foreground transition-transform [[data-state=open]_&]:rotate-180" style={{ height: "1rem", width: "1rem" }}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="nds-rounded-md nds-border-default bg-muted/40 nds-px-4 nds-text-body" data-spacing="xs" style={{ paddingBlock: "0.75rem" }}>
        <p className="nds-text-muted-foreground">Filtro avançado 1</p>
        <p className="nds-text-muted-foreground">Filtro avançado 2</p>
      </CollapsibleContent>
    </Collapsible>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("ícones decorativos não são acessíveis para leitores de tela", async () => {
      const svgs = canvasElement.querySelectorAll('svg[aria-hidden="true"]');
      await expect(svgs.length).toBeGreaterThan(0);
    });

    await step("trigger está presente e expansível", async () => {
      const trigger = canvas.getByRole("button");
      await expect(trigger).toHaveAttribute("aria-expanded", "false");
      await userEvent.click(trigger);
      await expect(trigger).toHaveAttribute("aria-expanded", "true");
    });
  },
};

// ─── Com conteúdo estruturado ─────────────────────────────────────────────────

export const ComConteudoEstruturado: Story = {
  name: "Com Conteúdo Estruturado",
  render: () => (
    <Collapsible defaultOpen className="nds-stack" data-spacing="sm" style={{ width: "20rem" }}>
      <div className="nds-cluster nds-rounded-md nds-border-default nds-bg-card nds-px-4" data-align="center" data-spacing="sm" style={{ paddingBlock: "0.75rem" }}>
        <span className="nds-flex-1 nds-text-body nds-font-medium">Filtro básico ativo</span>
        <CollapsibleTrigger
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "px-2")}
          aria-label="Exibir filtros avançados"
        >
          <ChevronDown
            aria-hidden="true"
            className="transition-transform [[data-state=open]_&]:rotate-180" style={{ height: "1rem", width: "1rem" }}
          />
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent className="nds-rounded-md nds-border-default bg-muted/40 nds-px-4 nds-text-body" data-spacing="xs" style={{ paddingBlock: "0.75rem" }}>
        <p className="nds-text-muted-foreground">Filtro avançado 1</p>
        <p className="nds-text-muted-foreground">Filtro avançado 2</p>
      </CollapsibleContent>
    </Collapsible>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("painel começa aberto com defaultOpen", async () => {
      const trigger = canvas.getByRole("button", { name: /exibir filtros/i });
      await expect(trigger).toHaveAttribute("aria-expanded", "true");
    });

    await step("clicar no trigger fecha o painel", async () => {
      const trigger = canvas.getByRole("button", { name: /exibir filtros/i });
      await userEvent.click(trigger);
      await expect(trigger).toHaveAttribute("aria-expanded", "false");
    });
  },
};
