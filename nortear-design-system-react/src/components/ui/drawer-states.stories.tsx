import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { userEvent, within, expect, waitFor } from "storybook/test";
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
import {
  drawerOpenSource,
  drawerControlledSource,
  drawerNotDispensavelSource,
  drawerSource,
} from "./drawer.source";
import { Button } from "./button";

const meta = {
  title: "UI/Drawer/States",
  tags: ["disclosure"],
  component: Drawer,
  parameters: {
    layout: "centered",
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      // Fechado é o padrão do componente: esta transform já é o snippet da
      // story Closed.
      source: { transform: drawerSource },
      description: {
        component:
          "Estados canônicos do Drawer: fechado (padrão), aberto, controlado por estado externo e não dispensável.",
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

export const Closed: Story = {
  parameters: {
    covers: ["accessibility.item1"],
    docs: {
      description: {
        story:
          "Estado inicial — apenas o gatilho está na tela. O painel não existe no DOM, e o gatilho anuncia que há um diálogo atrás dele sem afirmar que já está aberto.",
      },
    },
  },
  render: () => (
    <div style={wrapperStyle}>
      <Drawer>
        <DrawerTrigger asChild>
          <Button variant="outline">Abrir</Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Editar perfil</DrawerTitle>
            <DrawerDescription>Atualize seus dados.</DrawerDescription>
          </DrawerHeader>
          <DrawerFooter>
            <DrawerClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step("Fechado, o painel não existe no DOM", async () => {
      const trigger = canvas.getByRole("button", { name: /Abrir/i });
      await expect(trigger).toBeVisible();
      await expect(within(document.body).queryAllByRole("dialog")).toHaveLength(0);
      await expect(document.querySelector("[data-slot='drawer-content']")).toBeNull();
      await expect(document.querySelector("[data-slot='drawer-overlay']")).toBeNull();
    });

    await step("O gatilho é o único caminho de entrada, e está alcançável", async () => {
      const trigger = canvas.getByRole("button", { name: /Abrir/i });
      await expect(trigger).toHaveAttribute("data-slot", "drawer-trigger");
      await expect(trigger).toBeEnabled();
    });
  },
};

export const Open: Story = {
  parameters: {
    covers: ["accessibility.item2"],
    docs: {
      // Aqui abrir na montagem É o assunto — nas demais stories o `defaultOpen`
      // só serve à captura visual, e por isso não entra naqueles snippets.
      source: { transform: drawerOpenSource },
      description: {
        story:
          "Aberto ao montar, sem estado externo. Overlay ativo, foco dentro do painel e contrato de markup completo.",
      },
    },
  },
  render: () => (
    <div style={wrapperStyle}>
      <Drawer defaultOpen>
        <DrawerTrigger asChild>
          <Button variant="outline">Abrir</Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Editar perfil</DrawerTitle>
            <DrawerDescription>Atualize seus dados.</DrawerDescription>
          </DrawerHeader>
          <DrawerFooter>
            <DrawerClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  ),
  play: async ({ step }) => {
    const panel = await waitForPortal("dialog");

    await step("Monta já aberto, com o contrato de markup completo", async () => {
      await expect(panel).toBeVisible();
      await expect(panel).toHaveAttribute("role", "dialog");
      await expect(panel).toHaveAttribute("aria-modal", "true");
      await expect(panel).toHaveAttribute("data-slot", "drawer-content");
      await expect(panel).toHaveAccessibleName("Editar perfil");
      await expect(document.querySelector("[data-slot='drawer-overlay']")).not.toBeNull();
    });

    await step("O foco está dentro do painel", async () => {
      await waitFor(() => {
        if (!panel.contains(document.activeElement)) {
          throw new Error("o foco não entrou no painel");
        }
      });
      await expect(panel.contains(document.activeElement)).toBe(true);
    });
  },
};

export const Controlled: Story = {
  parameters: {
    covers: ["functional.item6"],
    docs: {
      // Composição diferente: estado de fora, sem `DrawerTrigger` — quem abre é
      // o botão da página.
      source: { transform: drawerControlledSource },
      description: {
        story:
          "Estado do lado de fora: o componente não decide nada sozinho — abre quando o valor ligado diz que sim e avisa a cada mudança para que o dono do estado acompanhe.",
      },
    },
  },
  render: () => {
    const ControlledDemo = () => {
      const [open, setOpen] = useState(false);
      return (
        <div className="nds-stack" data-spacing="sm" style={wrapperStyle}>
          <div className="nds-cluster" data-spacing="sm">
            <Button onClick={() => setOpen(true)}>Abrir externamente</Button>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Fechar externamente
            </Button>
          </div>
          <Drawer open={open} onOpenChange={setOpen}>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>Editar perfil</DrawerTitle>
                <DrawerDescription>Atualize seus dados.</DrawerDescription>
              </DrawerHeader>
              <DrawerFooter>
                <DrawerClose asChild>
                  <Button variant="outline">Cancelar</Button>
                </DrawerClose>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        </div>
      );
    };
    return <ControlledDemo />;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const openBtn = canvas.getByRole("button", { name: /Abrir externamente/i });
    const closeBtn = canvas.getByRole("button", { name: /Fechar externamente/i });

    await step("Sem gatilho interno, o painel nasce fechado", async () => {
      if (within(document.body).queryAllByRole("dialog").length > 0) {
        await userEvent.click(closeBtn);
        await waitForPortalGone("dialog");
      }
      await expect(within(document.body).queryAllByRole("dialog")).toHaveLength(0);
    });

    await step("O estado externo abre o painel", async () => {
      await userEvent.click(openBtn);
      const panel = await waitForPortal("dialog");
      await expect(panel).toBeVisible();
      await expect(panel).toHaveAccessibleName("Editar perfil");
    });

    await step("Fechar por dentro devolve o valor a quem é dono dele", async () => {
      const panel = await waitForPortal("dialog");
      await userEvent.click(within(panel).getByRole("button", { name: /Cancelar/i }));
      await waitForPortalGone("dialog");
      // Se o callback não tivesse chegado, `open` continuaria true e o painel
      // reabriria no render seguinte.
      await expect(within(document.body).queryAllByRole("dialog")).toHaveLength(0);
    });
  },
};

export const NotDismissible: Story = {
  parameters: {
    docs: {
      // `dismissible={false}` só faz sentido junto da saída explícita do rodapé
      // — o snippet precisa mostrar os dois na mesma composição.
      source: { transform: drawerNotDispensavelSource },
      description: {
        story:
          "Sem dispensa por gesto: Escape e clique no overlay não fecham. A saída existe e é explícita — o botão do rodapé, alcançável por teclado.",
      },
    },
  },
  render: () => (
    <div style={wrapperStyle}>
      <Drawer defaultOpen dismissible={false}>
        <DrawerTrigger asChild>
          <Button variant="outline">Abrir</Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Confirmação obrigatória</DrawerTitle>
            <DrawerDescription>Use o botão Confirmar para prosseguir.</DrawerDescription>
          </DrawerHeader>
          <DrawerFooter>
            <DrawerClose asChild>
              <Button>Confirmar e fechar</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  ),
  play: async ({ step }) => {
    const panel = await waitForPortal("dialog");

    await step("Escape não fecha", async () => {
      await userEvent.keyboard("{Escape}");
      // Espera ATIVA por um fechamento que não deve acontecer: se fechasse, a
      // transição de saída levaria menos que isto.
      await new Promise((r) => setTimeout(r, 400));
      await expect(within(document.body).queryAllByRole("dialog")).toHaveLength(1);
      await expect(panel).toBeVisible();
    });

    await step("Clique no overlay não fecha", async () => {
      const overlay = document.querySelector<HTMLElement>("[data-slot='drawer-overlay']");
      await expect(overlay).not.toBeNull();
      await userEvent.click(overlay!, { pointerEventsCheck: 0 });
      await new Promise((r) => setTimeout(r, 400));
      await expect(within(document.body).queryAllByRole("dialog")).toHaveLength(1);
    });

    await step("A saída explícita do rodapé continua funcionando", async () => {
      await expect(
        within(panel).getByRole("button", { name: /Confirmar e fechar/i }),
      ).toBeVisible();
    });
  },
};
