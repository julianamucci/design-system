import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { within, expect, waitFor } from "storybook/test";
import { waitForPortal, waitForPortalGone } from "@/lib/wait-for-portal";
import {
  Menubar,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSeparator,
  MenubarShortcut,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
} from "./menubar";

const meta = {
  title: "UI/Menubar/Composicoes",
  tags: ["navigation"],
  component: Menubar,
  parameters: {
    layout: "centered",
    controls: { disable: true },
    docs: {
      description: {
        component:
          "Composicoes típicas: ComShortcuts, ComSubmenu, ComCheckboxItems, ComRadioGroup e EditorCompleto (4 menus simulando editor).",
      },
    },
  },
} satisfies Meta<typeof Menubar>;

export default meta;
type Story = StoryObj<typeof meta>;

const wrapperStyle: React.CSSProperties = {
  contain: "layout",
  minHeight: 360,
  position: "relative",
};

export const ComShortcuts: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Items com MenubarShortcut — exibição visual de atalhos. O atalho real precisa ser registrado no consumidor (useHotkeys).",
      },
    },
  },
  render: () => (
    <div style={wrapperStyle}>
      <Menubar>
        <MenubarMenu defaultOpen>
          <MenubarTrigger>Arquivo</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>
              Novo <MenubarShortcut>⌘N</MenubarShortcut>
            </MenubarItem>
            <MenubarItem>
              Abrir <MenubarShortcut>⌘O</MenubarShortcut>
            </MenubarItem>
            <MenubarItem>
              Salvar <MenubarShortcut>⌘S</MenubarShortcut>
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
    </div>
  ),
  play: async ({ step }) => {
    const body = within(document.body);
    await step("3 shortcuts renderizados ao lado dos items", async () => {
      await waitForPortal("menu");
      const shortcuts = document.querySelectorAll(
        "[data-slot='menubar-shortcut']"
      );
      await expect(shortcuts.length).toBe(3);
    });
  },
};

export const ComSubmenu: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Submenu aninhado — Sub + SubTrigger + SubContent. Hover/foco no SubTrigger abre o SubContent à direita.",
      },
    },
  },
  render: () => (
    <div style={wrapperStyle}>
      <Menubar>
        <MenubarMenu defaultOpen>
          <MenubarTrigger>Arquivo</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>Salvar</MenubarItem>
            <MenubarSub>
              <MenubarSubTrigger>Exportar</MenubarSubTrigger>
              <MenubarSubContent>
                <MenubarItem>PDF</MenubarItem>
                <MenubarItem>CSV</MenubarItem>
              </MenubarSubContent>
            </MenubarSub>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
    </div>
  ),
  play: async ({ step }) => {
    const body = within(document.body);
    await step("SubTrigger renderizado", async () => {
      await waitForPortal("menu");
      const subTrigger = document.querySelector(
        "[data-slot='menubar-sub-trigger']"
      ) as HTMLElement | null;
      await expect(subTrigger).not.toBeNull();
      await expect(subTrigger?.textContent).toMatch(/Exportar/i);
    });
  },
};

export const ComCheckboxItems: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Menu Exibir com CheckboxItems — toggles para Sidebar, Grid e Toolbar. role=menuitemcheckbox e aria-checked refletem estado.",
      },
    },
  },
  render: () => {
    const Demo = () => {
      const [sidebar, setSidebar] = useState(true);
      const [grid, setGrid] = useState(false);
      const [toolbar, setToolbar] = useState(true);
      return (
        <div style={wrapperStyle}>
          <Menubar>
            <MenubarMenu defaultOpen>
              <MenubarTrigger>Exibir</MenubarTrigger>
              <MenubarContent>
                <MenubarCheckboxItem
                  checked={sidebar}
                  onCheckedChange={setSidebar}
                >
                  Sidebar
                </MenubarCheckboxItem>
                <MenubarCheckboxItem checked={grid} onCheckedChange={setGrid}>
                  Grid
                </MenubarCheckboxItem>
                <MenubarCheckboxItem
                  checked={toolbar}
                  onCheckedChange={setToolbar}
                >
                  Toolbar
                </MenubarCheckboxItem>
              </MenubarContent>
            </MenubarMenu>
          </Menubar>
        </div>
      );
    };
    return <Demo />;
  },
  play: async ({ step }) => {
    const body = within(document.body);
    await step("3 itens com role=menuitemcheckbox", async () => {
      await waitForPortal("menu");
      const checkboxes = body.getAllByRole("menuitemcheckbox");
      await expect(checkboxes.length).toBe(3);
      const checked = checkboxes.filter(
        (el) => el.getAttribute("aria-checked") === "true"
      );
      await expect(checked.length).toBeGreaterThanOrEqual(1);
    });
  },
};

