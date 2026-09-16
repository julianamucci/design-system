import type { Meta, StoryObj } from "@storybook/react-vite";
import { within, expect, waitFor } from "storybook/test";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./tooltip";
import { balaoDe, cabeNoLado, esperarLado } from "./tooltip.fixtures";
import { Button } from "./button";
import { Save } from "lucide-react";
import {
  tooltipWithShortcutSource,
  tooltipCurtoSource,
  tooltipSource,
  tooltipTextLongSource,
} from "./tooltip.source";

import { figmaDesign } from "@shared/figma/design-links";
// As três variantes que o conteúdo compartilhado descreve — texto curto, texto
// com atalho e texto longo. Todas nascem abertas: é o único jeito de a regressão
// visual capturar o balão, que só existe no DOM enquanto está aberto.

/** Luminância relativa da WCAG a partir de um `rgb(r, g, b)` computado. */
function luminancia(cor: string): number {
  const [r, g, b] = (cor.match(/[\d.]+/g) ?? ["0", "0", "0"]).slice(0, 3).map((v) => {
    const channel = Number(v) / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Razão de contraste WCAG entre duas cores computadas. */
function contraste(a: string, b: string): number {
  const [light, escuro] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
  return (light + 0.05) / (escuro + 0.05);
}

const meta = {
  title: "Components/Overlay/Tooltip/Variants",
  tags: ["overlay"],
  component: Tooltip,
  decorators: [
    // Sem `delay={0}` (D5): as três variantes nascem por `defaultOpen`, que não
    // passa pela espera do ponteiro — o zero não servia a nenhuma delas e só
    // fazia o arquivo medir um atraso que o design system não entrega.
    (Story) => (
      <TooltipProvider>
        <Story />
      </TooltipProvider>
    ),
  ],
  parameters: {
    design: figmaDesign("tooltip"),
    layout: "centered",
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: tooltipSource },
      description: {
        component:
          "Default é texto curto. Com atalho acrescenta a tecla em <kbd>, que a folha compartilhada reconhece e usa para encurtar o respiro à direita. Texto longo quebra dentro do limite de largura do balão — passou disso, o caso é de Popover.",
      },
    },
  },
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

// Palco que CENTRA o gatilho, e não só reserva altura.
//
// As três stories daqui nascem abertas, e duas delas são a foto do Chromatic
// para `visual.item1` ("side top"). Medido: o `layout: "centered"` não centra na
// vertical neste runner — o palco encosta no topo do quadro, e a folga acima do
// gatilho vira só o padding. Com 150px de altura e o gatilho no topo não havia
// folga para o balão, e o base-ui virava para `bottom`, CORRETAMENTE: a
// baseline registraria o oposto do que a lista de testes afirma.
//
// A altura saiu do `style` inline para `nds-min-h-100`: altura é valor de
// design, e inline ela escapa do tema e da densidade.

export const Default: Story = {
  parameters: {
    covers: ["visual.item1", "accessibility.item2"],
    docs: {
      // Nasce aberta, e o estado inicial é o assunto: o balão só existe no DOM
      // enquanto aberto.
      source: { transform: tooltipCurtoSource },
      description: {
        story:
          "Default — texto curto explicativo, com o par de cores do balão medido contra o limite de 4.5:1.",
      },
    },
  },
  render: () => (
    <div
      className="nds-cluster nds-min-h-100"
      data-align="center"
      data-justify="center"
      style={{ contain: "layout", position: "relative" }}
    >
      <Tooltip defaultOpen>
        <TooltipTrigger
          render={(props) => (
            <Button {...props} variant="ghost" size="icon" aria-label="Salvar">
              <Save aria-hidden="true" />
            </Button>
          )}
        />
        <TooltipContent>Salvar</TooltipContent>
      </Tooltip>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const trigger = within(canvasElement).getByRole("button", { name: /Salvar/i });

    await step("Nasce aberto, com o texto curto no balão", async () => {
      await waitFor(async () => {
        await expect(balaoDe(trigger)).not.toBeNull();
      });
      const balao = balaoDe(trigger)!;
      await expect(balao).toHaveClass(/nds-tooltip-content/);
      await expect(balao.textContent?.trim()).toBe("Salvar");
    });

    await step("O balão nasce do lado pedido — é esta a foto do Chromatic", async () => {
      // `visual.item1` afirma "side top". Sem folga garantida acima, a baseline
      // podia registrar um balão VIRADO para baixo, e a foto passaria a provar
      // o contrário do que a lista de testes diz — sem nada ficar vermelho.
      // Premissa antes do resultado, com os números na mensagem.
      const balao = balaoDe(trigger)!;
      const lado = await esperarLado(balao, "top");
      const { folga, preciso, viewport } = cabeNoLado(trigger, balao, "top");
      await expect(
        folga,
        `sem folga em "top": ${Math.round(folga)}px livres para um balão que precisa de ${Math.round(preciso)}px (janela ${viewport}) — abra espaço acima do gatilho`,
      ).toBeGreaterThanOrEqual(preciso);
      await expect(lado).toBe("top");
    });

    await step("O texto do balão passa dos 4.5:1 exigidos", async () => {
      // Medido no elemento real, não na tabela de tokens: é a combinação
      // aplicada (fundo --primary, texto --primary-foreground) que a pessoa lê,
      // e ela precisa valer em qualquer tema da toolbar.
      const computedStyle = getComputedStyle(balaoDe(trigger)!);
      await expect(contraste(computedStyle.color, computedStyle.backgroundColor)).toBeGreaterThanOrEqual(4.5);
    });
  },
};

export const WithShortcut: Story = {
  parameters: {
    covers: ["visual.item2"],
    docs: {
      // O par <kbd data-slot="kbd"> é a composição que os args não descrevem.
      source: { transform: tooltipWithShortcutSource },
      description: {
        story:
          "Tooltip com atalho de teclado em <kbd> — útil para botões icon-only com hotkeys (ex.: Salvar Ctrl+S).",
      },
    },
  },
  render: () => (
    <div
      className="nds-cluster nds-min-h-100"
      data-align="center"
      data-justify="center"
      style={{ contain: "layout", position: "relative" }}
    >
      <Tooltip defaultOpen>
        <TooltipTrigger
          render={(props) => (
            <Button {...props} variant="ghost" size="icon" aria-label="Salvar">
              <Save aria-hidden="true" />
            </Button>
          )}
        />
        <TooltipContent>
          <span>Salvar</span>
          {/* `.nds-kbd` + `data-slot="kbd"`: a classe é a do design system, e o
              data-slot é o que faz `.nds-tooltip-content:has([data-slot="kbd"])`
              encurtar o respiro à direita do balão. */}
          <kbd className="nds-kbd" data-slot="kbd">Ctrl</kbd>
          <kbd className="nds-kbd" data-slot="kbd">S</kbd>
        </TooltipContent>
      </Tooltip>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const trigger = within(canvasElement).getByRole("button", { name: /Salvar/i });

    await step("O atalho vai em <kbd>, não solto no texto", async () => {
      await waitFor(async () => {
        await expect(balaoDe(trigger)).not.toBeNull();
      });
      const teclas = balaoDe(trigger)!.querySelectorAll("kbd");
      await expect(teclas.length).toBe(2);
      await expect(teclas[0].textContent).toBe("Ctrl");
    });

    await step("O balão nasce do lado pedido — é esta a foto do Chromatic", async () => {
      // Mesma razão da `Default`: `visual.item2` fotografa o balão com a tecla,
      // e um balão virado por falta de espaço viraria baseline sem aviso.
      const balao = balaoDe(trigger)!;
      const lado = await esperarLado(balao, "top");
      const { folga, preciso, viewport } = cabeNoLado(trigger, balao, "top");
      await expect(
        folga,
        `sem folga em "top": ${Math.round(folga)}px livres para um balão que precisa de ${Math.round(preciso)}px (janela ${viewport}) — abra espaço acima do gatilho`,
      ).toBeGreaterThanOrEqual(preciso);
      await expect(lado).toBe("top");
    });

    await step("A folha compartilhada reconhece a tecla e encurta o respiro", async () => {
      const balao = balaoDe(trigger)!;
      await expect(balao.querySelector('[data-slot="kbd"]')).not.toBeNull();
      await expect(getComputedStyle(balao).paddingInlineEnd).not.toBe(
        getComputedStyle(balao).paddingInlineStart,
      );
    });
  },
};

export const LongText: Story = {
  parameters: {
    covers: ["visual.item4"],
    docs: {
      // O comprimento do texto É a variante: o snippet do meta o esconderia.
      source: { transform: tooltipTextLongSource },
      description: {
        story:
          "Texto longo — quebra dentro do limite de largura do balão. Use só se realmente couber em poucas linhas; passou disso, o caso é de Popover.",
      },
    },
  },
  render: () => (
    <div
      className="nds-cluster nds-min-h-100"
      data-align="center"
      data-justify="center"
      style={{ contain: "layout", position: "relative" }}
    >
      <Tooltip defaultOpen>
        <TooltipTrigger
          render={(props) => (
            <Button {...props} variant="outline">
              Compartilhar
            </Button>
          )}
        />
        <TooltipContent side="bottom">
          Cria um link público de leitura — qualquer pessoa com o link vê o conteúdo
        </TooltipContent>
      </Tooltip>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const trigger = within(canvasElement).getByRole("button", { name: /Compartilhar/i });

    await step("O texto quebra dentro do limite de largura do balão", async () => {
      await waitFor(async () => {
        await expect(balaoDe(trigger)).not.toBeNull();
      });
      const balao = balaoDe(trigger)!;
      await expect(balao.textContent).toMatch(/link público/i);
      // O limite vem da folha compartilhada; medir a largura real prova que o
      // texto respeitou o teto em vez de esticar o balão pela viewport.
      const limit = parseFloat(getComputedStyle(balao).maxWidth);
      await expect(limit).toBeGreaterThan(0);
      await expect(balao.getBoundingClientRect().width).toBeLessThanOrEqual(limit + 1);
    });
  },
};
