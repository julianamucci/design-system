import type { Meta, StoryObj } from "@storybook/react-vite";
import { userEvent, within, expect, waitFor, fn } from "storybook/test";
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
  commandWithSeparatorSource,
  commandWithShortcutsSource,
  commandWithDisabledItemsSource,
  commandPaletteSource,
  commandSource,
} from "./command.source";
import { Button } from "@/components/ui/button";

import { figmaDesign } from "@shared/figma/design-links";
const meta = {
  title: "Components/Overlay/Command/Compositions",
  tags: ["overlay"],
  component: Command,
  parameters: {
    design: figmaDesign("command"),
    layout: "centered",
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: commandSource },
      description: {
        component:
          "As composições da paleta: com traço declarado, com atalhos, com itens desabilitados e a paleta dentro de um Dialog (padrão command palette). Nenhuma peça nova entra aqui — é composição de call site. A lista dividida em grupos é variante e mora em Variants; a lista longa é estado e mora em States.",
      },
    },
  },
} satisfies Meta<typeof Command>;

export default meta;
type Story = StoryObj<typeof meta>;

const FRAME = "nds-w-sm nds-border-default nds-rounded-md nds-shadow-md";
const NO_RESULT = "Nenhum resultado encontrado.";

/** O item pelo `value`, e não pelo nome acessível: atalho e marca entram no nome. */
const commandByValue = (root: ParentNode, value: string) =>
  root.querySelector<HTMLElement>(`[data-slot="command-item"][data-value="${value}"]`)!;

const separators = (root: ParentNode) =>
  root.querySelectorAll<HTMLElement>('[data-slot="command-separator"]');

/**
 * O item em destaque, por `aria-selected` e não por `aria-activedescendant`:
 * medido na fonte do `cmdk`, o id só é reescrito quando o valor muda de fato.
 */
const inHighlight = (root: ParentNode) =>
  root.querySelector<HTMLElement>('[role="option"][aria-selected="true"]');

// ─── Com traço declarado ──────────────────────────────────────────────────────
//
// O traço não precisa de grupo NOMEADO: uma lista plana separa "o que se faz
// com o arquivo" de "o que encerra a sessão" sem inventar um nome para cada
// bloco. Cada bloco mora num grupo sem cabeçalho — a forma da fábrica do
// Vanilla, que põe o traço entre duas caixas `.nds-command-group` sem papel.

export const WithSeparator: Story = {
  parameters: {
    docs: {
      // O traço numa lista sem grupos é o assunto, e a lista do `meta` não o
      // tem: sem override o snippet esconderia o que a story mostra.
      source: { transform: commandWithSeparatorSource },
      description: {
        story:
          "Traço entre dois blocos de uma lista sem grupos. Ele some junto com os comandos quando o filtro esvazia um dos lados, porque não sobra fronteira para marcar.",
      },
    },
  },
  render: () => (
    <div className={FRAME}>
      <Command>
        <CommandInput placeholder="Buscar comando..." />
        <CommandList>
          <CommandGroup>
            <CommandItem value="novo">Novo arquivo</CommandItem>
            <CommandItem value="abrir">Abrir recente</CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup>
            <CommandItem value="sair">Sair</CommandItem>
          </CommandGroup>
        </CommandList>
        <CommandEmpty>{NO_RESULT}</CommandEmpty>
      </Command>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByRole("combobox");

    await userEvent.clear(field);
    await waitFor(async () => {
      await expect(canvas.getAllByRole("option")).toHaveLength(3);
    });

    await step("O traço declarado divide a lista plana em dois blocos", async () => {
      await expect(separators(canvasElement)).toHaveLength(1);
      // Dentro de um listbox a linha é decorativa: só `option` e `group` são
      // filhos permitidos.
      await expect(separators(canvasElement)[0]).toHaveAttribute("aria-hidden", "true");
      await expect(canvas.queryAllByRole("separator")).toHaveLength(0);
      // Nenhum cabeçalho: a divisão aqui não veio de grupo nomeado. As duas
      // caixas existem, e nenhuma se anuncia como grupo sem nome.
      await expect(canvasElement.querySelectorAll("[cmdk-group-heading]")).toHaveLength(0);
      await expect(
        canvasElement.querySelectorAll('[data-slot="command-group"]'),
      ).toHaveLength(2);
      await expect(canvas.queryAllByRole("group")).toHaveLength(0);
    });

    await step("Filtrando até sobrar um lado só, o traço vai junto", async () => {
      await userEvent.type(field, "sair");
      await waitFor(async () => {
        await expect(canvas.getAllByRole("option")).toHaveLength(1);
      });
      await expect(separators(canvasElement)).toHaveLength(0);
    });

    await step("A story termina no estado padrão", async () => {
      await userEvent.clear(field);
      await waitFor(async () => {
        await expect(canvas.getAllByRole("option")).toHaveLength(3);
      });
      await expect(separators(canvasElement)).toHaveLength(1);
    });
  },
};

