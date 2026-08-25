import type { Meta, StoryObj } from "@storybook/react-vite";
import { within, expect } from "storybook/test";
import { MoreVertical, TrendingUp } from "lucide-react";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./card";
import { Button } from "./button";
import { Badge } from "./badge";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";
import {
  cardWithActionSource,
  cardWithImageSource,
  cardCompactoSource,
  cardPerfilSource,
  cardProductSource,
  cardSource,
} from "./card.source";

/**
 * Imagem em data URI, igual nas cinco stacks: a asserção de radius e de padding
 * mede a imagem REAL, e uma URL remota faria o resultado depender da rede.
 */
const DEMO_IMAGE_PRODUCT =
  "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='160'%3E%3Crect width='400' height='160' fill='%23cbd5e1'/%3E%3C/svg%3E";
const DEMO_IMAGE_AVATAR =
  "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Crect width='80' height='80' fill='%23cbd5e1'/%3E%3C/svg%3E";

const meta = {
  title: "UI/Card/Compositions",
  tags: ["layout"],
  component: Card,
  parameters: {
    layout: "centered",
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: cardSource },
      description: {
        component:
          "Composições canônicas do Card: com footer, com action, com imagem e exemplos reais (ProductCard, MetricCard, ProfileCard) para catálogo, dashboard e listas de perfil.",
      },
    },
  },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithFooter: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "O CardFooter ganha borda superior e fundo soft; o Card zera o próprio padding inferior ao detectar o rodapé como filho direto, para a borda encostar na base.",
      },
    },
  },
  render: () => (
    <Card className="nds-w-sm">
      <CardHeader>
        <CardTitle as="h3">Cadeira Gamer Pro</CardTitle>
        <CardDescription>Produto atualizado em 12/04.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="nds-text-base nds-font-semibold">R$ 1.299,00</p>
      </CardContent>
      <CardFooter className="nds-cluster" data-justify="end" data-spacing="md">
        <Button variant="outline" aria-label="Cancelar edição de Cadeira Gamer Pro">
          Cancelar
        </Button>
        <Button aria-label="Salvar alterações em Cadeira Gamer Pro">Salvar</Button>
      </CardFooter>
    </Card>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const card = canvasElement.querySelector<HTMLElement>('[data-slot="card"]')!;
    const footer = card.querySelector<HTMLElement>('[data-slot="card-footer"]')!;

    await step("O rodapé é filho direto e vem DEPOIS do conteúdo", async () => {
      await expect(footer.parentElement).toBe(card);
      await expect(card.lastElementChild).toBe(footer);
    });

    await step("O rodapé se separa do conteúdo por uma borda superior", async () => {
      await expect(
        Number.parseFloat(getComputedStyle(footer).borderTopWidth),
      ).toBeGreaterThan(0);
    });

    await step("As ações do rodapé nomeiam o card", async () => {
      await expect(
        canvas.getByRole("button", { name: "Cancelar edição de Cadeira Gamer Pro" }),
      ).toBeInTheDocument();
      await expect(
        canvas.getByRole("button", { name: "Salvar alterações em Cadeira Gamer Pro" }),
      ).toBeInTheDocument();
    });
  },
};

export const WithAction: Story = {
  parameters: {
    covers: ["functional.item3", "accessibility.item5", "visual.item3"],
    docs: {
      // A ação vive DENTRO do header e o snippet do meta não a tem: é a peça
      // que faz o header virar grade de duas colunas.
      source: { transform: cardWithActionSource },
      description: {
        story:
          "Com CardAction o header vira grid de duas colunas e a ação encosta à direita. A ordem do DOM continua título → descrição → ação, então o leitor de tela lê na ordem lógica.",
      },
    },
  },
  render: () => (
    <Card className="nds-w-sm">
      <CardHeader>
        <CardTitle as="h3">Cadeira Gamer Pro</CardTitle>
        <CardDescription>Em estoque</CardDescription>
        <CardAction>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Ações do produto Cadeira Gamer Pro"
          >
            <MoreVertical aria-hidden="true" className="nds-size-4" />
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <p className="nds-text-body">R$ 1.299,00</p>
      </CardContent>
    </Card>
  ),
  play: async ({ canvasElement, step }) => {
    const header = canvasElement.querySelector<HTMLElement>(
      '[data-slot="card-header"]',
    )!;

    await step("A ação vive DENTRO do header, não solta no card", async () => {
      // Fora do header a ação cairia no fluxo normal e o alinhamento à direita
      // sumiria — a posição vem da grid do header, não de uma classe própria.
      await expect(
        header.querySelector('[data-slot="card-action"]'),
      ).toBeInTheDocument();
    });

    await step("O header passa a ter duas colunas", async () => {
      const colunas = getComputedStyle(header).gridTemplateColumns.trim().split(/\s+/);
      await expect(colunas).toHaveLength(2);
    });

    await step("A ordem do DOM é título → descrição → ação", async () => {
      const slots = [...header.children].map((el) => el.getAttribute("data-slot"));
      await expect(slots).toEqual(["card-title", "card-description", "card-action"]);
    });
  },
};

