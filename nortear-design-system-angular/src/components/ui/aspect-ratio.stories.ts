import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect } from 'storybook/test';
import { NdsAspectRatio } from './aspect-ratio';
import {
  ratioDescribeFailures,
  measureRatio,
  ratioReprovas,
} from '@shared/testing/aspect-ratio-probe';
import { RATIOS } from './aspect-ratio.fixtures';
import { aspectRatioPlaygroundSource, type AspectRatioArgs } from './aspect-ratio.source';
import { NdsAspectRatioDocs } from '@/components/docs/AspectRatioDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

/** Placeholder inline: evita rede no teste e mantém a story determinística. */
export const IMG_PLACEHOLDER =
  "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='450'%3E%3Crect width='800' height='450' fill='%23cbd5e1'/%3E%3C/svg%3E";

const meta: Meta<AspectRatioArgs> = {
  title: 'Primitives/Layout/AspectRatio',
  tags: ['autodocs', 'layout'],
  // `IMG_PLACEHOLDER` é DADO, e sem esta linha o CSF o trata como story: o
  // plugin de teste tenta escrever `.parameters` numa string, o módulo ESM está
  // em modo estrito, e o arquivo INTEIRO morre no import — nenhuma das stories
  // daqui chegava a rodar. Os arquivos irmãos importam a constante daqui, então
  // a saída é declarar que ela não é story, não mudá-la de casa.
  excludeStories: ['IMG_PLACEHOLDER'],
  decorators: [moduleMetadata({ imports: [NdsAspectRatio] })],
  parameters: {
    layout: 'padded',
    docs: { page: withAutoDocsTab(NdsAspectRatioDocs) },
  },
  argTypes: {
    ratio: {
      control: 'select',
      options: RATIOS.map((r) => r.value),
      description: 'Proporção largura/altura. Ex.: 16/9, 4/3, 1.',
    },
    alt: {
      control: 'text',
      description: 'Alternativa textual da imagem. Vazia só se a imagem for decorativa.',
    },
  },
  args: { ratio: 16 / 9, alt: 'Vista aérea da orla' },
};

export default meta;
type Story = StoryObj<AspectRatioArgs>;

export const Playground: Story = {
  parameters: {
    docs: { source: { transform: aspectRatioPlaygroundSource } },
    covers: ['functional.item1', 'functional.item2', 'accessibility.item1'],
  },
  render: (args) => ({
    props: { ...args, src: IMG_PLACEHOLDER },
    template: `
      <div class="nds-max-w-md">
        <div ndsAspectRatio [ratio]="ratio">
          <img [src]="src" [alt]="alt" />
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step, args }) => {
    await step('A proporção vira a custom property que o CSS lê', async () => {
      // O CSS compartilhado declara `aspect-ratio: var(--ratio)`. Se o
      // componente escrevesse `aspect-ratio` inline, sobrescreveria a regra do
      // design system em vez de alimentá-la — e as outras stacks divergiriam.
      const box = canvasElement.querySelector<HTMLElement>('[data-slot="aspect-ratio"]')!;
      await expect(box.style.getPropertyValue('--ratio').trim()).toBe(String(args.ratio));
    });

    await step('A caixa resultante respeita a proporção pedida', async () => {
      // Medir a caixa é o único jeito de saber que a custom property foi de
      // fato consumida: `--ratio` correto com o CSS ausente passaria igual.
      //
      // A sonda mede mais que a razão: confere que a caixa é a `.nds-aspect-ratio`
      // do design system, que a proporção sai do `aspect-ratio` nativo da folha
      // (e não de um truque de padding embutido por uma lib), que não há altura
      // cravada e que o filho direto está sendo esticado para cobrir a caixa.
      // Medir só a razão aprovava as duas stacks que não tinham a classe.
      const failures = ratioReprovas(
        [measureRatio(canvasElement, 'playground')],
        args.ratio,
      );
      await expect(
        failures,
        failures.length ? `\n${ratioDescribeFailures(failures)}\n` : '',
      ).toEqual([]);
    });

    await step('A imagem tem alternativa textual', async () => {
      const img = canvasElement.querySelector<HTMLImageElement>('img')!;
      await expect(img.alt).toBe(args.alt);
    });
  },
};
