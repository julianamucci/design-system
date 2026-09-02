import type { Meta, StoryObj } from "@storybook/react-vite";
import { userEvent, within, expect, waitFor, screen } from "storybook/test";
import { waitForPortal, waitForPortalGone } from "@/lib/wait-for-portal";
import { useEffect, useState } from "react";
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
  commandWithShortcutsSource,
  commandPaletteSource,
  commandSource,
} from "./command.source";
import { Button } from "@/components/ui/button";
import {
  LayoutIcon,
  TypeIcon,
  MinusIcon,
  SearchIcon,
} from "lucide-react";

const meta = {
  title: "Primitives/Overlay/Command/Compositions",
  tags: ["overlay"],
  component: Command,
  parameters: {
    layout: "centered",
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: commandSource },
      description: {
        component:
          "Os arranjos da paleta: com grupos e divisor, com atalhos, e dentro de um Dialog (command palette). Nenhuma peça nova entra aqui — é composição de call site.",
      },
    },
    // Filhos auxiliares dentro do listbox — ver PATCHES.md#command-listbox-children
    a11y: {
      config: {
        rules: [{ id: 'aria-required-children', enabled: false }],
      },
    },
  },
} satisfies Meta<typeof Command>;

export default meta;
type Story = StoryObj<typeof meta>;

// ─── Com Shortcuts ────────────────────────────────────────────────────────────

export const WithShortcuts: Story = {
  // O atalho dentro do comando é a peça do exemplo, e o snippet do `meta` não
  // a mostra.
  parameters: {
    docs: { source: { transform: commandWithShortcutsSource } },
  },
  render: () => (
    <div className="nds-w-sm nds-border-default nds-rounded-md nds-shadow-md">
      <Command>
        <CommandInput placeholder="Buscar componente..." />
        <CommandList>
          <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
          <CommandGroup heading="Componentes">
            <CommandItem value="button">
              <LayoutIcon />
              Button <CommandShortcut>Ctrl+B</CommandShortcut>
            </CommandItem>
            <CommandItem value="input">
              <TypeIcon />
              Input <CommandShortcut>Ctrl+I</CommandShortcut>
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Utilitários">
            <CommandItem value="separator">
              <MinusIcon />
              Separator <CommandShortcut>Ctrl+S</CommandShortcut>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="command"]')!;

    await userEvent.clear(canvas.getByRole("combobox"));
    await waitFor(async () => {
      await expect(canvas.getAllByRole("option")).toHaveLength(3);
    });

    await step("Cada comando exibe o próprio atalho", async () => {
      const shortcuts = root.querySelectorAll<HTMLElement>('[data-slot="command-shortcut"]');
      await expect(shortcuts).toHaveLength(3);
      await expect(shortcuts[0]).toHaveClass(/nds-command-shortcut/);
      await expect(shortcuts[0]).toHaveTextContent("Ctrl+B");
    });

    await step("O atalho entra no nome acessível do comando", async () => {
      // Atalho escondido do leitor de tela é atalho que só quem enxerga
      // descobre.
      await expect(canvas.getByRole("option", { name: /Button\s*Ctrl\+B/ })).toBeVisible();
    });

    await step("O atalho fica encostado na borda direita do comando", async () => {
      const atalho = root.querySelector<HTMLElement>(
        '[data-value="button"] [data-slot="command-shortcut"]',
      )!;
      const boxComando = atalho
        .closest<HTMLElement>('[data-slot="command-item"]')!
        .getBoundingClientRect();
      const boxShortcut = atalho.getBoundingClientRect();
      await expect(boxComando.right - boxShortcut.right).toBeLessThan(
        boxShortcut.left - boxComando.left,
      );
    });
  },
};

// ─── Command Palette (em CommandDialog) ──────────────────────────────────────

