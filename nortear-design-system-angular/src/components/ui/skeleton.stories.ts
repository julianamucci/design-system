import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect } from 'storybook/test';
import { NdsSkeleton } from './skeleton';
import { NdsSkeletonDocs } from '@/components/docs/SkeletonDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import { WIDTH_FRACTION, boxDesenhada } from '@shared/testing/skeleton-probe';
import { skeletonPlaygroundSource, type SkeletonArgs } from './skeleton.source';

const meta: Meta<SkeletonArgs> = {
  title: 'Primitives/Feedback/Skeleton',
  tags: ['autodocs', 'feedback'],
  decorators: [moduleMetadata({ imports: [NdsSkeleton] })],
  parameters: {
    layout: 'padded',
    docs: { page: withAutoDocsTab(NdsSkeletonDocs) },
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
  args: { shape: 'text', width: '3-4', loading: true },
};

export default meta;
type Story = StoryObj<SkeletonArgs>;

export const Playground: Story = {
  parameters: {
    docs: { source: { transform: skeletonPlaygroundSource } },
    covers: ['functional.item2', 'functional.item3', 'accessibility.item1', 'accessibility.item2'],
  },
  render: (args) => ({
    props: {
      ...args,
      width: args.shape === 'text' || args.shape === 'heading' ? args.width : null,
      // `fill` preenche a caixa que o container estabelece; aqui quem
      // estabelece é a proporção de mídia, senão o bloco nasce com altura zero
      // e o Playground mostra um esqueleto invisível.
      className: args.shape === 'fill' ? 'nds-docs-skeleton-media' : '',
    },
    template: `
      <div role="status" [attr.aria-busy]="loading" aria-label="Carregando conteúdo">
        <div ndsSkeleton [attr.data-shape]="shape" [attr.data-width]="width" [class]="className"></div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step, args }) => {
    const sk = canvasElement.querySelector<HTMLElement>('[data-slot="skeleton"]')!;
    const regiao = canvasElement.querySelector<HTMLElement>('[role="status"]')!;

    await step('O esqueleto sai da árvore de acessibilidade', async () => {
      // É ruído para leitor de tela: não tem conteúdo, só ocupa o espaço.
      await expect(sk).toHaveAttribute('aria-hidden', 'true');
    });

    await step('Quem anuncia o carregamento é o container', async () => {
      // O par é sempre este: esqueleto aria-hidden dentro de região aria-busy.
      // Sem o container, o leitor não sabe que algo está sendo carregado.
      await expect(regiao.getAttribute('aria-busy')).toBe(String(args.loading));
      await expect(regiao.contains(sk)).toBe(true);
    });

    await step('O atributo desenha a caixa — medida no que foi renderizado', async () => {
      // Mede o que foi DESENHADO, não a classe: é a asserção que faltava nas
      // outras quatro stacks, onde `h-4 w-[250px]` era texto inerte e o
      // Playground renderizava altura zero.
      await expect(sk).toHaveClass(/nds-skeleton/);
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
