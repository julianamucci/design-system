import { figmaDesign } from '@shared/figma/design-links';
import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { within, expect } from 'storybook/test';
import { AspectRatio } from './index';
import AspectRatioStory from './AspectRatioStory.svelte';
import {
  ratioDescribeFailures,
  measureRatio,
  ratioReprovas,
} from '@shared/testing/aspect-ratio-probe';
import AspectRatioDocs from '@/components/docs/AspectRatioDocs.svelte';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import { aspectRatioSource } from './aspect-ratio.source';

const meta: Meta = {
  title: 'Components/Layout/AspectRatio',
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
          'Container passivo que preserva uma proporção fixa de largura-altura para mídia responsiva — imagens, vídeos e iframes.',
      },
    },
  },
  argTypes: {
    ratio: {
      control: { type: 'number', min: 0.25, max: 4, step: 0.05 },
      description: 'Proporção largura/altura (ex.: 16/9 ≈ 1.777).',
    },
  },
  args: {
    ratio: 16 / 9,
  },
};

export default meta;
type Story = StoryObj;

export const Playground: Story = {
  parameters: {
    covers: ['functional.item1', 'functional.item3', 'accessibility.item1'],
  },
  render: (args) => ({
    Component: AspectRatioStory,
    props: {
      ratio: args.ratio,
      child: 'img',
      src: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&auto=format&fit=crop&q=60',
      alt: 'Paisagem ao entardecer',
    },
  }),
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);

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
        args.ratio as number,
      );
      await expect(
        failures,
        failures.length ? `\n${ratioDescribeFailures(failures)}\n` : '',
      ).toEqual([]);
    });

    await step('Imagem filha renderiza com alt descritivo', async () => {
      const img = await canvas.findByRole('img', { name: /Paisagem ao entardecer/i });
      await expect(img).toHaveAttribute('alt', 'Paisagem ao entardecer');
    });

    await step('Imagem preenche a caixa sem distorcer', async () => {
      // Comportamento, não classe: object-cover, w-full e h-full são vocabulário
      // do Tailwind, que saiu do projeto — as três asserções eram inertes e a
      // primeira reprovava. O que o contrato promete é o preenchimento.
      const img = await canvas.findByRole('img', { name: /Paisagem ao entardecer/i });
      const estilo = getComputedStyle(img);
      await expect(estilo.objectFit).toBe('cover');
      const box = canvasElement.querySelector('[data-slot="aspect-ratio"]')!;
      await expect(img.getBoundingClientRect().width).toBeCloseTo(box.getBoundingClientRect().width, 0);
    });
  },
};
