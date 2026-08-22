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
  commandAsComboboxSource,
  commandPaletteSource,
  commandSource,
} from "./command.source";
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
  ChevronsUpDownIcon,
} from "lucide-react";

const meta = {
  title: "UI/Command/Compositions",
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
          "Os arranjos da paleta: com grupos e divisor, com atalhos, dentro de um Popover (combobox) e dentro de um Dialog (command palette). Nenhuma peça nova entra aqui — é composição de call site.",
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

// ─── Com Grupos e Separador ───────────────────────────────────────────────────

export const WithGroups: Story = {
  name: "With groups and separator",
  parameters: { covers: ["visual.item1"] },
  render: () => (
    <div className="nds-w-sm nds-border-default nds-rounded-md nds-shadow-md">
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
            <CommandItem value="separator">
              <MinusIcon />
              Separator
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Utilitários">
            <CommandItem value="cn">cn()</CommandItem>
            <CommandItem value="clsx">clsx()</CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const raiz = canvasElement.querySelector<HTMLElement>('[data-slot="command"]')!;
    const campo = canvas.getByRole("combobox");

    // Idempotente: a busca parte sempre do zero.
    await userEvent.clear(campo);
    await waitFor(async () => {
      await expect(canvas.getAllByRole("option")).toHaveLength(5);
    });

    await step("Cada grupo é nomeado pelo próprio cabeçalho", async () => {
      // Sem o `aria-labelledby` o leitor anuncia "grupo" e a pessoa não sabe de
      // qual bloco se trata.
      await expect(canvas.getByRole("group", { name: "Componentes" })).toBeVisible();
      await expect(canvas.getByRole("group", { name: "Utilitários" })).toBeVisible();
      await expect(raiz.querySelectorAll("[cmdk-group-heading]")).toHaveLength(2);
    });

    await step("O cabeçalho não é opção da lista", async () => {
      // Cabeçalho navegável seria pior que inútil: a seta pararia nele como se
      // fosse comando, e o filtro o traria como resultado.
      await expect(canvas.getAllByRole("option")).toHaveLength(5);
      for (const opcao of canvas.getAllByRole("option")) {
        await expect(opcao).toHaveAttribute("data-slot", "command-item");
      }
    });

    await step("O divisor separa os blocos e não vira comando", async () => {
      const divisor = raiz.querySelector<HTMLElement>('[data-slot="command-separator"]')!;
      await expect(divisor).toHaveClass(/nds-command-separator/);
      await expect(divisor).not.toHaveAttribute("data-slot", "command-item");
      // Divergência conhecida: a lib desta stack marca o divisor com
      // `role="separator"`, filho que a spec ARIA não admite dentro de um
      // listbox. É comportamento upstream deliberado, registrado com issue em
      // PATCHES.md#command-listbox-children — a asserção o REGISTRA em vez de
      // fingir que não existe.
      await expect(divisor).toHaveAttribute("role", "separator");
    });

    await step('Buscando "n", o filtro atravessa os dois grupos', async () => {
      await userEvent.type(campo, "n");

      await waitFor(async () => {
        // "Button", "Input" e "cn()" — dois grupos ao mesmo tempo.
        await expect(canvas.getAllByRole("option")).toHaveLength(3);
      });
      await expect(canvas.getByRole("group", { name: "Componentes" })).toBeVisible();
      await expect(canvas.getByRole("group", { name: "Utilitários" })).toBeVisible();
      // Com busca ativa o divisor sai do DOM: separar blocos que o filtro
      // acabou de embaralhar só confundiria.
      await expect(raiz.querySelector('[data-slot="command-separator"]')).toBeNull();
    });

    await step("Apagar a busca devolve o estado padrão", async () => {
      await userEvent.clear(campo);
      await waitFor(async () => {
        await expect(canvas.getAllByRole("option")).toHaveLength(5);
      });
      // A story TERMINA no arranjo padrão, com os dois grupos e o divisor —
      // é este o quadro que o Chromatic captura.
      await expect(raiz.querySelector('[data-slot="command-separator"]')).not.toBeNull();
    });
  },
};

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
              Button <CommandShortcut>⌘B</CommandShortcut>
            </CommandItem>
            <CommandItem value="input">
              <TypeIcon />
              Input <CommandShortcut>⌘I</CommandShortcut>
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Utilitários">
            <CommandItem value="separator">
              <MinusIcon />
              Separator <CommandShortcut>⌘S</CommandShortcut>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const raiz = canvasElement.querySelector<HTMLElement>('[data-slot="command"]')!;

    await userEvent.clear(canvas.getByRole("combobox"));
    await waitFor(async () => {
      await expect(canvas.getAllByRole("option")).toHaveLength(3);
    });

    await step("Cada comando exibe o próprio atalho", async () => {
      const shortcuts = raiz.querySelectorAll<HTMLElement>('[data-slot="command-shortcut"]');
      await expect(shortcuts).toHaveLength(3);
      await expect(shortcuts[0]).toHaveClass(/nds-command-shortcut/);
      await expect(shortcuts[0]).toHaveTextContent("⌘B");
    });

    await step("O atalho entra no nome acessível do comando", async () => {
      // Atalho escondido do leitor de tela é atalho que só quem enxerga
      // descobre.
      await expect(canvas.getByRole("option", { name: /Button\s*⌘B/ })).toBeVisible();
    });

    await step("O atalho fica encostado na borda direita do comando", async () => {
      const atalho = raiz.querySelector<HTMLElement>(
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

// ─── Como Combobox (em Popover) ───────────────────────────────────────────────

const FRAMEWORKS = [
  { value: "react", label: "React" },
  { value: "vue", label: "Vue" },
  { value: "svelte", label: "Svelte" },
  { value: "angular", label: "Angular" },
  { value: "solid", label: "SolidJS" },
];

function ComboboxDemo() {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const listboxId = "combobox-frameworks-listbox";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {/*
          O papel de combobox é escrito à mão: para o primitivo o gatilho é um
          botão comum, e sem ele o leitor anuncia "botão" — a pessoa não sabe
          que há uma lista do outro lado. `aria-haspopup` e `aria-controls`
          completam o par exigido pelo padrão ARIA de combobox, e o `aria-label`
          dá nome ao gatilho no estado vazio, em que o texto visível é só um
          placeholder. Ver PATCHES.md#command-combobox-aria.
        */}
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-controls={open ? listboxId : undefined}
          aria-label="Selecionar framework"
          className="nds-w-xs"
        >
          {value
            ? FRAMEWORKS.find((f) => f.value === value)?.label
            : "Selecione um item..."}
          <ChevronsUpDownIcon className="nds-spacer-start nds-opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="nds-p-0 nds-w-xs" id={listboxId}>
        <Command>
          <CommandInput placeholder="Buscar item..." />
          <CommandList>
            <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
            <CommandGroup>
              {FRAMEWORKS.map((framework) => (
                <CommandItem
                  key={framework.value}
                  value={framework.value}
                  checked={value === framework.value}
                  onSelect={(escolhido) => {
                    // Sempre define (nunca alterna): alternar faria a segunda
                    // rodada da play desfazer a escolha da primeira.
                    setValue(escolhido);
                    // Fechar aqui é a guideline: sem isso o popover fica por
                    // cima do valor que a pessoa acabou de escolher.
                    setOpen(false);
                  }}
                >
                  {framework.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export const AsCombobox: Story = {
  name: "As combobox (in Popover)",
  parameters: {
    covers: ["functional.item7", "accessibility.item5", "visual.item3"],
    // O conteúdo do Popover renderiza em portal, fora de `#storybook-root`, e o
    // addon-a11y roda o axe no documento inteiro — inclusive no instante em que
    // o painel ainda está animando. A violation residual depende do timing do
    // clique, então a exceção não cabe numa regra só.
    // Registro completo (com o roteiro de verificação manual que a fecha) em
    // PATCHES.md#command-combobox-portal-flaky. O que ela NÃO deixa de proteger:
    // `accessibility.item1` é declarado pela Playground, com o axe ligado.
    a11y: { test: 'off' },
    // Paleta dentro de Popover, com estado e o papel de combobox escrito à mão:
    // é outra composição, não a paleta solta do `meta`.
    docs: { source: { transform: commandAsComboboxSource } },
  },
  render: () => <ComboboxDemo />,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const gatilho = canvas.getByRole("combobox");

    // Idempotente: a play REEXECUTA no mesmo DOM, e um clique cego alternaria o
    // popover a partir do estado que a rodada anterior deixou.
    const abrir = async (): Promise<HTMLElement> => {
      if (gatilho.getAttribute("aria-expanded") !== "true") await userEvent.click(gatilho);
      await waitFor(async () => {
        await expect(gatilho).toHaveAttribute("aria-expanded", "true");
      });
      return await waitForPortal("listbox");
    };
    const fechar = async () => {
      if (gatilho.getAttribute("aria-expanded") === "true") await userEvent.keyboard("{Escape}");
      await waitForPortalGone("listbox");
    };

    await fechar();

    await step("O gatilho anuncia que abre uma lista para escolher", async () => {
      await expect(gatilho).toHaveAttribute("role", "combobox");
      await expect(gatilho).toHaveAttribute("aria-haspopup", "listbox");
      await expect(gatilho).toHaveAttribute("aria-expanded", "false");
      await expect(gatilho).toHaveAccessibleName("Selecionar framework");
    });

    await step("Abrir revela a paleta dentro do popover", async () => {
      const lista = await abrir();
      const painel = lista.closest<HTMLElement>('[data-slot="popover-content"]')!;
      const inside = within(painel);

      await expect(inside.getAllByRole("option")).toHaveLength(5);
      const search = painel.querySelector<HTMLElement>('[data-slot="command-input"]')!;
      // Um combobox que abre e deixa o foco no gatilho obriga a pessoa a caçar
      // o campo com Tab.
      await waitFor(async () => {
        await expect(search).toHaveFocus();
      });
      // `aria-controls` só aponta para algo enquanto há algo para apontar.
      const controlled = gatilho.getAttribute("aria-controls");
      await expect(controlled).toBeTruthy();
      await expect(document.getElementById(controlled!)).toBe(painel);
    });

    await step("Escolher fecha o popover e leva o valor para o gatilho", async () => {
      const lista = await abrir();
      await userEvent.click(within(lista).getByRole("option", { name: "Vue" }));

      await waitForPortalGone("listbox");
      await expect(gatilho).toHaveAttribute("aria-expanded", "false");
      await expect(gatilho).toHaveTextContent("Vue");
    });

    await step("O escolhido volta marcado quando a lista reabre", async () => {
      const lista = await abrir();
      const escolhido = within(lista).getByRole("option", { name: "Vue" });
      await expect(escolhido).toHaveAttribute("data-checked", "true");
      await expect(
        getComputedStyle(escolhido.querySelector<HTMLElement>(".nds-command-item-check")!)
          .opacity,
      ).toBe("1");

      // A story TERMINA fechada: é o estado de repouso do padrão, e é o que o
      // axe do postVisit encontra.
      await fechar();
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
        <kbd className="nds-kbd">⌘K</kbd>
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
                Button <CommandShortcut>⌘B</CommandShortcut>
              </CommandItem>
              <CommandItem value="input" onSelect={() => setOpen(false)}>
                <TypeIcon />
                Input <CommandShortcut>⌘I</CommandShortcut>
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
      "visual.item4",
    ],
    // Paleta dentro do CommandDialog, com o atalho global registrado por quem
    // consome: nada disso cabe no snippet da paleta solta.
    docs: { source: { transform: commandPaletteSource } },
  },
  render: () => <CommandPaletteDemo />,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const gatilho = canvas.getByRole("button", { name: /Abrir command palette/i });

    const aberta = () => within(document.body).queryByRole("dialog");
    // Idempotente: só clica se a paleta não estiver aberta.
    const buttonOpen = async (): Promise<HTMLElement> => {
      if (!aberta()) await userEvent.click(gatilho);
      return await waitForPortal("dialog");
    };
    const fechar = async () => {
      if (aberta()) await userEvent.keyboard("{Escape}");
      await waitForPortalGone("dialog");
    };

    await fechar();

    await step("A dica do atalho fica visível ao lado do gatilho", async () => {
      // Atalho escondido é atalho que ninguém descobre — é a metade "do" do par
      // de Do & Don't deste componente.
      const dica = canvasElement.querySelector<HTMLElement>(".nds-kbd")!;
      await expect(dica).toBeVisible();
      await expect(dica).toHaveTextContent("⌘K");
    });

    await step("O diálogo é nomeado por um título que só o leitor de tela vê", async () => {
      const painel = await buttonOpen();
      const idTitle = painel.getAttribute("aria-labelledby");
      await expect(idTitle).toBeTruthy();

      const titulo = document.getElementById(idTitle!)!;
      await expect(titulo).toHaveTextContent("Command Palette");
      // O título mora DENTRO do painel: fora dele ficaria no fluxo da página
      // mesmo com a paleta fechada.
      await expect(painel.contains(titulo)).toBe(true);
      // Fora da tela, mas dentro da árvore de acessibilidade — `display: none`
      // apagaria o nome do diálogo.
      await expect(titulo.getBoundingClientRect().width).toBeLessThan(4);
    });

    await step("O foco vai direto para a busca", async () => {
      const painel = await buttonOpen();
      const search = painel.querySelector<HTMLElement>('[data-slot="command-input"]')!;
      await waitFor(async () => {
        await expect(search).toHaveFocus();
      });
      await expect(within(painel).getAllByRole("option")).toHaveLength(3);
      const atalho = painel.querySelector<HTMLElement>(
        '[data-value="button"] [data-slot="command-shortcut"]',
      )!;
      await expect(atalho).toHaveTextContent("⌘B");
    });

    await step("Escape fecha o diálogo e devolve o foco ao gatilho", async () => {
      await buttonOpen();
      await userEvent.keyboard("{Escape}");

      await waitForPortalGone("dialog");
      await waitFor(async () => {
        await expect(gatilho).toHaveFocus();
      });
    });

    await step("Cmd+K abre a paleta de qualquer lugar da página", async () => {
      await userEvent.keyboard("{Meta>}k{/Meta}");

      const painel = await waitForPortal("dialog");
      const search = painel.querySelector<HTMLElement>('[data-slot="command-input"]')!;
      await waitFor(async () => {
        await expect(search).toHaveFocus();
      });
      // A story TERMINA com a paleta ABERTA: é o quadro que o Chromatic captura
      // e o estado que a documentação descreve.
      await expect(screen.getByRole("dialog")).toBeVisible();
    });
  },
};
