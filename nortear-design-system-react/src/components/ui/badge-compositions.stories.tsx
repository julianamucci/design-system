import { figmaDesign } from "@shared/figma/design-links";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { within, expect } from "storybook/test";
import { Check } from "lucide-react";
import { backgroundEffective, noTransicao, ratio, resolveColor } from "@shared/testing/cor";
import { Badge, BadgeCounter } from "./badge";
import {
  badgeWithIconSource,
  badgeAsButtonSource,
  badgeWithCounterSource,
  badgeSource,
} from "./badge.source";

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
          "Configurações contextuais do Badge: combinado com ícone, com contador dentro da etiqueta ou envolvido em <button> para virar gatilho clicável.",
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
      Ativo
    </Badge>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const badge = canvas.getByText("Ativo");

    // accessibility.item2 — o ícone é reforço visual: quem nomeia é o texto.
    const icone = badge.querySelector("svg");
    await expect(icone).not.toBeNull();
    await expect(icone).toHaveAttribute("aria-hidden", "true");
    await expect(badge.textContent?.trim()).toBe("Ativo");

    // functional.item5 — o espaço entre ícone e texto é do container, não uma
    // margem na story: o .nds-badge declara gap, e o data-icon encurta o padding
    // daquele lado. Margem manual somaria ao gap e dobraria o respiro.
    const style = getComputedStyle(badge);
    await expect(style.display).toBe("inline-flex");
    await expect(parseFloat(style.columnGap)).toBeGreaterThan(0);
    await expect(getComputedStyle(icone!).marginRight).toBe("0px");
    await expect(parseFloat(style.paddingInlineStart)).toBeLessThan(
      parseFloat(style.paddingInlineEnd),
    );
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
      Urgente
      <BadgeCounter>12</BadgeCounter>
    </Badge>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const counter = canvas.getByText("12");
    const badge = counter.closest<HTMLElement>('[data-slot="badge"]')!;

    // A peça publicada, e não uma classe solta na story: o markup tem de sair
    // com a classe e o slot que a folha compartilhada documenta.
    await expect(counter).toHaveAttribute("data-slot", "badge-counter");
    await expect(counter.classList.contains("nds-badge-counter")).toBe(true);
    await expect(badge.contains(counter)).toBe(true);

    // ── Geometria: à direita do rótulo, na mesma linha ──────────────────────
    // O rótulo é nó de texto, não elemento: quem dá a caixa dele é um Range.
    // Comparar com a caixa do BADGE não provaria nada — o contador está dentro
    // dele de qualquer jeito.
    const label = Array.from(badge.childNodes).find(
      (node) => node.nodeType === Node.TEXT_NODE && (node.textContent ?? "").trim().length > 0,
    );
    await expect(label, "o rótulo da etiqueta precisa ser texto próprio").toBeTruthy();
    const range = document.createRange();
    range.selectNodeContents(label!);
    const labelBox = range.getBoundingClientRect();
    const counterBox = counter.getBoundingClientRect();

    await expect(counterBox.left).toBeGreaterThanOrEqual(labelBox.right - 1);
    // Sobreposição vertical em vez de tolerância em pixel: prova a mesma linha
    // sem depender de arredondamento, e ainda reprova se o contador quebrar
    // para baixo do rótulo.
    await expect(counterBox.top).toBeLessThan(labelBox.bottom);
    await expect(labelBox.top).toBeLessThan(counterBox.bottom);

    // ── O número é lido ─────────────────────────────────────────────────────
    // Texto de verdade no DOM, dentro do rótulo e sem aria-hidden: contador
    // desenhado por `content:` do CSS ou escondido do leitor reprova aqui.
    await expect(counter.textContent?.trim()).toBe("12");
    await expect(counter.hasAttribute("aria-hidden")).toBe(false);
    await expect((badge.textContent ?? "").replace(/\s+/g, " ").trim()).toBe("Urgente12");

    // ── Contraste do número contra o fundo do próprio contador ──────────────
    // A transição sai do caminho antes de medir: ler no primeiro quadro devolve
    // a cor anterior, e é assim que se inventa um contraste de ~1.0.
    const contrast = noTransicao(counter, () => {
      const counterBackgroundColor = backgroundEffective(counter);
      return counterBackgroundColor
        ? ratio(getComputedStyle(counter).color, counterBackgroundColor)
        : null;
    });
    await expect(contrast, "não deu para medir a cor do contador").not.toBeNull();
    await expect(
      contrast!.ratio,
      `número do contador em ${contrast!.ratio}:1 sobre ${contrast!.background}`,
    ).toBeGreaterThanOrEqual(4.5);

    // ── Neutro, e não tingido pela variante ─────────────────────────────────
    // É a decisão medida da folha: preencher o contador com a cor da variante
    // deixa o número abaixo de 4.5:1 em parte dos temas.
    const counterBackground = getComputedStyle(counter).backgroundColor;
    await expect(counterBackground).toBe(resolveColor(canvasElement, "hsl(var(--secondary))"));
    await expect(counterBackground).not.toBe(resolveColor(canvasElement, "hsl(var(--destructive))"));
  },
};

export const AsButton: Story = {
  parameters: {
    covers: ["functional.item6", "accessibility.item4", "visual.item4"],
    // O badge NÃO vira o elemento clicável — quem envolve é que recebe o foco.
    docs: { source: { transform: badgeAsButtonSource } },
  },
  render: () => (
    <button
      type="button"
      aria-label="Filtrar por React"
      className="nds-cluster nds-rounded-md nds-focus-ring-inset"
    >
      <Badge variant="info">React</Badge>
    </button>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button", { name: /Filtrar por React/i });
    // functional.item6 — o pai recebe o foco e o badge não compete por ele.
    const badge = button.querySelector('[data-slot="badge"]');
    await expect(badge).not.toBeNull();
    await expect(badge!.hasAttribute("tabindex")).toBe(false);
    button.focus();
    await expect(document.activeElement).toBe(button);
  },
};