// ─── Com atalhos ──────────────────────────────────────────────────────────────

export const WithShortcuts: Story = {
  // O atalho dentro do comando é a peça do exemplo, e o snippet do `meta` não
  // a mostra.
  parameters: {
    docs: { source: { transform: commandWithShortcutsSource } },
  },
  render: () => (
    <div className={FRAME}>
      <Command>
        <CommandInput placeholder="Buscar comando..." />
        <CommandList>
          <CommandGroup heading="Arquivo">
            <CommandItem value="novo">
              Novo arquivo <CommandShortcut>Ctrl+N</CommandShortcut>
            </CommandItem>
            <CommandItem value="abrir">
              Abrir <CommandShortcut>Ctrl+O</CommandShortcut>
            </CommandItem>
            <CommandItem value="salvar">
              Salvar <CommandShortcut>Ctrl+S</CommandShortcut>
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Aplicativo">
            <CommandItem value="preferencias">Preferências</CommandItem>
          </CommandGroup>
        </CommandList>
        <CommandEmpty>{NO_RESULT}</CommandEmpty>
      </Command>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByRole("combobox");

    await userEvent.clear(field);
    await waitFor(async () => {
      await expect(canvas.getAllByRole("option")).toHaveLength(4);
    });

    await step("O atalho aparece à direita do comando", async () => {
      const save = commandByValue(canvasElement, "salvar");
      const atalho = save.querySelector<HTMLElement>('[data-slot="command-shortcut"]')!;
      await expect(atalho).toHaveTextContent("Ctrl+S");
      await expect(atalho).toHaveClass(/nds-command-shortcut/);

      const boxItem = save.getBoundingClientRect();
      const boxShortcut = atalho.getBoundingClientRect();
      await expect(boxItem.right - boxShortcut.right).toBeLessThan(
        boxShortcut.left - boxItem.left,
      );
    });

    await step("O atalho faz parte do nome do comando", async () => {
      // Sem isso o leitor anunciaria "Salvar" e a pessoa nunca saberia que há
      // uma tecla — o atalho é informação, não decoração.
      const save = commandByValue(canvasElement, "salvar");
      const atalho = save.querySelector<HTMLElement>('[data-slot="command-shortcut"]')!;
      await expect(atalho.getAttribute("aria-hidden")).toBeNull();
      await expect(save).toHaveAccessibleName(/Ctrl\+S/);
    });

    await step("Comando sem atalho não ganha um espaço vazio", async () => {
      const preferencias = commandByValue(canvasElement, "preferencias");
      await expect(preferencias.querySelector('[data-slot="command-shortcut"]')).toBeNull();
    });

    await step('Buscando "sal" sobra 1 comando, com o atalho junto', async () => {
      await userEvent.type(field, "sal");
      await waitFor(async () => {
        await expect(canvas.getAllByRole("option")).toHaveLength(1);
      });
      await expect(
        commandByValue(canvasElement, "salvar").querySelector('[data-slot="command-shortcut"]'),
      ).not.toBeNull();

      await userEvent.clear(field);
      await waitFor(async () => {
        await expect(canvas.getAllByRole("option")).toHaveLength(4);
      });
    });

    await step('Buscando "arq" sobra "Novo arquivo": o filtro casa com o rótulo (C9)', async () => {
      // O valor do comando é `novo`; "arquivo" só existe no texto que se lê.
      // O filtro compara a busca com o valor E com o rótulo — quem procura
      // pelo que vê na tela tem de achar.
      await userEvent.type(field, "arq");
      await waitFor(async () => {
        await expect(canvas.getAllByRole("option")).toHaveLength(1);
      });
      await expect(commandByValue(canvasElement, "novo")).toBeVisible();

      await userEvent.clear(field);
      await waitFor(async () => {
        await expect(canvas.getAllByRole("option")).toHaveLength(4);
      });
    });

    await step('Buscando "ctrl" não sobra nenhum comando: o atalho não entra no filtro (C9)', async () => {
      // Os três atalhos começam por "Ctrl", e o texto deles está DENTRO do
      // comando (é o que o põe no nome acessível). O rótulo que vai ao filtro
      // pula o atalho: sem isso "ctrl" casaria com metade da paleta, e buscar
      // pela tecla viraria buscar por nada.
      await userEvent.type(field, "ctrl");
      await waitFor(async () => {
        await expect(canvas.queryAllByRole("option")).toHaveLength(0);
      });
      const emptyRegion = canvasElement.querySelector<HTMLElement>('[data-slot="command-empty"]')!;
      await expect(emptyRegion).toHaveAttribute("data-empty", "");
      await expect(emptyRegion).toHaveTextContent(NO_RESULT);

      // A story termina no estado padrão.
      await userEvent.clear(field);
      await waitFor(async () => {
        await expect(canvas.getAllByRole("option")).toHaveLength(4);
      });
    });
  },
};

