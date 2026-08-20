import { figmaDesign } from '@shared/figma/design-links';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect, waitFor } from 'storybook/test';
import { Avatar, AvatarImage, AvatarFallback } from './index';
import AvatarDocs from '@/components/docs/AvatarDocs.vue';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import { avatarSource } from './avatar.source';

/** Diâmetro de cada preset, em px, com a densidade padrão. */
const DIAMETRO = { sm: 24, md: 32, lg: 40, xl: 48, '2xl': 64 } as const;

const meta = {
  title: 'UI/Avatar',
  component: Avatar,
  tags: ['autodocs', 'display'],
  parameters: {
    design: figmaDesign('avatar'),
    layout: 'centered',
    docs: {
      page: withAutoDocsTab(AvatarDocs),
      source: { transform: avatarSource },
      description: {
        component:
          'Avatar representa um usuário via foto, iniciais ou ícone. O diâmetro sai dos presets da prop size.',
      },
    },
  },
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl', '2xl'],
      description: 'Preset de diâmetro: sm 24px, md 32px, lg 40px, xl 48px, 2xl 64px.',
      table: {
        type: { summary: "'sm' | 'md' | 'lg' | 'xl' | '2xl'" },
        defaultValue: { summary: 'md' },
      },
    },
    class: {
      control: 'text',
      description:
        'Classes .nds-* adicionais para ajustes pontuais de forma ou borda. O diâmetro sai da prop size.',
      table: { type: { summary: 'string' } },
    },
  },
  args: {
    size: 'md',
    class: 'nds-shadow-sm',
  },
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  parameters: { covers: ['accessibility.item4', 'visual.item1'] },
  render: (args) => ({
    components: { Avatar, AvatarImage, AvatarFallback },
    setup() { return { args }; },
    template: `
      <Avatar v-bind="args">
        <AvatarImage
          src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format"
          alt="Foto de perfil de Maria Rodrigues"
        />
        <AvatarFallback :delay-ms="600">MR</AvatarFallback>
      </Avatar>
    `,
  }),
  play: async ({ canvasElement, args, step }) => {
    const root = canvasElement.querySelector('[data-slot="avatar"]');

    await step('O preset do control chega ao elemento', async () => {
      await expect(root).not.toBeNull();
      await expect(root).toHaveAttribute('data-size', args.size!);
      // Medir e não conferir a classe: o diâmetro é o contrato do preset, e a
      // classe base é a mesma nos cinco.
      const { width } = root!.getBoundingClientRect();
      await expect(Math.abs(width - DIAMETRO[args.size!])).toBeLessThan(0.5);
    });

    await step('A foto identifica a pessoa pelo alt', async () => {
      await waitFor(async () => {
        const img = canvasElement.querySelector<HTMLImageElement>('[data-slot="avatar-image"]');
        await expect(img).not.toBeNull();
        await expect(img!.alt).toBe('Foto de perfil de Maria Rodrigues');
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
