import type { Meta, StoryObj } from "@storybook/react";
import { fn, userEvent, within, expect } from "storybook/test";
import { ChevronDown } from "lucide-react";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "./collapsible";
import { buttonVariants } from "./button";
import { cn } from "@/lib/utils";
import { CollapsibleDocs } from "@/components/docs/CollapsibleDocs";
import { withAutoDocsTab } from "@/lib/withAutoDocsTab";

const meta = {
  title: "UI/Collapsible",
  component: Collapsible,
  tags: ["autodocs", "disclosure"],
  parameters: {
    docs: { page: withAutoDocsTab(CollapsibleDocs) },
    layout: "centered",
  },
  argTypes: {
    open: {
      control: "boolean",
      description: "Estado aberto/fechado no modo controlado",
    },
    defaultOpen: {
      control: "boolean",
      description: "Estado inicial no modo não-controlado",
    },
    disabled: {
      control: "boolean",
      description: "Desabilita o trigger impedindo interação",
    },
  },
  args: {
    defaultOpen: false,
    disabled: false,
    onOpenChange: fn(),
  },
} satisfies Meta<typeof Collapsible>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => (
    // key força re-mount quando defaultOpen muda no control, pois é prop de montagem
    <Collapsible key={String(args.defaultOpen)} {...args} className="w-80 space-y-2">
      <CollapsibleTrigger
        className={cn(buttonVariants({ variant: "ghost" }), "flex w-full items-center justify-between px-4")}
        aria-label="Exibir filtros avançados"
        disabled={args.disabled}
      >
        <span>Filtros avançados</span>
        <ChevronDown
          aria-hidden="true"
          className="h-4 w-4 transition-transform [[data-state=open]_&]:rotate-180"
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="rounded-md border border-border bg-muted/40 px-4 py-3 text-sm space-y-1">
        <p>Filtro avançado 1</p>
        <p>Filtro avançado 2</p>
      </CollapsibleContent>
    </Collapsible>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("trigger está presente e visível", async () => {
      const trigger = canvas.getByRole("button");
      await expect(trigger).toBeInTheDocument();
      await expect(trigger).toBeVisible();
    });

    await step("aria-expanded é false no estado inicial fechado", async () => {
      const trigger = canvas.getByRole("button");
      await expect(trigger).toHaveAttribute("aria-expanded", "false");
    });

    await step("clicar no trigger expande o conteúdo", async () => {
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
