import type { Meta, StoryObj } from "@storybook/react-vite";
import { userEvent, within, expect } from "storybook/test";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "./collapsible";
import { Button, buttonVariants } from "./button";
import { cn } from "@/lib/utils";

const meta = {
  title: "UI/Collapsible/Estados",
  tags: ["disclosure"],
  component: Collapsible,
  parameters: {
    layout: "centered",
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          "Estados do Collapsible: não-controlado (defaultOpen), controlado (open + onOpenChange) e desabilitado (disabled).",
      },
    },
  },
} satisfies Meta<typeof Collapsible>;

export default meta;
type Story = StoryObj<typeof meta>;

// ─── Uncontrolled ─────────────────────────────────────────────────────────────

export const NaoControlado: Story = {
  name: "Não Controlado",
  render: () => (
    <Collapsible defaultOpen={false} className="nds-stack" data-spacing="sm" style={{ width: "20rem" }}>
      <CollapsibleTrigger
        className={cn(buttonVariants({ variant: "ghost" }), "flex w-full items-center justify-between px-4")}
      >
        <span>Exibir filtros avançados</span>
        <ChevronDown
          aria-hidden="true"
          className="transition-transform [[data-state=open]_&]:rotate-180" style={{ height: "1rem", width: "1rem" }}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="nds-rounded-md nds-border-default bg-muted/40 nds-px-4 nds-text-body" data-spacing="xs" style={{ paddingBlock: "0.75rem" }}>
        <p>Filtro avançado 1</p>
        <p>Filtro avançado 2</p>
      </CollapsibleContent>
    </Collapsible>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("estado inicial é fechado", async () => {
      const trigger = canvas.getByRole("button");
      await expect(trigger).toHaveAttribute("aria-expanded", "false");
    });

    await step("clicar abre o painel sem controle externo", async () => {
      const trigger = canvas.getByRole("button");
      await userEvent.click(trigger);
      await expect(trigger).toHaveAttribute("aria-expanded", "true");
    });

    await step("clicar novamente fecha o painel", async () => {
      const trigger = canvas.getByRole("button");
      await userEvent.click(trigger);
      await expect(trigger).toHaveAttribute("aria-expanded", "false");
    });
  },
};

// ─── Controlled ──────────────────────────────────────────────────────────────

function ControlledExample() {
  const [open, setOpen] = useState(false);
  return (
    <div className="nds-stack" data-spacing="sm" style={{ width: "20rem" }}>
      <p className="nds-text-caption nds-text-muted-foreground">
        Estado externo: <strong>{open ? "aberto" : "fechado"}</strong>
      </p>
      <div className="nds-cluster" data-spacing="sm">
        <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
          Abrir
        </Button>
        <Button size="sm" variant="outline" onClick={() => setOpen(false)}>
          Fechar
        </Button>
      </div>
      <Collapsible open={open} onOpenChange={setOpen} className="nds-stack" data-spacing="sm">
        <CollapsibleTrigger
          className={cn(buttonVariants({ variant: "ghost" }), "flex w-full items-center justify-between px-4")}
          aria-label={open ? "Ocultar filtros avançados" : "Exibir filtros avançados"}
        >
          <span>{open ? "Ocultar filtros avançados" : "Exibir filtros avançados"}</span>
          <ChevronDown
            aria-hidden="true"
            className="transition-transform [[data-state=open]_&]:rotate-180" style={{ height: "1rem", width: "1rem" }}
          />
        </CollapsibleTrigger>
        <CollapsibleContent className="nds-rounded-md nds-border-default bg-muted/40 nds-px-4 nds-text-body" data-spacing="xs" style={{ paddingBlock: "0.75rem" }}>
          <p>Filtro avançado 1</p>
          <p>Filtro avançado 2</p>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

export const Controlado: Story = {
  render: () => <ControlledExample />,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("estado inicial é fechado", async () => {
      const trigger = canvas.getByRole("button", { name: /exibir filtros/i });
      await expect(trigger).toHaveAttribute("aria-expanded", "false");
    });

    await step("clicar no botão externo 'Abrir' expande o painel", async () => {
      const openBtn = canvas.getByRole("button", { name: "Abrir" });
      await userEvent.click(openBtn);
      const trigger = canvas.getByRole("button", { name: /ocultar filtros/i });
      await expect(trigger).toHaveAttribute("aria-expanded", "true");
    });

    await step("clicar no botão externo 'Fechar' colapsa o painel", async () => {
      const closeBtn = canvas.getByRole("button", { name: "Fechar" });
      await userEvent.click(closeBtn);
      const trigger = canvas.getByRole("button", { name: /exibir filtros/i });
      await expect(trigger).toHaveAttribute("aria-expanded", "false");
    });
  },
};

// ─── Disabled ─────────────────────────────────────────────────────────────────

export const Desabilitado: Story = {
  render: () => (
    <Collapsible className="nds-stack" data-spacing="sm" style={{ width: "20rem" }}>
      <CollapsibleTrigger
        className={cn(buttonVariants({ variant: "ghost" }), "flex w-full items-center justify-between px-4")}
        disabled
      >
        <span>Filtros avançados</span>
        <ChevronDown
          aria-hidden="true"
          className="" style={{ height: "1rem", width: "1rem" }}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="nds-rounded-md nds-border-default bg-muted/40 nds-px-4 nds-text-body" data-spacing="xs" style={{ paddingBlock: "0.75rem" }}>
        <p>Filtro avançado 1</p>
        <p>Filtro avançado 2</p>
      </CollapsibleContent>
    </Collapsible>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("trigger está desabilitado", async () => {
      const trigger = canvas.getByRole("button");
      // base-ui usa aria-disabled em vez de attribute disabled nativo
      await expect(trigger).toHaveAttribute("aria-disabled", "true");
    });

    await step("clicar no trigger desabilitado não altera aria-expanded", async () => {
      const trigger = canvas.getByRole("button");
      await userEvent.click(trigger, { pointerEventsCheck: 0 });
      await expect(trigger).toHaveAttribute("aria-expanded", "false");
    });
  },
};
