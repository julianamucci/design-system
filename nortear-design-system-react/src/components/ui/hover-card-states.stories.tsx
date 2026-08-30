import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { userEvent, within, expect } from "storybook/test";
import {
  panelEntrar,
  waitForOpen,
  waitForClosed,
  accessibleName,
  panelOpen,
  contrastRatio,
} from "@shared/testing/hover-card-probe";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "./hover-card";
import {
  hoverCardControlledSource,
  hoverCardClosedSource,
  hoverCardSource,
} from "./hover-card.source";
import { Button } from "./button";

// Os três estados que o conteúdo compartilhado descreve: fechado (só o
// gatilho), aberto (painel no portal) e controlado (quem manda é o estado de
// fora). Não há estado desabilitado com visual próprio — um gatilho
// desabilitado é o `disabled` do elemento nativo.

const meta = {
  title: "Primitives/Overlay/HoverCard/States",
  tags: ["overlay"],
  component: HoverCard,
  parameters: {
    layout: "centered",
    // Sem argTypes nestas stories: sem isto o painel Controls abre vazio.
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: hoverCardSource },
      description: {
        component:
          "Fechado, aberto e controlado. O painel só existe no DOM enquanto o cartão está aberto — fechado, o portal não deixa resíduo nenhum.",
      },
    },
  },
} satisfies Meta<typeof HoverCard>;

export default meta;
type Story = StoryObj<typeof meta>;

const paragrafo: React.CSSProperties = {
  contain: "layout",
  minHeight: 250,
  position: "relative",
  maxWidth: "24rem",
};

const CartaoPerfil = () => (
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
);

export const Closed: Story = {
  parameters: {
    docs: {
      // O que a story afirma é uma AUSÊNCIA — nem `aria-expanded` nem
      // `aria-haspopup` no gatilho —, e ausência não sai dos args.
      source: { transform: hoverCardClosedSource },
      description: {
        story:
          "Estado inicial. Nada além do gatilho existe no documento, e o gatilho não anuncia nenhum estado expandido: um cartão de preview não é um menu.",
      },
    },
  },
  render: () => (
    <p className="nds-text-body" style={paragrafo}>
      Comentário de{" "}
      <HoverCard>
        <HoverCardTrigger asChild>
          <a href="/users/joana" className="nds-text-primary nds-font-medium nds-hover-underline">
            @joana
          </a>
        </HoverCardTrigger>
        <HoverCardContent>
          <CartaoPerfil />
        </HoverCardContent>
      </HoverCard>{" "}
      há 2 horas.
    </p>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("link", { name: /@joana/i });

    await step("Fechado, o portal está vazio", async () => {
      await waitForClosed();
      await expect(trigger).toBeVisible();
      await expect(panelOpen()).toBeNull();
    });

    await step("O gatilho não anuncia estado de expansão", async () => {
      // Deliberado, e igual nas cinco stacks: `aria-expanded` descreveria o
      // cartão como um menu que o leitor comanda. Ele é conteúdo suplementar —
      // quem tem estado é o painel, não o link.
      await expect(trigger).not.toHaveAttribute("aria-expanded");
      await expect(trigger).not.toHaveAttribute("aria-haspopup");
    });
  },
};

