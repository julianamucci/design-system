import type { Meta, StoryObj } from '@storybook/html-vite';
import { expect } from 'storybook/test';
import { createSkeleton, type SkeletonShape, type SkeletonWidth } from './skeleton';
import { skeletonSource } from './skeleton.source';
import { createSkeletonDocs } from '@/components/docs/SkeletonDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import { WIDTH_FRACTION, boxDesenhada } from '@shared/testing/skeleton-probe';

// ─── Meta ─────────────────────────────────────────────────────────────────────

// A caixa do esqueleto vem de atributo, não de classe de dimensão nem de altura
// cravada: `data-shape` escolhe a forma e `data-width` a fração da largura do
// container (docs/shared/styles/nds/skeleton.css). A factory registra os dois na
// raiz, então o painel Code acompanha os controls pelo `outerHTML`.
type SkeletonArgs = {
  shape: SkeletonShape;
  width: SkeletonWidth;
  loading: boolean;
};

const meta: Meta<SkeletonArgs> = {
  title: 'UI/Skeleton',
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
    loading: {
      control: 'boolean',
      description: 'Estado de carregamento da região que contém o placeholder.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
  },
  args: {
    shape: 'text',
    width: '3-4',
    loading: true,
  },
};

export default meta;
type Story = StoryObj<SkeletonArgs>;

// ─── Playground ───────────────────────────────────────────────────────────────

export const Playground: Story = {
  parameters: {
    covers: [
      'functional.item2',
      'functional.item3',
      'functional.item4',
      'accessibility.item1',
      'accessibility.item2',
      'accessibility.item3',
    ],
  },
  render: ({ shape, width, loading }) => {
    const regiao = document.createElement('div');
    regiao.setAttribute('role', 'status');
    regiao.setAttribute('aria-busy', String(loading));
    regiao.setAttribute('aria-label', 'Carregando conteúdo');

    regiao.appendChild(
      createSkeleton({
        shape,
        width: shape === 'text' || shape === 'heading' ? width : undefined,
        // `fill` preenche a caixa que o container estabelece; aqui quem
        // estabelece é a proporção de mídia, senão o bloco nasce com altura
        // zero e o Playground mostra um esqueleto invisível.
        className: shape === 'fill' ? 'nds-docs-skeleton-media' : undefined,
      }),
    );

    return regiao;
  },
  play: async ({ canvasElement, step, args }) => {
    const sk = canvasElement.querySelector<HTMLElement>('[data-slot="skeleton"]')!;
    const regiao = canvasElement.querySelector<HTMLElement>('[role="status"]')!;

    await step('O placeholder fica fora da árvore de acessibilidade', async () => {
      // Anunciar cada barrinha é ruído: o esqueleto não tem conteúdo.
      await expect(sk).toHaveAttribute('aria-hidden', 'true');
    });

    await step('Quem anuncia o carregamento é a região', async () => {
      // `aria-busy` sozinho num div sem role não é anunciado, e aria-label em
      // div sem role é violação de ARIA — o par role+label é o que faz o leitor
      // dizer "carregando conteúdo".
      await expect(regiao).toHaveAttribute('aria-busy', String(args.loading));
      await expect(regiao.getAttribute('aria-label')).toBeTruthy();
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
