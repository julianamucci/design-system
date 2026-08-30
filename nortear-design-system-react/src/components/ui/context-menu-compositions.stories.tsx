import type { Meta, StoryObj } from "@storybook/react-vite";
import { userEvent, within, expect, waitFor } from "storybook/test";
import { useState } from "react";
import {
  MENU_RULE_CHILDREN,
  FOCUS_RULE_GUARDA,
  waitForPortal,
} from "@/lib/wait-for-portal";
import { gestoOpen } from "@shared/testing/context-menu-area";
import { AreaTrigger } from "./context-menu.fixtures";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuLabel,
  ContextMenuItem,
  ContextMenuCheckboxItem,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubTrigger,
  ContextMenuSubContent,
} from "@/components/ui/context-menu";
import {
  contextMenuCompletoSource,
  contextMenuWithChoiceUnicaSource,
  contextMenuWithMarkupSource,
  contextMenuWithSubmenuSource,
  contextMenuSource,
} from "./context-menu.source";

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta = {
  title: "Primitives/Overlay/ContextMenu/Compositions",
  tags: ["overlay"],
  component: ContextMenu,
  parameters: {
    layout: "centered",
    controls: { disable: true },
    actions: { disable: true },
    a11y: { config: { rules: [FOCUS_RULE_GUARDA] } },
    docs: {
      source: { transform: contextMenuSource },
      description: {
        component:
          "Composições do ContextMenu: atalhos, marcação, escolha única, submenu e o menu completo.",
      },
    },
  },
} satisfies Meta<typeof ContextMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

const target = (id: string) => document.querySelector<HTMLElement>(`[data-testid="${id}"]`)!;

// ─── Com atalhos ──────────────────────────────────────────────────────────────

export const WithShortcut: Story = {
  render: () => (
    <ContextMenu>
      <AreaTrigger>Clique com o botão direito aqui</AreaTrigger>
      <ContextMenuContent>
        <ContextMenuItem data-testid="editar">
          Editar
          <ContextMenuShortcut>⌘E</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem>
          Desfazer
          <ContextMenuShortcut>⌘Z</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem variant="destructive">
          Excluir
          <ContextMenuShortcut>⌫</ContextMenuShortcut>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  ),
  play: async ({ canvasElement, step }) => {
    const area = () => within(canvasElement).getByTestId("area");

    await step("O atalho vive dentro do item e é lido junto dele", async () => {
      const menu = await gestoOpen(area());
      const shortcuts = menu.querySelectorAll<HTMLElement>('[data-slot="context-menu-shortcut"]');
      await expect(shortcuts.length).toBe(3);
      for (const atalho of shortcuts) {
        await expect(atalho.hasAttribute("aria-hidden")).toBe(false);
        await expect(atalho.closest('[data-slot="context-menu-item"]')).not.toBeNull();
      }
    });

    await step("O atalho fica encostado à direita do rótulo", async () => {
      // É o alinhamento que faz a coluna de atalhos existir; sem ele o texto
      // sai colado no rótulo e a leitura visual se perde.
      const item = target("editar").getBoundingClientRect();
      const atalho = target("editar")
        .querySelector<HTMLElement>('[data-slot="context-menu-shortcut"]')!
        .getBoundingClientRect();
      await expect(item.right - atalho.right).toBeLessThan(16);
    });
  },
};

// ─── Com marcação ─────────────────────────────────────────────────────────────

function DemoCheckbox() {
  const [grid, setGrade] = useState(false);
  const [reguas, setReguas] = useState(true);

  return (
    <ContextMenu>
      <AreaTrigger>Clique com o botão direito aqui</AreaTrigger>
      <ContextMenuContent>
        <ContextMenuGroup>
          <ContextMenuLabel>Visualização</ContextMenuLabel>
          <ContextMenuCheckboxItem
            checked={grid}
            onCheckedChange={(value) => setGrade(value)}
            data-testid="grade"
          >
            Mostrar grade
          </ContextMenuCheckboxItem>
          <ContextMenuCheckboxItem
            checked={reguas}
            onCheckedChange={(value) => setReguas(value)}
            data-testid="reguas"
          >
            Mostrar réguas
          </ContextMenuCheckboxItem>
        </ContextMenuGroup>
      </ContextMenuContent>
    </ContextMenu>
  );
}

