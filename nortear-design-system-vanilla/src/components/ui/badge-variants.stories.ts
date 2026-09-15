import { figmaDesign } from '@shared/figma/design-links';
import type { Meta, StoryObj } from '@storybook/html-vite';
import { within, expect } from 'storybook/test';
import {
  BADGE_BORDER_FLOOR,
  badgeBorder,
  badgeRoot,
  badgeSurface,
  borderAgainstPage,
  type BadgeVariant,
} from '@shared/testing/badge-probe';
import { createBadge } from './badge';
import { badgeGroupSourceWith, badgeSource, badgeSourceWith } from './badge.source';

const meta: Meta = {
  tags: ['feedback'],
  title: 'Components/Feedback/Badge/Variants',
  parameters: {
    design: figmaDesign('badge'),
    controls: { disable: true },
    actions: { disable: true },
    layout: 'centered',
    docs: {
      source: { transform: badgeSource },
      description: {
        component:
          'As 5 variantes nativas do Badge renderizadas via createBadge({ variant, children }). ' +
          'A variante escolhe só a cor da borda; fundo e texto são neutros em todas — sem prop size.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

/*
 * O que a variante promete é o desenho, e desenho se mede — pela sonda
 * compartilhada `badge-probe`, a mesma nas cinco stacks: borda (largura e cor
 * contra o token da variante) e superfície (fundo, texto e contraste). A sonda
 * devolve os números; as asserções ficam no corpo de cada play, de propósito:
 * a contagem de asserções por story (`coverage_divergence`) lê o corpo, e
 * asserção escondida atrás de uma chamada some da conta.
 *
 * A referência nunca é uma etiqueta montada com classe escrita à mão: o valor
 * esperado sai do token resolvido na própria árvore da story.
 */

// ─── Variantes ────────────────────────────────────────────────────────────────

export const Default: Story = {
  parameters: {
    covers: ['functional.item1', 'visual.item2'],
  },
  render: () => createBadge({ variant: 'default', children: 'Novo' }),
  play: async ({ canvasElement }) => {
    const badge = badgeRoot(within(canvasElement).getByText('Novo'));
    await expect(badge).toHaveAttribute('data-variant', 'default');

    // functional.item1 — a ênfase alta vem da borda em --primary; fundo e texto
    // ficam neutros, como em todas as outras.
    const border = badgeBorder(badge, 'default');
    await expect(border.width).toBeGreaterThanOrEqual(2);
    await expect(border.color).toBe(border.expected);

    const surface = badgeSurface(badge);
    await expect(surface.background).toBe(surface.expectedBackground);
    await expect(surface.color).toBe(surface.expectedColor);
    await expect(surface.textRatio).toBeGreaterThanOrEqual(4.5);
  },
};

export const Destructive: Story = {
  // Override de story: a variante não passa por control neste arquivo, e o
  // snippet do meta mostraria `default` onde a story renderiza outra.
  parameters: {
    covers: ['functional.item3', 'accessibility.item3', 'visual.item2'],
    docs: {
      source: { transform: badgeSourceWith({ variant: 'destructive', label: 'Urgente' }) },
    },
  },
  render: () => createBadge({ variant: 'destructive', children: 'Urgente' }),
  play: async ({ canvasElement }) => {
    const badge = badgeRoot(within(canvasElement).getByText('Urgente'));
    await expect(badge).toHaveAttribute('data-variant', 'destructive');

    // functional.item3 — a cor sinaliza pela borda e o contraste vem do texto
    // neutro: com fundo e texto fora do par semântico, os 4.5:1 do rótulo não
    // dependem de qual variante se escolheu (accessibility.item3).
    const border = badgeBorder(badge, 'destructive');
    await expect(border.width).toBeGreaterThanOrEqual(2);
    await expect(border.color).toBe(border.expected);

    const surface = badgeSurface(badge);
    await expect(surface.background).toBe(surface.expectedBackground);
    await expect(surface.color).toBe(surface.expectedColor);
    await expect(surface.textRatio).toBeGreaterThanOrEqual(4.5);
  },
};

const SEMANTICS: ReadonlyArray<{ variant: BadgeVariant; label: string }> = [
  { variant: 'default', label: 'Novo' },
  { variant: 'destructive', label: 'Urgente' },
  { variant: 'warning', label: 'Vence hoje' },
  { variant: 'success', label: 'Aprovado' },
  { variant: 'info', label: 'Novidade' },
];

/**
 * As cinco numa story só: o que elas prometem não é cada uma isolada, e sim
 * serem DISTINGUÍVEIS entre si. Uma por story deixaria passar o erro mais
 * provável — copiar o bloco da destructive e esquecer de trocar o token.
 */
export const Semantics: Story = {
  parameters: {
    /*
     * Sete itens numa story só, e não é excesso: `functional.item2` (warning) e
     * `functional.item4` (info) pedem a borda de CADA uma, e é justamente por
     * estarem lado a lado que dá para provar que não se confundem.
     */
    covers: [
      'functional.item2',
      'functional.item4',
      'functional.item7',
      'visual.item2',
      'visual.item5',
      'accessibility.item3',
      'accessibility.item5',
    ],
    // Override de story: o assunto é o CONJUNTO.
    docs: {
      source: { transform: badgeGroupSourceWith({ items: SEMANTICS }) },
      description: {
        story:
          'warning avisa, success confirma e info contextualiza — esta última com a borda neutra mais silenciosa do conjunto, a mesma que input e card já desenham.',
      },
    },
  },
  render: () => {
    const group = document.createElement('div');
    group.className = 'nds-cluster';
    group.dataset.spacing = 'sm';
    group.append(
      ...SEMANTICS.map(({ variant, label }) => createBadge({ variant, children: label })),
    );
    return group;
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const borders = {} as Record<BadgeVariant, string>;

    for (const { variant, label } of SEMANTICS) {
      const badge = badgeRoot(canvas.getByText(label));
      await expect(badge).toHaveAttribute('data-variant', variant);

      // functional.item2 (warning), functional.item4 (info) e functional.item7 —
      // a cor vem da borda, cada uma no SEU token (a info lê `--border`, não
      // `--info`: a tabela da sonda é o que reprova a simetria de nomes).
      const border = badgeBorder(badge, variant);
      await expect(border.width).toBeGreaterThanOrEqual(2);
      await expect(border.color).toBe(border.expected);

      // Fundo e texto não se movem entre variantes, e o texto sustenta 4.5:1.
      const surface = badgeSurface(badge);
      await expect(surface.background).toBe(surface.expectedBackground);
      await expect(surface.color).toBe(surface.expectedColor);
      await expect(surface.textRatio).toBeGreaterThanOrEqual(4.5);

      // accessibility.item5 — a borda das cromáticas alcança 3:1 contra a
      // página (WCAG 1.4.11). A `info` fica de fora POR DECISÃO (D3): assumiu a
      // hairline neutra `--border`, que mede abaixo do piso de propósito — é a
      // etiqueta que não compete por atenção.
      if (variant !== 'info') {
        await expect(borderAgainstPage(badge)).toBeGreaterThanOrEqual(BADGE_BORDER_FLOOR);
      }

      borders[variant] = border.color;
    }

    // Três cores, e não três nomes para a mesma: sem isto, copiar o bloco nas
    // três semânticas passaria.
    await expect(new Set([borders.warning, borders.success, borders.info]).size).toBe(3);

    // functional.item2 — o que a warning promete não é "ser laranja", é NÃO se
    // confundir com a destructive: as duas já colaram uma vez.
    await expect(borders.warning).not.toBe(borders.destructive);
  },
};
