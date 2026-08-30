import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect, waitFor } from 'storybook/test';
import { NDS_AVATAR, type AvatarSize } from './avatar';
import { DIAMETER, IMG_AVATAR } from './avatar.stories';

const PRESETS: AvatarSize[] = ['sm', 'md', 'lg', 'xl', '2xl'];

const meta: Meta = {
  title: 'Primitives/Display/Avatar/Sizes',
  tags: ['display'],
  decorators: [moduleMetadata({ imports: [...NDS_AVATAR] })],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Presets de diâmetro: sm 24px, md 32px (padrão), lg 40px, xl 48px e 2xl 64px. O valor sai do CSS compartilhado pela escada de espaçamento — nenhuma medida é escrita no componente.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Presets: Story = {
  parameters: {
    covers: ['functional.item6', 'visual.item3'],
  },
  render: () => ({
    props: { presets: PRESETS, src: IMG_AVATAR },
    template: `
      <div class="nds-cluster" data-spacing="lg">
        @for (p of presets; track p) {
          <div class="nds-stack" data-spacing="xs">
            <span ndsAvatar [size]="p" [attr.data-testid]="'avatar-' + p">
              <img ndsAvatarImage [src]="src" alt="" />
              <span ndsAvatarFallback>MR</span>
            </span>
            <p class="nds-text-caption nds-text-muted-foreground">{{ p }}</p>
          </div>
        }
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    await step('Cada preset chega ao elemento como data-size', async () => {
      // Uma story para os cinco: é o conjunto lado a lado que a regressão
      // visual compara, e é nele que um preset errado salta aos olhos.
      for (const p of PRESETS) {
        const el = canvasElement.querySelector<HTMLElement>(`[data-testid="avatar-${p}"]`);
        await expect(el).not.toBeNull();
        await expect(el!).toHaveAttribute('data-size', p);
      }
    });

    await step('E vira o diâmetro que o preset promete', async () => {
      // A medida é o contrato. Conferir só o atributo passaria com o CSS
      // ausente; conferir só a medida passaria com todos no default — juntas,
      // as duas provam que o input chegou E que o CSS o consumiu.
      for (const p of PRESETS) {
        const el = canvasElement.querySelector<HTMLElement>(`[data-testid="avatar-${p}"]`)!;
        const { width, height } = el.getBoundingClientRect();
        await expect(Math.abs(width - DIAMETER[p])).toBeLessThan(0.5);
        await expect(Math.abs(height - DIAMETER[p])).toBeLessThan(0.5);
      }
    });

    await step('A foto acompanha o círculo em todos eles', async () => {
      for (const p of PRESETS) {
        const el = canvasElement.querySelector<HTMLElement>(`[data-testid="avatar-${p}"]`)!;
        const img = el.querySelector<HTMLImageElement>('[data-slot="avatar-image"]')!;
        await waitFor(async () => {
          await expect(img.style.display).toBe('');
        }, { timeout: 5000 });
        const box = img.getBoundingClientRect();
        await expect(Math.abs(box.width - DIAMETER[p])).toBeLessThan(0.5);
      }
    });
  },
};
