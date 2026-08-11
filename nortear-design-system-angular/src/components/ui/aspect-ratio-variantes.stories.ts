import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect } from 'storybook/test';
import { NdsAspectRatio } from './aspect-ratio';
import { IMG_PLACEHOLDER } from './aspect-ratio.stories';

const PROPORCOES = [
  { nome: '16:9',  ratio: 16 / 9  },
  { nome: '4:3',   ratio: 4 / 3   },
  { nome: '1:1',   ratio: 1       },
  { nome: '3:4',   ratio: 3 / 4   },
  { nome: '21:9',  ratio: 21 / 9  },
];

const meta: Meta = {
  title: 'UI/AspectRatio/Variants',
  decorators: [moduleMetadata({ imports: [NdsAspectRatio] })],
  parameters: { layout: 'padded', controls: { disable: true } },
};

export default meta;
type Story = StoryObj;

export const Ratios: Story = {
  parameters: {
    covers: [
      'functional.item3', 'functional.item4',
      'visual.item1', 'visual.item2', 'visual.item3', 'visual.item4', 'visual.item5',
    ],
  },
  render: () => ({
    props: { proporcoes: PROPORCOES, src: IMG_PLACEHOLDER },
    template: `
      <div class="nds-grid nds-w-full" data-spacing="lg" style="--grid-min: 12rem">
        @for (p of proporcoes; track p.nome) {
          <div class="nds-stack" data-spacing="sm">
            <p class="nds-text-caption nds-text-muted-foreground">{{ p.nome }}</p>
            <div ndsAspectRatio [ratio]="p.ratio">
              <img [src]="src" [alt]="'Exemplo na proporção ' + p.nome" />
            </div>
          </div>
        }
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    await step('Cada caixa mede a proporção que declarou', async () => {
      // Uma story para as cinco: é o conjunto lado a lado que a regressão
      // visual compara, e é nele que uma proporção errada salta aos olhos.
      const caixas = [...canvasElement.querySelectorAll<HTMLElement>('[data-slot="aspect-ratio"]')];
      await expect(caixas).toHaveLength(PROPORCOES.length);
      for (const [i, caixa] of caixas.entries()) {
        const { width, height } = caixa.getBoundingClientRect();
        await expect(Math.abs(width / height - PROPORCOES[i].ratio)).toBeLessThan(0.1);
      }
    });

    await step('Cada imagem preenche a caixa sem estourar', async () => {
      // Os filhos vão para `position: absolute; inset: 0`; se essa regra sair,
      // a img volta a ter dimensão intrínseca e vaza da caixa.
      const caixas = [...canvasElement.querySelectorAll<HTMLElement>('[data-slot="aspect-ratio"]')];
      for (const caixa of caixas) {
        const img = caixa.querySelector<HTMLImageElement>('img')!;
        await expect(img.getBoundingClientRect().height)
          .toBeLessThanOrEqual(caixa.getBoundingClientRect().height + 1);
      }
    });
  },
};
