import { figmaDesign } from '@shared/figma/design-links';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { within, expect } from 'storybook/test';
import { ratio } from '@shared/testing/cor';
import { Badge } from './index';
import {
  badgeDefaultSource,
  badgeDestructiveSource,
  badgeOutlineSource,
  badgeSecondarySource,
  badgeSemanticasSource,
} from './badge.source';

const meta = {
  title: 'UI/Badge/Variants',
  component: Badge,
  tags: ['feedback'],
  parameters: {
    design: figmaDesign('badge'),
    controls: { disable: true },
    actions: { disable: true },
    layout: 'centered',
    docs: {
      source: { transform: badgeDefaultSource },
      description: {
        component:
          'Cada variante do Badge reflete um nível de hierarquia visual: default destaca, secondary informa, destructive alerta e outline oferece baixa ênfase.',
      },
    },
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * O que a variante promete é o desenho, e desenho se mede: cor de fundo, cor de
 * texto e borda. As plays antigas só perguntavam se algo tinha renderizado —
 * passavam com as quatro variantes idênticas.
 *
 * O que se mede MUDOU com o redesenho: a etiqueta deixou de ser preenchida, e
 * fundo e texto passaram a ser iguais nas sete variantes — não distinguem mais
 * nada. Quem carrega a variante agora é a BORDA, e é ela que estas plays
 * comparam. Medir o fundo continua valendo, mas como GUARDA do neutro, não
 * como sinal.
 */
const painting = (el: HTMLElement) => {
  const s = getComputedStyle(el);
  return {
    background: s.backgroundColor,
    text: s.color,
    border: s.borderTopColor,
    borderWidth: s.borderTopWidth,
  };
};
const transparent = (cor: string) => cor === 'rgba(0, 0, 0, 0)' || cor === 'transparent';

/**
 * Pintura de uma variante de REFERÊNCIA, medida de um elemento vivo em vez de
 * cravada em `rgb()`: trocar o tema não pode reprovar o teste, mas trocar a
 * REGRA pode.
 */
const referencePainting = (root: HTMLElement, variantClass: string) => {
  const probe = document.createElement('span');
  probe.className = `nds-badge ${variantClass}`;
  root.appendChild(probe);
  const measured = painting(probe);
  probe.remove();
  return measured;
};

const render = (variant: string, text: string) => () => ({
  components: { Badge },
  setup: () => ({ variant, text }),
  template: `<Badge :variant="variant">{{ text }}</Badge>`,
});

export const Default: Story = {
  parameters: { covers: ['functional.item1', 'visual.item2'] },
  render: render('default', 'Novo'),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const badge = canvas.getByText('Novo');
    await expect(badge).toHaveAttribute('data-variant', 'default');
    // functional.item1 — a etiqueta não é preenchida: o fundo é o neutro da
    // página e quem carrega a variante é a borda, sólida e visível. Borda
    // TRANSPARENTE era o desenho antigo, e é o defeito que esta play pega.
    const { background, text, border, borderWidth } = painting(badge);
    await expect(transparent(border)).toBe(false);
    await expect(border).not.toBe(background);
    await expect(background).not.toBe(text);

    // 2px, e não 1: em traço fino duas cores próximas somem na tela, e a borda
    // passou a ser o único portador da variante.
    await expect(parseFloat(borderWidth)).toBeGreaterThanOrEqual(2);

    // O fundo é o MESMO da outline, que nunca teve cor — é assim que se afirma
    // "neutro" sem cravar um rgb().
    await expect(background).toBe(referencePainting(canvasElement, 'nds-badge-outline').background);
  },
};

export const Secondary: Story = {
  parameters: {
    covers: ['functional.item2', 'visual.item2'],
    // Sem controls, a variante e o rótulo só existem no template.
    docs: { source: { transform: badgeSecondarySource } },
  },
  render: render('secondary', 'Beta'),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const badge = canvas.getByText('Beta');
    await expect(badge).toHaveAttribute('data-variant', 'secondary');
    // functional.item2 — mesmo fundo neutro da default, e outra cor de BORDA:
    // é isso que faz a hierarquia entre as duas existir agora.
    const { background, border } = painting(badge);
    await expect(transparent(border)).toBe(false);

    const referenceDefault = referencePainting(canvasElement, 'nds-badge-default');
    await expect(background).toBe(referenceDefault.background);
    await expect(border).not.toBe(referenceDefault.border);

    // A borda desta variante NÃO é `--secondary`: medido, como traço ele fica em
    // ~1.1:1 contra a página e a variante sumiria. A folha usa
    // `--muted-foreground`, e o que se cobra aqui é o efeito — o traço tem de
    // se ver contra o fundo da etiqueta.
    const separation = ratio(border, background);
    await expect(separation).not.toBeNull();
    await expect(separation!.ratio).toBeGreaterThanOrEqual(3);
  },
};

