import { figmaDesign } from '@shared/figma/design-links';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { within, expect } from 'storybook/test';
import {
  BADGE_BORDER_FLOOR,
  badgeBorder,
  badgeSurface,
  borderAgainstPage,
  type BadgeVariant,
} from '@shared/testing/badge-probe';
import { Badge } from './index';
import {
  badgeDefaultSource,
  badgeDestructiveSource,
  badgeSemanticsSource,
} from './badge.source';

const meta = {
  title: 'Components/Feedback/Badge/Variants',
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

/*
 * O que a variante promete é o desenho, e desenho se mede — pela sonda
 * compartilhada, a mesma nas cinco stacks. A etiqueta não é preenchida: fundo e
 * texto são o neutro da página em toda variante, e quem carrega a variante é a
 * BORDA. Cada medição compara a cor DESENHADA com a cor que o TOKEN produz ali,
 * então trocar o tema não reprova, mas trocar a regra reprova.
 *
 * As asserções ficam DENTRO de cada play, e não num helper: o portão de
 * cobertura conta o bloco da story, e helper esconde dele o que ela afirma.
 */

const render = (variant: BadgeVariant, text: string) => () => ({
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

    // functional.item1 — borda de 2px em --primary. 2px, e não 1: em traço fino
    // duas cores próximas somem na tela, e a borda é o único portador da variante.
    const border = badgeBorder(badge, 'default');
    await expect(border.width).toBeGreaterThanOrEqual(2);
    await expect(border.expected).not.toBeNull();
    await expect(border.color).toBe(border.expected);

    // Fundo --background e texto --foreground: neutro sobre neutro sustenta 4.5:1.
    const surface = badgeSurface(badge);
    await expect(surface.expectedBackground).not.toBeNull();
    await expect(surface.expectedColor).not.toBeNull();
    await expect(surface.background).toBe(surface.expectedBackground);
    await expect(surface.color).toBe(surface.expectedColor);
    await expect(surface.textRatio).toBeGreaterThanOrEqual(4.5);
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

    // functional.item3 — a cor está na BORDA (--destructive), em 2px.
    const border = badgeBorder(badge, 'destructive');
    await expect(border.width).toBeGreaterThanOrEqual(2);
    await expect(border.expected).not.toBeNull();
    await expect(border.color).toBe(border.expected);

    // O texto fica no --foreground sobre --background: é o que sustenta os
    // 4.5:1 documentados (accessibility.item3).
    const surface = badgeSurface(badge);
    await expect(surface.expectedBackground).not.toBeNull();
    await expect(surface.expectedColor).not.toBeNull();
    await expect(surface.background).toBe(surface.expectedBackground);
    await expect(surface.color).toBe(surface.expectedColor);
    await expect(surface.textRatio).toBeGreaterThanOrEqual(4.5);
  },
};

const SEMANTICS: Array<{ variant: BadgeVariant; label: string }> = [
  { variant: 'default', label: 'Novo' },
  { variant: 'destructive', label: 'Urgente' },
  { variant: 'warning', label: 'Vence hoje' },
  { variant: 'success', label: 'Aprovado' },
  { variant: 'info', label: 'Novidade' },
];

/**
 * As cinco variantes numa story só: o que elas prometem não é cada uma isolada,
 * e sim serem DISTINGUÍVEIS entre si. Uma por story deixaria passar o erro mais
 * provável — copiar o bloco de uma variante e esquecer de trocar o token.
 */
export const Semantics: Story = {
  parameters: {
    covers: [
      'functional.item2',
      'functional.item4',
      'functional.item7',
      'visual.item2',
      'visual.item5',
      'accessibility.item3',
      'accessibility.item5',
    ],
    docs: {
      source: { transform: badgeSemanticsSource },
      description: {
        story:
          'default destaca, destructive alerta, warning avisa, success confirma e info contextualiza — lado a lado, porque o que se compara é a borda de uma contra a outra.',
      },
    },
  },
  render: () => ({
    components: { Badge },
    setup: () => ({ items: SEMANTICS }),
    template: `
      <div class="nds-cluster" data-spacing="sm">
        <Badge v-for="item in items" :key="item.variant" :variant="item.variant">{{ item.label }}</Badge>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const colors = {} as Record<BadgeVariant, string>;

    for (const { variant, label } of SEMANTICS) {
      const badge = canvas.getByText(label);
      // functional.item7 — cada uma com a borda no PRÓPRIO token (a `info` lê
      // `--border`, não `--info`), e fundo e texto iguais entre todas.
      await expect(badge).toHaveAttribute('data-variant', variant);
      const border = badgeBorder(badge, variant);
      await expect(border.width).toBeGreaterThanOrEqual(2);
      await expect(border.expected).not.toBeNull();
      await expect(border.color).toBe(border.expected);
      const surface = badgeSurface(badge);
      await expect(surface.background).toBe(surface.expectedBackground);
      await expect(surface.color).toBe(surface.expectedColor);
      await expect(surface.textRatio).toBeGreaterThanOrEqual(4.5);
      colors[variant] = border.color;

      // accessibility.item5 — a borda das variantes cromáticas alcança 3:1
      // contra a página (WCAG 1.4.11). A `info` fica FORA por decisão: assumiu
      // a hairline neutra `--border`, a mesma de input e card, e mede abaixo do
      // piso de propósito — é a discreta do conjunto (functional.item4).
      if (variant !== 'info') {
        await expect(borderAgainstPage(badge)).toBeGreaterThanOrEqual(BADGE_BORDER_FLOOR);
      }
    }

    // functional.item2 — a warning não pode se confundir com a destructive:
    // significados opostos, que já colaram na tela uma vez.
    await expect(colors.warning).not.toBe(colors.destructive);

    // Três cores, e não três nomes para a mesma: copiar o bloco de uma
    // semântica nas outras duas passaria sem isto.
    await expect(new Set([colors.warning, colors.success, colors.info]).size).toBe(3);
  },
};
