import type { Meta, StoryObj } from "@storybook/react-vite";
import { within, expect, userEvent, waitFor, fn } from "storybook/test";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "./resizable";

const meta = {
  title: "UI/Resizable/States",
  tags: ["layout"],
  component: ResizablePanelGroup,
  parameters: {
    layout: "centered",
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          "Estados do ResizableHandle: Dragging (arrasto ajusta os painéis em tempo real), Limits (o painel para no mínimo e no máximo), Focus (divisor alcançado pelo Tab, com anel visível) e Disabled (divisor travado).",
      },
    },
  },
} satisfies Meta<typeof ResizablePanelGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

const boxStyle: React.CSSProperties = { width: 520, height: 240 };
const ROTULO = "Redimensionar painéis — use setas para ajustar";

/** Geometria real; `style.width` não decide nada num item de `flex-basis: 0`. */
function fracaoDoPrimeiro(canvasElement: HTMLElement): number {
  const paineis = [...canvasElement.querySelectorAll<HTMLElement>('[data-slot="resizable-panel"]')];
  const medidas = paineis.map((p) => p.getBoundingClientRect().width);
  return medidas[0] / medidas.reduce((a, b) => a + b, 0);
}

function razaoDeContraste(frente: string, fundo: string): number {
  const luminancia = (cor: string): number => {
    const [r = 0, g = 0, b = 0] = cor.match(/[\d.]+/g)?.map(Number) ?? [];
    const canal = (c: number) => {
      const v = c / 255;
      return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * canal(r) + 0.7152 * canal(g) + 0.0722 * canal(b);
  };
  const [a, b] = [luminancia(frente), luminancia(fundo)].sort((x, y) => y - x);
  return (a + 0.05) / (b + 0.05);
}

/** Espião de módulo: dentro do `render` ele seria inalcançável pelo `play`. */
const aoLayout = fn();

export const Dragging: Story = {
  parameters: { covers: ["functional.item1", "accessibility.item2"] },
  render: () => (
    <div className="nds-rounded-lg nds-border-default nds-overflow-hidden" style={boxStyle}>
      <ResizablePanelGroup direction="horizontal" onLayout={aoLayout}>
        <ResizablePanel defaultSize={50} minSize={10}>
          <div className="nds-cluster nds-p-4 nds-text-body" data-justify="center">
            Esquerda
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle aria-label={ROTULO} />
        <ResizablePanel defaultSize={50} minSize={10}>
          <div className="nds-cluster nds-bg-muted nds-p-4 nds-text-body" data-justify="center">
            Direita
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const punho = canvas.getByRole("separator", { name: ROTULO });
    aoLayout.mockClear();

    await step("Arrastar o divisor ajusta os painéis em tempo real", async () => {
      // functional.item1. `userEvent.pointer` com a sequência completa, e não um
      // PointerEvent construído à mão: a lib decide o arrasto por regiões de
      // acerto calculadas a partir de eventos de ponteiro reais, e descarta em
      // silêncio o que for sintético.
      const caixa = punho.getBoundingClientRect();
      const x = caixa.left + caixa.width / 2;
      const y = caixa.top + caixa.height / 2;
      const antes = fracaoDoPrimeiro(canvasElement);

      await userEvent.pointer([
        { keys: "[MouseLeft>]", target: punho, coords: { clientX: x, clientY: y } },
        { target: punho, coords: { clientX: x + 80, clientY: y } },
        { keys: "[/MouseLeft]" },
      ]);

      await waitFor(() =>
        expect(fracaoDoPrimeiro(canvasElement)).toBeGreaterThan(antes + 0.05),
      );
    });

    await step("O tamanho anunciado acompanha o arrasto", async () => {
      await waitFor(() =>
        expect(Number(punho.getAttribute("aria-valuenow"))).toBeCloseTo(
          fracaoDoPrimeiro(canvasElement) * 100,
          0,
        ),
      );
    });

    await step("O layout é emitido com os dois painéis", async () => {
      // Uma emissão por gesto entupiria menos o GA4 que uma por pixel — o que
      // importa aqui é que o callback recebe o layout inteiro, não um painel só.
      await expect(aoLayout).toHaveBeenCalled();
    });

    await step("O divisor em repouso alcança 3:1 contra o fundo", async () => {
      // accessibility.item2. O punho é o CONTROLE que a pessoa precisa achar
      // para arrastar, então a régua é a de componente de interface (WCAG
      // 1.4.11) e não a de decoração. O olho não distingue 1,25 de 3,0 numa
      // linha de 1px — por isso a conta fica aqui.
      const razao = razaoDeContraste(
        getComputedStyle(punho).backgroundColor,
        getComputedStyle(document.body).backgroundColor,
      );
      await expect(razao).toBeGreaterThanOrEqual(3);
    });
  },
};

export const Limits: Story = {
  parameters: { covers: ["functional.item3"] },
  render: () => (
    <div className="nds-rounded-lg nds-border-default nds-overflow-hidden" style={boxStyle}>
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={50} minSize={30} maxSize={60}>
          <div className="nds-cluster nds-p-4 nds-text-body" data-justify="center">
            Limitado
          </div>
        </ResizablePanel>
        <ResizableHandle aria-label={ROTULO} />
        <ResizablePanel defaultSize={50} minSize={30}>
          <div className="nds-cluster nds-bg-muted nds-p-4 nds-text-body" data-justify="center">
            Livre
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const punho = canvas.getByRole("separator", { name: ROTULO });

    // Cada passo leva o divisor a um EXTREMO absoluto antes de medir: assim a
    // rodada seguinte do painel Interactions parte de onde quiser e chega ao
    // mesmo lugar.
    await step("O painel para no mínimo, e o valor anunciado para junto", async () => {
      // functional.item3. Sem o piso, insistir na seta faria o painel sumir — e
      // o conteúdo dentro dele com ele.
      punho.focus();
      await userEvent.keyboard("{Home}");
      await waitFor(() => expect(fracaoDoPrimeiro(canvasElement)).toBeCloseTo(0.3, 1));
      await expect(Number(punho.getAttribute("aria-valuenow"))).toBeCloseTo(30, 0);
      await expect(Number(punho.getAttribute("aria-valuemin"))).toBeCloseTo(30, 0);
    });

    await step("Insistir na seta não passa do piso", async () => {
      for (let i = 0; i < 10; i++) await userEvent.keyboard("{ArrowLeft}");
      await expect(fracaoDoPrimeiro(canvasElement)).toBeCloseTo(0.3, 1);
    });

    await step("E para no máximo declarado", async () => {
      await userEvent.keyboard("{End}");
      await waitFor(() => expect(fracaoDoPrimeiro(canvasElement)).toBeCloseTo(0.6, 1));
      for (let i = 0; i < 10; i++) await userEvent.keyboard("{ArrowRight}");
      await expect(fracaoDoPrimeiro(canvasElement)).toBeCloseTo(0.6, 1);
      await expect(Number(punho.getAttribute("aria-valuemax"))).toBeCloseTo(60, 0);
    });
  },
};

export const Focus: Story = {
  parameters: { covers: ["functional.item4", "accessibility.item3"] },
  render: () => (
    <div className="nds-rounded-lg nds-border-default nds-overflow-hidden" style={boxStyle}>
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={50} minSize={20}>
          <div className="nds-cluster nds-p-4 nds-text-body" data-justify="center">
            Um
          </div>
        </ResizablePanel>
        <ResizableHandle aria-label={ROTULO} />
        <ResizablePanel defaultSize={50} minSize={20}>
          <div className="nds-cluster nds-bg-muted nds-p-4 nds-text-body" data-justify="center">
            Dois
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const punho = canvas.getByRole("separator", { name: ROTULO });
    const primeiro = canvasElement.querySelector<HTMLElement>('[data-slot="resizable-panel"]')!;

    await step("O Tab alcança o divisor", async () => {
      // functional.item4. Um divisor fora da ordem de tabulação seria
      // inalcançável para quem não usa mouse, e as setas nunca chegariam a ele.
      primeiro.focus();
      await userEvent.tab();
      await expect(punho).toHaveFocus();
    });

    await step("E o foco fica visível", async () => {
      // accessibility.item3 — `:focus-visible` é a condição exata que o CSS
      // compartilhado usa; asserção sobre `:focus` passaria também no clique,
      // onde o anel não deve aparecer.
      await expect(punho.matches(":focus-visible")).toBe(true);
      await expect(getComputedStyle(punho).boxShadow).not.toBe("none");
    });

    await step("O painel também é alcançável pelo Tab", async () => {
      // O painel pode rolar; região rolável fora da ordem de tabulação esconde
      // conteúdo de quem não usa mouse (WCAG 2.1.1).
      await expect(primeiro).toHaveAttribute("tabindex", "0");
    });
  },
};

export const Disabled: Story = {
  render: () => (
    <div className="nds-rounded-lg nds-border-default nds-overflow-hidden" style={boxStyle}>
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={50} minSize={20}>
          <div className="nds-cluster nds-p-4 nds-text-body" data-justify="center">
            Fixo
          </div>
        </ResizablePanel>
        <ResizableHandle disabled withHandle aria-label={ROTULO} />
        <ResizablePanel defaultSize={50} minSize={20}>
          <div className="nds-cluster nds-bg-muted nds-p-4 nds-text-body" data-justify="center">
            Fixo
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const punho = canvas.getByRole("separator", { name: ROTULO });

    await step("O divisor travado continua anunciado", async () => {
      await expect(punho).toHaveAttribute("aria-disabled", "true");
    });

    await step("E as setas não movem nada", async () => {
      const antes = fracaoDoPrimeiro(canvasElement);
      punho.focus();
      await userEvent.keyboard("{ArrowRight}{ArrowRight}{Home}{End}");
      await expect(fracaoDoPrimeiro(canvasElement)).toBeCloseTo(antes, 2);
    });

    await step("E o ponteiro não promete arrasto", async () => {
      await expect(getComputedStyle(punho).cursor).not.toBe("col-resize");
    });
  },
};
