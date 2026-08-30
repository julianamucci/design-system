import { figmaDesign } from '@shared/figma/design-links';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { within, expect } from 'storybook/test';
import { ratio } from '@shared/testing/cor';
import { Badge } from './index';
import {
  badgeDefaultSource,
  badgeDestructiveSource,
  badgeSemanticasSource,
} from './badge.source';

const meta = {
  title: 'Primitives/Feedback/Badge/Variants',
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
          'Cada variante do Badge reflete um nível de hierarquia visual: default destaca, destructive alerta, warning avisa, success confirma e info contextualiza sem competir por atenção.',
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
 * fundo e texto passaram a ser iguais nas cinco variantes — não distinguem mais
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
 *
 * A referência é sempre uma variante que NÃO está sob medição na própria play —
 * comparar uma variante consigo mesma aprovaria qualquer coisa. Depois que
 * `outline` saiu, quem herdou a hairline neutra foi a `info`, e é ela a
 * referência de neutro nas plays que não a medem.
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

    // O fundo é o MESMO da info, que carrega a borda neutra — é assim que se
    // afirma "neutro" sem cravar um rgb().
    await expect(background).toBe(referencePainting(canvasElement, 'nds-badge-info').background);
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

    const reference = referencePainting(canvasElement, 'nds-badge-info');
    await expect(text).toBe(reference.text);
    await expect(background).toBe(reference.background);
    // E a borda é de fato OUTRA cor que a neutra da info — sem isto, uma
    // variante que esquecesse de reapontar `--badge-border` passaria.
    await expect(border).not.toBe(reference.border);

    const legibility = ratio(text, background);
    await expect(legibility).not.toBeNull();
    await expect(legibility!.ratio).toBeGreaterThanOrEqual(4.5);
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
    // As três aparecem juntas, mas cada uma é medida por si: `item2` cobra a
    // warning, `item4` a info, e `item7` o que só existe entre elas — serem
    // distinguíveis. Uma story por variante repetiria a montagem três vezes
    // para afirmar menos.
    covers: [
      'functional.item2',
      'functional.item4',
      'functional.item7',
      'visual.item5',
      'accessibility.item3',
    ],
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
    // o tema não pode reprovar o teste, mas trocar a REGRA pode. A referência
    // aqui é a `default`, a única variante que esta story NÃO mede — a `info`,
    // que carrega a hairline neutra, está entre as três medidas e comparar uma
    // variante consigo mesma não afirmaria nada.
    const reference = referencePainting(canvasElement, 'nds-badge-default');

    const borders: string[] = [];
    for (const [name, badge] of Object.entries(badges)) {
      await expect(badge).toHaveAttribute('data-variant', name);
      const { background, text, border, borderWidth } = painting(badge);
      // functional.item7 — a cor vem da BORDA; fundo e texto ficam no neutro,
      // que é o que sustenta 4.5:1 sem depender da variante escolhida.
      await expect(transparent(border)).toBe(false);
      await expect(text).toBe(reference.text);
      await expect(background).toBe(reference.background);
      // functional.item2 e functional.item4 — as duas cobram traço de 2px, e
      // em 1px duas cores próximas somem na tela.
      await expect(parseFloat(borderWidth)).toBeGreaterThanOrEqual(2);
      borders.push(border);
    }

    // functional.item2 — o que a warning promete não é "ser laranja", é NÃO se
    // confundir com a destructive: são significados opostos, as duas já colaram
    // na tela, e o que as separa é a distância entre os dois tokens da paleta.
    // Sem esta medição, encostar uma na outra de novo passaria.
    const destructive = referencePainting(canvasElement, 'nds-badge-destructive');
    await expect(painting(badges.warning).border).not.toBe(destructive.border);

    // functional.item4 — a info é a discreta do conjunto: a hairline neutra, e
    // não o traço da default nem o da destructive.
    const infoBorder = painting(badges.info).border;
    await expect(infoBorder).not.toBe(reference.border);
    await expect(infoBorder).not.toBe(destructive.border);

    // Três cores, e não três nomes para a mesma: sem isto, copiar o bloco do
    // destructive nas três passaria. Antes a distinção era medida no FUNDO —
    // que hoje é o mesmo nas cinco variantes e aprovaria as três iguais.
    await expect(new Set(borders).size).toBe(3);
  },
};
