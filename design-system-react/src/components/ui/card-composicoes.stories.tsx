import type { Meta, StoryObj } from "@storybook/react";
import { expect } from "storybook/test";
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
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";

const DEMO_IMAGE_PRODUCT =
  "https://images.unsplash.com/photo-1592078615290-033ee584e267?w=800&h=400&fit=crop";
const DEMO_IMAGE_AVATAR =
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=160&h=160&fit=crop&crop=faces";

const meta = {
  title: "UI/Card/Composicoes",
  tags: ["layout"],
  component: Card,
  parameters: {
    layout: "centered",
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          "Composicoes canônicas do Card: com footer, com action, com imagem e exemplos reais (ProductCard, MetricCard, ProfileCard) para catálogo, dashboard e listas de perfil.",
      },
    },
  },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithFooter: Story = {
  render: () => (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Cadeira Gamer Pro</CardTitle>
        <CardDescription>Produto atualizado em 12/04.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-base font-semibold">R$ 1.299,00</p>
      </CardContent>
      <CardFooter className="justify-end gap-2">
        <Button
          variant="outline"
          aria-label="Cancelar edição de Cadeira Gamer Pro"
        >
          Cancelar
        </Button>
        <Button aria-label="Salvar alterações em Cadeira Gamer Pro">Salvar</Button>
      </CardFooter>
    </Card>
  ),
  play: async ({ canvasElement }) => {
    // CardFooter detectado via has-data-[slot=card-footer]:pb-0
    const footer = canvasElement.querySelector('[data-slot="card-footer"]');
    await expect(footer).toBeInTheDocument();
    await expect(footer).toHaveClass("border-t");
  },
  parameters: {
    docs: {
      description: {
        story:
          "CardFooter ganha `border-t` + `bg-muted/50`; o Card absorve `pb-0` via `has-data-[slot=card-footer]` para alinhar a borda.",
      },
    },
  },
};

export const WithAction: Story = {
  render: () => (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Cadeira Gamer Pro</CardTitle>
        <CardDescription>Em estoque</CardDescription>
        <CardAction>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Ações do produto Cadeira Gamer Pro"
          >
            <MoreVertical aria-hidden="true" className="h-4 w-4" />
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <p className="text-sm">R$ 1.299,00</p>
      </CardContent>
    </Card>
  ),
  play: async ({ canvasElement }) => {
    const action = canvasElement.querySelector('[data-slot="card-action"]');
    await expect(action).toBeInTheDocument();
    // CardAction ocupa col-start-2 row-span-2 (grid slot à direita)
    await expect(action).toHaveClass("col-start-2");
  },
  parameters: {
    docs: {
      description: {
        story:
          "CardHeader vira grid `[1fr_auto]` quando `CardAction` está presente (via `has-data-[slot=card-action]`). Ordem DOM preservada — leitores leem título → descrição → ação.",
      },
    },
  },
};

export const WithImage: Story = {
  render: () => (
    <Card className="w-full max-w-sm">
      <ImageWithFallback
        src={DEMO_IMAGE_PRODUCT}
        alt="Cadeira Gamer Pro em fundo neutro"
        className="h-40 w-full object-cover"
      />
      <CardHeader>
        <CardTitle>Cadeira Gamer Pro</CardTitle>
        <CardDescription>
          Estrutura ergonômica com ajuste de altura e apoio lombar.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm font-semibold">R$ 1.299,00</p>
      </CardContent>
    </Card>
  ),
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector('[data-slot="card"]');
    await expect(root).toBeInTheDocument();
    // has-[>img:first-child]:pt-0 absorve o padding quando a img é primeira
    const firstChild = root?.firstElementChild;
    await expect(firstChild?.tagName).toBe("IMG");
  },
  parameters: {
    docs: {
      description: {
        story:
          "Imagem como primeiro filho: o Card aplica `rounded-t-(--radius-card)` e `pt-0` automaticamente via seletores CSS — não precisa classes manuais na `<img>`.",
      },
    },
  },
};

export const ProductCard: Story = {
  render: () => (
    <Card className="w-full max-w-sm">
      <ImageWithFallback
        src={DEMO_IMAGE_PRODUCT}
        alt="Cadeira Gamer Pro em fundo neutro"
        className="h-40 w-full object-cover"
      />
      <CardHeader>
        <CardTitle>Cadeira Gamer Pro</CardTitle>
        <CardDescription>
          Estrutura ergonômica com ajuste de altura e apoio lombar.
        </CardDescription>
        <CardAction>
          <Badge variant="secondary">Em estoque</Badge>
        </CardAction>
      </CardHeader>
      <CardContent>
        <p className="text-lg font-semibold">R$ 1.299,00</p>
      </CardContent>
      <CardFooter className="justify-end gap-2">
        <Button
          variant="outline"
          aria-label="Editar produto Cadeira Gamer Pro"
        >
          Editar
        </Button>
        <Button
          variant="destructive"
          aria-label="Excluir produto Cadeira Gamer Pro"
        >
          Excluir
        </Button>
      </CardFooter>
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Exemplo real de catálogo: imagem + título + descrição + Badge de status em CardAction + footer com ações contextuais ("Editar produto Cadeira Gamer Pro", "Excluir produto Cadeira Gamer Pro"). Labels via demonstration.labels.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector('[data-slot="card"]');
    await expect(root).toBeInTheDocument();
    await expect(canvasElement.querySelector('[data-slot="card-action"]')).toBeInTheDocument();
    await expect(canvasElement.querySelector('[data-slot="card-footer"]')).toBeInTheDocument();
  },
};

export const MetricCard: Story = {
  render: () => (
    <Card size="sm" className="w-full max-w-xs">
      <CardHeader>
        <CardDescription>Assinantes ativos</CardDescription>
        <CardTitle className="text-2xl">8.742</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <TrendingUp aria-hidden="true" className="h-3.5 w-3.5" />
          +12% no mês
        </p>
      </CardContent>
    </Card>
  ),
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector('[data-slot="card"]');
    await expect(root).toHaveAttribute("data-size", "sm");
  },
  parameters: {
    docs: {
      description: {
        story:
          'KPI em dashboard: `size="sm"` para densidade; descrição acima do título grande; trend em `muted-foreground` com ícone decorativo (`aria-hidden`).',
      },
    },
  },
};

export const ProfileCard: Story = {
  render: () => (
    <Card className="max-w-sm w-[24rem]">
      <CardHeader className="flex flex-row items-center gap-3">
        <Avatar>
          <AvatarImage
            src={DEMO_IMAGE_AVATAR}
            alt="Foto de perfil de Maria Rodrigues"
          />
          <AvatarFallback>MR</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <CardTitle>Maria Rodrigues</CardTitle>
          <CardDescription>Designer de produto · São Paulo, BR</CardDescription>
        </div>
      </CardHeader>
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Card de perfil: Avatar à esquerda do CardHeader, título (nome) + descrição (papel/localização). Sem footer — unidade semântica mínima.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector('[data-slot="card"]');
    await expect(root).toBeInTheDocument();
    await expect(canvasElement.querySelector('[data-slot="card-title"]')).toBeInTheDocument();
  },
};