export const WithImage: Story = {
  parameters: {
    covers: ["functional.item4", "visual.item5"],
    docs: {
      // A imagem como PRIMEIRO filho direto é o que dispara o sangramento por
      // CSS; a posição dela é a lição, e não cabe em nenhum arg.
      source: { transform: cardWithImageSource },
      description: {
        story:
          "Imagem como primeiro filho: o Card arredonda o topo dela e remove o próprio padding superior por CSS — não é preciso passar classe na `<img>`.",
      },
    },
  },
  render: () => (
    <Card className="nds-w-sm">
      <img
        src={DEMO_IMAGE_PRODUCT}
        alt="Cadeira Gamer Pro vista de frente, em fundo neutro"
        className="nds-w-full nds-aspect-16-9"
        style={{ objectFit: "cover" }}
      />
      <CardHeader>
        <CardTitle as="h3">Cadeira Gamer Pro</CardTitle>
        <CardDescription>
          Estrutura ergonômica com ajuste de altura e apoio lombar.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="nds-text-body nds-font-semibold">R$ 1.299,00</p>
      </CardContent>
    </Card>
  ),
  play: async ({ canvasElement, step }) => {
    const card = canvasElement.querySelector<HTMLElement>('[data-slot="card"]')!;
    const img = card.querySelector("img")!;

    await step("A imagem é o primeiro filho DIRETO do card", async () => {
      await expect(card.firstElementChild).toBe(img);
    });

    await step("O card cede o padding superior e o raio para a imagem", async () => {
      await expect(Number.parseFloat(getComputedStyle(card).paddingTop)).toBe(0);
      await expect(
        Number.parseFloat(getComputedStyle(img).borderTopLeftRadius),
      ).toBeGreaterThan(0);
    });

    await step("A imagem tem alternativa textual descritiva", async () => {
      // Imagem informativa: `alt` vazio a esconderia de quem usa leitor de tela,
      // e é ela que mostra o produto.
      await expect(img.alt.trim().length).toBeGreaterThan(0);
    });
  },
};

export const ProductCard: Story = {
  parameters: {
    docs: {
      // Unidade completa: imagem, status na ação e rodapé de uma vez só — o
      // meta mostra a forma canônica, esta story mostra o caso montado.
      source: { transform: cardProductSource },
      description: {
        story:
          'Exemplo real de catálogo: imagem + título + descrição + Badge de status na ação do header + rodapé com ações contextuais ("Editar produto Cadeira Gamer Pro", "Excluir produto Cadeira Gamer Pro").',
      },
    },
  },
  render: () => (
    <Card className="nds-w-sm">
      <img
        src={DEMO_IMAGE_PRODUCT}
        alt="Cadeira Gamer Pro vista de frente, em fundo neutro"
        className="nds-w-full nds-aspect-16-9"
        style={{ objectFit: "cover" }}
      />
      <CardHeader>
        <CardTitle as="h3">Cadeira Gamer Pro</CardTitle>
        <CardDescription>
          Estrutura ergonômica com ajuste de altura e apoio lombar.
        </CardDescription>
        <CardAction>
          <Badge variant="info">Em estoque</Badge>
        </CardAction>
      </CardHeader>
      <CardContent>
        <p className="nds-text-base nds-font-semibold">R$ 1.299,00</p>
      </CardContent>
      <CardFooter className="nds-cluster" data-justify="end" data-spacing="md">
        <Button variant="outline" aria-label="Editar produto Cadeira Gamer Pro">
          Editar
        </Button>
        <Button variant="destructive" aria-label="Excluir produto Cadeira Gamer Pro">
          Excluir
        </Button>
      </CardFooter>
    </Card>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const card = canvasElement.querySelector<HTMLElement>('[data-slot="card"]')!;

    await step("A unidade completa está montada, na ordem visual", async () => {
      const slots = [...card.children].map((el) =>
        el.tagName === "IMG" ? "img" : el.getAttribute("data-slot"),
      );
      await expect(slots).toEqual(["img", "card-header", "card-content", "card-footer"]);
    });

    await step("O status é a ação do header, não texto solto no corpo", async () => {
      const action = card.querySelector<HTMLElement>('[data-slot="card-action"]')!;
      await expect(action.textContent).toContain("Em estoque");
    });

    await step("Cada ação do rodapé diz sobre QUAL produto age", async () => {
      await expect(
        canvas.getByRole("button", { name: "Editar produto Cadeira Gamer Pro" }),
      ).toBeInTheDocument();
      await expect(
        canvas.getByRole("button", { name: "Excluir produto Cadeira Gamer Pro" }),
      ).toBeInTheDocument();
    });
  },
};

