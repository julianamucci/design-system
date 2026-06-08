import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { within, expect, waitFor } from "storybook/test";
import { waitForPortal, waitForPortalGone } from "@/lib/wait-for-portal";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
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
import { Button } from "./button";

const meta = {
  title: "UI/DropdownMenu/Composicoes",
  tags: ["overlay"],
  component: DropdownMenu,
  parameters: {
    layout: "centered",
    controls: { disable: true },
    docs: {
      description: {
        component:
          "Composicoes típicas: ComLabel (grupo + separador), ComCheckboxItems (toggles), ComRadioGroup (seleção única), ComSubmenu (hierarquia) e ComShortcuts (atalhos visuais).",
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

export const ComLabel: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Menu com Label (cabeçalho de grupo) + Items + Separator + Items. Padrão para agrupar ações relacionadas.",
      },
    },
  },
  render: () => (
    <div style={wrapperStyle}>
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">Abrir</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>Conta</DropdownMenuLabel>
          <DropdownMenuItem>Perfil</DropdownMenuItem>
          <DropdownMenuItem>Configuracoes</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Equipe</DropdownMenuLabel>
          <DropdownMenuItem>Convidar membros</DropdownMenuItem>
          <DropdownMenuItem>Permissões</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  ),
  play: async ({ step }) => {
    const body = within(document.body);
    await step("Menu com Label e Separator", async () => {
      await waitForPortal("menu");
      const labels = document.querySelectorAll(
        "[data-slot='dropdown-menu-label']"
      );
      const separators = document.querySelectorAll(
        "[data-slot='dropdown-menu-separator']"
      );
      await expect(labels.length).toBe(2);
      await expect(separators.length).toBe(1);
    });
  },
};

export const ComCheckboxItems: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "3 CheckboxItems com state useState — toggles para mostrar/ocultar colunas. role=menuitemcheckbox e aria-checked refletem estado.",
      },
    },
  },
  render: () => {
    const Demo = () => {
      const [showName, setShowName] = useState(true);
      const [showEmail, setShowEmail] = useState(true);
      const [showRole, setShowRole] = useState(false);
      return (
        <div style={wrapperStyle}>
          <DropdownMenu defaultOpen>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">Colunas</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Mostrar colunas</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={showName}
                onCheckedChange={setShowName}
              >
                Nome
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={showEmail}
                onCheckedChange={setShowEmail}
              >
                E-mail
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={showRole}
                onCheckedChange={setShowRole}
              >
                Cargo
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
      // Pelo menos um marcado, pelo menos um desmarcado
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
          "RadioGroup com value useState — seleção única de tema (light/dark/system). role=menuitemradio.",
      },
    },
  },
  render: () => {
    const Demo = () => {
      const [theme, setTheme] = useState("system");
      return (
        <div style={wrapperStyle}>
          <DropdownMenu defaultOpen>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">Tema</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Tema</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
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
    const body = within(document.body);
    await step("RadioItems com role=menuitemradio e apenas um checked", async () => {
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

export const ComSubmenu: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Submenu aninhado — Sub + SubTrigger + SubContent. Hover/focus no SubTrigger abre o SubContent à direita.",
      },
    },
  },
  render: () => (
    <div style={wrapperStyle}>
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">Abrir</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Salvar</DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Exportar</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem>PDF</DropdownMenuItem>
              <DropdownMenuItem>CSV</DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive">Excluir</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  ),
  play: async ({ step }) => {
    const body = within(document.body);
    await step("SubTrigger renderizado no menu principal", async () => {
      await waitForPortal("menu");
      const subTrigger = document.querySelector(
        "[data-slot='dropdown-menu-sub-trigger']"
      ) as HTMLElement | null;
      await expect(subTrigger).not.toBeNull();
      await expect(subTrigger?.textContent).toMatch(/Exportar/i);
    });
  },
};

export const ComShortcuts: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Items com DropdownMenuShortcut — exibição visual dos atalhos. O atalho real precisa ser registrado no consumidor (useHotkeys).",
      },
    },
  },
  render: () => (
    <div style={wrapperStyle}>
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">Abrir</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>
            Buscar
            <DropdownMenuShortcut>⌘K</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem>
            Copiar
            <DropdownMenuShortcut>⌘C</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem>
            Colar
            <DropdownMenuShortcut>⌘V</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  ),
  play: async ({ step }) => {
    const body = within(document.body);
    await step("3 shortcuts renderizados ao lado dos items", async () => {
      await waitForPortal("menu");
      const shortcuts = document.querySelectorAll(
        "[data-slot='dropdown-menu-shortcut']"
      );
      await expect(shortcuts.length).toBe(3);
    });
  },
};
