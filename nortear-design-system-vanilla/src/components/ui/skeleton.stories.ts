import type { Meta, StoryObj } from '@storybook/html-vite';
import { expect } from 'storybook/test';
import {
  createSkeleton,
  createSkeletonRegion,
  type SkeletonShape,
  type SkeletonWidth,
} from './skeleton';
import { skeletonSource } from './skeleton.source';
import { createAspectRatio } from './aspect-ratio';
import { createSkeletonDocs } from '@/components/docs/SkeletonDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import { WIDTH_FRACTION, boxDesenhada } from '@shared/testing/skeleton-probe';

// ─── Meta ─────────────────────────────────────────────────────────────────────

// A caixa do esqueleto vem de atributo, não de classe de dimensão nem de altura
// cravada: `data-shape` escolhe a forma e `data-width` a fração da largura do
// container (docs/shared/styles/nds/skeleton.css).
//
// Não há control de "carregando": a região não alterna `aria-busy` — quando o
// conteúdo chega, ela SAI e o conteúdo entra no lugar dela (decisão da dona,
// 2026-09-14).
type SkeletonArgs = {
  shape: SkeletonShape;
  width: SkeletonWidth;
};

const REGION_LABEL = 'Carregando conteúdo';

const meta: Meta<SkeletonArgs> = {
  title: 'Components/Feedback/Skeleton',
  tags: ['autodocs', 'feedback'],
  parameters: {
    layout: 'padded',
    docs: { page: withAutoDocsTab(createSkeletonDocs), source: { transform: skeletonSource } },
  },
  argTypes: {
    shape: {
      control: { type: 'inline-radio' },
      options: ['text', 'heading', 'avatar', 'fill'],
      description: 'Forma do placeholder — decide a caixa que ele desenha (data-shape).',
      table: { type: { summary: '"text" | "heading" | "avatar" | "fill"' }, defaultValue: { summary: 'text' } },
    },
    width: {
      control: { type: 'inline-radio' },
      options: ['full', '3-4', '2-3', '1-2', '1-3'],
      description: 'Fração da largura do container (data-width). Só se aplica às formas de texto.',
      table: { type: { summary: '"full" | "3-4" | "2-3" | "1-2" | "1-3"' }, defaultValue: { summary: '3-4' } },
    },
  },
  args: {
    shape: 'text',
    width: '3-4',
  },
};

export default meta;
type Story = StoryObj<SkeletonArgs>;

// ─── Playground ───────────────────────────────────────────────────────────────

export const Playground: Story = {
  parameters: {
    docs: {
      // Declarada na story, e não só herdada do meta: o painel desta story tem
      // de publicar o que ela monta, mesmo se o meta mudar de forma.
      source: { transform: skeletonSource },
    },
    covers: [
      'functional.item2',
      'functional.item3',
      'functional.item4',
      'accessibility.item1',
      'accessibility.item2',
      'accessibility.item3',
    ],
  },
  // `fill` não tem medida própria: preenche a caixa que o CONTAINER estabelece,
  // e quem a estabelece é o `createAspectRatio` — o mesmo que o painel Code
  // ensina e que a composição de imagem usa. A classe de proporção é da docs
  // page, não API do design system: ela dava a caixa sem aparecer no exemplo.
  render: ({ shape, width }) =>
    shape === 'fill'
      ? createSkeletonRegion({
          label: REGION_LABEL,
          class: 'nds-w-sm',
          children: createAspectRatio({
            ratio: 16 / 9,
            content: createSkeleton({ shape: 'fill' }),
          }),
        })
      : createSkeletonRegion({
          label: REGION_LABEL,
          children: createSkeleton({
            shape,
            width: shape === 'text' || shape === 'heading' ? width : undefined,
          }),
        }),
  play: async ({ canvasElement, step, args }) => {
    const sk = canvasElement.querySelector<HTMLElement>('[data-slot="skeleton"]')!;
    const regiao = canvasElement.querySelector<HTMLElement>('[data-slot="skeleton-region"]')!;

    await step('O placeholder fica fora da árvore de acessibilidade', async () => {
      // Anunciar cada barrinha é ruído: o esqueleto não tem conteúdo.
      await expect(sk).toHaveAttribute('aria-hidden', 'true');
    });

    await step('Quem anuncia o carregamento é a peça de região', async () => {
      // `aria-busy` sozinho num div sem role não é anunciado, e aria-label em
      // div sem role é violação de ARIA — o trio vem da peça, não da story.
      //
      // Papel e estado NÃO são sobrescrevíveis, e nesta stack isso não tem
      // asserção: `createSkeletonRegion` não expõe opção de `role` nem de
      // `aria-busy`, então não há por onde passar valor diferente. Nas stacks
      // que espalham props/atributos a story afirma que o valor passado perde.
      await expect(regiao).not.toBeNull();
      await expect(regiao).toHaveAttribute('role', 'status');
      await expect(regiao).toHaveAttribute('aria-busy', 'true');
      await expect(regiao).toHaveAccessibleName(REGION_LABEL);
      await expect(regiao.contains(sk)).toBe(true);
    });

    await step('O atributo desenha a caixa — medida no que foi renderizado', async () => {
      // Mede o que foi DESENHADO, não a classe: foi exatamente assim que
      // `nds-skeleton-line` sobreviveu como classe inexistente, com o esqueleto
      // do Playground renderizando altura zero.
      const box = boxDesenhada(sk, regiao);
      await expect(box.height).toBeGreaterThan(0);
      if (args.shape === 'text' || args.shape === 'heading') {
        await expect(
          Math.abs(box.fracaoDoContainer - WIDTH_FRACTION[args.width]),
        ).toBeLessThan(0.02);
      }
    });
  },
};
