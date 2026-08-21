import type { Meta, StoryObj } from "@storybook/react-vite";
import { within, expect } from "storybook/test";
import {
  esperarAberto,
  esperarQuantidade,
  nomeAcessivel,
  paineisAbertos,
} from "@shared/testing/hover-card-probe";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "./hover-card";
import {
  hoverCardClasseExtraSource,
  hoverCardDefinicaoSource,
  hoverCardLadosSource,
  hoverCardMetricaSource,
  hoverCardPreviaDeLinkSource,
  hoverCardSource,
} from "./hover-card.source";

// Os padrões de conteúdo que o cartão hospeda. Todos seguem a mesma regra: o
// que está aqui dentro é ENRIQUECIMENTO — existe outro caminho para a mesma
// informação (o link, a página, o glossário), porque no toque não há hover.
//
// Todas as composições nascem abertas: é o estado que a regressão visual
// precisa capturar, e o estado fechado já está em UI/HoverCard/States.

const meta = {
  title: "UI/HoverCard/Compositions",
  tags: ["overlay"],
  component: HoverCard,
  parameters: {
    layout: "centered",
    // Sem argTypes nestas stories: sem isto o painel Controls abre vazio.
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      // O cartão de perfil é a composição canônica, e é o que esta transform
      // imprime — a story UserProfile é exatamente ela.
      source: { transform: hoverCardSource },
      description: {
        component:
          "Perfil, preview de link, definição de termo, métrica explicada, lados de abertura e classe extra no painel. O gatilho aparece sempre dentro de uma frase: é o uso real do componente e é o que mantém o alvo em linha dispensado do mínimo de 24px.",
      },
    },
  },
} satisfies Meta<typeof HoverCard>;

export default meta;
type Story = StoryObj<typeof meta>;

const paragrafo: React.CSSProperties = {
  contain: "layout",
  minHeight: 280,
  position: "relative",
  maxWidth: "24rem",
};

const CLASSES_GATILHO_BOTAO =
  "nds-text-primary nds-text-body nds-font-medium nds-underline-dotted nds-cursor-help nds-bg-transparent nds-border-none nds-p-0";