export const WithCheckbox: Story = {
  parameters: {
    covers: ["functional.item7", "accessibility.item4"],
    // O item de marcação é controlado: quem guarda o valor é o call site, e o
    // snippet do `meta` não tem estado nenhum.
    docs: { source: { transform: contextMenuWithMarkupSource } },
  },
  render: () => <DemoCheckbox />,
  play: async ({ canvasElement, step }) => {
    const area = () => within(canvasElement).getByTestId("area");

    await step("O papel diz que tipo de escolha o item é", async () => {
      await gestoOpen(area());
      await expect(target("grade").getAttribute("role")).toBe("menuitemcheckbox");
      await expect(target("reguas").getAttribute("aria-checked")).toBe("true");
    });

    await step("O indicador publica o data-slot do seu tipo de item", async () => {
      // `data-slot` é o endereço de markup que as cinco stacks compartilham, e
      // o do indicador é por TIPO de item. Aqui ele não existia.
      await gestoOpen(area());
      for (const id of ["grade", "reguas"]) {
        await expect(
          target(id).querySelector('[data-slot="context-menu-checkbox-item-indicator"]'),
        ).not.toBeNull();
      }
      // O tique mora DENTRO do indicador — prova que o atributo ficou no
      // invólucro, e não no item nem no nó que a lib injeta.
      await expect(
        target("reguas").querySelector(
          '[data-slot="context-menu-checkbox-item-indicator"] svg',
        ),
      ).not.toBeNull();
    });

    await step("Marcar alterna o estado anunciado e o indicador", async () => {
      // Lê o estado ANTES de clicar: no replay a story parte do que a rodada
      // anterior deixou, e um valor esperado fixo inverteria o resultado.
      const antes = target("grade").getAttribute("aria-checked");
      const esperado = antes === "true" ? "false" : "true";
      await userEvent.click(target("grade"));
      // Algumas libs fecham o menu ao escolher; reabrir é o que torna o passo
      // igual nas cinco stacks.
      await gestoOpen(area());
      await waitFor(() =>
        expect(target("grade").getAttribute("aria-checked")).toBe(esperado),
      );
      await expect(!!target("grade").querySelector("svg")).toBe(esperado === "true");
    });
  },
};

// ─── Com escolha única ────────────────────────────────────────────────────────

function DemoRadio() {
  const [zoom, setZoom] = useState("100");

  return (
    <ContextMenu>
      <AreaTrigger>Clique com o botão direito aqui</AreaTrigger>
      <ContextMenuContent>
        <ContextMenuGroup>
          <ContextMenuLabel>Zoom</ContextMenuLabel>
          <ContextMenuRadioGroup value={zoom} onValueChange={(value) => setZoom(value)}>
            <ContextMenuRadioItem value="75" data-testid="z75">
              75%
            </ContextMenuRadioItem>
            <ContextMenuRadioItem value="100" data-testid="z100">
              100%
            </ContextMenuRadioItem>
            <ContextMenuRadioItem value="150" data-testid="z150">
              150%
            </ContextMenuRadioItem>
          </ContextMenuRadioGroup>
        </ContextMenuGroup>
      </ContextMenuContent>
    </ContextMenu>
  );
}

