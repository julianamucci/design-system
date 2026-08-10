import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect } from 'storybook/test';
import { NdsAspectRatio } from './aspect-ratio';
import { NdsAspectRatioDocs } from '@/components/docs/AspectRatioDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

/** Placeholder inline: evita rede no teste e mantém a story determinística. */
export const IMG_PLACEHOLDER =
  "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='450'%3E%3Crect width='800' height='450' fill='%23cbd5e1'/%3E%3C/svg%3E";

type AspectRatioArgs = {
  ratio: number;
  alt: string;
};

/** Ver a nota em separator.stories.ts. */
function playgroundSource(_gerado: string, ctx: { args?: Partial<AspectRatioArgs> }): string {
  const { ratio = 16 / 9, alt = 'Vista aérea da orla' } = ctx.args ?? {};
  const legivel = RATIOS.find((r) => Math.abs(r.valor - ratio) < 0.001)?.expr ?? String(ratio);
  return `import { NdsAspectRatio } from '@/components/ui/aspect-ratio';

@Component({
  imports: [NdsAspectRatio],
  template: \`
    <div ndsAspectRatio [ratio]="${legivel}">
      <img src="/orla.jpg" alt="${alt}" />
    </div>
  \`,
})
export class Exemplo {}`;
}

/** Proporções com a expressão legível, para o snippet não mostrar 1.7777. */
const RATIOS = [
  { valor: 16 / 9, expr: '16 / 9' },
  { valor: 4 / 3,  expr: '4 / 3'  },
  { valor: 1,      expr: '1'      },
  { valor: 3 / 4,  expr: '3 / 4'  },
  { valor: 21 / 9, expr: '21 / 9' },
];

const meta: Meta<AspectRatioArgs> = {
  title: 'UI/AspectRatio',
  tags: ['autodocs', 'layout'],
  decorators: [moduleMetadata({ imports: [NdsAspectRatio] })],
  parameters: {
    layout: 'padded',
    docs: { page: withAutoDocsTab(NdsAspectRatioDocs) },
  },
  argTypes: {
    ratio: {
      control: 'select',
      options: RATIOS.map((r) => r.valor),
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
    docs: { source: { transform: playgroundSource } },
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
      const box = canvasElement.querySelector<HTMLElement>('[data-slot="aspect-ratio"]')!;
      const { width, height } = box.getBoundingClientRect();
      await expect(height).toBeGreaterThan(0);
      await expect(Math.abs(width / height - args.ratio)).toBeLessThan(0.1);
    });

    await step('A imagem tem alternativa textual', async () => {
      const img = canvasElement.querySelector<HTMLImageElement>('img')!;
      await expect(img.alt).toBe(args.alt);
    });
  },
};