export const UserProfile: Story = {
  parameters: {
    covers: ["visual.item1"],
    docs: {
      description: {
        story:
          "Menção a uma pessoa revela avatar, nome e uma métrica curta. O link continua navegável por clique e por teclado — é ele o caminho de quem está no toque.",
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
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("O cartão traz avatar, nome e uma métrica curta", async () => {
      const painel = await esperarAberto();
      await expect(painel).toBeVisible();
      await expect(within(painel).getByText("Joana Silva")).toBeVisible();
      await expect(within(painel).getByText(/142 seguidores/)).toBeVisible();
    });

    await step("E o gatilho continua sendo um link de verdade", async () => {
      await expect(canvas.getByRole("link")).toHaveAttribute("href", "/users/joana");
    });
  },
};

export const LinkPreview: Story = {
  parameters: {
    covers: ["visual.item2"],
    docs: {
      // Outro conteúdo dentro do painel: origem, título e descrição do destino.
      source: { transform: hoverCardPreviaDeLinkSource },
      description: {
        story:
          "Cabeçalho com a origem, título do destino e uma linha de descrição. Reduz o clique exploratório: quem lê decide antes de sair da página.",
      },
    },
  },
  render: () => (
    <p className="nds-text-body" style={paragrafo}>
      O guia completo está em{" "}
      <HoverCard defaultOpen>
        <HoverCardTrigger asChild>
          <a
            href="https://design-system.dev"
            className="nds-text-primary nds-font-medium nds-hover-underline"
          >
            design-system.dev
          </a>
        </HoverCardTrigger>
        <HoverCardContent>
          <div className="nds-stack" data-spacing="sm">
            <div className="nds-cluster nds-text-caption nds-text-muted-foreground" data-spacing="xs">
              <span className="nds-rounded-sm nds-bg-muted nds-px-1" aria-hidden="true">
                D
              </span>
              <span className="nds-truncate">design-system.dev/overlays</span>
            </div>
            <p className="nds-text-body nds-font-medium nds-leading-none">
              Guia de overlays acessíveis
            </p>
            <p className="nds-text-caption nds-text-muted-foreground">
              Quando usar tooltip, popover e cartão de hover — e o que cada um exige de teclado.
            </p>
          </div>
        </HoverCardContent>
      </HoverCard>
      .
    </p>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("O cartão mostra origem, título e descrição do destino", async () => {
      const painel = await esperarAberto();
      await expect(painel).toBeVisible();
      await expect(within(painel).getByText(/design-system\.dev\/overlays/)).toBeVisible();
      await expect(within(painel).getByText("Guia de overlays acessíveis")).toBeVisible();
      await expect(canvas.getByRole("link")).toHaveAttribute("href", "https://design-system.dev");
    });
  },
};

export const TermDefinition: Story = {
  parameters: {
    covers: ["visual.item3"],
    docs: {
      // Gatilho de botão e `aria-label` próprio no painel — duas trocas que o
      // snippet do cartão de perfil esconderia.
      source: { transform: hoverCardDefinicaoSource },
      description: {
        story:
          "Sigla no meio da prosa abre o termo por extenso e a definição em uma frase. O gatilho é um botão, não um link: não há para onde navegar — o glossário continua sendo o caminho alternativo obrigatório.",
      },
    },
  },
  render: () => (
    <p className="nds-text-body" style={paragrafo}>
      Todo componente do sistema atende{" "}
      <HoverCard defaultOpen>
        <HoverCardTrigger asChild>
          <button type="button" className={CLASSES_GATILHO_BOTAO}>
            WCAG 2.2 AA
          </button>
        </HoverCardTrigger>
        <HoverCardContent aria-label="Definição de WCAG 2.2 AA">
          <div className="nds-stack" data-spacing="xs">
            <p className="nds-text-body nds-font-medium nds-leading-none">WCAG 2.2 nível AA</p>
            <p className="nds-text-caption nds-text-muted-foreground">
              Diretrizes de acessibilidade para conteúdo web — contraste mínimo de 4.5:1, operação
              por teclado e alvo de toque de 24px.
            </p>
          </div>
        </HoverCardContent>
      </HoverCard>
      , sem exceção.
    </p>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("O gatilho de definição é um botão, e não envia formulário", async () => {
      const gatilho = canvas.getByRole("button", { name: "WCAG 2.2 AA" });
      // Sem `type="button"`, o mesmo gatilho dentro de um <form> enviaria o
      // formulário ao ser ativado por Enter.
      await expect(gatilho).toHaveAttribute("type", "button");
    });

    await step("O nome acessível do painel vem do rótulo declarado", async () => {
      const painel = await esperarAberto();
      // Sem `aria-label`, o nome cairia no texto do gatilho ("WCAG 2.2 AA"),
      // que repetiria a sigla sem dizer o que o cartão traz.
      await expect(nomeAcessivel(painel)).toBe("Definição de WCAG 2.2 AA");
      await expect(within(painel).getByText("WCAG 2.2 nível AA")).toBeVisible();
    });
  },
};

export const ExplainedMetric: Story = {
  parameters: {
    docs: {
      // A regra de cor é o assunto: a cor semântica no número curto, o texto
      // corrido em cor de corpo. Só a composição inteira mostra isso.
      source: { transform: hoverCardMetricaSource },
      description: {
        story:
          "Valor de painel com o nome completo da métrica e os limiares. A cor semântica fica no número — texto corrido dentro do cartão continua na cor de corpo, que é o que garante o contraste independentemente do valor.",
      },
    },
  },
  render: () => (
    <p className="nds-text-body" style={paragrafo}>
      A página inicial fechou o mês em{" "}
      <HoverCard defaultOpen>
        <HoverCardTrigger asChild>
          <button type="button" className={CLASSES_GATILHO_BOTAO}>
            LCP 1.8s
          </button>
        </HoverCardTrigger>
        <HoverCardContent aria-label="Explicação da métrica LCP">
          <div className="nds-stack" data-spacing="xs">
            <div
              className="nds-cluster"
              data-justify="between"
              data-align="baseline"
              data-spacing="sm"
            >
              <p className="nds-text-body nds-font-medium">Largest Contentful Paint</p>
              <span className="nds-text-caption nds-font-medium nds-text-success">1.8s</span>
            </div>
            <p className="nds-text-caption nds-text-muted-foreground">
              Tempo até o maior elemento visível aparecer. Bom até 2,5s; ruim acima de 4s.
            </p>
          </div>
        </HoverCardContent>
      </HoverCard>
      , dentro da meta.
    </p>
  ),
  play: async ({ step }) => {
    await step("O número carrega a cor semântica; o texto corrido, não", async () => {
      const painel = await esperarAberto();
      const valor = within(painel).getByText("1.8s");
      await expect(valor).toHaveClass(/nds-text-success/);
      const descricao = within(painel).getByText(/Tempo até o maior elemento/);
      await expect(descricao).not.toHaveClass(/nds-text-success/);
    });
  },
};

export const Sides: Story = {
  parameters: {
    covers: ["visual.item4"],
    docs: {
      // Quatro cartões lado a lado: `side` é preferência, e um cartão sozinho
      // não mostraria a fuga de colisão que a story afirma.
      source: { transform: hoverCardLadosSource },
      description: {
        story:
          "Os quatro lados de abertura. O lado é uma PREFERÊNCIA: quando não cabe, o cartão vira para o lado oposto do mesmo eixo — por isso o painel publica o lado que de fato usou em data-side.",
      },
    },
  },
  render: () => (
    <div className="nds-grid nds-max-w-lg" data-cols="2" data-spacing="lg">
      {(
        [
          ["acima", "top"],
          ["abaixo", "bottom"],
          ["esquerda", "left"],
          ["direita", "right"],
        ] as const
      ).map(([rotulo, lado]) => (
        <p className="nds-text-body nds-p-8" key={lado}>
          Abre{" "}
          <HoverCard defaultOpen>
            <HoverCardTrigger asChild>
              <button type="button" className={CLASSES_GATILHO_BOTAO}>
                {rotulo}
              </button>
            </HoverCardTrigger>
            <HoverCardContent side={lado} aria-label={`Cartão ${rotulo} do gatilho`}>
              <p className="nds-text-caption">Lado preferido: {rotulo}.</p>
            </HoverCardContent>
          </HoverCard>{" "}
          do gatilho.
        </p>
      ))}
    </div>
  ),
  play: async ({ step }) => {
    await step("Os quatro cartões abrem e cada um declara o lado que usou", async () => {
      const paineis = await esperarQuantidade(4);
      await expect(paineis).toHaveLength(4);

      const lados = paineis.map((p) => p.getAttribute("data-side"));
      for (const lado of lados) {
        await expect(lado).toBeTruthy();
      }

      // O EIXO é o contrato, não o lado exato: pedir "acima" sem espaço acima
      // resulta em "abaixo", e isso é comportamento correto de fuga de colisão.
      // Afirmar o lado literal transformaria o tamanho da janela do teste em
      // parte do contrato.
      const [acima, abaixo, esquerda, direita] = lados;
      await expect(["top", "bottom"]).toContain(acima);
      await expect(["top", "bottom"]).toContain(abaixo);
      await expect(["left", "right"]).toContain(esquerda);
      await expect(["left", "right"]).toContain(direita);
    });
  },
};

export const ExtraPanelClass: Story = {
  parameters: {
    covers: ["visual.item5"],
    docs: {
      // A `className` no painel é o assunto, e não há control que a descreva.
      source: { transform: hoverCardClasseExtraSource },
      description: {
        story:
          "A classe extra do painel é o caminho para o que a folha do cartão não define — e também para trocar a largura de UMA instância: as utilities entram por último no CSS compartilhado, então uma utilitária de largura vence a largura padrão de 20rem.",
      },
    },
  },
  render: () => (
    <p className="nds-text-body" style={paragrafo}>
      Resumo da entrega de{" "}
      <HoverCard defaultOpen>
        <HoverCardTrigger asChild>
          <a href="/users/joana" className="nds-text-primary nds-font-medium nds-hover-underline">
            @joana
          </a>
        </HoverCardTrigger>
        <HoverCardContent className="nds-w-md nds-text-center">
          <div className="nds-stack" data-spacing="xs">
            <p className="nds-text-body nds-font-medium nds-leading-none">Joana Silva</p>
            <p className="nds-text-caption nds-text-muted-foreground">
              Fechou 14 tarefas nesta sprint, 9 delas em revisão de acessibilidade.
            </p>
          </div>
        </HoverCardContent>
      </HoverCard>{" "}
      nesta sprint.
    </p>
  ),
  play: async ({ step }) => {
    await step("A classe extra convive com a classe do componente", async () => {
      const painel = await esperarAberto();
      // As duas coexistem: a classe do design system não é substituída pela do
      // consumidor, é acrescida.
      await expect(painel).toHaveClass(/nds-hover-card-content/);
      await expect(painel).toHaveClass(/nds-w-md/);
      await expect(getComputedStyle(painel).textAlign).toBe("center");
      await expect(paineisAbertos()).toHaveLength(1);
    });

    await step("E a largura customizada vence a largura padrão do cartão", async () => {
      // 28rem da utilitária contra os 20rem que `.nds-hover-card-content`
      // define. É o que prova que a customização de largura funciona de fato,
      // e não só que a classe está no atributo.
      const painel = await esperarAberto();
      const raiz = parseFloat(getComputedStyle(document.documentElement).fontSize);
      await expect(painel.getBoundingClientRect().width).toBeCloseTo(28 * raiz, 0);
    });
  },
};