export const ComRadioGroup: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Menu Tema com RadioGroup — seleção única (Light/Dark/System). role=menuitemradio.",
      },
    },
  },
  render: () => {
    const Demo = () => {
      const [theme, setTheme] = useState("system");
      return (
        <div style={wrapperStyle}>
          <Menubar>
            <MenubarMenu defaultOpen>
              <MenubarTrigger>Tema</MenubarTrigger>
              <MenubarContent>
                <MenubarRadioGroup value={theme} onValueChange={setTheme}>
                  <MenubarRadioItem value="light">Light</MenubarRadioItem>
                  <MenubarRadioItem value="dark">Dark</MenubarRadioItem>
                  <MenubarRadioItem value="system">System</MenubarRadioItem>
                </MenubarRadioGroup>
              </MenubarContent>
            </MenubarMenu>
          </Menubar>
        </div>
      );
    };
    return <Demo />;
  },
  play: async ({ step }) => {
    const body = within(document.body);
    await step("RadioItems com role=menuitemradio e exatamente um checked", async () => {
      await waitForPortal("menu");
      const radios = body.getAllByRole("menuitemradio");
      await expect(radios.length).toBe(3);
      const checked = radios.filter(
        (el) => el.getAttribute("aria-checked") === "true"
      );
      await expect(checked.length).toBe(1);
    });
  },
};

export const EditorCompleto: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Menubar completo simulando editor desktop — Arquivo + Editar + Exibir + Ferramentas, com shortcuts, submenu, checkbox e radio.",
      },
    },
  },
  render: () => {
    const Demo = () => {
      const [sidebar, setSidebar] = useState(true);
      const [grid, setGrid] = useState(false);
      const [theme, setTheme] = useState("system");
      return (
        <div style={{ ...wrapperStyle, minHeight: 380 }}>
          <Menubar>
            <MenubarMenu defaultOpen>
              <MenubarTrigger>Arquivo</MenubarTrigger>
              <MenubarContent>
                <MenubarItem>
                  Novo <MenubarShortcut>⌘N</MenubarShortcut>
                </MenubarItem>
                <MenubarItem>
                  Abrir <MenubarShortcut>⌘O</MenubarShortcut>
                </MenubarItem>
                <MenubarSeparator />
                <MenubarSub>
                  <MenubarSubTrigger>Exportar</MenubarSubTrigger>
                  <MenubarSubContent>
                    <MenubarItem>PDF</MenubarItem>
                    <MenubarItem>CSV</MenubarItem>
                  </MenubarSubContent>
                </MenubarSub>
                <MenubarSeparator />
                <MenubarItem variant="destructive">Excluir arquivo</MenubarItem>
              </MenubarContent>
            </MenubarMenu>
            <MenubarMenu>
              <MenubarTrigger>Editar</MenubarTrigger>
              <MenubarContent>
                <MenubarItem>
                  Desfazer <MenubarShortcut>⌘Z</MenubarShortcut>
                </MenubarItem>
                <MenubarItem>
                  Refazer <MenubarShortcut>⇧⌘Z</MenubarShortcut>
                </MenubarItem>
                <MenubarSeparator />
                <MenubarItem>Recortar</MenubarItem>
                <MenubarItem>Copiar</MenubarItem>
                <MenubarItem>Colar</MenubarItem>
              </MenubarContent>
            </MenubarMenu>
            <MenubarMenu>
              <MenubarTrigger>Exibir</MenubarTrigger>
              <MenubarContent>
                <MenubarCheckboxItem
                  checked={sidebar}
                  onCheckedChange={setSidebar}
                >
                  Sidebar
                </MenubarCheckboxItem>
                <MenubarCheckboxItem checked={grid} onCheckedChange={setGrid}>
                  Grid
                </MenubarCheckboxItem>
              </MenubarContent>
            </MenubarMenu>
            <MenubarMenu>
              <MenubarTrigger>Ferramentas</MenubarTrigger>
              <MenubarContent>
                <MenubarRadioGroup value={theme} onValueChange={setTheme}>
                  <MenubarRadioItem value="light">Tema Claro</MenubarRadioItem>
                  <MenubarRadioItem value="dark">Tema Escuro</MenubarRadioItem>
                  <MenubarRadioItem value="system">Sistema</MenubarRadioItem>
                </MenubarRadioGroup>
              </MenubarContent>
            </MenubarMenu>
          </Menubar>
        </div>
      );
    };
    return <Demo />;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);
    await step("4 Triggers no menubar", async () => {
      const triggers = canvas.getAllByRole("menuitem");
      await expect(triggers.length).toBeGreaterThanOrEqual(4);
    });
    await step("Menu Arquivo aberto com submenu", async () => {
      await waitForPortal("menu");
      const subTrigger = document.querySelector(
        "[data-slot='menubar-sub-trigger']"
      );
      await expect(subTrigger).not.toBeNull();
    });
  },
};
