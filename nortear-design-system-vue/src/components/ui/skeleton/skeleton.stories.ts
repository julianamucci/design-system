import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect } from 'storybook/test';
import { Skeleton } from './index';
import SkeletonDocs from '@/components/docs/SkeletonDocs.vue';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import { FRACAO_DE_LARGURA, caixaDesenhada } from '@shared/testing/skeleton-probe';

// A caixa do esqueleto vem de atributo, não de classe de dimensão nem de altura
// cravada: `data-shape` escolhe a forma e `data-width` a fração da largura do
// container (docs/shared/styles/nds/skeleton.css). Altura é resultado de padding
// + tipografia — guideline 12, WCAG 1.4.4.
type PlaygroundArgs = {
  shape: 'text' | 'heading' | 'avatar' | 'fill';
  width: 'full' | '3-4' | '2-3' | '1-2' | '1-3';
  loading: boolean;
};

const meta: Meta<PlaygroundArgs> = {
  title: 'UI/Skeleton',
  component: Skeleton,
  tags: ['autodocs', 'feedback'],
  parameters: {
    layout: 'padded',
    docs: { page: withAutoDocsTab(SkeletonDocs) },
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
type Story = StoryObj<PlaygroundArgs>;

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
  render: (args) => ({
    components: { Skeleton },
    setup() {
      const larguraAplicada = () =>
        args.shape === 'text' || args.shape === 'heading' ? args.width : null;
      return { args, larguraAplicada };
    },
    // Dois ramos em vez de uma classe ligada: `fill` preenche a caixa que o
    // container estabelece, e aqui quem estabelece é a proporção de mídia —
    // senão o bloco nasce com altura zero e o Playground mostra um esqueleto
    // invisível. A classe entra literal para não virar expressão no atributo.
    template: `
      <div role="status" :aria-busy="String(args.loading)" aria-label="Carregando conteúdo">
        <Skeleton v-if="args.shape === 'fill'" data-shape="fill" class="nds-docs-skeleton-media" />
        <Skeleton v-else :data-shape="args.shape" :data-width="larguraAplicada()" />
      </div>
    `,
  }),
  play: async ({ canvasElement, step, args }) => {
    const sk = canvasElement.querySelector('[data-slot="skeleton"]') as HTMLElement;
    const regiao = canvasElement.querySelector('[role="status"]') as HTMLElement;

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
      // `h-4 w-[250px]` sobreviveu como texto inerte, com o esqueleto do
      // Playground renderizando altura zero.
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