export const Destructive: Story = {
  parameters: {
    covers: ['functional.item3', 'accessibility.item3', 'visual.item2'],
    // Sem controls, a variante e o rótulo só existem no template.
    docs: { source: { transform: badgeDestructiveSource } },
  },
  render: render('destructive', 'Urgente'),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const badge = canvas.getByText('Urgente');
    await expect(badge).toHaveAttribute('data-variant', 'destructive');
    // functional.item3 — a cor está na BORDA e o texto fica no --foreground. É
    // a combinação que sustenta os 4.5:1 documentados: a cor sinaliza no
    // contorno, o contraste vem do texto neutro sobre fundo neutro.
    const { background, text, border } = painting(badge);
    await expect(transparent(border)).toBe(false);

    const reference = referencePainting(canvasElement, 'nds-badge-outline');
    await expect(text).toBe(reference.text);
    await expect(background).toBe(reference.background);
    // E a borda é de fato OUTRA cor que a neutra da outline — sem isto, uma
    // variante que esquecesse de reapontar `--badge-border` passaria.
    await expect(border).not.toBe(reference.border);

    const legibility = ratio(text, background);
    await expect(legibility).not.toBeNull();
    await expect(legibility!.ratio).toBeGreaterThanOrEqual(4.5);
  },
};

export const Outline: Story = {
  parameters: {
    covers: ['functional.item4', 'visual.item2'],
    // Sem controls, a variante e o rótulo só existem no template.
    docs: { source: { transform: badgeOutlineSource } },
  },
  render: render('outline', 'Rascunho'),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const badge = canvas.getByText('Rascunho');
    await expect(badge).toHaveAttribute('data-variant', 'outline');
    // functional.item4 — a borda mais discreta do conjunto. Todas as variantes
    // são de contorno agora, então o que a distingue é a COR do traço: a
    // hairline neutra do projeto, e não a da default.
    const { background, border, borderWidth } = painting(badge);
    await expect(transparent(border)).toBe(false);
    await expect(parseFloat(borderWidth)).toBeGreaterThanOrEqual(2);
    await expect(border).not.toBe(referencePainting(canvasElement, 'nds-badge-default').border);
    // O fundo é neutro como no resto da família — "sem fundo" deixou de ser o
    // que separa esta variante das outras.
    await expect(transparent(background)).toBe(false);
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
    covers: ['functional.item7', 'visual.item5', 'accessibility.item3'],
    docs: {
      // São três badges lado a lado dentro de um agrupador: o assunto é o
      // contraste ENTRE eles, e a do meta mostra um só.
      source: { transform: badgeSemanticasSource },
      description: {
        story:
          'warning avisa, success confirma e info contextualiza. As três existiam no CSS como -high, -medium e -low, servindo só à tabela de prioridade das docs pages.',
      },
    },
  },
  render: () => ({
    components: { Badge },
    template: `
      <div class="nds-cluster" data-spacing="sm">
        <Badge variant="warning">Vence hoje</Badge>
        <Badge variant="success">Aprovado</Badge>
        <Badge variant="info">Novidade</Badge>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const badges = {
      warning: canvas.getByText('Vence hoje'),
      success: canvas.getByText('Aprovado'),
      info: canvas.getByText('Novidade'),
    };

    // O neutro é medido de uma referência viva, e não cravado em rgb(): trocar
    // o tema não pode reprovar o teste, mas trocar a REGRA pode.
    const reference = referencePainting(canvasElement, 'nds-badge-outline');

    const borders: string[] = [];
    for (const [name, badge] of Object.entries(badges)) {
      await expect(badge).toHaveAttribute('data-variant', name);
      const { background, text, border } = painting(badge);
      // functional.item7 — a cor vem da BORDA; fundo e texto ficam no neutro,
      // que é o que sustenta 4.5:1 sem depender da variante escolhida.
      await expect(transparent(border)).toBe(false);
      await expect(text).toBe(reference.text);
      await expect(background).toBe(reference.background);
      borders.push(border);
    }

    // Três cores, e não três nomes para a mesma: sem isto, copiar o bloco do
    // destructive nas três passaria. Antes a distinção era medida no FUNDO —
    // que hoje é o mesmo nas sete variantes e aprovaria as três iguais.
    await expect(new Set(borders).size).toBe(3);
  },
};
