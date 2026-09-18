import type * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { userEvent, within, expect, fn } from "storybook/test";
import {
  waitForOpen,
  waitForClosed,
  accessibleName,
  panelOpen,
  leaveWithPointer,
  expectCentradoNoEixoCruzado,
  withSceneAwayFromEdge,
} from "@shared/testing/hover-card-probe";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "./hover-card";
import { hoverCardSource } from "./hover-card.source";
import { HoverCardDocs } from "@/components/docs/HoverCardDocs";
import { withAutoDocsTab } from "@/lib/withAutoDocsTab";

import { figmaDesign } from "@shared/figma/design-links";
type HoverCardPlaygroundArgs = {
  side?: "top" | "bottom" | "left" | "right";
  align?: "start" | "center" | "end";
  openDelay?: number;
  closeDelay?: number;
  defaultOpen?: boolean;
  triggerLabel?: string;
  onOpenChange?: (open: boolean) => void;
};

const HoverCardForArgs = HoverCard as unknown as React.ComponentType<HoverCardPlaygroundArgs>;

const meta = {
  title: "Components/Overlay/HoverCard",
  component: HoverCardForArgs,
  tags: ["autodocs", "overlay"],
  parameters: {
    design: figmaDesign("hoverCard"),
    layout: "centered",
    docs: {
      page: withAutoDocsTab(HoverCardDocs),
      // O painel imprimia `<HoverCardForArgs …>`, alias de tipo que só existe
      // neste arquivo para o Storybook montar os controls.
      source: { transform: hoverCardSource },
    },
  },
  argTypes: {
    triggerLabel: {
      control: "text",
      description:
        "Texto do gatilho. Conteúdo natural (uma menção, um nome), nunca “passe o mouse aqui”.",
      table: { type: { summary: "string" }, defaultValue: { summary: "@joana" } },
    },
    side: {
      control: { type: "radio" },
      options: ["top", "bottom", "left", "right"],
      description: "Lado preferido de abertura. Vira sozinho quando não cabe.",
      table: { type: { summary: '"top" | "bottom" | "left" | "right"' }, defaultValue: { summary: '"bottom"' } },
    },
    align: {
      control: { type: "radio" },
      options: ["start", "center", "end"],
      description: "Alinhamento do painel no eixo do lado escolhido.",
      table: { type: { summary: '"start" | "center" | "end"' }, defaultValue: { summary: '"center"' } },
    },
    openDelay: {
      control: { type: "number" },
      description: "Espera em ms antes de abrir, no ponteiro e no foco.",
      table: { type: { summary: "number" }, defaultValue: { summary: "600" } },
    },
    closeDelay: {
      control: { type: "number" },
      description: "Espera em ms antes de fechar depois que o cursor sai.",
      table: { type: { summary: "number" }, defaultValue: { summary: "300" } },
    },
    defaultOpen: {
      control: "boolean",
      description: "Estado inicial em modo não-controlado.",
      table: { type: { summary: "boolean" }, defaultValue: { summary: "false" } },
    },
    onOpenChange: {
      control: false,
      description: "Chamado a cada abertura e fechamento, com o novo estado.",
      table: { type: { summary: "(open: boolean) => void" } },
    },
  },
  args: {
    triggerLabel: "@joana",
    side: "bottom",
    align: "center",
    // Espera do SISTEMA: 600ms para abrir e 300ms para fechar. O Playground é
    // o exemplo canônico, e a página exige espera de abertura de ao menos
    // 300ms — atraso customizado é assunto da variante `withDelay`.
    openDelay: 600,
    closeDelay: 300,
    defaultOpen: false,
    onOpenChange: fn(),
  },
} satisfies Meta<typeof HoverCardForArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  parameters: {
    covers: [
      "functional.item1", "functional.item2", "functional.item3", "functional.item4",
      "accessibility.item1", "accessibility.item3", "accessibility.item4",
      "accessibility.item6",
    ],
  },
  render: ({ side, align, openDelay, closeDelay, defaultOpen, triggerLabel, onOpenChange }) => (
    // `key`: `defaultOpen` só é lido na montagem, então trocar o control sem
    // remontar não mudaria nada na tela.
    // A reserva de espaço sai de CLASSE (`nds-min-h-50`), como no `emFrase` do
    // Vanilla: cravada em `style`, venceria a folha e sairia do tema, da
    // densidade e da escala. No `style` fica só mecânica de layout — e só
    // `contain`, como o Vanilla: o `position: relative` que morava aqui não
    // ancorava nada, porque o painel vive num portal no `<body>`.
    <p className="nds-text-body nds-max-w-sm nds-min-h-50" style={{ contain: "layout" }}>
      Comentário de{" "}
      <HoverCard
        key={String(defaultOpen)}
        openDelay={openDelay}
        closeDelay={closeDelay}
        defaultOpen={defaultOpen}
        onOpenChange={(isOpen) => onOpenChange?.(isOpen)}
      >
        <HoverCardTrigger asChild>
          <a href="/users/joana" className="nds-text-primary nds-font-medium nds-hover-underline">
            {triggerLabel}
          </a>
        </HoverCardTrigger>
        <HoverCardContent side={side} align={align}>
          <div className="nds-cluster" data-spacing="sm" data-align="start">
            <div
              aria-hidden="true"
              className="nds-cluster nds-size-10 nds-shrink-0 nds-rounded-full nds-bg-muted nds-text-body nds-font-medium"
              data-align="center"
              data-justify="center"
            >
              JS
            </div>
            <div className="nds-stack" data-spacing="xs">
              <p className="nds-text-body nds-font-medium nds-leading-none">Joana Silva</p>
              <p className="nds-text-caption nds-text-muted-foreground">Designer · 142 seguidores</p>
            </div>
          </div>
        </HoverCardContent>
      </HoverCard>{" "}
      há 2 horas.
    </p>
  ),
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("link", { name: /@joana/i });
    const requestedSide = args.side ?? "bottom";

    await step("O gatilho continua sendo um link de verdade", async () => {
      // O cartão é ENRIQUECIMENTO: quem está no toque, ou num leitor de tela,
      // chega ao perfil pelo clique. É exigência do componente, não do exemplo.
      await expect(trigger).toHaveAttribute("href", "/users/joana");
      await expect(trigger).toHaveAttribute("data-slot", "hover-card-trigger");
    });

    // Estado conhecido antes das afirmações: o painel Interactions REEXECUTA a
    // play no mesmo DOM, e um passo que dependa do que a rodada anterior deixou
    // inverte de resultado na segunda vez.
    await userEvent.keyboard("{Escape}");
    await waitForClosed("no reset inicial");

    await step("Fechado, não existe painel no documento", async () => {
      await expect(panelOpen()).toBeNull();
    });

    await step("Passar o ponteiro abre o cartão", async () => {
      const callsBefore = (args.onOpenChange as ReturnType<typeof fn>).mock.calls.length;
      await userEvent.hover(trigger);
      const panel = await waitForOpen();
      await expect(panel).toBeVisible();
      // Sem `role`: o painel é conteúdo descritivo, não um diálogo. Quem o liga
      // ao gatilho é o `aria-describedby`, e é ele que faz o leitor de tela
      // anunciar o CONTEÚDO do cartão em vez de só o gatilho.
      await expect(panel).not.toHaveAttribute("role");
      await expect(accessibleName(panel)).toBe("");
      await expect(trigger).toHaveAttribute("aria-describedby", panel.id);
      await expect(panel).toHaveClass(/nds-hover-card-content/);
      await expect(
        (args.onOpenChange as ReturnType<typeof fn>).mock.calls.length,
      ).toBeGreaterThan(callsBefore);
    });

    await step("O painel fica centrado no gatilho no eixo cruzado", async () => {
      // D11: o deslocamento no eixo cruzado é ZERO nas cinco, e o que se afirma
      // aqui é a COORDENADA — afirmar `alignOffset === 0` repetiria a constante
      // para ela mesma, que é a forma de asserção que deixou a D8 passar meses.
      //
      // O lado vem da story, que é quem o pediu: a fuga de colisão pode trocar o
      // lado pelo oposto, mas nunca troca o EIXO, e é o eixo que decide qual das
      // duas coordenadas é a cruzada.
      //
      // A cena é AFASTADA da borda antes de medir, e isto é a asserção inteira.
      // O executor de teste não aplica o `layout: "centered"` do meta — isso é
      // do canvas do Storybook —, então a story renderiza encostada à esquerda:
      // medido, `canvasElement` nasce em x=0 num viewport de 1200px e o gatilho
      // fica a ~145px da borda. Com o painel a 320px, centrá-lo pediria um
      // `left` negativo, e o `shift` da lib o trava no respiro da janela —
      // travado, o painel fica fora do centro com o componente CERTO e o
      // deslocamento cruzado deixa de ter efeito nenhum. Sem a folga o passo
      // mediria o travamento, não a D11.
      //
      // O auxiliar é o da sonda COMPARTILHADA e não uma versão local: cinco
      // formas diferentes de afastar a cena seriam cinco asserções diferentes,
      // que é o defeito que esta passagem existe para fechar.
      await withSceneAwayFromEdge(canvasElement, () => {
        expectCentradoNoEixoCruzado(trigger, panelOpen()!, requestedSide);
      });
    });

    await step("Levar o ponteiro para longe fecha o cartão", async () => {
      await leaveWithPointer(trigger, panelOpen()!);
      await waitForClosed("depois do ponteiro sair");
      await expect(panelOpen()).toBeNull();
    });

    await step("Tab alcança o gatilho e abre o cartão sem ponteiro nenhum", async () => {
      // É o que sustenta a WCAG 1.4.13 para quem navega por teclado: o mesmo
      // conteúdo, pelo foco.
      //
      // `userEvent.tab()` e não `.focus()`: o primitivo só abre por foco quando
      // o gatilho casa `:focus-visible`, e foco programático não casa. Com
      // `.focus()` este passo provaria o contrário do que pretende.
      await userEvent.tab();
      await expect(trigger).toHaveFocus();
      const panel = await waitForOpen("depois do foco");
      await expect(panel).toBeVisible();
    });

    await step("Escape fecha o cartão", async () => {
      // O foco está no gatilho, não dentro do painel: o listener é do
      // documento, e é isso que faz o atalho valer de qualquer lugar.
      await userEvent.keyboard("{Escape}");
      await waitForClosed("depois do Escape");
      await expect(panelOpen()).toBeNull();
      // A descrição sai com o painel: sobrando, apontaria para um `id` que já
      // não está no documento.
      await expect(trigger).not.toHaveAttribute("aria-describedby");
    });
  },
};

