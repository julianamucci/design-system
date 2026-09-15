import { figmaDesign } from '@shared/figma/design-links';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect } from 'storybook/test';
import {
  BADGE_BORDER_FLOOR,
  badgeBorder,
  badgeSurface,
  borderAgainstPage,
  type BadgeVariant,
} from '@shared/testing/badge-probe';
import { NdsBadge } from './badge';
import {
  badgeDefaultSource,
  badgeDestructiveSource,
  badgeSemanticsSource,
  LABEL,
} from './badge.source';

const VARIANTS: BadgeVariant[] = ['default', 'destructive', 'warning', 'success', 'info'];

const meta: Meta = {
  title: 'Components/Feedback/Badge/Variants',
  tags: ['feedback'],
  decorators: [moduleMetadata({ imports: [NdsBadge] })],
  parameters: {
    design: figmaDesign('badge'),
    controls: { disable: true },
    actions: { disable: true },
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj;

/*
 * Toda medição sai da sonda compartilhada (`badge-probe.ts`), a mesma das cinco
 * stacks: cor computada e caixa desenhada, nunca a classe. A referência de cor é
 * o TOKEN resolvido no tema vigente — nenhuma etiqueta montada com classe
 * escrita à mão.
 */

export const Default: Story = {
  parameters: {
    docs: { source: { transform: badgeDefaultSource } },
    covers: ['functional.item1', 'visual.item2'],
  },
  render: () => ({
    props: { label: LABEL.default() },
    template: `<span ndsBadge>{{ label }}</span>`,
  }),
  play: async ({ canvasElement, step }) => {
    const badge = within(canvasElement).getByText(LABEL.default());

    await step('Sem variante passada, a etiqueta é a default', async () => {
      await expect(badge).toHaveAttribute('data-variant', 'default');
    });

    await step('Borda de 2px em --primary', async () => {
      // functional.item1 — a ênfase vem da borda; fundo e texto ficam neutros.
      const border = badgeBorder(badge, 'default');
      await expect(border.width).toBeGreaterThanOrEqual(2);
      await expect(border.color).toBe(border.expected);
    });

    await step('Fundo e texto neutros, texto a 4.5:1', async () => {
      // accessibility.item3 — o contraste do rótulo não depende da variante.
      const surface = badgeSurface(badge);
      await expect(surface.background).toBe(surface.expectedBackground);
      await expect(surface.color).toBe(surface.expectedColor);
      await expect(surface.textRatio).toBeGreaterThanOrEqual(4.5);
    });
  },
};

export const Destructive: Story = {
  parameters: {
    docs: { source: { transform: badgeDestructiveSource } },
    covers: ['functional.item3', 'accessibility.item3', 'visual.item2'],
  },
  render: () => ({
    props: { label: LABEL.destructive() },
    template: `<span ndsBadge variant="destructive">{{ label }}</span>`,
  }),
  play: async ({ canvasElement, step }) => {
    const badge = within(canvasElement).getByText(LABEL.destructive());

    await step('A variante chega ao DOM', async () => {
      await expect(badge).toHaveAttribute('data-variant', 'destructive');
    });

    await step('Borda de 2px em --destructive', async () => {
      // functional.item3 — a cor sinaliza pela borda, e só por ela.
      const border = badgeBorder(badge, 'destructive');
      await expect(border.width).toBeGreaterThanOrEqual(2);
      await expect(border.color).toBe(border.expected);
    });

    await step('O mesmo fundo e texto das demais, texto a 4.5:1', async () => {
      const surface = badgeSurface(badge);
      await expect(surface.background).toBe(surface.expectedBackground);
      await expect(surface.color).toBe(surface.expectedColor);
      await expect(surface.textRatio).toBeGreaterThanOrEqual(4.5);
    });
  },
};

/**
 * As cinco lado a lado: o que as variantes prometem não é cada uma isolada, e
 * sim serem DISTINGUÍVEIS entre si. Uma por story deixaria passar o erro mais
 * provável — copiar o bloco de uma e esquecer de trocar o token.
 */
export const Semantics: Story = {
  parameters: {
    docs: { source: { transform: badgeSemanticsSource } },
    covers: [
      'functional.item2',
      'functional.item4',
      'functional.item7',
      'visual.item2',
      'visual.item5',
      'accessibility.item3',
      'accessibility.item5',
    ],
  },
  render: () => ({
    props: { items: VARIANTS.map((variant) => ({ variant, label: LABEL[variant]() })) },
    template: `
      <div class="nds-cluster" data-spacing="sm">
        @for (item of items; track item.variant) {
          <span ndsBadge [variant]="item.variant">{{ item.label }}</span>
        }
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const badges = Object.fromEntries(
      VARIANTS.map((v) => [v, canvas.getByText(LABEL[v]())]),
    ) as Record<BadgeVariant, HTMLElement>;

    await step('Cada variante declara a própria variante no DOM', async () => {
      // Sem AOT o binding cai em silêncio no default e as cinco ficariam iguais.
      for (const v of VARIANTS) await expect(badges[v]).toHaveAttribute('data-variant', v);
    });

    await step('Cada variante pinta a BORDA com o próprio token, e só ela', async () => {
      // functional.item2/item4/item7 — a `info` lê `--border`, não `--info`: a
      // tabela da sonda é que reprova quem devolver o token homônimo.
      for (const v of VARIANTS) {
        const border = badgeBorder(badges[v], v);
        await expect(border.width, `${v}: largura da borda`).toBeGreaterThanOrEqual(2);
        await expect(border.color, `${v}: cor da borda`).toBe(border.expected);
        const surface = badgeSurface(badges[v]);
        await expect(surface.background, `${v}: fundo`).toBe(surface.expectedBackground);
        await expect(surface.color, `${v}: texto`).toBe(surface.expectedColor);
        await expect(surface.textRatio, `${v}: contraste do texto`).toBeGreaterThanOrEqual(4.5);
      }
    });

    await step('A borda das cromáticas alcança 3:1 contra a página', async () => {
      // accessibility.item5 — WCAG 1.4.11. A `info` fica FORA por decisão (D3):
      // ela assumiu a hairline neutra `--border`, a mesma de input e card, que
      // mede abaixo do piso de propósito.
      for (const v of ['default', 'destructive', 'warning', 'success'] as const) {
        await expect(borderAgainstPage(badges[v]), `${v}: borda contra a página`).toBeGreaterThanOrEqual(
          BADGE_BORDER_FLOOR,
        );
      }
    });

    await step('warning, success e info não repetem a mesma borda', async () => {
      // O trio que o conteúdo publica como distinguível (visual.item5).
      const colors = new Set(
        (['warning', 'success', 'info'] as const).map((v) => badgeBorder(badges[v], v).color),
      );
      await expect(colors.size).toBe(3);
    });

    await step('A warning não se confunde com a destructive', async () => {
      // functional.item2 — o que a warning promete é NÃO parecer um erro.
      await expect(badgeBorder(badges.warning, 'warning').color).not.toBe(
        badgeBorder(badges.destructive, 'destructive').color,
      );
    });
  },
};
