import type { Meta, StoryObj } from "@storybook/react-vite";
import { within, expect } from "storybook/test";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "./resizable";

const meta = {
  title: "UI/Resizable/Variants",
  tags: ["layout"],
  component: ResizablePanelGroup,
  parameters: {
    layout: "centered",
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          "Variantes de layout do Resizable: Horizontal (split lateral), Vertical (split empilhado), Nested (PanelGroup dentro de Panel) e WithHandle (pegador visual centralizado).",
      },
    },
  },
} satisfies Meta<typeof ResizablePanelGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

const boxStyle: React.CSSProperties = { width: 520, height: 280 };

/**
 * Rótulos dos divisores, em constante.
 *
 * Escrito inline dentro de `getByRole(…, { name: … })`, um rótulo em português
 * é indistinguível — para quem lê o arquivo estaticamente — do `name:` que
 * batiza a story na sidebar do Storybook, e vira alarme de menu não traduzido.
 * A constante separa as duas coisas de vez.
 */
const ROTULO_SIDEBAR = "Redimensionar sidebar e conteúdo — use setas";
const ROTULO_CONSOLE = "Redimensionar editor e console — use setas";
const ROTULO_PAINEIS = "Redimensionar painéis — use setas";

/** Geometria real; `style.width` não decide nada num item de `flex-basis: 0`. */
function fracoes(paineis: HTMLElement[], horizontal: boolean): number[] {
  const medida = (p: HTMLElement) =>
    horizontal ? p.getBoundingClientRect().width : p.getBoundingClientRect().height;
  const total = paineis.reduce((a, p) => a + medida(p), 0);
  return paineis.map((p) => medida(p) / total);
}

function paineisDiretos(grupo: Element): HTMLElement[] {
  return [...grupo.querySelectorAll<HTMLElement>(':scope > [data-slot="resizable-panel"]')];
}

export const Horizontal: Story = {
  parameters: { covers: ["visual.item1"] },
  render: () => (
    <div className="nds-rounded-lg nds-border-default nds-overflow-hidden" style={boxStyle}>
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={30} minSize={20} maxSize={50}>
          <div className="nds-cluster nds-bg-muted nds-p-4 nds-text-body" data-justify="center">
            Sidebar
          </div>
        </ResizablePanel>
        <ResizableHandle aria-label="Redimensionar as colunas — use setas para ajustar" />
        <ResizablePanel defaultSize={70} minSize={50}>
          <div className="nds-cluster nds-p-4 nds-text-body" data-justify="center">
            Conteúdo principal
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    await step("Split lateral: o divisor é uma linha vertical", async () => {
      // O CSS decide espessura e cursor pelo eixo do punho. Um grupo horizontal
      // é dividido por uma linha VERTICAL — a inversão é a fonte clássica de
      // erro aqui.
      const grupo = canvasElement.querySelector<HTMLElement>('[data-slot="resizable-panel-group"]')!;
      const punho = canvasElement.querySelector<HTMLElement>('[data-slot="resizable-handle"]')!;
      await expect(punho).toHaveAttribute("aria-orientation", "vertical");
      await expect(getComputedStyle(grupo).flexDirection).toBe("row");
      await expect(getComputedStyle(punho).cursor).toBe("col-resize");
    });

    await step("Os painéis dividem a LARGURA na proporção declarada", async () => {
      const grupo = canvasElement.querySelector('[data-slot="resizable-panel-group"]')!;
      await expect(fracoes(paineisDiretos(grupo), true)[0]).toBeCloseTo(0.3, 1);
    });
  },
};

export const Vertical: Story = {
  parameters: { covers: ["visual.item2"] },
  render: () => (
    <div className="nds-rounded-lg nds-border-default nds-overflow-hidden" style={boxStyle}>
      <ResizablePanelGroup direction="vertical">
        <ResizablePanel defaultSize={40} minSize={20}>
          <div className="nds-cluster nds-p-4 nds-text-body" data-justify="center">
            Topo
          </div>
        </ResizablePanel>
        <ResizableHandle aria-label="Redimensionar as faixas — use setas para ajustar" />
        <ResizablePanel defaultSize={60} minSize={20}>
          <div className="nds-cluster nds-bg-muted nds-p-4 nds-text-body" data-justify="center">
            Rodapé
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    await step("Split empilhado: o divisor é uma linha deitada", async () => {
      const grupo = canvasElement.querySelector<HTMLElement>('[data-slot="resizable-panel-group"]')!;
      const punho = canvasElement.querySelector<HTMLElement>('[data-slot="resizable-handle"]')!;
      await expect(punho).toHaveAttribute("aria-orientation", "horizontal");
      await expect(getComputedStyle(grupo).flexDirection).toBe("column");
      await expect(getComputedStyle(punho).cursor).toBe("row-resize");
    });

    await step("Os painéis dividem a ALTURA, e não a largura", async () => {
      // O eixo trocado é invisível numa foto quadrada: os dois painéis
      // apareceriam empilhados de qualquer jeito e só a proporção denunciaria.
      const grupo = canvasElement.querySelector('[data-slot="resizable-panel-group"]')!;
      await expect(fracoes(paineisDiretos(grupo), false)[0]).toBeCloseTo(0.4, 1);
    });
  },
};

