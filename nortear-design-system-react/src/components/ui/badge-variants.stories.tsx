import { figmaDesign } from "@shared/figma/design-links";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { within, expect } from "storybook/test";
import { resolveColor } from "@shared/testing/cor";
import { Badge } from "./badge";
import {
  badgeDefaultSource,
  badgeDestructiveSource,
  badgeOutlineSource,
  badgeSecundarioSource,
  badgeSemanticasSource,
  badgeSource,
} from "./badge.source";

const meta = {
  title: "UI/Badge/Variants",
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
          "Cada variante do Badge reflete um nível de hierarquia visual: default destaca, secondary informa, destructive alerta e outline oferece baixa ênfase.",
      },
    },
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * O que a variante promete é o desenho, e desenho se mede: cor de fundo, cor de
 * texto e borda. As plays antigas só perguntavam se o texto estava na tela —
 * passavam com as quatro variantes renderizando idênticas.
 *
 * O que cada variante promete MUDOU: a etiqueta deixou de ser preenchida, e
 * quem carrega a variante agora é a borda, de 2px. Fundo e texto são neutros em
 * todas — medir "fundo diferente entre variantes", como estas plays faziam,
 * hoje reprovaria o desenho correto.
 */
const pintura = (el: HTMLElement) => {
  const s = getComputedStyle(el);
  return {
    background: s.backgroundColor,
    text: s.color,
    border: s.borderTopColor,
    larguraBorda: s.borderTopWidth,
  };
};

/**
 * Cor que o TEMA VIGENTE dá ao token, medida de um elemento vivo — nunca um
 * `rgb()` cravado: trocar de tema não pode reprovar o teste, mas trocar a
 * regra pode.
 */
const token = (root: HTMLElement, tokenName: string) =>
  resolveColor(root, `hsl(var(${tokenName}))`);

/*
 * O trio "fundo neutro, texto neutro, borda de 2px" se repete em toda play, e
 * é de propósito que ele NÃO virou função: a contagem de asserções por story
 * (`coverage_divergence`) lê o corpo do play, e asserção escondida atrás de
 * uma chamada some da conta — a stack passaria a parecer sub-coberta ao lado
 * das outras quatro, com o mesmo teste.
 */

export const Default: Story = {
  // O arquivo desliga os controls, então o `meta` não tem args de onde ler a
  // variante: cada story diz a sua.
  parameters: {
    covers: ["functional.item1", "visual.item2"],
    docs: { source: { transform: badgeDefaultSource } },
  },
  render: () => <Badge variant="default">Novo</Badge>,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const badge = canvas.getByText("Novo");
    await expect(badge).toHaveAttribute("data-variant", "default");
    // functional.item1 — a ênfase alta vem da borda em --primary; fundo e texto
    // ficam neutros, como em todas as outras.
    const { background, text, border, larguraBorda } = pintura(badge);
    await expect(border).toBe(token(canvasElement, "--primary"));
    await expect(background).toBe(token(canvasElement, "--background"));
    await expect(text).toBe(token(canvasElement, "--foreground"));
    await expect(parseFloat(larguraBorda)).toBeGreaterThanOrEqual(2);
  },
};

export const Secondary: Story = {
  parameters: {
    covers: ["functional.item2", "visual.item2"],
    docs: { source: { transform: badgeSecundarioSource } },
  },
  render: () => <Badge variant="secondary">Beta</Badge>,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const badge = canvas.getByText("Beta");
    await expect(badge).toHaveAttribute("data-variant", "secondary");
    const { background, text, border, larguraBorda } = pintura(badge);
    // functional.item2 — o neutro que se VÊ: a borda é --muted-foreground, e
    // não --secondary. Medido, --secondary como traço não chega a 1.4:1 contra
    // a página e a variante sumiria — é a única cujo token de borda não tem o
    // nome da variante, e é por isso que o teste cobra os dois lados.
    await expect(border).toBe(token(canvasElement, "--muted-foreground"));
    await expect(border).not.toBe(token(canvasElement, "--secondary"));
    await expect(background).toBe(token(canvasElement, "--background"));
    await expect(text).toBe(token(canvasElement, "--foreground"));
    await expect(parseFloat(larguraBorda)).toBeGreaterThanOrEqual(2);

    // A hierarquia entre secondary e default continua existindo — na borda,
    // que é onde ela passou a morar.
    const referencia = document.createElement("span");
    referencia.className = "nds-badge nds-badge-default";
    canvasElement.appendChild(referencia);
    const defaultBorder = getComputedStyle(referencia).borderTopColor;
    referencia.remove();
    await expect(border).not.toBe(defaultBorder);
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
    const badge = canvas.getByText("Urgente");
    await expect(badge).toHaveAttribute("data-variant", "destructive");
    // functional.item3 — a cor sinaliza pela borda e o contraste vem do texto
    // neutro: com fundo e texto fora do par semântico, os 4.5:1 do rótulo não
    // dependem mais de qual variante se escolheu.
    const { background, text, border, larguraBorda } = pintura(badge);
    await expect(border).toBe(token(canvasElement, "--destructive"));
    await expect(background).toBe(token(canvasElement, "--background"));
    await expect(parseFloat(larguraBorda)).toBeGreaterThanOrEqual(2);

    // O texto neutro é medido de uma referência viva, e não cravado em rgb().
    const referencia = document.createElement("span");
    referencia.className = "nds-badge nds-badge-outline";
    canvasElement.appendChild(referencia);
    const neutralText = getComputedStyle(referencia).color;
    referencia.remove();
    await expect(text).toBe(neutralText);
    await expect(text).toBe(token(canvasElement, "--foreground"));
  },
};

