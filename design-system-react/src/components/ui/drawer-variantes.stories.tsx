import type { Meta, StoryObj } from "@storybook/react";
import { within, expect, waitFor } from "storybook/test";
import { waitForPortal, waitForPortalGone } from "@/lib/wait-for-portal";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "./drawer";
import { Button } from "./button";

const meta = {
  title: "UI/Drawer/Variantes",
  tags: ["disclosure"],
  component: Drawer,
  parameters: {
    layout: "centered",
    controls: { disable: true },
    docs: {
      description: {
        component:
          "Variantes do Drawer por direção: Bottom (mobile padrão), Top (notificação), Left (menu lateral) e Right (painel lateral desktop). O atributo data-vaul-drawer-direction controla o slide-in.",
      },
    },
  },
} satisfies Meta<typeof Drawer>;

export default meta;
type Story = StoryObj<typeof meta>;

const wrapperStyle: React.CSSProperties = {
  contain: "layout",
  minHeight: 400,
  position: "relative",
};

function makeStory(
  direction: "bottom" | "top" | "left" | "right",
  label: string,
  description: string
): Story {
  return {
    parameters: {
      docs: {
        description: {
          story: description,
        },
      },
    },
    render: () => (
      <div style={wrapperStyle}>
        <Drawer direction={direction} defaultOpen>
          <DrawerTrigger asChild>
            <Button variant="outline">{label}</Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle className="capitalize">{direction}</DrawerTitle>
              <DrawerDescription>
                Drawer com direction=&quot;{direction}&quot;.
              </DrawerDescription>
            </DrawerHeader>
            <div className="px-4 pb-2 text-sm text-muted-foreground">
              {description}
            </div>
            <DrawerFooter>
              <DrawerClose asChild>
                <Button variant="outline">Fechar</Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </div>
    ),
    play: async ({ step }) => {
      const body = within(document.body);
      await step(`Drawer renderiza com data-vaul-drawer-direction=${direction}`, async () => {
        const dialog = await waitForPortal("dialog");
        await expect(dialog).toBeVisible();
        const content = document.querySelector(
          "[data-slot='drawer-content']"
        ) as HTMLElement | null;
        await expect(content).not.toBeNull();
        await expect(content).toHaveAttribute("data-vaul-drawer-direction", direction);
      });
    },
  };
}

export const Bottom: Story = makeStory(
  "bottom",
  "Abrir bottom",
  "Mobile-first padrão com handle de drag visível; rounded-t-xl, max-height 80vh."
);

export const Top: Story = makeStory(
  "top",
  "Abrir top",
  "Entra de cima; rounded-b-xl; útil para notificações ou seletores rápidos."
);

export const Left: Story = makeStory(
  "left",
  "Abrir left",
  "Painel lateral à esquerda; w-3/4 mobile, max-w-sm desktop; rounded-r-xl."
);

export const Right: Story = makeStory(
  "right",
  "Abrir right",
  "Painel lateral à direita (padrão para edição em desktop); rounded-l-xl."
);
