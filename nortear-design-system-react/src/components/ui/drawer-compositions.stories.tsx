import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import { waitForPortal } from "@/lib/wait-for-portal";
import {
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "./drawer";
import {
  drawerWithConfirmSource,
  drawerWithFormSource,
  drawerSource,
} from "./drawer.source";
import { Button } from "./button";
import { Input } from "./input";
import { Label } from "./label";

const meta = {
  title: "Primitives/Overlay/Drawer/Compositions",
  tags: ["overlay"],
  component: Drawer,
  parameters: {
    layout: "centered",
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: drawerSource },
      description: {
        component:
          "Combinações canônicas: formulário curto com confirmar/cancelar e confirmação de ação destrutiva.",
      },
    },
  },
} satisfies Meta<typeof Drawer>;

export default meta;
type Story = StoryObj<typeof meta>;

// Andaime do canvas: `contain` e `position` são mecânica, e provam que o painel
// portalizado escapa de um bloco de contenção. Altura NÃO entra — as outras
// quatro stacks não têm nenhuma aqui, e o painel é `position: fixed` de todo
// jeito, então a altura do andaime não muda o que a foto mostra.
const wrapperStyle: React.CSSProperties = {
  contain: "layout",
  position: "relative",
};

export const WithForm: Story = {
  parameters: {
    covers: ["visual.item5"],
    docs: {
      // O par rótulo/campo dentro do corpo é o assunto, e o snippet do meta o
      // esconderia atrás de uma linha de texto.
      source: { transform: drawerWithFormSource },
      description: {
        story:
          "Formulário curto no corpo e par de ações no rodapé. Título e descrição dizem o que está sendo editado — juntos formam o nome e a descrição acessíveis do painel.",
      },
    },
  },
  render: () => (
    <div style={wrapperStyle}>
      <Drawer defaultOpen>
        <DrawerTrigger asChild>
          <Button variant="outline">Editar perfil</Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Editar perfil</DrawerTitle>
            <DrawerDescription>Atualize seu nome e e-mail.</DrawerDescription>
          </DrawerHeader>
          <DrawerBody>
            <form className="nds-grid" data-spacing="sm">
              <div className="nds-grid" data-spacing="xs">
                <Label htmlFor="drawer-name">Nome</Label>
                <Input id="drawer-name" defaultValue="Juliana" />
              </div>
              <div className="nds-grid" data-spacing="xs">
                <Label htmlFor="drawer-email">E-mail</Label>
                <Input id="drawer-email" type="email" defaultValue="juliana@example.com" />
              </div>
            </form>
          </DrawerBody>
          <DrawerFooter>
            <Button>Confirmar</Button>
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
    const inside = within(panel);

    await step("O painel carrega nome, descrição e os campos do formulário", async () => {
      await expect(panel).toHaveAccessibleName("Editar perfil");
      await expect(panel).toHaveAccessibleDescription("Atualize seu nome e e-mail.");
      // Os campos são achados pelo RÓTULO: se `htmlFor`/`id` não casassem, o
      // input ficaria sem nome acessível e a busca falharia.
      await expect(inside.getByLabelText(/Nome/i)).toBeInTheDocument();
      await expect(inside.getByLabelText(/E-mail/i)).toBeInTheDocument();
    });

    await step("O rodapé oferece confirmar e cancelar", async () => {
      const footer = panel.querySelector<HTMLElement>("[data-slot='drawer-footer']")!;
      await expect(footer).not.toBeNull();
      const names = within(footer).getAllByRole("button").map((b) => b.textContent?.trim());
      await expect(names).toContain("Confirmar");
      await expect(names).toContain("Cancelar");
    });
  },
};

export const WithConfirmation: Story = {
  parameters: {
    docs: {
      // Painel sem corpo, com a ação principal na variante destrutiva — outra
      // composição, não uma configuração da do meta.
      source: { transform: drawerWithConfirmSource },
      description: {
        story:
          "Mensagem curta e par de ações, com a principal na variante destrutiva. Vale para confirmação reversível; se a ação for realmente bloqueante, o componente é o AlertDialog.",
      },
    },
  },
  render: () => (
    <div style={wrapperStyle}>
      <Drawer defaultOpen>
        <DrawerTrigger asChild>
          <Button variant="outline">Remover anexo</Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Remover anexo?</DrawerTitle>
            <DrawerDescription>
              O anexo sai desta mensagem. Você pode adicioná-lo novamente depois.
            </DrawerDescription>
          </DrawerHeader>
          <DrawerFooter>
            <Button variant="destructive">Remover</Button>
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
    const inside = within(panel);

    await step("A consequência está escrita, não subentendida", async () => {
      await expect(panel).toHaveAccessibleName("Remover anexo?");
      await expect(panel).toHaveAccessibleDescription(/adicioná-lo novamente depois/i);
    });

    await step("A ação principal carrega a variante destrutiva", async () => {
      const destrutivo = inside.getByRole("button", { name: /^Remover$/i });
      await expect(destrutivo).toHaveClass(/nds-button-destructive/);
      const cancelar = inside.getByRole("button", { name: /Cancelar/i });
      await expect(cancelar).toHaveClass(/nds-button-outline/);
    });
  },
};