export const MetricCard: Story = {
  parameters: {
    docs: {
      // Densidade de painel: `size="sm"` e nenhum rodapé — o valor mora no
      // corpo, e o meta traria uma composição com ações que não existe aqui.
      source: { transform: cardCompactoSource },
      description: {
        story:
          'KPI em dashboard: `size="sm"` para densidade, título curto, valor em destaque no corpo e a tendência em texto de apoio com ícone decorativo.',
      },
    },
  },
  render: () => (
    <Card size="sm" className="nds-w-xs">
      <CardHeader>
        <CardTitle as="h3">Assinantes ativos</CardTitle>
        <CardDescription>Últimos 30 dias</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="nds-text-h4 nds-tabular-nums">8.742</p>
        <p
          className="nds-cluster nds-text-caption nds-text-success"
          data-align="center"
          data-spacing="xs"
        >
          <TrendingUp aria-hidden="true" style={{ height: "0.875rem", width: "0.875rem" }} />
          +12% no mês
        </p>
      </CardContent>
    </Card>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const card = canvasElement.querySelector<HTMLElement>('[data-slot="card"]')!;

    await step("A densidade do dashboard vem do tamanho sm", async () => {
      await expect(card).toHaveAttribute("data-size", "sm");
    });

    await step("O título nomeia a métrica e é heading", async () => {
      await expect(
        canvas.getByRole("heading", { name: "Assinantes ativos" }),
      ).toBeInTheDocument();
    });

    await step("O valor mora no corpo, não no título", async () => {
      // Trocar título e valor de lugar faz o leitor de tela anunciar "8.742"
      // como o nome do card, sem dizer do que ele fala.
      const content = card.querySelector<HTMLElement>('[data-slot="card-content"]')!;
      await expect(content.textContent).toContain("8.742");
    });
  },
};

export const ProfileCard: Story = {
  parameters: {
    docs: {
      // Avatar dentro do header e a ausência de corpo e rodapé: é a unidade
      // semântica mínima, e o `alt` vazio da foto faz parte da lição.
      source: { transform: cardPerfilSource },
      description: {
        story:
          "Card de perfil: avatar à esquerda do header, título (nome) e descrição (papel e localização). Sem footer — é a unidade semântica mínima.",
      },
    },
  },
  render: () => (
    <Card className="nds-w-sm">
      <CardHeader className="nds-cluster" data-align="center" data-spacing="sm">
        <Avatar>
          <AvatarImage src={DEMO_IMAGE_AVATAR} alt="" />
          <AvatarFallback>MR</AvatarFallback>
        </Avatar>
        <div className="nds-flex-1">
          <CardTitle as="h3">Maria Rodrigues</CardTitle>
          <CardDescription>Designer de produto · São Paulo, BR</CardDescription>
        </div>
      </CardHeader>
    </Card>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const card = canvasElement.querySelector<HTMLElement>('[data-slot="card"]')!;

    await step("O nome é o título do card, e é heading", async () => {
      await expect(
        canvas.getByRole("heading", { name: "Maria Rodrigues" }),
      ).toBeInTheDocument();
    });

    await step("O avatar é decorativo — o nome já está no título", async () => {
      // `alt=""` de propósito: com texto alternativo o leitor anunciaria o nome
      // duas vezes seguidas. Imagem decorativa sai da árvore de acessibilidade,
      // então medir por role vale tanto se a foto carregou quanto se caiu na
      // inicial de fallback.
      await expect(canvas.queryAllByRole("img")).toHaveLength(0);
    });

    await step("Sem rodapé o card termina no header", async () => {
      await expect(card.querySelector('[data-slot="card-footer"]')).toBeNull();
    });
  },
};