export const WithRadio: Story = {
  name: "With radio group",
  parameters: {
    covers: ["functional.item8", "accessibility.item5"],
    // Quem guarda o valor é o grupo de escolha única, peça que não existe no
    // snippet do `meta`.
    docs: { source: { transform: contextMenuWithChoiceUnicaSource } },
  },
  render: () => <DemoRadio />,
  play: async ({ canvasElement, step }) => {
    const area = () => within(canvasElement).getByTestId("area");

    await step("O papel diz que a escolha é única", async () => {
      await gestoOpen(area());
      await expect(target("z100").getAttribute("role")).toBe("menuitemradio");
      await expect(target("z75").getAttribute("role")).toBe("menuitemradio");
    });

    await step("O indicador publica o data-slot do seu tipo de item", async () => {
      // Endereço por TIPO de item: escolha única e marcação não compartilham
      // slot, como nas outras stacks.
      await gestoOpen(area());
      const options = ["z75", "z100", "z150"].map(target);
      for (const opcao of options) {
        await expect(
          opcao.querySelector('[data-slot="context-menu-radio-item-indicator"]'),
        ).not.toBeNull();
      }
      // O tique mora DENTRO do indicador — prova que o atributo ficou no
      // invólucro. Qual opção está marcada varia entre rodadas, então ela é
      // procurada, nunca fixada.
      const marcada = options.find((o) => o.getAttribute("aria-checked") === "true")!;
      await expect(
        marcada.querySelector('[data-slot="context-menu-radio-item-indicator"] svg'),
      ).not.toBeNull();
    });

    await step("Escolher uma opção limpa a anterior", async () => {
      // Alterna entre dois valores conhecidos e afirma o PAR: assim o passo vale
      // igual em qualquer rodada, não importa de onde parta.
      const partiuDe75 = target("z75").getAttribute("aria-checked") === "true";
      const click = partiuDe75 ? "z150" : "z75";
      const other = partiuDe75 ? "z75" : "z150";
      await userEvent.click(target(click));
      await gestoOpen(area());
      await waitFor(() => expect(target(click).getAttribute("aria-checked")).toBe("true"));
      await expect(target(other).getAttribute("aria-checked")).toBe("false");
    });
  },
};

// ─── Com submenu ──────────────────────────────────────────────────────────────

export const WithSubmenu: Story = {
  parameters: {
    covers: ["functional.item5", "functional.item6", "visual.item3"],
    a11y: { config: { rules: [FOCUS_RULE_GUARDA, MENU_RULE_CHILDREN] } },
    // As três peças do submenu andam juntas e nenhuma aparece no snippet do
    // `meta`.
    docs: { source: { transform: contextMenuWithSubmenuSource } },
  },
  render: () => (
    <ContextMenu>
      <AreaTrigger>Clique com o botão direito aqui</AreaTrigger>
      <ContextMenuContent>
        <ContextMenuItem>Editar</ContextMenuItem>
        <ContextMenuItem>Duplicar</ContextMenuItem>
        <ContextMenuSub>
          <ContextMenuSubTrigger data-testid="sub">Compartilhar</ContextMenuSubTrigger>
          <ContextMenuSubContent>
            <ContextMenuItem data-testid="por-email">Por e-mail</ContextMenuItem>
            <ContextMenuItem>Por link</ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>
      </ContextMenuContent>
    </ContextMenu>
  ),
  play: async ({ canvasElement, step }) => {
    const area = () => within(canvasElement).getByTestId("area");
    const submenu = () =>
      document.querySelector<HTMLElement>('[data-slot="context-menu-sub-content"]');

    await step("O sub-gatilho diz que abre um menu", async () => {
      await gestoOpen(area());
      await expect(target("sub").getAttribute("aria-haspopup")).toBe("menu");
      await expect(target("sub").getAttribute("aria-expanded")).toBe("false");
    });

    await step("Seta direita abre o submenu ao lado do item que o dispara", async () => {
      target("sub").focus();
      await userEvent.keyboard("{ArrowRight}");
      await waitFor(() => expect(target("sub").getAttribute("aria-expanded")).toBe("true"));
      await expect(
        submenu()!.querySelectorAll('[data-slot="context-menu-item"]').length,
      ).toBe(2);

      // "À direita" é medida, não atributo: é o que o conteúdo promete e o que
      // um `side` errado quebraria sem nenhum aviso. O `waitFor` não é folga —
      // o popup entra no DOM ANTES de o posicionador medir, e até lá fica em
      // (0,0).
      await waitFor(() =>
        expect(submenu()!.getBoundingClientRect().left).toBeGreaterThanOrEqual(
          target("sub").getBoundingClientRect().left,
        ),
      );
    });

    await step("Seta esquerda fecha o submenu e devolve o foco ao sub-gatilho", async () => {
      await userEvent.keyboard("{ArrowLeft}");
      await waitFor(() => expect(target("sub").getAttribute("aria-expanded")).toBe("false"));
      await expect(document.activeElement).toBe(target("sub"));
    });

    await step("A story termina com o submenu ABERTO", async () => {
      // `visual.item3` descreve o submenu aberto — é o que o Chromatic precisa
      // fotografar.
      await userEvent.keyboard("{ArrowRight}");
      await waitFor(() => expect(submenu()).not.toBeNull());
    });
  },
};

