import { figmaDesign } from '@shared/figma/design-links';
import type { Meta, StoryObj } from '@storybook/html-vite';
import { expect, waitFor } from 'storybook/test';
import { createAvatar, type AvatarSize } from './avatar';
import { createAvatarDocs } from '@/components/docs/AvatarDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

// ─── Meta ─────────────────────────────────────────────────────────────────────

type AvatarArgs = {
  src: string;
  alt: string;
  fallback: string;
  size: AvatarSize;
  className: string;
};

const meta: Meta<AvatarArgs> = {
  title: 'UI/Avatar',
  tags: ['autodocs', 'display'],
  parameters: {
    design: figmaDesign('avatar'),
    docs: { page: withAutoDocsTab(createAvatarDocs) },
  },
  argTypes: {
    src: { control: 'text', description: 'URL da imagem (deixe vazio para mostrar o fallback).' },
    alt: { control: 'text', description: 'Texto alternativo descritivo ou vazio se decorativo.' },
    fallback: { control: 'text', description: 'Iniciais exibidas quando a imagem falha ou está ausente.' },
    className: {
      control: 'text',
      description:
        'Classes .nds-* adicionais para ajustes pontuais de forma ou borda. O diâmetro sai da prop size.',
      table: { type: { summary: 'string' } },
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl', '2xl'],
      description: 'Tamanho preset (sm=24, md=32, lg=40, xl=48, 2xl=64). Padrão: md.',
    },
  },
  args: {
    src: 'https://i.pravatar.cc/128?img=47',
    alt: 'Foto de perfil de Maria Rodrigues',
    fallback: 'MR',
    size: 'md',
    className: 'nds-shadow-sm',
  },
};

export default meta;
type Story = StoryObj<AvatarArgs>;

// ─── Playground ───────────────────────────────────────────────────────────────

function buildAvatar(args: AvatarArgs): HTMLElement {
  return createAvatar({
    src: args.src || undefined,
    alt: args.alt,
    fallbackText: args.fallback,
    size: args.size,
    className: args.className,
  });
}

/** Diâmetro de cada preset, em px, com a densidade padrão. */
const DIAMETRO: Record<AvatarSize, number> = { sm: 24, md: 32, lg: 40, xl: 48, '2xl': 64 };

export const Playground: Story = {
  parameters: { covers: ['accessibility.item4', 'visual.item1'] },
  render: (args) => buildAvatar(args),
  play: async ({ canvasElement, args, step }) => {
    const root = canvasElement.querySelector('[data-slot="avatar"]');

    await step('O preset do control chega ao elemento', async () => {
      await expect(root).not.toBeNull();
      await expect(root).toHaveAttribute('data-size', args.size);
      // Medir e não conferir a classe: o diâmetro é o contrato do preset, e a
      // classe base é a mesma nos cinco.
      const { width } = root!.getBoundingClientRect();
      await expect(Math.abs(width - DIAMETRO[args.size])).toBeLessThan(0.5);
    });

    await step('A foto identifica a pessoa pelo alt', async () => {
      const img = canvasElement.querySelector<HTMLImageElement>('[data-slot="avatar-image"]');
      await expect(img).not.toBeNull();
      await expect(img!.alt).toBe(args.alt);
      // E é ela que fica na tela depois do load.
      await waitFor(async () => {
        const r = root!.getBoundingClientRect();
        const alvo = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        await expect(alvo && alvo.closest('[data-slot="avatar-image"]')).not.toBeNull();
      }, { timeout: 5000 });
    });

    await step('A classe extra do control chega à raiz', async () => {
      // A extensibilidade documentada é justamente esta: classe .nds-* somada
      // à do componente, sem substituir.
      await expect(root).toHaveClass('nds-avatar');
      await expect(root).toHaveClass('nds-shadow-sm');
    });
  },
};
