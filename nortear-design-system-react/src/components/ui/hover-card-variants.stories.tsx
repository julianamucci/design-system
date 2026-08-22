import type { Meta, StoryObj } from "@storybook/react-vite";
import { userEvent, within, expect } from "storybook/test";
import {
  waitForOpen,
  waitForClosed,
  panelOpen,
} from "@shared/testing/hover-card-probe";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "./hover-card";
import {
  hoverCardWaitCurtaSource,
  hoverCardWaitDefaultSource,
  hoverCardSource,
} from "./hover-card.source";

// O HoverCard não tem variante de cor nem de tamanho: o painel é um só. O que
// varia é o TEMPO — quanto o cartão espera antes de aparecer e antes de sumir —
// e essa escolha é de conteúdo, não de estilo: preview rico pede 300-500ms;
// enriquecimento opcional pede 600ms ou mais, para não abrir a cada passada de
// cursor.

const meta = {
  title: "UI/HoverCard/Variants",
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
          "As duas configurações de tempo. Padrão usa a espera do próprio componente; a segunda encurta a espera, o que só se justifica quando o cartão traz informação que o leitor está procurando ativamente.",
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

export const Default: Story = {
  parameters: {
    docs: {
      // A AUSÊNCIA das esperas é o assunto, e o `defaultOpen` daqui é só o
      // device da captura visual — nenhum dos dois cabe nos args do arquivo.
      source: { transform: hoverCardWaitDefaultSource },
      description: {
        story:
          "Espera padrão: 600ms para abrir, 300ms para fechar. Nenhum atraso é escrito no markup — o cartão nasce aberto aqui só para a captura visual, e no uso real responde ao ponteiro e ao foco.",
      },
    },
  },
  render: () => (
    <p className="nds-text-body" style={paragrafo}>
      Comentário de{" "}
      <HoverCard defaultOpen>
        <HoverCardTrigger asChild>
          <a href="/users/joana" className="nds-text-primary nds-font-medium nds-hover-underline">
            @joana
          </a>
        </HoverCardTrigger>
        <HoverCardContent>
          <div className="nds-stack" data-spacing="xs">
            <p className="nds-text-body nds-font-medium nds-leading-none">Joana Silva</p>
            <p className="nds-text-caption nds-text-muted-foreground">
              Espera padrão: 600ms para abrir e 300ms para fechar.
            </p>
          </div>
        </HoverCardContent>
      </HoverCard>{" "}
      há 2 horas.
    </p>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Sem atraso escrito no markup, o cartão usa o padrão do componente", async () => {
      const painel = await waitForOpen();
      await expect(painel).toBeVisible();
      await expect(within(painel).getByText(/600ms/)).toBeVisible();
      await expect(canvas.getByRole("link")).toHaveAttribute("data-slot", "hover-card-trigger");
    });
  },
};

export const WithShortDelay: Story = {
  parameters: {
    covers: ["functional.item1"],
    docs: {
      // As esperas moram na RAIZ, e o arquivo desliga os controls: sem override
      // o painel imprimiria um cartão sem atraso nenhum.
      source: { transform: hoverCardWaitCurtaSource },
      description: {
        story:
          "Espera curta (150ms para abrir, 100ms para fechar) para previews que o leitor procura de propósito. Abaixo de ~300ms o cartão passa a abrir sozinho quando o cursor só atravessa o texto — é o que a diretriz de uso desaconselha.",
      },
    },
  },
  render: () => (
    <p className="nds-text-body" style={paragrafo}>
      Documentação em{" "}
      <HoverCard openDelay={150} closeDelay={100}>
        <HoverCardTrigger asChild>
          <a
            href="https://design-system.dev"
            className="nds-text-primary nds-font-medium nds-hover-underline"
          >
            design-system.dev
          </a>
        </HoverCardTrigger>
        <HoverCardContent>
          <div className="nds-stack" data-spacing="xs">
            <p className="nds-text-body nds-font-medium nds-leading-none">
              Guia de overlays acessíveis
            </p>
            <p className="nds-text-caption nds-text-muted-foreground">
              Espera de 150ms para abrir e 100ms para fechar.
            </p>
          </div>
        </HoverCardContent>
      </HoverCard>{" "}
      — leitura de 8 minutos.
    </p>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const gatilho = canvas.getByRole("link");

    // Estado conhecido: a play reexecuta no mesmo DOM pelo painel Interactions.
    await userEvent.keyboard("{Escape}");
    await waitForClosed();

    await step("O cartão abre depois da espera pedida na raiz", async () => {
      await expect(panelOpen()).toBeNull();
      const inicio = performance.now();
      await userEvent.hover(gatilho);
      const painel = await waitForOpen();
      await expect(painel).toBeVisible();
      await expect(within(painel).getByText("Guia de overlays acessíveis")).toBeVisible();

      // O cronômetro é a prova de que o atraso CHEGOU ao primitivo: no Base UI
      // `delay`/`closeDelay` moram no Trigger, e a raiz os ignorava em silêncio
      // — o cartão usava sempre os 600ms padrão, muito acima deste teto. A
      // folga é larga de propósito: o que se mede é a diferença entre 150 e
      // 600, não a precisão do relógio.
      await expect(performance.now() - inicio).toBeLessThan(550);
    });
  },
};
