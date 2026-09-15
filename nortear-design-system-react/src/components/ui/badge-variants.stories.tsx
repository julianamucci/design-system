import { figmaDesign } from "@shared/figma/design-links";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { within, expect } from "storybook/test";
import {
  BADGE_BORDER_FLOOR,
  badgeBorder,
  badgeRoot,
  badgeSurface,
  badgeVariant,
  borderAgainstPage,
  type BadgeVariant,
} from "@shared/testing/badge-probe";
import { Badge } from "./badge";
import {
  badgeDefaultSource,
  badgeDestructiveSource,
  badgeSemanticsSource,
  badgeSource,
} from "./badge.source";

const meta = {
  title: "Components/Feedback/Badge/Variants",
  tags: ["feedback"],
  component: Badge,
  parameters: {
    design: figmaDesign("badge"),
    layout: "centered",
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: badgeSource },
      description: {
        component:
          "Cada variante do Badge reflete um nível de hierarquia visual: default destaca, destructive alerta, warning avisa, success confirma e info contextualiza sem competir por atenção.",
      },
    },
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

/*
 * O que a variante promete é o desenho, e desenho se mede — pela sonda
 * compartilhada (`badge-probe.ts`), a mesma nas cinco stacks. A variante mora
 * só na BORDA, de 2px; fundo e texto são neutros em todas.
 *
 * As asserções ficam no corpo da play, e não atrás de uma função: a contagem
 * de asserções por story (`coverage_divergence`) lê o corpo, e asserção
 * escondida some da conta. A sonda só MEDE; quem afirma é a story.
 *
 * A referência nunca é montada com classe escrita à mão: o esperado sai do
 * token resolvido pela sonda, e o medido sai do componente renderizado.
 */

export const Default: Story = {
  // O arquivo desliga os controls, então o `meta` não tem args de onde ler a
  // variante: cada story diz a sua.
  parameters: {
    covers: ["functional.item1", "visual.item2"],
    docs: { source: { transform: badgeDefaultSource } },
  },
  render: () => <Badge>Novo</Badge>,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const badge = badgeRoot(canvasElement);
    await expect(canvas.getByText("Novo")).toBe(badge);
    await expect(badgeVariant(badge)).toBe("default");

    // functional.item1 — a ênfase alta vem da borda em --primary.
    const border = badgeBorder(badge, "default");
    await expect(border.width).toBeGreaterThanOrEqual(2);
    await expect(border.color).toBe(border.expected);

    const surface = badgeSurface(badge);
    await expect(surface.background).toBe(surface.expectedBackground);
    await expect(surface.color).toBe(surface.expectedColor);
    await expect(surface.textRatio).toBeGreaterThanOrEqual(4.5);
  },
};

export const Destructive: Story = {
  parameters: {
    covers: ["functional.item3", "accessibility.item3", "visual.item2"],
    docs: { source: { transform: badgeDestructiveSource } },
  },
  render: () => <Badge variant="destructive">Urgente</Badge>,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const badge = badgeRoot(canvasElement);
    await expect(canvas.getByText("Urgente")).toBe(badge);
    await expect(badgeVariant(badge)).toBe("destructive");

    // functional.item3 — a cor sinaliza pela borda.
    const border = badgeBorder(badge, "destructive");
    await expect(border.width).toBeGreaterThanOrEqual(2);
    await expect(border.color).toBe(border.expected);

    // accessibility.item3 — o contraste vem do texto neutro: com fundo e texto
    // fora do par semântico, os 4.5:1 não dependem da variante escolhida.
    const surface = badgeSurface(badge);
    await expect(surface.background).toBe(surface.expectedBackground);
    await expect(surface.color).toBe(surface.expectedColor);
    await expect(surface.textRatio).toBeGreaterThanOrEqual(4.5);
  },
};

const ALL_VARIANTS: BadgeVariant[] = ["default", "destructive", "warning", "success", "info"];

/**
 * As cinco numa story só: o que as semânticas prometem não é cada uma
 * isolada, e sim serem DISTINGUÍVEIS entre si. Uma por story deixaria passar o
 * erro mais provável — copiar o bloco da destructive e esquecer de trocar o
 * token, que é como as três nasceriam iguais.
 */
export const Semantics: Story = {
  parameters: {
    covers: [
      "functional.item2",
      "functional.item4",
      "functional.item7",
      "visual.item2",
      "visual.item5",
      "accessibility.item3",
      "accessibility.item5",
    ],
    docs: {
      // A escala inteira é o assunto; um badge sozinho a esconderia.
      source: { transform: badgeSemanticsSource },
      description: {
        story:
          "As cinco variantes lado a lado: a cor está só na borda, e fundo e texto são os mesmos em todas.",
      },
    },
  },
  render: () => (
    <div className="nds-cluster" data-spacing="sm">
      <Badge>Novo</Badge>
      <Badge variant="destructive">Urgente</Badge>
      <Badge variant="warning">Vence hoje</Badge>
      <Badge variant="success">Aprovado</Badge>
      <Badge variant="info">Novidade</Badge>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const badges = Array.from(
      canvasElement.querySelectorAll<HTMLElement>('[data-slot="badge"]'),
    );
    await expect(badges.map((badge) => badgeVariant(badge))).toEqual(ALL_VARIANTS);

    const borders: Partial<Record<BadgeVariant, string>> = {};
    for (const badge of badges) {
      const variant = badgeVariant(badge) as BadgeVariant;
      // A tabela da sonda diz o que a folha faz, não o que o nome sugere:
      // `info` lê a hairline `--border`, e não `--info`.
      const border = badgeBorder(badge, variant);
      await expect(border.width, `largura da borda da ${variant}`).toBeGreaterThanOrEqual(2);
      await expect(border.color, `cor da borda da ${variant}`).toBe(border.expected);

      // functional.item7 — fundo e texto não mudam entre variantes.
      const surface = badgeSurface(badge);
      await expect(surface.background, `fundo da ${variant}`).toBe(surface.expectedBackground);
      await expect(surface.color, `texto da ${variant}`).toBe(surface.expectedColor);
      await expect(surface.textRatio, `contraste do texto da ${variant}`).toBeGreaterThanOrEqual(4.5);
      borders[variant] = border.color;
    }

    // accessibility.item5 — a borda é o contorno que identifica a variante, e
    // precisa de 3:1 contra a página (WCAG 1.4.11). A `info` fica FORA por
    // decisão (D3): ela assumiu a hairline neutra `--border`, a mesma de input
    // e card, que mede abaixo do piso de propósito — é o neutro discreto.
    const chromatic = badges.filter((badge) => badgeVariant(badge) !== "info");
    await expect(chromatic).toHaveLength(4);
    for (const badge of chromatic) {
      await expect(
        borderAgainstPage(badge),
        `borda da ${badgeVariant(badge)} contra a página`,
      ).toBeGreaterThanOrEqual(BADGE_BORDER_FLOOR);
    }

    // Três cores, e não três nomes para a mesma.
    await expect(new Set([borders.warning, borders.success, borders.info]).size).toBe(3);

    // functional.item2 — a warning não pode se confundir com a destructive.
    await expect(borders.warning).not.toBe(borders.destructive);
  },
};
