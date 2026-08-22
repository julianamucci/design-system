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

const meta = {
  title: "UI/DropdownMenu/Compositions",
  tags: ["overlay"],
  component: DropdownMenu,
  parameters: {
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

const wrapperStyle: React.CSSProperties = {
  contain: "layout",
  minHeight: 360,
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
    <div style={wrapperStyle}>
      <DropdownMenu defaultOpen modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">Conta</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuGroup>
            <DropdownMenuLabel>Conta</DropdownMenuLabel>
            <DropdownMenuItem>Perfil</DropdownMenuItem>
            <DropdownMenuItem>Configuracoes</DropdownMenuItem>
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
      const [nome, setNome] = useState(true);
      const [email, setEmail] = useState(false);
      return (
        <div style={wrapperStyle}>
          <DropdownMenu defaultOpen modal={false}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">Colunas</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuGroup>
                <DropdownMenuLabel>Colunas visíveis</DropdownMenuLabel>
                <DropdownMenuCheckboxItem checked={nome} onCheckedChange={setNome}>
                  Nome
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked={email} onCheckedChange={setEmail}>
                  E-mail
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
    const nome = canvas.getByRole("menuitemcheckbox", { name: "Nome" });
    const email = canvas.getByRole("menuitemcheckbox", { name: "E-mail" });

    await step("O papel e o estado inicial chegam ao markup", async () => {
      await expect(canvas.getAllByRole("menuitemcheckbox")).toHaveLength(2);
      await expect(nome).toHaveAttribute("aria-checked", "true");
      await expect(email).toHaveAttribute("aria-checked", "false");
    });

    await step("O indicador só aparece no item marcado", async () => {
      // O estado não pode depender só do texto: o Check é o que a pessoa vê e o
      // `aria-checked` é o que ela ouve.
      const marca = (item: HTMLElement) =>
        item.querySelector(".nds-dropdown-menu-item-indicator svg") !== null;
      await expect(marca(nome)).toBe(true);
      await expect(marca(email)).toBe(false);
    });

    await step("Clicar alterna o item e mantém o menu aberto", async () => {
      // Idempotente: leva o e-mail a marcado só se ainda não estiver, então o
      // replay do painel Interactions termina no mesmo estado.
      if (email.getAttribute("aria-checked") !== "true") await userEvent.click(email);

      await waitFor(async () => {
        await expect(email).toHaveAttribute("aria-checked", "true");
      });
      // Alternar não fecha: quem marca uma coluna costuma marcar a próxima.
      await expect(within(document.body).queryAllByRole("menu")).toHaveLength(1);
      // Independentes entre si — é o que separa checkbox de escolha única.
      await expect(nome).toHaveAttribute("aria-checked", "true");
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
      const [tema, setTema] = useState("light");
      return (
        <div style={wrapperStyle}>
          <DropdownMenu defaultOpen modal={false}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">Tema</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuRadioGroup value={tema} onValueChange={(v) => setTema(v as string)}>
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
    const claro = canvas.getByRole("menuitemradio", { name: "Claro" });
    const escuro = canvas.getByRole("menuitemradio", { name: "Escuro" });

    await step("Um item por vez se anuncia escolhido", async () => {
      await expect(canvas.getAllByRole("menuitemradio")).toHaveLength(3);
      await expect(claro).toHaveAttribute("aria-checked", "true");
      await expect(escuro).toHaveAttribute("aria-checked", "false");
    });

    await step("Escolher outro desmarca o anterior", async () => {
      // Idempotente: só clica se "Escuro" ainda não for o escolhido.
      if (escuro.getAttribute("aria-checked") !== "true") await userEvent.click(escuro);

      await waitFor(async () => {
        await expect(escuro).toHaveAttribute("aria-checked", "true");
        await expect(claro).toHaveAttribute("aria-checked", "false");
      });
    });
  },
};

export const WithSubmenu: Story = {
  parameters: {
    covers: ["functional.item7", "visual.item4"],
    // O trio Sub/SubTrigger/SubContent não existe no snippet do meta.
    docs: { source: { transform: dropdownMenuWithSubmenuSource } },
  },
  render: () => (
    <div style={wrapperStyle}>
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
    const corpo = within(document.body);
    const menu = await waitForPortal("menu");
    const subTrigger = within(menu).getByRole("menuitem", { name: "Exportar" });

    await step("O sub-gatilho anuncia que abre um menu", async () => {
      await expect(subTrigger).toHaveAttribute("aria-haspopup", "menu");
      await expect(subTrigger).toHaveAttribute("aria-expanded", "false");
    });

    await step("A seta para a direita abre o submenu", async () => {
      // Idempotente: a seta só é enviada com o submenu fechado.
      if (subTrigger.getAttribute("aria-expanded") !== "true") {
        subTrigger.focus();
        await userEvent.keyboard("{ArrowRight}");
      }
      await waitFor(async () => {
        await expect(subTrigger).toHaveAttribute("aria-expanded", "true");
        await expect(corpo.getAllByRole("menu")).toHaveLength(2);
      });
    });

    await step("O submenu abre AO LADO, não por cima do menu pai", async () => {
      const submenu = corpo.getAllByRole("menu")[1];
      await expect(within(submenu).getAllByRole("menuitem")).toHaveLength(2);
      // Um submenu que nasce sobre o pai cobre os irmãos do item que o abriu.
      // A comparação é com a borda DIREITA do pai — comparar com a esquerda
      // passaria com os dois painéis empilhados. O posicionador coloca o popup
      // em passo assíncrono, daí o `waitFor` em volta da medida.
      await waitFor(async () => {
        await expect(submenu.getBoundingClientRect().left).toBeGreaterThanOrEqual(
          menu.getBoundingClientRect().right - 8,
        );
      });
    });
  },
};

export const WithShortcuts: Story = {
  parameters: {
    // O atalho vive DENTRO do item e entra no nome acessível: é a posição no
    // markup que a story afirma, e ela some no snippet do meta.
    docs: { source: { transform: dropdownMenuWithShortcutsSource } },
  },
  render: () => (
    <div style={wrapperStyle}>
      <DropdownMenu defaultOpen modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">Editar</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>
            Desfazer
            <DropdownMenuShortcut>Ctrl Z</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem>
            Copiar
            <DropdownMenuShortcut>Ctrl C</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            Colar
            <DropdownMenuShortcut>Ctrl V</DropdownMenuShortcut>
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
      await expect(canvas.getByRole("menuitem", { name: "Copiar Ctrl C" })).toBeTruthy();
    });

    await step("O texto do atalho não some para o leitor de tela", async () => {
      const atalho = menu.querySelector("[data-slot='dropdown-menu-shortcut']")!;
      await expect(atalho.getAttribute("aria-hidden")).toBe(null);
    });

    await step("O atalho fica encostado na borda direita do item", async () => {
      // `margin-left: auto` é o mecanismo, mas num item flex o valor computado
      // já vem resolvido em pixels — o que dá para afirmar é o resultado.
      const item = canvas.getByRole("menuitem", { name: "Colar Ctrl V" });
      const atalho = item.querySelector<HTMLElement>("[data-slot='dropdown-menu-shortcut']")!;
      const itemBox = item.getBoundingClientRect();
      const shortcutBox = atalho.getBoundingClientRect();
      await expect(itemBox.right - shortcutBox.right).toBeLessThan(
        shortcutBox.left - itemBox.left,
      );
    });
  },
};