// ─── Com itens desabilitados ──────────────────────────────────────────────────

const onListSelect = fn();

export const WithDisabledItems: Story = {
  parameters: {
    // Três comandos desabilitados espalhados pelos dois grupos: nenhuma lista
    // de outro snippet tem essa forma.
    docs: { source: { transform: commandWithDisabledItemsSource } },
  },
  render: () => (
    <div className={FRAME}>
      <Command>
        <CommandInput placeholder="Buscar..." />
        <CommandList>
          <CommandGroup heading="Componentes">
            <CommandItem value="button" onSelect={onListSelect}>Button</CommandItem>
            <CommandItem value="input" disabled onSelect={onListSelect}>Input</CommandItem>
            <CommandItem value="badge" onSelect={onListSelect}>Badge</CommandItem>
            <CommandItem value="select" disabled onSelect={onListSelect}>Select</CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Utilitários">
            <CommandItem value="cn" onSelect={onListSelect}>cn()</CommandItem>
            <CommandItem value="clsx" disabled onSelect={onListSelect}>clsx()</CommandItem>
          </CommandGroup>
        </CommandList>
        <CommandEmpty>{NO_RESULT}</CommandEmpty>
      </Command>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByRole("combobox");

    await userEvent.clear(field);
    await waitFor(async () => {
      await expect(canvas.getAllByRole("option")).toHaveLength(6);
    });

    await step("Os três desabilitados se declaram no markup", async () => {
      for (const value of ["input", "select", "clsx"]) {
        await expect(commandByValue(canvasElement, value)).toHaveAttribute("aria-disabled", "true");
      }
      // A lib desta stack escreve `aria-disabled="false"` no habilitado, em vez
      // de omitir o atributo — o que importa é ele não dizer "true".
      for (const value of ["button", "badge", "cn"]) {
        await expect(commandByValue(canvasElement, value)).not.toHaveAttribute(
          "aria-disabled",
          "true",
        );
      }
    });

    await step("A cada busca, o destaque cai no primeiro HABILITADO (D11)", async () => {
      // "t" casa com Button, Input e Select — os dois últimos desabilitados.
      // O destaque automático pula os dois: Enter nunca executa um comando
      // que a pessoa não poderia executar com o ponteiro.
      await userEvent.type(field, "t");
      await waitFor(async () => {
        await expect(canvas.getAllByRole("option")).toHaveLength(3);
      });
      await waitFor(async () => {
        await expect(inHighlight(canvasElement)).toHaveTextContent("Button");
      });
      await expect(inHighlight(canvasElement)).not.toHaveAttribute("aria-disabled", "true");

      // Busca que só casa com desabilitado não destaca nada — e Enter, sem
      // destaque, não executa nada.
      await userEvent.clear(field);
      await userEvent.type(field, "sel");
      await waitFor(async () => {
        await expect(canvas.getAllByRole("option")).toHaveLength(1);
      });
      await waitFor(async () => {
        await expect(inHighlight(canvasElement)).toBeNull();
      });
      const antes = onListSelect.mock.calls.length;
      await userEvent.keyboard("{Enter}");
      await new Promise((resolve) => setTimeout(resolve, 50));
      await expect(onListSelect.mock.calls.length).toBe(antes);

      await userEvent.clear(field);
      await waitFor(async () => {
        await expect(canvas.getAllByRole("option")).toHaveLength(6);
      });
    });

    await step("As setas percorrem só os 3 habilitados, em sequência", async () => {
      field.focus();
      // Home estabelece a precondição: destaque no primeiro comando habilitado,
      // em vez de herdar o de uma rodada anterior.
      await userEvent.keyboard("{Home}");
      await waitFor(async () => {
        await expect(inHighlight(canvasElement)).toHaveTextContent("Button");
      });

      for (const esperado of ["Badge", "cn()"]) {
        await userEvent.keyboard("{ArrowDown}");
        await waitFor(async () => {
          await expect(inHighlight(canvasElement)).toHaveTextContent(esperado);
        });
      }
      // Fim da lista: a seta não empurra o destaque para fora, não cai num
      // comando desabilitado e não volta ao primeiro.
      await userEvent.keyboard("{ArrowDown}");
      await expect(inHighlight(canvasElement)).toHaveTextContent("cn()");
      await expect(field).toHaveFocus();
    });

    await step("Clicar num desabilitado não executa nada", async () => {
      const antes = onListSelect.mock.calls.length;
      // `pointerEventsCheck: 0` porque a folha bloqueia o ponteiro: sem isso o
      // user-event recusa o clique antes de o componente ter chance de errar.
      await userEvent.click(commandByValue(canvasElement, "select"), { pointerEventsCheck: 0 });
      await expect(onListSelect.mock.calls.length).toBe(antes);
    });
  },
};