export const Open: Story = {
  parameters: {
    covers: ["functional.item5", "accessibility.item2", "accessibility.item5"],
    docs: {
      description: {
        story:
          "Aberto por ponteiro. O cartão permanece enquanto o cursor estiver sobre o gatilho OU sobre o próprio painel — é o que a WCAG 1.4.13 chama de hoverable, e o que permite selecionar o texto de dentro.",
      },
    },
  },
  render: () => (
    <p className="nds-text-body" style={paragrafo}>
      Comentário de{" "}
      <HoverCard openDelay={100} closeDelay={80}>
        <HoverCardTrigger asChild>
          <a href="/users/joana" className="nds-text-primary nds-font-medium nds-hover-underline">
            @joana
          </a>
        </HoverCardTrigger>
        <HoverCardContent>
          <CartaoPerfil />
        </HoverCardContent>
      </HoverCard>{" "}
      há 2 horas.
    </p>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("link", { name: /@joana/i });

    // Estado conhecido: a play reexecuta no mesmo DOM pelo painel Interactions.
    await userEvent.keyboard("{Escape}");
    await waitForClosed();
    await userEvent.hover(trigger);
    const panel = await waitForOpen();

    await step("O painel é um dialog não-modal", async () => {
      await expect(panel).toHaveAttribute("role", "dialog");
      // Sem `aria-modal`: a ausência do atributo JÁ significa não-modal, e é o
      // markup que o Vanilla — referência do sistema — emite. Escrever
      // `aria-modal="false"` seria redundância que nenhuma outra stack tem.
      await expect(panel).not.toHaveAttribute("aria-modal");
      // Não-modal de verdade: o resto da página continua alcançável.
      await expect(trigger).toBeVisible();
      await expect(accessibleName(panel)).toBe("@joana");
    });

    await step("Levar o cursor para dentro do painel mantém o cartão aberto", async () => {
      // O caminho completo: sai do gatilho (o que agenda o fechamento) e entra
      // no painel (o que o cancela). Só a entrada, sem a saída, provaria nada.
      await panelEntrar(trigger, panel);
      // Espera deliberada, maior que o closeDelay de 80ms: o que se prova aqui
      // é a AUSÊNCIA de fechamento, e ausência não tem evento para aguardar.
      await new Promise((resolve) => setTimeout(resolve, 300));
      await expect(panelOpen()).toBe(panel);
      await expect(panel).toBeVisible();
    });

    await step("O texto do painel tem contraste de 4.5:1 contra o fundo do cartão", async () => {
      // Medido do par que o design system promete (--popover-foreground sobre
      // --popover), e não deduzido do token: é o valor que o navegador aplicou.
      const estilo = getComputedStyle(panel);
      await expect(contrastRatio(estilo.color, estilo.backgroundColor)).toBeGreaterThanOrEqual(4.5);
    });
  },
};

export const Controlled: Story = {
  parameters: {
    covers: ["functional.item6"],
    docs: {
      // Estado de fora: o par `open` + `onOpenChange` com `useState` é outra
      // composição, não uma configuração do cartão padrão.
      source: { transform: hoverCardControlledSource },
      description: {
        story:
          "Estado vindo de fora. Útil quando outra parte da tela precisa saber que o cartão está aberto — para pausar um carrossel, por exemplo. O gatilho continua abrindo por ponteiro e por foco; cada mudança volta pelo callback.",
      },
    },
  },
  render: () => {
    const ControlledDemo = () => {
      const [isOpen, setAberto] = useState(false);
      return (
        <div className="nds-stack" data-spacing="md" style={paragrafo}>
          <div className="nds-cluster" data-spacing="sm">
            {/* Nomes próprios, e não os mesmos do gatilho: dois controles com o
                mesmo nome acessível são ambíguos em leitor de tela. */}
            <Button size="sm" variant="outline" onClick={() => setAberto(true)}>
              Abrir pelo estado externo
            </Button>
            <Button size="sm" variant="outline" onClick={() => setAberto(false)}>
              Fechar pelo estado externo
            </Button>
          </div>

          <p className="nds-text-body">
            Comentário de{" "}
            <HoverCard open={isOpen} onOpenChange={setAberto}>
              <HoverCardTrigger asChild>
                <a href="/users/joana" className="nds-text-primary nds-font-medium nds-hover-underline">
                  @joana
                </a>
              </HoverCardTrigger>
              <HoverCardContent>
                <CartaoPerfil />
              </HoverCardContent>
            </HoverCard>{" "}
            há 2 horas.
          </p>

          <p className="nds-text-caption nds-text-muted-foreground" data-testid="estado-externo">
            State externo: {isOpen ? "aberto" : "fechado"}
          </p>
        </div>
      );
    };
    return <ControlledDemo />;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const open = canvas.getByRole("button", { name: "Abrir pelo estado externo" });
    const close = canvas.getByRole("button", { name: "Fechar pelo estado externo" });
    const espelho = canvas.getByTestId("estado-externo");

    await step("O cartão obedece ao estado externo, sem ponteiro nenhum", async () => {
      // Nenhum hover e nenhum foco no gatilho: quem abre é a propriedade, e é
      // isso que distingue o modo controlado.
      await userEvent.click(open);
      const panel = await waitForOpen();
      await expect(panel).toBeVisible();
      await expect(espelho).toHaveTextContent("aberto");
    });

    await step("E fecha pelo mesmo caminho", async () => {
      await userEvent.click(close);
      await waitForClosed();
      await expect(panelOpen()).toBeNull();
      await expect(espelho).toHaveTextContent("fechado");
    });
  },
};
