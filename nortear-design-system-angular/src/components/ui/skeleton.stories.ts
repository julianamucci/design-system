import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect } from 'storybook/test';
import { NDS_SKELETON } from './skeleton';
import { NdsSkeletonDocs } from '@/components/docs/SkeletonDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import { WIDTH_FRACTION, boxDesenhada } from '@shared/testing/skeleton-probe';
import { skeletonPlaygroundSource, type SkeletonArgs } from './skeleton.source';

// Não há control de "carregando": a região não alterna `aria-busy` — quando o
// conteúdo chega, ela SAI e o conteúdo entra no lugar dela (decisão da dona,
// 2026-09-14).

const REGION_LABEL = 'Carregando conteúdo';

const meta: Meta<SkeletonArgs> = {
  title: 'Components/Feedback/Skeleton',
  tags: ['autodocs', 'feedback'],
  decorators: [moduleMetadata({ imports: [...NDS_SKELETON] })],
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
  },
  args: { shape: 'text', width: '3-4' },
};

export default meta;
type Story = StoryObj<SkeletonArgs>;

export const Playground: Story = {
  parameters: {
    docs: {
      source: { transform: skeletonPlaygroundSource },
      description: {
        story:
          'Uma peça dentro da região que anuncia o carregamento. Forma e largura vêm dos controls, por atributo.',
      },
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
  render: (args) => ({
    props: {
      ...args,
      width: args.shape === 'text' || args.shape === 'heading' ? args.width : null,
      // `fill` preenche a caixa que o container estabelece; aqui quem
      // estabelece é a proporção de mídia, senão o bloco nasce com altura zero
      // e o Playground mostra um esqueleto invisível.
      className: args.shape === 'fill' ? 'nds-docs-skeleton-media' : '',
      regionLabel: REGION_LABEL,
    },
    template: `
      <div ndsSkeletonRegion [label]="regionLabel">
        <div ndsSkeleton [attr.data-shape]="shape" [attr.data-width]="width" [class]="className"></div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step, args }) => {
    const sk = canvasElement.querySelector<HTMLElement>('.nds-skeleton')!;
    const region = canvasElement.querySelector<HTMLElement>('[ndsSkeletonRegion]')!;

    await step('O esqueleto sai da árvore de acessibilidade', async () => {
      // É ruído para leitor de tela: não tem conteúdo, só ocupa o espaço.
      await expect(sk).toHaveAttribute('aria-hidden', 'true');
    });

    await step('Quem anuncia o carregamento é a peça de região', async () => {
      // O trio vem da diretiva, não da story: `aria-busy` sozinho num div sem
      // papel não é anunciado, e nome em div sem papel é atributo proibido.
      //
      // Papel e estado NÃO são sobrescrevíveis, e nesta stack isso não tem
      // asserção: `NdsSkeletonRegion` não expõe input de `role` nem de
      // `aria-busy`, e host binding apaga o atributo estático do template —
      // não há por onde passar valor diferente.
      await expect(region).not.toBeNull();
      await expect(region).toHaveAttribute('data-slot', 'skeleton-region');
      await expect(region).toHaveAttribute('role', 'status');
      await expect(region).toHaveAttribute('aria-busy', 'true');
      await expect(region).toHaveAccessibleName(REGION_LABEL);
      await expect(region.contains(sk)).toBe(true);
    });

    await step('O atributo desenha a caixa — medida no que foi renderizado', async () => {
      // Mede o que foi DESENHADO, não a classe: `h-4 w-[250px]` era texto
      // inerte e o Playground renderizava altura zero com a suíte verde.
      const box = boxDesenhada(sk, region);
      await expect(box.height).toBeGreaterThan(0);
      if (args.shape === 'text' || args.shape === 'heading') {
        await expect(
          Math.abs(box.fracaoDoContainer - WIDTH_FRACTION[args.width]),
        ).toBeLessThan(0.02);
      }
    });
  },
};
