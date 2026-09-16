import { figmaDesign } from "@shared/figma/design-links";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { within, expect, userEvent } from "storybook/test";
import { Check } from "lucide-react";
import { noTransicao, resolveColor } from "@shared/testing/cor";
import {
  badgeCounterMeasure,
  badgeLinkHover,
  badgeRoot,
  iconPadding,
} from "@shared/testing/badge-probe";
import { Badge, BadgeCounter } from "./badge";
import { Button } from "./button";
import {
  badgeAsButtonSource,
  badgeAsLinkSource,
  badgeSource,
  badgeWithCounterSource,
  badgeWithIconSource,
} from "./badge.source";
import badgeTranslations from "@shared/content/badge/translations.json";

/** Os mesmos rótulos que os construtores do painel leem — uma fonte só. */
const LABELS = badgeTranslations["pt-BR"].demonstration.labels;

const meta = {
  title: "Components/Feedback/Badge/Compositions",
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
          "Configurações contextuais do Badge: combinado com ícone, com contador dentro da etiqueta, dentro do Button do design system como gatilho, ou dentro de um link.",
      },
    },
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithIcon: Story = {
  parameters: {
    covers: ["functional.item5", "accessibility.item2", "visual.item3"],
    // A composição é o assunto: o ícone dentro do badge não cabe nos args.
    docs: { source: { transform: badgeWithIconSource } },
  },
  render: () => (
    <Badge>
      <Check aria-hidden="true" data-icon="inline-start" />
      {LABELS.statusLabel}
    </Badge>
  ),
  play: async ({ canvasElement }) => {
    const badge = badgeRoot(canvasElement);

    // accessibility.item2 — o ícone é reforço visual: quem nomeia é só o texto.
    const icon = badge.querySelector("svg");
    await expect(icon).not.toBeNull();
    await expect(icon).toHaveAttribute("aria-hidden", "true");
    await expect(icon).toHaveAttribute("data-icon", "inline-start");
    await expect(badge.textContent?.trim()).toBe(LABELS.statusLabel);

    // functional.item5 — o espaço entre ícone e texto é do container: o
    // .nds-badge declara gap, e o data-icon encurta o padding daquele lado.
    // Margem manual somaria ao gap e dobraria o respiro.
    const style = getComputedStyle(badge);
    await expect(style.display).toBe("inline-flex");
    await expect(parseFloat(style.columnGap)).toBeGreaterThan(0);
    await expect(getComputedStyle(icon!).marginRight).toBe("0px");
    const padding = iconPadding(badge);
    await expect(padding.start).toBeLessThan(padding.end);
  },
};

/**
 * Contador DENTRO da etiqueta — a peça que qualquer variante aceita. O número
 * entra na etiqueta, à direita do rótulo que lhe dá sentido: "12" sozinho não
 * diz de quê, e é o rótulo ao lado que carrega o significado.
 */
export const WithCounter: Story = {
  parameters: {
    covers: ["visual.item6"],
    docs: {
      source: { transform: badgeWithCounterSource },
      description: {
        story:
          "O contador é neutro de propósito: a cor da variante fica na borda ao redor. Preenchê-lo com a cor semântica derruba o número abaixo de 4.5:1 em parte dos temas.",
      },
    },
  },
  render: () => (
    <Badge variant="destructive">
      {LABELS.destructiveLabel}
      <BadgeCounter>12</BadgeCounter>
    </Badge>
  ),
  play: async ({ canvasElement }) => {
    const badge = badgeRoot(canvasElement);
    const counter = within(badge).getByText("12");

    // A peça publicada, e não uma classe solta na story.
    await expect(counter).toHaveAttribute("data-slot", "badge-counter");
    await expect(counter.classList.contains("nds-badge-counter")).toBe(true);

    // O número é lido: texto de verdade no DOM, sem aria-hidden.
    await expect(counter.hasAttribute("aria-hidden")).toBe(false);
    await expect((badge.textContent ?? "").replace(/\s+/g, " ").trim()).toBe(
      `${LABELS.destructiveLabel}12`,
    );

    // A transição sai do caminho antes de medir: ler no primeiro quadro devolve
    // a cor anterior, e é assim que se inventa um contraste de ~1.0.
    const measure = noTransicao(counter, () => badgeCounterMeasure(badge));
    await expect(measure.rightOfLabel, "o contador começa depois do rótulo").toBe(true);
    await expect(measure.sameLine, "rótulo e contador na mesma linha").toBe(true);
    await expect(measure.textRatio).toBeGreaterThanOrEqual(4.5);

    // Neutro, e não tingido pela variante.
    await expect(measure.background).toBe(measure.expectedBackground);
    await expect(measure.background).not.toBe(
      resolveColor(canvasElement, "hsl(var(--destructive))"),
    );
  },
};

export const AsButton: Story = {
  parameters: {
    covers: ["functional.item6", "accessibility.item4", "visual.item4"],
    // O badge NÃO vira o elemento clicável — quem envolve é que recebe o foco.
    docs: { source: { transform: badgeAsButtonSource } },
  },
  render: () => (
    <Button variant="ghost" size="sm" aria-label={LABELS.categoryFilterLabel}>
      <Badge variant="info">{LABELS.categoryLabel}</Badge>
    </Button>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button", { name: LABELS.categoryFilterLabel });
    await expect(button.classList.contains("nds-button-ghost")).toBe(true);
    await expect(button.classList.contains("nds-button-sm")).toBe(true);

    // functional.item6 — o pai recebe o foco e o badge não compete por ele.
    const badge = badgeRoot(button);
    await expect(badge).toHaveAttribute("data-variant", "info");
    await expect(badge.textContent?.trim()).toBe(LABELS.categoryLabel);
    await expect(badge.hasAttribute("tabindex")).toBe(false);

    await userEvent.tab();
    await expect(document.activeElement).toBe(button);

    // accessibility.item4 — o foco é VISÍVEL, e o anel é do botão.
    await expect(button.matches(":focus-visible")).toBe(true);
    await expect(getComputedStyle(button).boxShadow).not.toBe("none");
  },
};

export const AsLink: Story = {
  parameters: {
    covers: ["functional.item8", "visual.item7"],
    docs: { source: { transform: badgeAsLinkSource } },
  },
  render: () => (
    <a href="#">
      <Badge variant="info">{LABELS.categoryLabel}</Badge>
    </a>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const link = canvas.getByRole("link", { name: LABELS.categoryLabel });
    const badge = badgeRoot(link);

    // functional.item8 — o link é o controle: recebe o foco por Tab, e a
    // etiqueta não tem tabindex.
    await expect(badge).toHaveAttribute("data-variant", "info");
    await expect(badge.hasAttribute("tabindex")).toBe(false);
    await userEvent.tab();
    await expect(document.activeElement).toBe(link);

    // visual.item7 — com o ponteiro em cima, o fundo passa a --secondary.
    // `:hover` não acende por evento sintético (medido no carousel e na AsLink
    // do angular: o fundo continua neutro depois do `userEvent.hover`). A sonda
    // prova as duas metades que, juntas, são o hover: a etiqueta está na
    // relação que o seletor exige, e a regra desse seletor pinta `--secondary`.
    const hover = badgeLinkHover(badge);
    await expect(hover.insideLink, "a etiqueta tem de ser filha direta do link").toBe(true);
    await expect(hover.declared, "a regra de hover dentro de link sumiu da folha").not.toBeNull();
    await expect(hover.resolved).toBe(hover.expected);
  },
};
