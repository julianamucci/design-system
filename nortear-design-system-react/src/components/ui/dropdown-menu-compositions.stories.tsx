import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import {
  waitForPortal,
  FOCUS_RULE_GUARDA,
  MENU_RULE_CHILDREN,
} from "@/lib/wait-for-portal";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import {
  dropdownMenuWithShortcutsSource,
  dropdownMenuWithCheckboxSource,
  dropdownMenuWithRadioSource,
  dropdownMenuWithLabelSource,
  dropdownMenuWithSubmenuSource,
  dropdownMenuSource,
} from "./dropdown-menu.source";
import { Button } from "./button";

import { figmaDesign } from "@shared/figma/design-links";
const meta = {
  title: "Components/Overlay/DropdownMenu/Compositions",
  tags: ["overlay"],
  component: DropdownMenu,
  parameters: {
    design: figmaDesign("dropdownMenu"),
    layout: "centered",
    controls: { disable: true },
    actions: { disable: true },
    // Estas stories terminam com o menu ABERTO, de propósito: é o estado que o
    // Chromatic precisa fotografar. As duas regras do axe que isso acende são
    // da lib, e o motivo de cada uma está em `wait-for-portal.ts`.
    a11y: { config: { rules: [FOCUS_RULE_GUARDA, MENU_RULE_CHILDREN] } },
    docs: {
      source: { transform: dropdownMenuSource },
      description: {
        component:
          "As composições canônicas: grupos com rótulo, alternadores, escolha única, submenu e " +
          "atalhos. Todas partem das mesmas peças — o que muda é o papel ARIA do item e o " +
          "indicador que o acompanha.",
      },
    },
  },
} satisfies Meta<typeof DropdownMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

// Andaime do canvas: o menu abre em portal e o cartão da story precisa
// reservar a altura. O degrau vem da escada `.nds-min-h-*`, e não de um valor
// cravado — inline vence a folha e sairia do tema e da densidade.
const wrapperClass = "nds-min-h-90";
const wrapperStyle: React.CSSProperties = {
  contain: "layout",
  position: "relative",
};

/*
 * O rótulo mora DENTRO do grupo que ele nomeia — é o que dá nome acessível ao
 * bloco e, neste primitivo, é também o que impede o menu de não renderizar:
 * fora de um `Group`/`RadioGroup` o rótulo lança "MenuGroupContext is missing".
 */

export const WithLabel: Story = {
  parameters: {
    covers: ["visual.item1"],
    // Dois grupos rotulados separados por um divisor — o snippet do meta tem um
    // grupo só e esconderia a estrutura que a story afirma.
    docs: { source: { transform: dropdownMenuWithLabelSource } },
  },
  render: () => (
    <div className={wrapperClass} style={wrapperStyle}>
      <DropdownMenu defaultOpen modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">Conta</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuGroup>
            <DropdownMenuLabel>Conta</DropdownMenuLabel>
            <DropdownMenuItem>Perfil</DropdownMenuItem>
            <DropdownMenuItem>Configurações</DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuLabel>Suporte</DropdownMenuLabel>
            <DropdownMenuItem>Documentação</DropdownMenuItem>
            <DropdownMenuItem>Sair</DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  ),
  play: async ({ step }) => {
    const menu = await waitForPortal("menu");
    const canvas = within(menu);

    await step("Cada grupo é nomeado pelo próprio rótulo", async () => {
      // É o que o rótulo entrega além do texto: sem o `aria-labelledby`, o
      // leitor anuncia "grupo" e a pessoa não sabe de qual bloco se trata.
      await expect(canvas.getByRole("group", { name: "Conta" })).toBeTruthy();
      await expect(canvas.getByRole("group", { name: "Suporte" })).toBeTruthy();
    });

    await step("O rótulo não é item de menu", async () => {
      // Rótulo dentro de `role="menu"` não pode ser navegável: a seta o pousaria
      // como se fosse ação, e o typeahead o traria como resultado.
      await expect(canvas.getAllByRole("menuitem")).toHaveLength(4);
    });

    await step("O separador divide os grupos", async () => {
      await expect(canvas.getAllByRole("separator")).toHaveLength(1);
    });
  },
};

