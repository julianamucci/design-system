import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect } from 'storybook/test';
import { NdsSkeleton } from './skeleton';
import { NdsSkeletonDocs } from '@/components/docs/SkeletonDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import { FRACAO_DE_LARGURA, caixaDesenhada } from '@shared/testing/skeleton-probe';

// O CSS do .nds-skeleton não traz forma nem dimensão de propósito — quem usa
// define a caixa que o conteúdo real vai ocupar.
// Forma por ATRIBUTO, nunca por medida cravada: guideline 12 — altura é
// resultado de padding e tipografia, senão o bloco não cresce quando a pessoa
// aumenta a fonte do navegador.
type SkeletonArgs = {
  shape: 'text' | 'heading' | 'avatar' | 'fill';
  width: 'full' | '3-4' | '2-3' | '1-2' | '1-3';
  loading: boolean;
};

/** Ver a nota em separator.stories.ts. */
function playgroundSource(_gerado: string, ctx: { args?: Partial<SkeletonArgs> }): string {
  const { shape = 'text', width = '3-4' } = ctx.args ?? {};
  const largura = shape === 'text' || shape === 'heading' ? ` data-width="${width}"` : '';
  return `import { NdsSkeleton } from '@/components/ui/skeleton';

@Component({
  imports: [NdsSkeleton],
  template: \`
    <!-- aria-busy no CONTAINER: o esqueleto é aria-hidden e quem anuncia
         o carregamento é a região que vai receber o conteúdo. -->
    <div role="status" [attr.aria-busy]="carregando()" aria-label="Carregando conteúdo">
      <div ndsSkeleton data-shape="${shape}"${largura}></div>
    </div>
  \`,
})
export class Exemplo {}`;
}

const meta: Meta<SkeletonArgs> = {
  title: 'UI/Skeleton',
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
    docs: { source: { transform: playgroundSource } },
    covers: ['functional.item2', 'functional.item3', 'accessibility.item1', 'accessibility.item2'],
  },
  render: (args) => ({
    props: {
      ...args,
      largura: args.shape === 'text' || args.shape === 'heading' ? args.width : null,
      // `fill` preenche a caixa que o container estabelece; aqui quem
      // estabelece é a proporção de mídia, senão o bloco nasce com altura zero
      // e o Playground mostra um esqueleto invisível.
      classe: args.shape === 'fill' ? 'nds-docs-skeleton-media' : '',
    },
    template: `
      <div role="status" [attr.aria-busy]="loading" aria-label="Carregando conteúdo">
        <div ndsSkeleton [attr.data-shape]="shape" [attr.data-width]="largura" [class]="classe"></div>
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
      const caixa = caixaDesenhada(sk, regiao);
      await expect(caixa.altura).toBeGreaterThan(0);
      if (args.shape === 'text' || args.shape === 'heading') {
        await expect(
          Math.abs(caixa.fracaoDoContainer - FRACAO_DE_LARGURA[args.width]),
        ).toBeLessThan(0.02);
      }
    });
  },
};
