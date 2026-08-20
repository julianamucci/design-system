import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
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
  drawerDireitaSource,
  drawerEsquerdaSource,
  drawerSource,
  drawerTopoSource,
} from "./drawer.source";
import { Button } from "./button";

const meta = {
  title: "UI/Drawer/Variants",
  tags: ["disclosure"],
  component: Drawer,
  parameters: {
    layout: "centered",
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      // Bottom é o padrão do componente: sem `direction` escrito, esta transform
      // já é o snippet da story Bottom.
      source: { transform: drawerSource },
      description: {
        component:
          "Direção de entrada pela prop direction da raiz. Bottom é o padrão mobile-first e a única direção em que a alça aparece; left e right servem a painéis laterais.",
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

/** Mesmo painel nas quatro direções — o que muda é `direction` e o título. */
function painel(
  direction: "bottom" | "top" | "left" | "right",
  titulo: string,
  descricao: string,
) {
  return () => (
    <div style={wrapperStyle}>
      <Drawer direction={direction} defaultOpen>
        <DrawerTrigger asChild>
          <Button variant="outline">Abrir</Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{titulo}</DrawerTitle>
            <DrawerDescription>{descricao}</DrawerDescription>
          </DrawerHeader>
          <DrawerBody className="nds-text-body nds-text-muted-foreground">
            Conteúdo do painel.
          </DrawerBody>
          <DrawerFooter>
            <DrawerClose asChild>
              <Button variant="outline">Fechar</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
}

// A asserção de direção está escrita story a story, e não extraída para um
// helper: `play_without_assertion` conta `expect()` DENTRO do bloco, e um
// helper compartilhado esconderia da leitura o único contrato que cada uma
// destas quatro stories verifica.

export const Bottom: Story = {
  parameters: {
    covers: ["accessibility.item6", "visual.item1"],
    docs: {
      description: {
        story:
          "Padrão mobile-first: entra por baixo, com teto de 80% da altura da tela e cantos arredondados no topo. É a única direção em que a alça aparece.",
      },
    },
  },
  render: painel("bottom", "Detalhes do pedido", "Pedido #4287 confirmado em 15 de março."),
  play: async ({ step }) => {
    await step("O painel encosta na base e mostra a alça", async () => {
      const painelEl = await waitForPortal("dialog");
      await expect(painelEl).toHaveAttribute("data-vaul-drawer-direction", "bottom");
      await expect(painelEl).toHaveClass(/nds-drawer-content/);
      await expect(painelEl).toHaveAccessibleName("Detalhes do pedido");
      // A alça só é visível nesta direção — o CSS compartilhado a esconde nas
      // outras. Contraste e cor do painel são verificados pelo axe da story.
      const alca = painelEl.querySelector<HTMLElement>(".nds-drawer-handle")!;
      await expect(window.getComputedStyle(alca).display).toBe("block");
    });
  },
};

export const Top: Story = {
  parameters: {
    covers: ["visual.item4"],
    docs: {
      // `direction="top"` é o assunto, e o arquivo desliga os controls.
      source: { transform: drawerTopoSource },
      description: {
        story:
          "Entra por cima, com cantos arredondados embaixo. Serve a notificação rica e a seletor rápido — conteúdo curto e saída imediata.",
      },
    },
  },
  render: painel("top", "Nova versão disponível", "Atualize agora para acessar as novidades."),
  play: async ({ step }) => {
    await step("O painel encosta no topo e esconde a alça", async () => {
      const painelEl = await waitForPortal("dialog");
      await expect(painelEl).toHaveAttribute("data-vaul-drawer-direction", "top");
      await expect(painelEl).toHaveClass(/nds-drawer-content/);
      await expect(painelEl).toHaveAccessibleName("Nova versão disponível");
      const alca = painelEl.querySelector<HTMLElement>(".nds-drawer-handle")!;
      await expect(window.getComputedStyle(alca).display).toBe("none");
    });
  },
};

export const Left: Story = {
  parameters: {
    covers: ["visual.item3"],
    docs: {
      // `direction="left"` é o assunto, e o arquivo desliga os controls.
      source: { transform: drawerEsquerdaSource },
      description: {
        story:
          "Painel lateral à esquerda — a direção do menu de navegação, que a pessoa espera encontrar onde o menu costuma ficar.",
      },
    },
  },
  render: painel("left", "Menu", "Navegue pelas seções do app."),
  play: async ({ step }) => {
    await step("O painel encosta na borda esquerda", async () => {
      const painelEl = await waitForPortal("dialog");
      await expect(painelEl).toHaveAttribute("data-vaul-drawer-direction", "left");
      await expect(painelEl).toHaveClass(/nds-drawer-content/);
      await expect(painelEl).toHaveAccessibleName("Menu");
      // Ocupa a altura inteira, encostada na borda — ao contrário de bottom/top.
      await expect(painelEl.getBoundingClientRect().left).toBeLessThan(1);
    });
  },
};

export const Right: Story = {
  parameters: {
    covers: ["functional.item5", "visual.item2"],
    docs: {
      // `direction="right"` é o assunto, e o arquivo desliga os controls.
      source: { transform: drawerDireitaSource },
      description: {
        story:
          "Painel lateral à direita — alternativa de desktop para edição e filtros, sem trocar de componente.",
      },
    },
  },
  render: painel("right", "Filtros", "Refine sua busca por categoria, preço e disponibilidade."),
  play: async ({ step }) => {
    await step("O painel encosta na borda direita", async () => {
      const painelEl = await waitForPortal("dialog");
      await expect(painelEl).toHaveAttribute("data-vaul-drawer-direction", "right");
      await expect(painelEl).toHaveClass(/nds-drawer-content/);
      await expect(painelEl).toHaveAccessibleName("Filtros");
      const caixa = painelEl.getBoundingClientRect();
      await expect(Math.abs(caixa.right - window.innerWidth)).toBeLessThan(2);
    });
  },
};
