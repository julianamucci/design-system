import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor, within } from "storybook/test";
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

import { figmaDesign } from "@shared/figma/design-links";
const meta = {
  title: "Components/Overlay/Drawer/Compositions",
  tags: ["overlay"],
  component: Drawer,
  parameters: {
    design: figmaDesign("drawer"),
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
            <form
              id="drawer-form"
              className="nds-grid"
              data-spacing="sm"
              onSubmit={(event) => event.preventDefault()}
            >
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
          {/*
            O rodapé é IRMÃO do corpo por construção do primitivo — `.nds-drawer-body`
            só rola enquanto é filho direto do flex column de `.nds-drawer-content` —,
            então o `<form>` não pode envolvê-lo. Quem religa os dois é o par
            id ↔ `form`: sem ele, com dois campos o navegador NÃO faz submissão
            implícita e o Enter num campo não dispara nada.
          */}
          <DrawerFooter>
            <DrawerClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DrawerClose>
            <Button type="submit" form="drawer-form">
              Confirmar
            </Button>
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

    await step("Confirmar submete o formulário do corpo", async () => {
      // `button.form` é o que denuncia o botão órfão: vem `null` quando nada o
      // liga ao `<form>`, e nada na tela denuncia. Leitura pura, sem `waitFor`.
      const confirmar = within(panel).getByRole("button", {
        name: "Confirmar",
      }) as HTMLButtonElement;
      await expect(confirmar.type).toBe("submit");
      await expect(confirmar.form?.id).toBe("drawer-form");
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
        <DrawerContent
          onOpenAutoFocus={(event) => {
            // Aqui a decisão É a tela, e por isso o foco entra no cancelar —
            // a mesma escolha do AlertDialog: o Enter por reflexo tem de cair
            // na saída segura, nunca na ação que consuma. Na WithForm o padrão
            // FICA: ali o assunto é editar, e forçar o Cancelar cobraria um Tab
            // a mais de quem só quer editar.
            //
            // `onOpenAutoFocus` é o que esta stack oferece para escolher o alvo:
            // sem `preventDefault()` o primitivo foca o primeiro tabbable e
            // desfaz a escolha logo em seguida.
            const panelEl = event.target as HTMLElement | null;
            const safeExit = panelEl?.querySelector<HTMLElement>('[data-slot="drawer-close"]');
            // Sem saída marcada no rodapé não há alvo, e aí o padrão do primitivo
            // é melhor que um diálogo aberto sem foco nenhum dentro.
            if (!safeExit) return;
            event.preventDefault();
            safeExit.focus();
          }}
        >
          <DrawerHeader>
            <DrawerTitle>Remover anexo?</DrawerTitle>
            <DrawerDescription>
              O anexo sai desta mensagem. Você pode adicioná-lo novamente depois.
            </DrawerDescription>
          </DrawerHeader>
          <DrawerFooter>
            <DrawerClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DrawerClose>
            <Button variant="destructive">Remover</Button>
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

    await step("O foco abre no cancelar, não na ação destrutiva", async () => {
      // O ELEMENTO, não a mera presença de foco: um painel que foca a si mesmo
      // também tem foco dentro, e é justamente o que esta story recusa.
      const cancelar = inside.getByRole("button", { name: /^Cancelar$/i });
      const destrutivo = inside.getByRole("button", { name: /^Remover$/i });
      await waitFor(() => expect(cancelar).toHaveFocus());
      await expect(destrutivo).not.toHaveFocus();
    });
  },
};
