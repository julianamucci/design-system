import { figmaDesign } from '@shared/figma/design-links';
import type { Meta, StoryObj } from '@storybook/html-vite';
import { within, expect } from 'storybook/test';
import { badgeRoot, badgeVariant } from '@shared/testing/badge-probe';
import { createBadge, type BadgeVariant } from './badge';
import { badgeSource } from './badge.source';
import badgeTranslations from '@shared/content/badge/translations.json';

/**
 * Rótulos do bloco pt-BR, lidos DIRETO do JSON compartilhado — o mesmo que o
 * construtor do snippet lê. A story é fixture: o texto que ela monta e o que ela
 * procura têm de ser o mesmo, e não podem mudar com o idioma do navegador.
 */
const LABELS = badgeTranslations['pt-BR'].demonstration.labels;
import { createBadgeDocs } from '@/components/docs/BadgeDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

// ─── Meta ─────────────────────────────────────────────────────────────────────

type BadgeArgs = {
  variant: BadgeVariant;
  label: string;
};

const meta: Meta<BadgeArgs> = {
  title: 'Components/Feedback/Badge',
  tags: ['autodocs', 'feedback'],
  parameters: {
    design: figmaDesign('badge'),
    actions: { disable: true },
    layout: 'centered',
    docs: {
      page: withAutoDocsTab(createBadgeDocs),
      source: { transform: badgeSource },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive', 'warning', 'success', 'info'],
      description: 'Variante visual nativa do Badge',
    },
    label: { control: 'text', description: 'Texto do Badge (1 a 3 palavras)' },
  },
  args: {
    variant: 'default',
    label: LABELS.defaultLabel,
  },
};

export default meta;
type Story = StoryObj<BadgeArgs>;

// ─── Playground ───────────────────────────────────────────────────────────────

export const Playground: Story = {
  // A transform é declarada AQUI, e não herdada do `meta`: herança acerta por
  // coincidência, e no dia em que o `meta` trocar de transform esta story passa
  // a publicar outro exemplo sem ninguém ver.
  parameters: {
    covers: ['accessibility.item1', 'visual.item1'],
    docs: { source: { transform: badgeSource } },
  },
  render: (args) => createBadge({ variant: args.variant, children: args.label }),
  play: async ({ canvasElement, args, step }) => {
    const badge = badgeRoot(within(canvasElement).getByText(args.label));

    await step('Os controls chegam ao elemento', async () => {
      await expect(badge).toHaveAttribute('data-slot', 'badge');
      await expect(badgeVariant(badge)).toBe(String(args.variant));
    });

    await step('Sem variante passada, a etiqueta declara default', async () => {
      // O padrão da fábrica tem de chegar ao DOM: é pelo `data-variant` que
      // story, teste e ferramenta leem a variante, e ausência não é `default`.
      const bare = createBadge({ children: 'Sem variante' });
      canvasElement.appendChild(bare);
      const declared = badgeVariant(bare);
      const slot = bare.getAttribute('data-slot');
      bare.remove();
      await expect(declared).toBe('default');
      await expect(slot).toBe('badge');
    });

    await step('É um <span>, para caber dentro de frase e célula', async () => {
      // Um <div> aqui quebra o fluxo do texto que acompanha o badge, e
      // <div> dentro de <p> é aninhamento inválido.
      await expect(badge.tagName).toBe('SPAN');
    });

    await step('Etiqueta inline, não bloco', async () => {
      // accessibility.item1 — o badge mora dentro de frase e de célula: se
      // virasse bloco, quebraria a linha do texto que o acompanha.
      const style = getComputedStyle(badge);
      await expect(style.display).toBe('inline-flex');
      await expect(style.whiteSpace).toBe('nowrap');
      await expect(badge.hasAttribute('tabindex')).toBe(false);
    });

    await step('Tipografia compacta do componente', async () => {
      const style = getComputedStyle(badge);
      await expect(style.fontSize).toBe('12px');
      await expect(Number(style.fontWeight)).toBeGreaterThanOrEqual(500);
    });
  },
};
