import type { Meta, StoryObj } from "@storybook/react";
import { userEvent, within, expect, waitFor } from "storybook/test";
import { useState } from "react";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import {
  LayoutIcon,
  TypeIcon,
  MinusIcon,
  SearchIcon,
  CheckIcon,
  ChevronsUpDownIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const meta = {
  title: "UI/Command/Composições",
  component: Command,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Composições do Command: com grupos, com shortcuts, como combobox em Popover e como command palette em CommandDialog.",
      },
    },
  },
} satisfies Meta<typeof Command>;

export default meta;
type Story = StoryObj<typeof meta>;

// ─── Com Grupos e Separador ───────────────────────────────────────────────────

export const ComGrupos: Story = {
  name: "Com Grupos e Separador",
  render: () => (
    <div className="w-72">
      <Command>
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

    await step("dois grupos são renderizados", async () => {
      const groups = canvasElement.querySelectorAll("[data-slot='command-group']");
      await expect(groups.length).toBe(2);
    });

    await step("separador está presente", async () => {
      const separator = canvasElement.querySelector("[data-slot='command-separator']");
      await expect(separator).toBeInTheDocument();
    });
  },
};

// ─── Com Shortcuts ────────────────────────────────────────────────────────────

export const ComShortcuts: Story = {
  name: "Com Shortcuts",
  render: () => (
    <div className="w-72">
      <Command>
        <CommandInput placeholder="Buscar componente..." />
        <CommandList>
          <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
          <CommandGroup heading="Componentes">
            <CommandItem value="button">
              <LayoutIcon />
              Button
              <CommandShortcut>⌘B</CommandShortcut>
            </CommandItem>
            <CommandItem value="input">
              <TypeIcon />
              Input
              <CommandShortcut>⌘I</CommandShortcut>
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Utilitários">
            <CommandItem value="separator">
              <MinusIcon />
              Separator
              <CommandShortcut>⌘S</CommandShortcut>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("shortcuts são renderizados nos itens", async () => {
      const shortcuts = canvasElement.querySelectorAll("[data-slot='command-shortcut']");
      await expect(shortcuts.length).toBe(3);
    });

    await step("shortcut do Button exibe ⌘B", async () => {
      await expect(canvas.getByText("⌘B")).toBeInTheDocument();
    });
  },
};

// ─── Como Combobox (em Popover) ───────────────────────────────────────────────

const FRAMEWORKS = [
  { value: "react", label: "React" },
  { value: "vue", label: "Vue" },
  { value: "svelte", label: "Svelte" },
  { value: "angular", label: "Angular" },
  { value: "solid", label: "SolidJS" },
];

export const ComoCombobox: Story = {
  name: "Como Combobox (em Popover)",
  render: () => {
    const [open, setOpen] = useState(false);
    const [value, setValue] = useState("");

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-56 justify-between"
          >
            {value
              ? FRAMEWORKS.find((f) => f.value === value)?.label
              : "Selecione um item..."}
            <ChevronsUpDownIcon className="opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-0">
          <Command>
            <CommandInput placeholder="Buscar item..." />
            <CommandList>
              <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
              <CommandGroup>
                {FRAMEWORKS.map((framework) => (
                  <CommandItem
                    key={framework.value}
                    value={framework.value}
                    onSelect={(currentValue) => {
                      setValue(currentValue === value ? "" : currentValue);
                      setOpen(false);
                    }}
                  >
                    {framework.label}
                    <CheckIcon
                      className={cn(
                        "ml-auto",
                        value === framework.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);

    await step("trigger exibe placeholder inicial", async () => {
      const trigger = canvas.getByRole("combobox");
      await expect(trigger).toHaveTextContent("Selecione um item...");
    });

    await step("clicar no trigger abre o popover", async () => {
      const trigger = canvas.getByRole("combobox");
      await userEvent.click(trigger);
      await waitFor(() => {
        expect(body.getByText("React")).toBeInTheDocument();
      });
    });

    await step("selecionar item fecha o popover e atualiza o trigger", async () => {
      const reactItem = body.getByText("React");
      await userEvent.click(reactItem);
      await waitFor(() => {
        expect(canvas.getByRole("combobox")).toHaveTextContent("React");
      });
    });
  },
};

// ─── Command Palette (em CommandDialog) ──────────────────────────────────────

export const CommandPalette: Story = {
  name: "Command Palette (em CommandDialog)",
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
      const btn = canvas.getByRole("button", { name: /Buscar/i });
      await expect(btn).toBeInTheDocument();
    });

    await step("clicar no botão abre o dialog", async () => {
      const btn = canvas.getByRole("button", { name: /Buscar/i });
      await userEvent.click(btn);
      const dialog = await body.findByRole("dialog");
      await expect(dialog).toBeVisible();
    });

    await step("CommandInput está com foco após abertura", async () => {
      const input = body.getByRole("combobox");
      await expect(input).toBeInTheDocument();
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