export const Outline: Story = {
  parameters: {
    covers: ["functional.item4", "visual.item2"],
    docs: { source: { transform: badgeOutlineSource } },
  },
  render: () => <Badge variant="outline">Rascunho</Badge>,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const badge = canvas.getByText("Rascunho");
    await expect(badge).toHaveAttribute("data-variant", "outline");
    // functional.item4 — a borda mais discreta do conjunto: a hairline neutra
    // que input e card já desenham. O que a diferencia não é a ausência de
    // fundo (nenhuma variante tem preenchimento), e sim a ausência de cor.
    const { background, text, border, larguraBorda } = pintura(badge);
    await expect(border).toBe(token(canvasElement, "--border"));
    await expect(border).not.toBe(token(canvasElement, "--primary"));
    await expect(background).toBe(token(canvasElement, "--background"));
    await expect(text).toBe(token(canvasElement, "--foreground"));
    await expect(parseFloat(larguraBorda)).toBeGreaterThanOrEqual(2);
  },
};

/**
 * As três semânticas numa story só: o que elas prometem não é cada uma isolada,
 * e sim serem DISTINGUÍVEIS entre si. Uma por story deixaria passar o erro mais
 * provável — copiar o bloco do destructive e esquecer de trocar o token, que é
 * como as três nasceriam iguais.
 */
export const Semantics: Story = {
  parameters: {
    covers: ["functional.item7", "visual.item5", "accessibility.item3"],
    docs: {
      // A escala inteira é o assunto; um badge sozinho a esconderia.
      source: { transform: badgeSemanticasSource },
      description: {
        story:
          "warning avisa, success confirma e info contextualiza. As três existiam no CSS como -high, -medium e -low, servindo só à tabela de prioridade das docs pages.",
      },
    },
  },
  render: () => (
    <div className="nds-cluster" data-spacing="sm">
      <Badge variant="warning">Vence hoje</Badge>
      <Badge variant="success">Aprovado</Badge>
      <Badge variant="info">Novidade</Badge>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const badges = {
      warning: canvas.getByText("Vence hoje"),
      success: canvas.getByText("Aprovado"),
      info: canvas.getByText("Novidade"),
    };

    // O texto neutro é medido de uma referência viva, e não cravado em rgb():
    // trocar o tema não pode reprovar o teste, mas trocar a REGRA pode.
    const referencia = document.createElement("span");
    referencia.className = "nds-badge nds-badge-outline";
    canvasElement.appendChild(referencia);
    const neutralText = getComputedStyle(referencia).color;
    referencia.remove();

    const borders: string[] = [];
    for (const [name, badge] of Object.entries(badges)) {
      await expect(badge).toHaveAttribute("data-variant", name);
      const { background, text, border, larguraBorda } = pintura(badge);
      // functional.item7 — a cor vem da borda; o texto fica neutro, que é o que
      // sustenta 4.5:1 sem depender da variante escolhida.
      await expect(border).toBe(token(canvasElement, `--${name}`));
      await expect(text).toBe(neutralText);
      await expect(background).toBe(token(canvasElement, "--background"));
      await expect(parseFloat(larguraBorda)).toBeGreaterThanOrEqual(2);
      borders.push(border);
    }

    // Três cores, e não três nomes para a mesma: sem isto, copiar o bloco do
    // destructive nas três passaria. A checagem migrou do fundo para a borda —
    // hoje as três compartilham o mesmo fundo neutro, e comparar fundos
    // reprovaria o desenho correto.
    await expect(new Set(borders).size).toBe(3);
  },
};
