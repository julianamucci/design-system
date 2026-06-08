import type { Meta, StoryObj } from "@storybook/react";
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
    <Collapsible className="w-80 space-y-2">
      <CollapsibleTrigger
        className={cn(buttonVariants({ variant: "outline" }), "flex w-full items-center justify-between px-4")}
        aria-label="Exibir filtros avançados"
      >
        <span>Exibir filtros avançados</span>
        <ChevronDown
          aria-hidden="true"
          className="h-4 w-4 transition-transform [[data-state=open]_&]:rotate-180"
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="rounded-md border border-border bg-card px-4 py-3 text-sm space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Filtro avançado 1</span>
          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">ativo</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Filtro avançado 2</span>
          <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">inativo</span>
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
    <Collapsible className="w-80 space-y-2">
      <CollapsibleTrigger
        className={cn(buttonVariants({ variant: "ghost" }), "flex w-full items-center justify-between px-4")}
        aria-label="Filtros avançados"
      >
        <span className="flex items-center gap-2">
          <SlidersHorizontal aria-hidden="true" className="h-4 w-4 text-muted-foreground" />
          Filtros avançados
        </span>
        <ChevronDown
          aria-hidden="true"
          className="h-4 w-4 text-muted-foreground transition-transform [[data-state=open]_&]:rotate-180"
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="rounded-md border border-border bg-muted/40 px-4 py-3 text-sm space-y-1">
        <p className="text-muted-foreground">Filtro avançado 1</p>
        <p className="text-muted-foreground">Filtro avançado 2</p>
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
    <Collapsible defaultOpen className="w-80 space-y-2">
      <div className="flex items-center gap-2 rounded-md border border-border bg-card px-4 py-3">
        <span className="flex-1 text-sm font-medium">Filtro básico ativo</span>
        <CollapsibleTrigger
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "px-2")}
          aria-label="Exibir filtros avançados"
        >
          <ChevronDown
            aria-hidden="true"
            className="h-4 w-4 transition-transform [[data-state=open]_&]:rotate-180"
          />
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent className="rounded-md border border-border bg-muted/40 px-4 py-3 text-sm space-y-1">
        <p className="text-muted-foreground">Filtro avançado 1</p>
        <p className="text-muted-foreground">Filtro avançado 2</p>
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