// ─── Command Palette (em CommandDialog) ──────────────────────────────────────

// Espião de escopo de módulo: este arquivo desliga a aba Actions. As asserções
// são relativas à contagem do início do passo, para sobreviver ao replay.
const onRunCommand = fn();

function CommandPaletteStory() {
  const [open, setOpen] = useState(false);

  // O Cmd+K não é nativo de componente nenhum — é um listener de janela, e é o
  // consumidor que o registra. Ele só ABRE. O cleanup não é detalhe: sem ele o
  // listener sobrevive à troca de story e passa a abrir uma paleta que já saiu
  // da tela.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== "k") return;
      if (!event.metaKey && !event.ctrlKey) return;
      // Sem isto o navegador leva o Cmd+K para a barra de endereço.
      event.preventDefault();
      setOpen(true);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Escolher executa E fecha: a paleta não se fecha sozinha, e deixá-la aberta
  // depois de executar o comando obrigaria a pessoa a dispensá-la à mão.
  const run = (value: string) => {
    onRunCommand(value);
    setOpen(false);
  };

  return (
    <>
      {/*
       * A dica do atalho mora DENTRO do gatilho, e o nome do botão sai do texto
       * visível ("Buscar Ctrl+K"). Um `aria-label` diferente do que se lê
       * quebraria quem comanda por voz (WCAG 2.5.3).
       *
       * O botão está FORA do `CommandDialog`, então o Dialog não o marca como
       * gatilho: `aria-haspopup` e `aria-expanded` são escritos aqui, como o
       * Dialog do Vanilla escreve no dele — quem chega pelo leitor de tela
       * ouve que o botão abre um diálogo, e se ele está aberto.
       */}
      <Button
        variant="outline"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        Buscar
        <kbd className="nds-kbd">Ctrl+K</kbd>
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
            <CommandGroup heading="Componentes">
              <CommandItem value="button" onSelect={run}>
                Button <CommandShortcut>Ctrl+B</CommandShortcut>
              </CommandItem>
              <CommandItem value="input" onSelect={run}>
                Input <CommandShortcut>Ctrl+I</CommandShortcut>
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Utilitários">
              <CommandItem value="cn" onSelect={run}>cn()</CommandItem>
            </CommandGroup>
          </CommandList>
          <CommandEmpty>{NO_RESULT}</CommandEmpty>
        </Command>
      </CommandDialog>
    </>
  );
}