// ─── Composição completa ──────────────────────────────────────────────────────

function DemoCompleta() {
  const [grid, setGrade] = useState(true);
  const [zoom, setZoom] = useState("100");

  return (
    <ContextMenu>
      <AreaTrigger>Clique com o botão direito aqui</AreaTrigger>
      <ContextMenuContent>
        <ContextMenuGroup>
          <ContextMenuLabel>Ações</ContextMenuLabel>
          <ContextMenuItem>
            Editar
            <ContextMenuShortcut>⌘E</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuSub>
            <ContextMenuSubTrigger>Compartilhar</ContextMenuSubTrigger>
            <ContextMenuSubContent>
              <ContextMenuItem>Por e-mail</ContextMenuItem>
              <ContextMenuItem>Por link</ContextMenuItem>
            </ContextMenuSubContent>
          </ContextMenuSub>
        </ContextMenuGroup>
        <ContextMenuSeparator />
        <ContextMenuGroup>
          <ContextMenuLabel>Visualização</ContextMenuLabel>
          <ContextMenuCheckboxItem
            checked={grid}
            onCheckedChange={(value) => setGrade(value)}
            data-testid="grade"
          >
            Mostrar grade
          </ContextMenuCheckboxItem>
        </ContextMenuGroup>
        <ContextMenuSeparator />
        <ContextMenuGroup>
          <ContextMenuLabel>Zoom</ContextMenuLabel>
          <ContextMenuRadioGroup value={zoom} onValueChange={(value) => setZoom(value)}>
            <ContextMenuRadioItem value="100" data-testid="z100">
              100%
            </ContextMenuRadioItem>
            <ContextMenuRadioItem value="150">150%</ContextMenuRadioItem>
          </ContextMenuRadioGroup>
        </ContextMenuGroup>
        <ContextMenuSeparator />
        <ContextMenuItem variant="destructive">
          Excluir
          <ContextMenuShortcut>⌫</ContextMenuShortcut>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

export const CompleteComposition: Story = {
  parameters: {
    covers: ["visual.item4"],
    // A convivência de marcação, escolha única e submenu num menu só é o
    // assunto; cada peça isolada já vive nas outras composições.
    docs: { source: { transform: contextMenuCompletoSource } },
  },
  render: () => <DemoCompleta />,
  play: async ({ canvasElement, step }) => {
    const area = () => within(canvasElement).getByTestId("area");

    await step("Marcação e escolha única convivem no mesmo menu", async () => {
      // `visual.item4` descreve exatamente esta convivência — é o que precisa
      // estar na tela quando o Chromatic fotografa.
      const menu = await gestoOpen(area());
      await expect(target("grade").getAttribute("role")).toBe("menuitemcheckbox");
      await expect(target("z100").getAttribute("role")).toBe("menuitemradio");
      await expect(
        menu.querySelectorAll('[data-slot="context-menu-separator"]').length,
      ).toBe(3);
    });

    await step("Os rótulos de grupo não são itens escolhíveis", async () => {
      const menu = await waitForPortal("menu");
      const rotulos = menu.querySelectorAll<HTMLElement>('[data-slot="context-menu-label"]');
      await expect(rotulos.length).toBe(3);
      for (const label of rotulos) {
        await expect(label.getAttribute("role")).not.toBe("menuitem");
      }
    });
  },
};
