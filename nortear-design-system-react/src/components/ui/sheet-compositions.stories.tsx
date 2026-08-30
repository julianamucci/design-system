import type { Meta, StoryObj } from "@storybook/react-vite";
import { within, expect } from "storybook/test";
import { waitForPortal } from "@/lib/wait-for-portal";
import {
  Sheet,
  SheetBody,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./sheet";
import {
  sheetContentLongSource,
  sheetFiltersSource,
  sheetNavigationSource,
  sheetPanelInferiorSource,
  sheetSource,
} from "./sheet.source";
import { Button } from "./button";
import { Input } from "./input";
import { Label } from "./label";

const meta = {
  title: "Primitives/Overlay/Sheet/Compositions",
  tags: ["overlay"],
  component: Sheet,
  parameters: {
    layout: "centered",
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: sheetSource },
      description: {
        component:
          "Composições reais do Sheet em fluxos de produto: filtros avançados, navegação " +
          "secundária, painel inferior e corpo longo com rolagem interna.",
      },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ contain: "layout", minHeight: 320 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Sheet>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FiltersPanel: Story = {
  parameters: {
    docs: {
      // Formulário dentro do SheetBody — sub-composição que o snippet do meta,
      // só com cabeçalho e rodapé, esconderia.
      source: { transform: sheetFiltersSource },
      description: {
        story:
          "Sheet à direita com filtros avançados em formulário. O título nomeia a ação, a " +
          "descrição orienta o uso e o rodapé traz Cancelar + ação primária.",
      },
    },
  },
  render: () => (
    <Sheet defaultOpen>
      <SheetTrigger render={<Button variant="outline" />}>Abrir filtros</SheetTrigger>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Filtros avançados</SheetTitle>
          <SheetDescription>
            Refine os resultados por categoria, preço e disponibilidade.
          </SheetDescription>
        </SheetHeader>
        <SheetBody>
          <form
            className="nds-grid"
            data-spacing="md"
            onSubmit={(e) => {
              e.preventDefault();
            }}
          >
            <div className="nds-stack" data-spacing="sm">
              <Label htmlFor="filter-category">Categoria</Label>
              <Input id="filter-category" defaultValue="Eletrônicos" />
            </div>
            <div className="nds-stack" data-spacing="sm">
              <Label htmlFor="filter-min">Preço mínimo</Label>
              <Input id="filter-min" type="number" defaultValue="100" />
            </div>
            <div className="nds-stack" data-spacing="sm">
              <Label htmlFor="filter-max">Preço máximo</Label>
              <Input id="filter-max" type="number" defaultValue="2000" />
            </div>
          </form>
        </SheetBody>
        <SheetFooter>
          <SheetClose render={<Button type="button" variant="outline" />}>
            Cancelar
          </SheetClose>
          <Button>Aplicar filtros</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  ),
  play: async () => {
    const panel = await waitForPortal("dialog");
    await expect(panel).toHaveAccessibleName(/Filtros avançados/i);
    const field = within(panel).getByLabelText(/Categoria/i);
    await expect(field).toBeVisible();
  },
};

export const SecondaryNavigation: Story = {
  parameters: {
    docs: {
      // Painel à esquerda, com nav no corpo e SEM rodapé: a ausência de
      // confirmação faz parte do que a story ensina.
      source: { transform: sheetNavigationSource },
      description: {
        story:
          "Sheet à esquerda como menu de navegação secundária — itens clicáveis dentro do " +
          "painel, sem rodapé.",
      },
    },
  },
  render: () => (
    <Sheet defaultOpen>
      <SheetTrigger render={<Button variant="outline" />}>Abrir menu</SheetTrigger>
      <SheetContent side="left">
        <SheetHeader>
          <SheetTitle>Navegação</SheetTitle>
          <SheetDescription>Acesse as seções principais do aplicativo.</SheetDescription>
        </SheetHeader>
        <SheetBody>
          <nav className="nds-stack" data-spacing="xs" aria-label="Seções">
            {["Dashboard", "Projetos", "Equipe", "Configurações"].map((label) => (
              <Button key={label} variant="ghost">
                {label}
              </Button>
            ))}
          </nav>
        </SheetBody>
      </SheetContent>
    </Sheet>
  ),
  play: async () => {
    const panel = await waitForPortal("dialog");
    await expect(panel).toHaveAttribute("data-side", "left");
    const nav = within(panel).getByRole("navigation");
    await expect(nav).toBeVisible();
  },
};

export const BottomPanel: Story = {
  parameters: {
    docs: {
      // Direção inferior mais a fileira de ações no corpo — nenhum control
      // descreve isso neste arquivo.
      source: { transform: sheetPanelInferiorSource },
      description: {
        story:
          "Sheet inferior — o mesmo desenho do Drawer mobile, sem o gesto de arrastar. " +
          "Quando o gesto importa, o componente é o Drawer.",
      },
    },
  },
  render: () => (
    <Sheet defaultOpen>
      <SheetTrigger render={<Button variant="outline" />}>Abrir ações</SheetTrigger>
      <SheetContent side="bottom">
        <SheetHeader>
          <SheetTitle>Ações rápidas</SheetTitle>
          <SheetDescription>
            Escolha uma das ações disponíveis para este item.
          </SheetDescription>
        </SheetHeader>
        <SheetBody>
          <div className="nds-cluster" data-spacing="md">
            <Button variant="outline">Compartilhar</Button>
            <Button variant="outline">Duplicar</Button>
            <Button variant="destructive">Excluir</Button>
          </div>
        </SheetBody>
        <SheetFooter>
          <SheetClose render={<Button variant="outline" />}>Fechar</SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  ),
  play: async () => {
    const panel = await waitForPortal("dialog");
    await expect(panel).toHaveAttribute("data-side", "bottom");
    await expect(panel).toHaveAccessibleName(/Ações rápidas/i);
  },
};

export const WithLongScrollContent: Story = {
  parameters: {
    covers: ["visual.item4"],
    docs: {
      // O corpo que rola é o assunto, e ele só aparece com o SheetBody cheio.
      source: { transform: sheetContentLongSource },
      description: {
        story:
          "Corpo mais alto que o painel. O corpo rola sozinho e o rodapé continua visível — " +
          "é o que separa 'conteúdo longo' de 'ação fora de alcance'.",
      },
    },
  },
  render: () => (
    <Sheet defaultOpen>
      <SheetTrigger render={<Button variant="outline" />}>Ler termos</SheetTrigger>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Termos de uso</SheetTitle>
          <SheetDescription>Leia atentamente antes de aceitar.</SheetDescription>
        </SheetHeader>
        <SheetBody className="nds-stack" data-spacing="sm">
          {Array.from({ length: 24 }, (_, i) => (
            <p key={i} className="nds-text-body">
              Parágrafo {i + 1}: termos longos o bastante para o body precisar rolar
              inside do panel, without empurrar o rodapé para outside da tela.
            </p>
          ))}
        </SheetBody>
        <SheetFooter>
          <SheetClose render={<Button variant="outline" />}>Cancelar</SheetClose>
          <Button>Aceitar termos</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  ),
  play: async ({ step }) => {
    const panel = await waitForPortal("dialog");
    const body = panel.querySelector<HTMLElement>('[data-slot="sheet-body"]')!;
    const footer = panel.querySelector<HTMLElement>('[data-slot="sheet-footer"]')!;

    await step("O corpo é quem rola, não o painel", async () => {
      await expect(body).not.toBeNull();
      await expect(body.scrollHeight).toBeGreaterThan(body.clientHeight);
      // O painel em si não rola: o `flex` do corpo é o que segura o rodapé.
      await expect(panel.scrollHeight).toBeLessThanOrEqual(panel.clientHeight + 1);
    });

    await step("A região rolável é alcançável por teclado", async () => {
      // WCAG 2.1.1 — sem o tabindex quem navega por teclado não consegue rolar
      // o corpo (é a regra scrollable-region-focusable do axe).
      await expect(body).toHaveAttribute("tabindex", "0");
    });

    await step("O rodapé continua visível com o corpo cheio", async () => {
      const boxFooter = footer.getBoundingClientRect();
      const boxPanel = panel.getBoundingClientRect();
      await expect(boxFooter.bottom).toBeLessThanOrEqual(boxPanel.bottom + 1);
      await expect(boxFooter.height).toBeGreaterThan(0);
    });
  },
};