export const CommandPalette: Story = {
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
  render: () => <CommandPaletteStory />,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("button", { name: /Buscar/ });

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

    await step("A dica do atalho fica visível DENTRO do gatilho", async () => {
      // Atalho escondido é atalho que ninguém descobre — é a metade "do" do par
      // de Do & Don't deste componente.
      const dica = trigger.querySelector<HTMLElement>("kbd")!;
      await expect(dica).toHaveClass(/nds-kbd/);
      await expect(dica).toHaveTextContent("Ctrl+K");
      await expect(dica).toBeVisible();
      // O nome do botão é o que se lê nele, dica incluída — sem `aria-label`.
      await expect(trigger).not.toHaveAttribute("aria-label");
      await expect(trigger).toHaveAccessibleName(/Buscar\s*Ctrl\+K/);
    });

    await step("O gatilho anuncia o diálogo que abre, e se ele está aberto", async () => {
      await expect(trigger).toHaveAttribute("aria-haspopup", "dialog");
      await expect(trigger).toHaveAttribute("aria-expanded", "false");
      await buttonOpen();
      await waitFor(async () => {
        await expect(trigger).toHaveAttribute("aria-expanded", "true");
      });
      await close();
      await waitFor(async () => {
        await expect(trigger).toHaveAttribute("aria-expanded", "false");
      });
    });

    await step("O diálogo é nomeado por um título que só o leitor de tela vê", async () => {
      const panel = await buttonOpen();
      const idTitle = panel.getAttribute("aria-labelledby");
      await expect(idTitle).toBeTruthy();

      const title = document.getElementById(idTitle!)!;
      await expect(title).toHaveTextContent("Command Palette");
      // O título mora DENTRO do painel, num cabeçalho só para leitor de tela:
      // fora dele ficaria no fluxo da página mesmo com a paleta fechada.
      await expect(panel.contains(title)).toBe(true);
      await expect(title.closest('[data-slot="dialog-header"]')).toHaveClass(/nds-sr-only/);
      // Fora da tela, mas dentro da árvore de acessibilidade — `display: none`
      // apagaria o nome do diálogo.
      await expect(title.getBoundingClientRect().width).toBeLessThan(4);
      await expect(panel).toHaveAccessibleName("Command Palette");
    });

    await step("O foco vai direto para a busca, com os 3 comandos na lista", async () => {
      const panel = await buttonOpen();
      const search = panel.querySelector<HTMLElement>('[data-slot="command-input"]')!;
      await waitFor(async () => {
        await expect(search).toHaveFocus();
      });
      await expect(within(panel).getAllByRole("option")).toHaveLength(3);
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

      // Os atalhos de cada comando aparecem à direita, encostados na borda.
      const button = commandByValue(panel, "button");
      const atalho = button.querySelector<HTMLElement>('[data-slot="command-shortcut"]')!;
      await expect(atalho).toHaveTextContent("Ctrl+B");
      const boxItem = button.getBoundingClientRect();
      const boxShortcut = atalho.getBoundingClientRect();
      await expect(boxItem.right - boxShortcut.right).toBeLessThan(
        boxShortcut.left - boxItem.left,
      );
    });

    await step("Escolher um comando executa e fecha", async () => {
      const panel = await buttonOpen();
      const antes = onRunCommand.mock.calls.length;
      await userEvent.click(within(panel).getByRole("option", { name: /Input/ }));

      await waitForPortalGone("dialog");
      await expect(onRunCommand.mock.calls.length).toBe(antes + 1);
      await expect(onRunCommand.mock.calls[antes][0]).toBe("input");
    });

    await step("A story termina com a paleta ABERTA", async () => {
      // O Chromatic fotografa o estado final e o axe roda depois da play:
      // terminar fechada capturaria só o gatilho, e o conteúdo compartilhado
      // declara `visual.item3` sobre o diálogo ABERTO.
      await userEvent.keyboard("{Meta>}k{/Meta}");
      const panel = await waitForPortal("dialog");
      await expect(panel).toBeVisible();
      await expect(within(panel).getAllByRole("option")).toHaveLength(3);
    });
  },
};
