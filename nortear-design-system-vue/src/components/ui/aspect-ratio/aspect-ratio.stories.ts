import { figmaDesign } from '@shared/figma/design-links';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { within, expect } from 'storybook/test';
import { AspectRatio } from './index';
import {
  ratioDescribeFailures,
  measureRatio,
  ratioReprovas,
} from '@shared/testing/aspect-ratio-probe';
import AspectRatioDocs from '@/components/docs/AspectRatioDocs.vue';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import { aspectRatioSource } from './aspect-ratio.source';

const meta = {
  title: 'Primitives/Layout/AspectRatio',
  component: AspectRatio,
  tags: ['autodocs', 'layout'],
  parameters: {
    design: figmaDesign('aspectRatio'),
    layout: 'centered',
    docs: {
      page: withAutoDocsTab(AspectRatioDocs),
      source: { transform: aspectRatioSource },
      description: {
        component:
          'AspectRatio preserva uma proporção fixa de largura-altura para mídia responsiva — imagens, vídeos, iframes e mapas. Container passivo e sem estado.',
      },
    },
  },
  argTypes: {
    ratio: {
      control: { type: 'number', min: 0.25, max: 4, step: 0.01 },
      description: 'Proporção largura/altura (ex: 16/9 ≈ 1.777, 4/3 ≈ 1.333, 1/1 = 1).',
    },
  },
  args: {
    ratio: 16 / 9,
  },
} satisfies Meta<typeof AspectRatio>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  parameters: {
    covers: ['functional.item1', 'functional.item3', 'accessibility.item1'],
  },
  render: (args) => ({
    components: { AspectRatio },
    setup() { return { args }; },
    template: `
      <div class="" style="width: 480px">
        <AspectRatio v-bind="args">
          <img
            src="https://images.unsplash.com/photo-1535025183041-0991a977e25b?w=800&auto=format"
            alt="Paisagem ao amanhecer"
            loading="lazy"
            decoding="async"
            class="nds-w-full nds-rounded-md" style="height: 100%; object-fit: cover"
          />
        </AspectRatio>
      </div>
    `,
  }),
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const img = canvas.getByRole('img', { name: /Paisagem ao amanhecer/ });

    await step('Caixa respeita a proporção do control', async () => {
      // functional.item1 — medir contra args.ratio prova que o control chega ao
      // CSS; a presença do wrapper sozinha não prova proporção nenhuma.
      //
      // A sonda mede mais que a razão: confere que a caixa é a `.nds-aspect-ratio`
      // do design system, que a proporção sai do `aspect-ratio` nativo da folha
      // (e não de um truque de padding embutido por uma lib), que não há altura
      // cravada e que o filho direto está sendo esticado para cobrir a caixa.
      // Medir só a razão aprovava as duas stacks que não tinham a classe.
      const failures = ratioReprovas(
        [measureRatio(canvasElement, 'playground')],
        args.ratio!,
      );
      await expect(
        failures,
        failures.length ? `\n${ratioDescribeFailures(failures)}\n` : '',
      ).toEqual([]);
    });

    await step('Imagem tem atributo alt descritivo', async () => {
      // accessibility.item1
      await expect(img).toHaveAttribute('alt', 'Paisagem ao amanhecer');
    });

    await step('Imagem preenche a caixa sem distorcer', async () => {
      // functional.item3 — comportamento, não classe.
      await expect(getComputedStyle(img).objectFit).toBe('cover');
      const box = canvasElement.querySelector('[data-slot="aspect-ratio"]')!;
      await expect(img.getBoundingClientRect().width).toBeCloseTo(
        box.getBoundingClientRect().width,
        0,
      );
      await expect(img).toBeVisible();
    });
  },
};
