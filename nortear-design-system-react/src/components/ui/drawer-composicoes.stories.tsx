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
import { Button } from "./button";
import { Input } from "./input";
import { Label } from "./label";

const meta = {
  title: "UI/Drawer/Compositions",
  tags: ["disclosure"],
  component: Drawer,
  parameters: {
    layout: "centered",
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          "Combinações canônicas: formulário curto com confirmar/cancelar, confirmação de ação destrutiva e corpo mais alto que o painel.",
      },
    },
  },
} satisfies Meta<typeof Drawer>;

export default meta;
type Story = StoryObj<typeof meta>;

const wrapperStyle: React.CSSProperties = {
  contain: "layout",
  minHeight: 480,
  position: "relative",
};

export const WithForm: Story = {
  parameters: {
    covers: ["visual.item5"],
    docs: {
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
    const painel = await waitForPortal("dialog");
    const dentro = within(painel);

    await step("O painel carrega nome, descrição e os campos do formulário", async () => {
      await expect(painel).toHaveAccessibleName("Editar perfil");
      await expect(painel).toHaveAccessibleDescription("Atualize seu nome e e-mail.");
      // Os campos são achados pelo RÓTULO: se `htmlFor`/`id` não casassem, o
      // input ficaria sem nome acessível e a busca falharia.
      await expect(dentro.getByLabelText(/Nome/i)).toBeInTheDocument();
      await expect(dentro.getByLabelText(/E-mail/i)).toBeInTheDocument();
    });

    await step("O rodapé oferece confirmar e cancelar", async () => {
      const rodape = painel.querySelector<HTMLElement>("[data-slot='drawer-footer']")!;
      await expect(rodape).not.toBeNull();
      const nomes = within(rodape).getAllByRole("button").map((b) => b.textContent?.trim());
      await expect(nomes).toContain("Confirmar");
      await expect(nomes).toContain("Cancelar");
    });
  },
};

export const WithConfirmation: Story = {
  parameters: {
    docs: {
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
    const painel = await waitForPortal("dialog");
    const dentro = within(painel);

    await step("A consequência está escrita, não subentendida", async () => {
      await expect(painel).toHaveAccessibleName("Remover anexo?");
      await expect(painel).toHaveAccessibleDescription(/adicioná-lo novamente depois/i);
    });

    await step("A ação principal carrega a variante destrutiva", async () => {
      const destrutivo = dentro.getByRole("button", { name: /^Remover$/i });
      await expect(destrutivo).toHaveClass(/nds-button-destructive/);
      const cancelar = dentro.getByRole("button", { name: /Cancelar/i });
      await expect(cancelar).toHaveClass(/nds-button-outline/);
    });
  },
};

export const WithScroll: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Corpo mais alto que o painel. O corpo rola sozinho dentro do teto de altura e o rodapé continua visível — é o que separa 'conteúdo longo' de 'ação fora de alcance'.",
      },
    },
  },
  render: () => (
    <div style={wrapperStyle}>
      <Drawer defaultOpen>
        <DrawerTrigger asChild>
          <Button variant="outline">Ver lista</Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Lista de itens</DrawerTitle>
            <DrawerDescription>30 itens — role o conteúdo para ver mais.</DrawerDescription>
          </DrawerHeader>
          <DrawerBody className="nds-text-body">
            <ul className="nds-stack" data-spacing="sm">
              {Array.from({ length: 30 }).map((_, i) => (
                <li
                  key={i}
                  className="nds-cluster nds-border-default nds-rounded-md nds-py-2 nds-px-4"
                  data-justify="between"
                >
                  <span>Item {i + 1}</span>
                  <span className="nds-text-muted-foreground">#{i + 1}</span>
                </li>
              ))}
            </ul>
          </DrawerBody>
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
    const painel = await waitForPortal("dialog");
    const corpo = painel.querySelector<HTMLElement>("[data-slot='drawer-body']")!;
    const rodape = painel.querySelector<HTMLElement>("[data-slot='drawer-footer']")!;

    await step("O corpo é quem rola, não o painel", async () => {
      await expect(corpo).not.toBeNull();
      await expect(painel.querySelectorAll("[data-slot='drawer-body'] li")).toHaveLength(30);
      await expect(corpo.scrollHeight).toBeGreaterThan(corpo.clientHeight);
      // O painel em si não rola: o mínimo automático zero de um item com
      // overflow é o que faz o corpo ceder altura em vez de esticar a caixa.
      // O painel NÃO é contêiner de rolagem, e é isso que prova o contrato.
      // Medir `scrollHeight <= clientHeight` nele não provava nada: sem
      // `overflow` declarado o computado é `visible`, e elemento visível não
      // rola por maior que seja o `scrollHeight`. Sonda no navegador com o
      // corpo já correto: painel client 719 / scroll 2157, corpo client 559 /
      // scroll 1524 — ou seja, o corpo cede altura e rola, e o número do painel
      // era só a caixa de conteúdo não recortada.
      await expect(['auto', 'scroll']).not.toContain(
        getComputedStyle(painel).overflowY,
      );
    });

    await step("A região rolável é alcançável por teclado", async () => {
      // WCAG 2.1.1 — sem o tabindex, quem navega por teclado não consegue rolar
      // o corpo. É a regra scrollable-region-focusable do axe, que reprovava
      // esta story antes de o corpo virar componente.
      await expect(corpo).toHaveAttribute("tabindex", "0");
    });

    await step("O rodapé continua visível com o corpo cheio", async () => {
      const caixaRodape = rodape.getBoundingClientRect();
      const caixaPainel = painel.getBoundingClientRect();
      await expect(caixaRodape.bottom).toBeLessThanOrEqual(caixaPainel.bottom + 1);
      await expect(caixaRodape.height).toBeGreaterThan(0);
    });
  },
};
