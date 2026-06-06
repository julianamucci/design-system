import type { Meta, StoryObj } from "@storybook/react";
import { userEvent, within, expect, waitFor } from "storybook/test";
import { waitForPortal, waitForPortalGone } from "@/lib/wait-for-portal";
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarTrigger,
} from "./menubar";
import { MenubarDocs } from "@/components/docs/MenubarDocs";
import { withAutoDocsTab } from "@/lib/withAutoDocsTab";

type PlaygroundArgs = {
  defaultValue?: string;
  loop?: boolean;
};

const meta = {
  title: "UI/Menubar",
  component: Menubar as never,
  tags: ["autodocs", "navigation"],
  parameters: {
    layout: "centered",
    docs: { page: withAutoDocsTab(MenubarDocs) },
  },
  argTypes: {
    defaultValue: {
      control: "text",
      description:
        "Menu inicialmente aberto (file | edit | view | tools). Em base-ui, mapeado para defaultOpen no MenubarMenu correspondente.",
    },
    loop: {
      control: "boolean",
      description:
        "Loop de navegação por setas entre os Triggers (mapeado para loopFocus em base-ui).",
    },
  },
  args: {
    defaultValue: "",
    loop: true,
  },
} satisfies Meta<PlaygroundArgs>;

export default meta;
type Story = StoryObj<PlaygroundArgs>;

export const Playground: Story = {
  render: (args) => {
    const { defaultValue, loop } = args;
    return (
      <div
        style={{ contain: "layout", minHeight: 320, position: "relative" }}
      >
        <Menubar loopFocus={loop}>
          <MenubarMenu defaultOpen={defaultValue === "file"}>
            <MenubarTrigger>Arquivo</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>
                Novo <MenubarShortcut>⌘N</MenubarShortcut>
              </MenubarItem>
              <MenubarItem>
                Abrir <MenubarShortcut>⌘O</MenubarShortcut>
              </MenubarItem>
              <MenubarSeparator />
              <MenubarItem>
                Salvar <MenubarShortcut>⌘S</MenubarShortcut>
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>
          <MenubarMenu defaultOpen={defaultValue === "edit"}>
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
          <MenubarMenu defaultOpen={defaultValue === "view"}>
            <MenubarTrigger>Exibir</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>Zoom +</MenubarItem>
              <MenubarItem>Zoom −</MenubarItem>
              <MenubarSeparator />
              <MenubarItem>Tela cheia</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
          <MenubarMenu defaultOpen={defaultValue === "tools"}>
            <MenubarTrigger>Ferramentas</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>Preferências</MenubarItem>
              <MenubarItem>Atalhos de teclado</MenubarItem>
              <MenubarSeparator />
              <MenubarItem variant="destructive">Limpar cache</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      </div>
    );
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);

    await step("1. Tab foca o primeiro Trigger", async () => {
      const trigger = canvas.getByRole("menuitem", { name: /Arquivo/i });
      await expect(trigger).toBeVisible();
    });

    await step("2. Click no Trigger Arquivo abre o menu", async () => {
      const trigger = canvas.getByRole("menuitem", { name: /Arquivo/i });
      await userEvent.click(trigger);
      const menu = await waitForPortal("menu");
      await expect(menu).toBeVisible();
    });

    await step("3. ESC fecha o menu", async () => {
      await userEvent.keyboard("{Escape}");
      await waitFor(
        () => {
          const menu = body.queryByRole("menu");
          if (menu) throw new Error("menu still open");
        },
        { timeout: 1000 }
      );
    });
  },
};