export const Nested: Story = {
  parameters: { covers: ["visual.item3"] },
  render: () => (
    <div className="nds-rounded-lg nds-border-default nds-overflow-hidden" style={boxStyle}>
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={30} minSize={20}>
          <div className="nds-cluster nds-bg-muted nds-p-4 nds-text-body" data-justify="center">
            Sidebar
          </div>
        </ResizablePanel>
        <ResizableHandle aria-label={ROTULO_SIDEBAR} />
        <ResizablePanel defaultSize={70} minSize={40}>
          <ResizablePanelGroup direction="vertical">
            <ResizablePanel defaultSize={60} minSize={20}>
              <div className="nds-cluster nds-p-4 nds-text-body" data-justify="center">
                Editor
              </div>
            </ResizablePanel>
            <ResizableHandle aria-label={ROTULO_CONSOLE} />
            <ResizablePanel defaultSize={40} minSize={20}>
              <div className="nds-cluster nds-bg-muted-60 nds-p-4 nds-text-body" data-justify="center">
                Console
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Cada grupo governa só os próprios painéis", async () => {
      // O grupo de dentro é outro grupo: os painéis dele não podem entrar na
      // conta do de fora, senão um ajuste move os dois layouts ao mesmo tempo.
      const grupos = [...canvasElement.querySelectorAll('[data-slot="resizable-panel-group"]')];
      await expect(grupos).toHaveLength(2);
      for (const g of grupos) await expect(paineisDiretos(g)).toHaveLength(2);
    });

    await step("O divisor de dentro tem o eixo do grupo de dentro", async () => {
      await expect(
        canvas.getByRole("separator", { name: ROTULO_SIDEBAR }),
      ).toHaveAttribute("aria-orientation", "vertical");
      await expect(
        canvas.getByRole("separator", { name: ROTULO_CONSOLE }),
      ).toHaveAttribute("aria-orientation", "horizontal");
    });

    await step("E as proporções de cada grupo são independentes", async () => {
      const grupos = [...canvasElement.querySelectorAll('[data-slot="resizable-panel-group"]')];
      await expect(fracoes(paineisDiretos(grupos[0]), true)[0]).toBeCloseTo(0.3, 1);
      await expect(fracoes(paineisDiretos(grupos[1]), false)[0]).toBeCloseTo(0.6, 1);
    });
  },
};

export const WithHandle: Story = {
  parameters: { covers: ["visual.item4"] },
  render: () => (
    <div className="nds-rounded-lg nds-border-default nds-overflow-hidden" style={boxStyle}>
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={50} minSize={20}>
          <div className="nds-cluster nds-p-4 nds-text-body" data-justify="center">
            Antes
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle aria-label={ROTULO_PAINEIS} />
        <ResizablePanel defaultSize={50} minSize={20}>
          <div className="nds-cluster nds-bg-muted nds-p-4 nds-text-body" data-justify="center">
            Depois
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    await step("O pegador aparece e é maior que a linha de 1px", async () => {
      // A linha sozinha é quase invisível; o pegador é o que anuncia que ali
      // existe um controle. É por isso que a guideline pede `withHandle` em
      // desktop.
      const grip = canvasElement.querySelector<HTMLElement>(".nds-resizable-grip-bar")!;
      await expect(grip).toBeInTheDocument();
      await expect(grip.getBoundingClientRect().height).toBeGreaterThan(8);
    });

    await step("O pegador não rouba o nome acessível do divisor", async () => {
      // Quem carrega o significado é o `aria-label` do separator; o pegador é
      // desenho. Um elemento com texto ali dentro passaria a compor o nome.
      const punho = within(canvasElement).getByRole("separator", { name: ROTULO_PAINEIS });
      await expect(punho.querySelector(".nds-resizable-grip-bar")?.textContent).toBe("");
    });
  },
};
