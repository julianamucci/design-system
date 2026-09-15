import { figmaDesign } from '@shared/figma/design-links';
import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { within, expect } from 'storybook/test';
import {
  BADGE_BORDER_FLOOR,
  badgeBorder,
  badgeSurface,
  badgeVariant,
  borderAgainstPage,
  type BadgeVariant,
} from '@shared/testing/badge-probe';
import { Badge } from './index';
import BadgeStory from './BadgeStory.svelte';
import BadgeSemanticsStory from './BadgeSemanticsStory.svelte';
import { badgeDestructiveSource, badgeSemanticsSource, badgeSource } from './badge.source';

const meta: Meta = {
  title: 'Components/Feedback/Badge/Variants',
  component: Badge,
  tags: ['feedback'],
  parameters: {
    design: figmaDesign('badge'),
    controls: { disable: true },
    actions: { disable: true },
    layout: 'centered',
    docs: {
      // Cascateia para todas as stories do arquivo; cada variante sobrescreve
      // com o próprio par de variante e rótulo logo abaixo.
      source: { transform: badgeSource },
      description: {
        component:
          'Cada variante do Badge reflete um nível de hierarquia visual: default destaca, destructive alerta, warning avisa, success confirma e info contextualiza com o traço mais discreto do conjunto.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

/*
 * O que a variante promete é o desenho, e desenho se mede — pela sonda
 * compartilhada, a mesma nas cinco stacks. Quem carrega a variante é a BORDA:
 * fundo e texto são neutros e iguais em todas, e a sonda os compara com
 * `--background`/`--foreground` resolvidos vivos, nunca com uma etiqueta de
 * referência montada com classe escrita à mão.
 */

export const Default: Story = {
  parameters: { covers: ['functional.item1', 'visual.item2'] },
  render: () => ({ Component: BadgeStory, props: { variant: 'default', label: 'Novo' } }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const badge = canvas.getByText('Novo');
    await expect(badgeVariant(badge)).toBe('default');

    // functional.item1 — borda de 2px em `--primary`, fundo e texto neutros.
    const border = badgeBorder(badge, 'default');
    await expect(border.width).toBeGreaterThanOrEqual(2);
    await expect(border.color).toBe(border.expected);

    const surface = badgeSurface(badge);
    await expect(surface.background).toBe(surface.expectedBackground);
    await expect(surface.color).toBe(surface.expectedColor);
    await expect(surface.textRatio).toBeGreaterThanOrEqual(4.5);

    await expect(borderAgainstPage(badge)).toBeGreaterThanOrEqual(BADGE_BORDER_FLOOR);
  },
};

export const Destructive: Story = {
  parameters: {
    covers: ['functional.item3', 'accessibility.item3', 'visual.item2'],
    docs: { source: { transform: badgeDestructiveSource } },
  },
  render: () => ({ Component: BadgeStory, props: { variant: 'destructive', label: 'Urgente' } }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const badge = canvas.getByText('Urgente');
    await expect(badgeVariant(badge)).toBe('destructive');

    // functional.item3 — a cor sinaliza pela borda; fundo e texto são os mesmos
    // das outras quatro.
    const border = badgeBorder(badge, 'destructive');
    await expect(border.width).toBeGreaterThanOrEqual(2);
    await expect(border.color).toBe(border.expected);

    // accessibility.item3 — os 4.5:1 do texto não dependem da variante.
    const surface = badgeSurface(badge);
    await expect(surface.background).toBe(surface.expectedBackground);
    await expect(surface.color).toBe(surface.expectedColor);
    await expect(surface.textRatio).toBeGreaterThanOrEqual(4.5);

    await expect(borderAgainstPage(badge)).toBeGreaterThanOrEqual(BADGE_BORDER_FLOOR);
  },
};

/**
 * As cinco variantes numa story só: o que elas prometem não é cada uma isolada,
 * e sim serem DISTINGUÍVEIS entre si. Uma por story deixaria passar o erro mais
 * provável — copiar o bloco do destructive e esquecer de trocar o token.
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
          'warning avisa, success confirma e info contextualiza. A warning é distinta da destructive, para que aviso e erro não se confundam; a info usa a borda neutra, o traço mais discreto do conjunto.',
      },
    },
  },
  render: () => ({ Component: BadgeSemanticsStory }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const badges: Record<BadgeVariant, HTMLElement> = {
      default: canvas.getByText('Novo'),
      destructive: canvas.getByText('Urgente'),
      warning: canvas.getByText('Vence hoje'),
      success: canvas.getByText('Aprovado'),
      info: canvas.getByText('Novidade'),
    };

    const borders = {} as Record<BadgeVariant, string>;
    for (const [name, badge] of Object.entries(badges) as [BadgeVariant, HTMLElement][]) {
      await expect(badgeVariant(badge)).toBe(name);

      // functional.item2 (warning), functional.item4 (info), functional.item7 —
      // cada borda no PRÓPRIO token (a info lê `--border`, não `--info`); fundo
      // e texto neutros, que é o que sustenta 4.5:1 em qualquer variante.
      const border = badgeBorder(badge, name);
      await expect(border.width).toBeGreaterThanOrEqual(2);
      await expect(border.color).toBe(border.expected);

      const surface = badgeSurface(badge);
      await expect(surface.background).toBe(surface.expectedBackground);
      await expect(surface.color).toBe(surface.expectedColor);
      await expect(surface.textRatio).toBeGreaterThanOrEqual(4.5);

      borders[name] = border.color;
    }

    // accessibility.item5 — a borda das variantes cromáticas alcança 3:1 contra
    // a página. A `info` fica de fora POR DECISÃO (D3): assumiu a hairline
    // neutra do projeto, a mesma de input e card, e cobrá-la aqui reprovaria o
    // desenho em vez de um defeito.
    for (const name of ['default', 'destructive', 'warning', 'success'] as const) {
      await expect(borderAgainstPage(badges[name])).toBeGreaterThanOrEqual(BADGE_BORDER_FLOOR);
    }

    // Três cores, e não três nomes para a mesma.
    await expect(new Set([borders.warning, borders.success, borders.info]).size).toBe(3);

    // functional.item2 — a warning não pode parecer a destructive.
    await expect(borders.warning).not.toBe(borders.destructive);
  },
};
