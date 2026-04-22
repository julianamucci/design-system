import type { Meta, StoryObj } from '@storybook/html';
import { within, expect } from 'storybook/test';
import { createAvatar, createAvatarFallback, createAvatarImage, createAvatarRoot } from './avatar';
import { createAvatarDocs } from '@/components/docs/AvatarDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

// ─── Meta ─────────────────────────────────────────────────────────────────────

type AvatarArgs = {
  src: string;
  alt: string;
  fallback: string;
  size: '' | 'h-6 w-6' | 'h-8 w-8' | 'h-10 w-10' | 'h-12 w-12';
};

const meta: Meta<AvatarArgs> = {
  title: 'UI/Avatar',
  tags: ['autodocs'],
  parameters: {
    docs: { page: withAutoDocsTab(createAvatarDocs) },
  },
  argTypes: {
    src: { control: 'text', description: 'URL da imagem (deixe vazio para mostrar o fallback).' },
    alt: { control: 'text', description: 'Texto alternativo descritivo ou vazio se decorativo.' },
    fallback: { control: 'text', description: 'Iniciais exibidas quando a imagem falha ou está ausente.' },
    size: {
      control: 'select',
      options: ['', 'h-6 w-6', 'h-8 w-8', 'h-10 w-10', 'h-12 w-12'],
      description: 'Tamanho do Avatar via className (não existe prop size). Padrão: h-8 w-8.',
    },
  },
  args: {
    src: 'https://github.com/shadcn.png',
    alt: 'Foto de perfil de Maria Rodrigues',
    fallback: 'MR',
    size: '',
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
    className: args.size,
  });
}

export const Playground: Story = {
  render: (args) => buildAvatar(args),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Avatar está presente no DOM', async () => {
      // hidden:true — img começa com display:none até o load completar.
      const img = await canvas.findByRole('img', { hidden: true });
      await expect(img).toBeInTheDocument();
    });

    await step('Imagem tem atributo alt', async () => {
      const img = (await canvas.findByRole('img', { hidden: true })) as HTMLImageElement;
      await expect(img.alt).toBeTruthy();
    });
  },
};

// Keep factories referenced so unused-import lint stays happy when tree-shaking analyzes.
void createAvatarRoot;
void createAvatarImage;
void createAvatarFallback;