export const WithCheckboxItems: Story = {
  parameters: {
    covers: ["functional.item5", "accessibility.item4", "visual.item2"],
    // Sub-composição inteira: item de marcação mais o estado que o alimenta.
    docs: { source: { transform: dropdownMenuWithCheckboxSource } },
  },
  render: () => {
    const Demo = () => {
      const [name, setName] = useState(true);
      const [email, setEmail] = useState(false);
      // Três colunas, como no vanilla, que é a referência: com duas o menu não
      // mostrava que a marcação de uma não mexe nas OUTRAS, só na vizinha.
      const [role, setRole] = useState(false);
      return (
        <div className={wrapperClass} style={wrapperStyle}>
          <DropdownMenu defaultOpen modal={false}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">Colunas</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuGroup>
                <DropdownMenuLabel>Colunas visíveis</DropdownMenuLabel>
                <DropdownMenuCheckboxItem checked={name} onCheckedChange={setName}>
                  Nome
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked={email} onCheckedChange={setEmail}>
                  E-mail
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked={role} onCheckedChange={setRole}>
                  Função
                </DropdownMenuCheckboxItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    };
    return <Demo />;
  },
  play: async ({ step }) => {
    const menu = await waitForPortal("menu");
    const canvas = within(menu);
    const name = canvas.getByRole("menuitemcheckbox", { name: "Nome" });
    const email = canvas.getByRole("menuitemcheckbox", { name: "E-mail" });
    const role = canvas.getByRole("menuitemcheckbox", { name: "Função" });

    await step("O papel e o estado inicial chegam ao markup", async () => {
      await expect(canvas.getAllByRole("menuitemcheckbox")).toHaveLength(3);
      await expect(name).toHaveAttribute("aria-checked", "true");
      await expect(email).toHaveAttribute("aria-checked", "false");
      await expect(role).toHaveAttribute("aria-checked", "false");
    });

    // O estado não pode depender só do texto: o Check é o que a pessoa vê e o
    // `aria-checked` é o que ela ouve. Os dois são conferidos JUNTOS, antes e
    // depois de cada clique — um indicador que não acompanha a troca mente para
    // quem enxerga enquanto o leitor de tela diz a verdade.
    const indicatorShown = (item: HTMLElement) =>
      item.querySelector(".nds-dropdown-menu-item-indicator svg") !== null;

    // Alternar não fecha (C10): quem marca uma coluna costuma marcar a
    // próxima. Um quadro depois da troca a decisão de fechar já teria sido
    // tomada — e sem animação de saída (D5) o painel sairia do DOM na hora.
    // UM menu aberto, e o MESMO nó: fechado e reaberto passaria por "aberto".
    const expectSameMenuOpen = async () => {
      await new Promise((resolve) => requestAnimationFrame(resolve));
      const menus = within(document.body).queryAllByRole("menu");
      await expect(menus).toHaveLength(1);
      await expect(menus[0]).toBe(menu);
    };

    // Independentes entre si — é o que separa checkbox de escolha única. O
    // terceiro item é quem prova: alternar o e-mail não arrasta nem o vizinho
    // de cima, que já estava marcado, nem o de baixo, que não estava.
    const expectNeighboursUntouched = async () => {
      await expect(name).toHaveAttribute("aria-checked", "true");
      await expect(indicatorShown(name)).toBe(true);
      await expect(role).toHaveAttribute("aria-checked", "false");
      await expect(indicatorShown(role)).toBe(false);
    };

    await step("O indicador só aparece no item marcado", async () => {
      await expect(indicatorShown(name)).toBe(true);
      await expect(indicatorShown(email)).toBe(false);
    });

    // Os dois passos seguintes vão de falso a verdadeiro e de volta a falso: a
    // story termina no estado em que começou. Cada clique é guardado pelo
    // estado de destino — o par idempotente —, então o replay do painel
    // Interactions que parta de uma rodada interrompida no meio não inverte o
    // resultado. Numa rodada limpa os dois cliques acontecem.
    await step("Clicar marca: aria-checked e indicador vão a verdadeiro, e o menu segue aberto", async () => {
      if (email.getAttribute("aria-checked") !== "true") await userEvent.click(email);

      // Leitura pura dentro do `waitFor`: atributo e presença de nó.
      await waitFor(async () => {
        await expect(email).toHaveAttribute("aria-checked", "true");
        await expect(indicatorShown(email)).toBe(true);
      });
      await expectSameMenuOpen();
      await expectNeighboursUntouched();
    });

    await step("Clicar de novo desmarca: aria-checked e indicador voltam a falso, e o menu segue aberto", async () => {
      if (email.getAttribute("aria-checked") !== "false") await userEvent.click(email);

      // O indicador da lib desmonta ao desmarcar — é a sua ausência que se lê.
      await waitFor(async () => {
        await expect(email).toHaveAttribute("aria-checked", "false");
        await expect(indicatorShown(email)).toBe(false);
      });
      await expectSameMenuOpen();
      await expectNeighboursUntouched();
    });
  },
};

export const WithRadioGroup: Story = {
  parameters: {
    covers: ["functional.item6", "accessibility.item4", "visual.item3"],
    // O valor mora no GRUPO, não em cada item — só a sub-composição inteira
    // mostra de onde vem a exclusividade da escolha.
    docs: { source: { transform: dropdownMenuWithRadioSource } },
  },
  render: () => {
    const Demo = () => {
      const [theme, setTema] = useState("light");
      return (
        <div className={wrapperClass} style={wrapperStyle}>
          <DropdownMenu defaultOpen modal={false}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">Tema</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuRadioGroup value={theme} onValueChange={(v) => setTema(v as string)}>
                <DropdownMenuLabel>Aparência</DropdownMenuLabel>
                <DropdownMenuRadioItem value="light">Claro</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="dark">Escuro</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="system">Sistema</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    };
    return <Demo />;
  },
  play: async ({ step }) => {
    const menu = await waitForPortal("menu");
    const canvas = within(menu);
    const light = canvas.getByRole("menuitemradio", { name: "Claro" });
    const escuro = canvas.getByRole("menuitemradio", { name: "Escuro" });

    await step("Um item por vez se anuncia escolhido", async () => {
      await expect(canvas.getAllByRole("menuitemradio")).toHaveLength(3);
      await expect(light).toHaveAttribute("aria-checked", "true");
      await expect(escuro).toHaveAttribute("aria-checked", "false");
    });

    await step("Escolher outro desmarca o anterior, e o menu segue aberto", async () => {
      // Idempotente: só clica se "Escuro" ainda não for o escolhido.
      if (escuro.getAttribute("aria-checked") !== "true") await userEvent.click(escuro);

      await waitFor(async () => {
        await expect(escuro).toHaveAttribute("aria-checked", "true");
        await expect(light).toHaveAttribute("aria-checked", "false");
      });
      // Escolher não fecha (C10). As referências de cima foram tomadas ANTES do
      // clique, e um nó desmontado continuaria respondendo ao que era — por
      // isso a prova é o documento: um quadro depois, UM menu aberto, e o MESMO
      // nó de antes do clique.
      await new Promise((resolve) => requestAnimationFrame(resolve));
      const menus = within(document.body).queryAllByRole("menu");
      await expect(menus).toHaveLength(1);
      await expect(menus[0]).toBe(menu);
      await expect(menu.contains(escuro)).toBe(true);
    });
  },
};

export const WithSubmenu: Story = {
  parameters: {
    covers: ["functional.item7", "functional.item12", "visual.item4"],
    // O trio Sub/SubTrigger/SubContent não existe no snippet do meta.
    docs: { source: { transform: dropdownMenuWithSubmenuSource } },
  },
  render: () => (
    <div className={wrapperClass} style={wrapperStyle}>
      <DropdownMenu defaultOpen modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">Arquivo</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Renomear</DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Exportar</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem>PDF</DropdownMenuItem>
              <DropdownMenuItem>CSV</DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  ),
  play: async ({ step }) => {
    const body = within(document.body);
    const menu = await waitForPortal("menu");
    const subTrigger = within(menu).getByRole("menuitem", { name: "Exportar" });

    await step("O sub-gatilho anuncia que abre um menu", async () => {
      await expect(subTrigger).toHaveAttribute("aria-haspopup", "menu");
      await expect(subTrigger).toHaveAttribute("aria-expanded", "false");
    });

    const submenu = () => body.getAllByRole("menu").find((m) => m !== menu);

    await step("A seta para a direita abre o submenu e o foco entra nele", async () => {
      // Idempotente: a seta só é enviada com o submenu fechado.
      if (subTrigger.getAttribute("aria-expanded") !== "true") {
        subTrigger.focus();
        await userEvent.keyboard("{ArrowRight}");
      }
      await waitFor(async () => {
        await expect(subTrigger).toHaveAttribute("aria-expanded", "true");
        await expect(body.getAllByRole("menu")).toHaveLength(2);
      });
      // Abrir não basta: o FOCO entra no submenu, no primeiro item. Parado no
      // sub-gatilho, as setas continuariam andando no pai, e o submenu
      // existiria só para quem usa ponteiro.
      await waitFor(async () => {
        await expect(document.activeElement).toBe(within(submenu()!).getAllByRole("menuitem")[0]);
      });
    });

    await step("O submenu abre AO LADO, não por cima do menu pai", async () => {
      const panel = submenu()!;
      await expect(within(panel).getAllByRole("menuitem")).toHaveLength(2);
      // Um submenu que nasce sobre o pai cobre os irmãos do item que o abriu.
      // A comparação é com a borda DIREITA do pai — comparar com a esquerda
      // passaria com os dois painéis empilhados. O posicionador coloca o popup
      // em passo assíncrono, daí o `waitFor` em volta da medida.
      await waitFor(async () => {
        await expect(panel.getBoundingClientRect().left).toBeGreaterThanOrEqual(
          menu.getBoundingClientRect().right - 8,
        );
      });
    });

    /** Só o submenu fechou: o foco no sub-gatilho, e o raiz é o MESMO nó, aberto. */
    const onlySubmenuClosed = async () => {
      await waitFor(async () => {
        await expect(subTrigger).toHaveAttribute("aria-expanded", "false");
      });
      await waitFor(async () => {
        await expect(document.activeElement).toBe(subTrigger);
      });
      // Um quadro depois: a decisão de fechar o raiz junto já teria sido
      // tomada, e sem animação de saída (D5) ele sairia do DOM na hora.
      await new Promise((resolve) => requestAnimationFrame(resolve));
      const menus = body.queryAllByRole("menu");
      await expect(menus).toHaveLength(1);
      await expect(menus[0]).toBe(menu);
    };

    await step("A seta para a esquerda fecha só o submenu e devolve o foco ao sub-gatilho", async () => {
      await userEvent.keyboard("{ArrowLeft}");
      await onlySubmenuClosed();
    });

    await step("Escape dentro do submenu também fecha só o submenu", async () => {
      // WAI-ARIA APG: Escape fecha o menu em que o foco está, e o de fora segue
      // aberto. Fechar a árvore inteira faria um nível de volta custar os dois.
      subTrigger.focus();
      await userEvent.keyboard("{ArrowRight}");
      await waitFor(async () => {
        await expect(body.getAllByRole("menu")).toHaveLength(2);
      });
      await waitFor(async () => {
        await expect(submenu()!.contains(document.activeElement)).toBe(true);
      });
      await userEvent.keyboard("{Escape}");
      await onlySubmenuClosed();
    });

    await step("A story termina com o submenu ABERTO", async () => {
      // `visual.item4` descreve o submenu aberto — é o que o Chromatic fotografa.
      subTrigger.focus();
      await userEvent.keyboard("{ArrowRight}");
      await waitFor(async () => {
        await expect(body.getAllByRole("menu")).toHaveLength(2);
      });
    });
  },
};

export const WithShortcuts: Story = {
  parameters: {
    // Os três passos são o item do contrato: o atalho no nome acessível, sem
    // `aria-hidden`, e encostado à direita do rótulo.
    covers: ["functional.item14"],
    // O atalho vive DENTRO do item e entra no nome acessível: é a posição no
    // markup que a story afirma, e ela some no snippet do meta.
    docs: { source: { transform: dropdownMenuWithShortcutsSource } },
  },
  render: () => (
    <div className={wrapperClass} style={wrapperStyle}>
      <DropdownMenu defaultOpen modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">Editar</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>
            Desfazer
            <DropdownMenuShortcut>Ctrl+Z</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem>
            Copiar
            <DropdownMenuShortcut>Ctrl+C</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            Colar
            <DropdownMenuShortcut>Ctrl+V</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  ),
  play: async ({ step }) => {
    const menu = await waitForPortal("menu");
    const canvas = within(menu);

    await step("O atalho faz parte do nome do item", async () => {
      // Sem isso o leitor de tela anunciaria "Copiar" e a pessoa nunca saberia
      // que existe uma tecla — o atalho é informação, não decoração.
      await expect(canvas.getByRole("menuitem", { name: "Copiar Ctrl+C" })).toBeTruthy();
    });

    await step("O texto do atalho não some para o leitor de tela", async () => {
      const atalho = menu.querySelector("[data-slot='dropdown-menu-shortcut']")!;
      await expect(atalho.getAttribute("aria-hidden")).toBe(null);
    });

    await step("O atalho fica encostado na borda direita do item", async () => {
      // `margin-left: auto` é o mecanismo, mas num item flex o valor computado
      // já vem resolvido em pixels — o que dá para afirmar é o resultado.
      const item = canvas.getByRole("menuitem", { name: "Colar Ctrl+V" });
      const atalho = item.querySelector<HTMLElement>("[data-slot='dropdown-menu-shortcut']")!;
      const itemBox = item.getBoundingClientRect();
      const shortcutBox = atalho.getBoundingClientRect();
      await expect(itemBox.right - shortcutBox.right).toBeLessThan(
        shortcutBox.left - itemBox.left,
      );
    });
  },
};
