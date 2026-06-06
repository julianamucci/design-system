import type { Meta, StoryObj } from "@storybook/react";
import { userEvent, within, expect, waitFor } from "storybook/test";
import { waitForPortal, waitForPortalGone } from "@/lib/wait-for-portal";
import {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
} from "./command";
import { CommandDocs } from "@/components/docs/CommandDocs";
import { withAutoDocsTab } from "@/lib/withAutoDocsTab";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { LayoutIcon, TypeIcon, MinusIcon, SearchIcon } from "lucide-react";

const meta = {
  title: "UI/Command",
  component: Command,
  tags: ["autodocs", "overlay"],
  parameters: {
    layout: "centered",
    docs: { page: withAutoDocsTab(CommandDocs) },
    // cmdk renderiza <div cmdk-list role="listbox"> com children que incluem
    // <div role="separator"> e <div cmdk-empty>. axe reporta aria-required-children
    // pois listbox só permite option/group por spec, mas cmdk segue o padrão de
    // command palettes (VSCode, Figma, etc.) — comportamento da lib upstream.
    // Ver PATCHES.md#command-listbox-children.
    a11y: {
      config: {
        rules: [{ id: 'aria-required-children', enabled: false }],
      },
    },
  },
  argTypes: {
    loop: {
      control: "boolean",
      description: "Navegação por teclado cicla do último para o primeiro item",
    },
    shouldFilter: {
      control: "boolean",
      description: "Habilita filtro interno por texto (desative para filtro externo)",
    },
  },
  args: {
    loop: false,
    shouldFilter: true,
  },
} satisfies Meta<typeof Command>;

export default meta;
type Story = StoryObj<typeof meta>;

// ─── Playground ──────────────────────────────────────────────────────────────

export const Playground: Story = {
  render: (args) => (
    <div className="w-72">
      <Command {...args}>
        <CommandInput placeholder="Buscar componente..." />
        <CommandList>
          <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
          <CommandGroup heading="Componentes">
            <CommandItem value="button">
              <LayoutIcon />
              Button
            </CommandItem>
            <CommandItem value="input">
              <TypeIcon />
              Input
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Utilitários">
            <CommandItem value="separator">
              <MinusIcon />
              Separator
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("campo de busca está acessível", async () => {
      const input = canvas.getByRole("combobox");
      await expect(input).toBeInTheDocument();
    });

    await step("digitar filtra os itens", async () => {
      const input = canvas.getByRole("combobox");
      await userEvent.type(input, "but");
      await waitFor(() => {
        expect(canvas.getByText("Button")).toBeInTheDocument();
      });
    });

    await step("texto sem correspondência exibe CommandEmpty", async () => {
      const input = canvas.getByRole("combobox");
      await userEvent.clear(input);
      await userEvent.type(input, "zzz_inexistente");
      await waitFor(() => {
        expect(canvas.getByText("Nenhum resultado encontrado.")).toBeInTheDocument();
      });
    });

    await step("limpar busca restaura todos os itens", async () => {
      const input = canvas.getByRole("combobox");
      await userEvent.clear(input);
      await waitFor(() => {
        expect(canvas.getByText("Button")).toBeInTheDocument();
      });
    });
  },
};

// ─── CommandPalette (CommandDialog) ──────────────────────────────────────────

export const CommandPaletteDialog: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Pressione</span>
          <kbd className="rounded border px-1.5 py-0.5 text-xs font-mono bg-muted">⌘K</kbd>
        </div>
        <Button
          variant="outline"
          onClick={() => setOpen(true)}
          aria-label="Abrir command palette"
        >
          <SearchIcon />
          Buscar
        </Button>
        <CommandDialog
          open={open}
          onOpenChange={setOpen}
          title="Command Palette"
          description="Busque por um comando ou ação..."
        >
          <Command>
            <CommandInput placeholder="Buscar componente..." />
            <CommandList>
              <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
              <CommandGroup heading="Componentes">
                <CommandItem value="button" onSelect={() => setOpen(false)}>
                  <LayoutIcon />
                  Button
                  <CommandShortcut>⌘B</CommandShortcut>
                </CommandItem>
                <CommandItem value="input" onSelect={() => setOpen(false)}>
                  <TypeIcon />
                  Input
                  <CommandShortcut>⌘I</CommandShortcut>
                </CommandItem>
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup heading="Utilitários">
                <CommandItem value="separator" onSelect={() => setOpen(false)}>
                  <MinusIcon />
                  Separator
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </CommandDialog>
      </div>
    );
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);

    await step("botão de abertura está presente", async () => {
      const btn = canvas.getByRole("button", { name: /Abrir command palette/i });
      await expect(btn).toBeInTheDocument();
    });

    await step("clicar no botão abre o dialog", async () => {
      const btn = canvas.getByRole("button", { name: /Abrir command palette/i });
      await userEvent.click(btn);
      const dialog = await waitForPortal("dialog");
      await expect(dialog).toBeVisible();
    });

    await step("Escape fecha o dialog", async () => {
      await userEvent.keyboard("{Escape}");
      await waitFor(() => {
        const dialog = body.queryByRole("dialog");
        if (dialog && dialog.getAttribute("data-state") !== "closed") {
          throw new Error("dialog ainda aberto");
        }
      });
    });
  },
};