function CommandPaletteDemo() {
  const [open, setOpen] = useState(false);

  // O Cmd+K não é nativo de componente nenhum — é um listener de janela, e é o
  // consumidor que o registra. O cleanup não é detalhe: sem ele o listener
  // sobrevive à troca de story e passa a abrir uma paleta que já saiu da tela.
  useEffect(() => {
    const onKeyDown = (evento: KeyboardEvent) => {
      if (evento.key.toLowerCase() !== "k") return;
      if (!evento.metaKey && !evento.ctrlKey) return;
      // Sem isto o navegador leva o Cmd+K para a barra de endereço.
      evento.preventDefault();
      setOpen(true);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div className="nds-stack" data-spacing="md">
      <div
        className="nds-cluster nds-text-body nds-text-muted-foreground"
        data-align="center"
        data-spacing="sm"
      >
        <span>Pressione</span>
        <kbd className="nds-kbd">Ctrl+K</kbd>
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
                Button <CommandShortcut>Ctrl+B</CommandShortcut>
              </CommandItem>
              <CommandItem value="input" onSelect={() => setOpen(false)}>
                <TypeIcon />
                Input <CommandShortcut>Ctrl+I</CommandShortcut>
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
}

export const CommandPalette: Story = {
  name: "Command palette (in CommandDialog)",
  parameters: {
    covers: [
      "functional.item3",
      "functional.item6",
      "accessibility.item3",
      "visual.item3",
    ],
    // Paleta dentro do CommandDialog, com o atalho global registrado por quem
    // consome: nada disso cabe no snippet da paleta solta.
    docs: { source: { transform: commandPaletteSource } },
  },
  render: () => <CommandPaletteDemo />,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("button", { name: /Abrir command palette/i });

    const aberta = () => within(document.body).queryByRole("dialog");
    // Idempotente: só clica se a paleta não estiver aberta.
    const buttonOpen = async (): Promise<HTMLElement> => {
      if (!aberta()) await userEvent.click(trigger);
      return await waitForPortal("dialog");
    };
    const close = async () => {
      if (aberta()) await userEvent.keyboard("{Escape}");
      await waitForPortalGone("dialog");
    };

    await close();

    await step("A dica do atalho fica visível ao lado do gatilho", async () => {
      // Atalho escondido é atalho que ninguém descobre — é a metade "do" do par
      // de Do & Don't deste componente.
      const dica = canvasElement.querySelector<HTMLElement>(".nds-kbd")!;
      await expect(dica).toBeVisible();
      await expect(dica).toHaveTextContent("Ctrl+K");
    });

    await step("O diálogo é nomeado por um título que só o leitor de tela vê", async () => {
      const panel = await buttonOpen();
      const idTitle = panel.getAttribute("aria-labelledby");
      await expect(idTitle).toBeTruthy();

      const title = document.getElementById(idTitle!)!;
      await expect(title).toHaveTextContent("Command Palette");
      // O título mora DENTRO do painel: fora dele ficaria no fluxo da página
      // mesmo com a paleta fechada.
      await expect(panel.contains(title)).toBe(true);
      // Fora da tela, mas dentro da árvore de acessibilidade — `display: none`
      // apagaria o nome do diálogo.
      await expect(title.getBoundingClientRect().width).toBeLessThan(4);
    });

    await step("O foco vai direto para a busca", async () => {
      const panel = await buttonOpen();
      const search = panel.querySelector<HTMLElement>('[data-slot="command-input"]')!;
      await waitFor(async () => {
        await expect(search).toHaveFocus();
      });
      await expect(within(panel).getAllByRole("option")).toHaveLength(3);
      const atalho = panel.querySelector<HTMLElement>(
        '[data-value="button"] [data-slot="command-shortcut"]',
      )!;
      await expect(atalho).toHaveTextContent("Ctrl+B");
    });

    await step("Escape fecha o diálogo e devolve o foco ao gatilho", async () => {
      await buttonOpen();
      await userEvent.keyboard("{Escape}");

      await waitForPortalGone("dialog");
      await waitFor(async () => {
        await expect(trigger).toHaveFocus();
      });
    });

    await step("Cmd+K abre a paleta de qualquer lugar da página", async () => {
      await userEvent.keyboard("{Meta>}k{/Meta}");

      const panel = await waitForPortal("dialog");
      const search = panel.querySelector<HTMLElement>('[data-slot="command-input"]')!;
      await waitFor(async () => {
        await expect(search).toHaveFocus();
      });
      // A story TERMINA com a paleta ABERTA: é o quadro que o Chromatic captura
      // e o estado que a documentação descreve.
      await expect(screen.getByRole("dialog")).toBeVisible();
    });
  },
};
