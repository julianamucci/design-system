import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect } from 'storybook/test';
import { createApp } from 'vue';
import { Skeleton, SkeletonRegion } from './index';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import SkeletonDocs from '@/components/docs/SkeletonDocs.vue';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import { WIDTH_FRACTION, boxDesenhada } from '@shared/testing/skeleton-probe';
import { skeletonPlaygroundSource } from './skeleton.source';

// A caixa do esqueleto vem de atributo, não de classe de dimensão nem de altura
// cravada: `data-shape` escolhe a forma e `data-width` a fração da largura do
// container (docs/shared/styles/nds/skeleton.css). Altura é resultado de padding
// + tipografia — guideline 12, WCAG 1.4.4.
//
// Sem control de "carregando": a região não alterna `aria-busy` — ela SAI
// quando o conteúdo chega (decisão da dona, 2026-09-14). Um control que virasse
// o estado para `false` ensinaria exatamente a alternância que a peça recusa.
type PlaygroundArgs = {
  shape: 'text' | 'heading' | 'avatar' | 'fill';
  width: 'full' | '3-4' | '2-3' | '1-2' | '1-3';
};

const meta: Meta<PlaygroundArgs> = {
  title: 'Components/Feedback/Skeleton',
  component: Skeleton,
  tags: ['autodocs', 'feedback'],
  parameters: {
    layout: 'padded',
    docs: { page: withAutoDocsTab(SkeletonDocs), source: { transform: skeletonPlaygroundSource } },
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
type Story = StoryObj<PlaygroundArgs>;

export const Playground: Story = {
  parameters: {
    docs: {
      // Declarada na story, e não só herdada do meta: o painel desta story tem
      // de publicar o que ela monta, mesmo se o meta mudar de forma.
      source: { transform: skeletonPlaygroundSource },
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
    components: { Skeleton, SkeletonRegion, AspectRatio },
    setup() {
      const widthAplicada = () =>
        args.shape === 'text' || args.shape === 'heading' ? args.width : null;
      return { args, widthAplicada };
    },
    // Dois ramos com classe literal em cada um, em vez de classe ligada: `fill`
    // não tem medida própria e preenche a caixa que o container estabelece —
    // aqui o `AspectRatio`, que é o mesmo que o painel Code ensina. A classe de
    // proporção da docs page daria a caixa sem ser API do design system.
    template: `
      <SkeletonRegion v-if="args.shape === 'fill'" label="Carregando conteúdo" class="nds-w-sm">
        <AspectRatio :ratio="16 / 9">
          <Skeleton data-shape="fill" />
        </AspectRatio>
      </SkeletonRegion>
      <SkeletonRegion v-else label="Carregando conteúdo">
        <Skeleton :data-shape="args.shape" :data-width="widthAplicada()" />
      </SkeletonRegion>
    `,
  }),
  play: async ({ canvasElement, step, args }) => {
    const sk = canvasElement.querySelector('[data-slot="skeleton"]') as HTMLElement;
    const regiao = canvasElement.querySelector('[data-slot="skeleton-region"]') as HTMLElement;

    await step('O placeholder fica fora da árvore de acessibilidade', async () => {
      // Anunciar cada barrinha é ruído: o esqueleto não tem conteúdo.
      await expect(sk).toHaveAttribute('aria-hidden', 'true');
    });

    await step('Quem anuncia o carregamento é a peça de região', async () => {
      // `aria-busy` sozinho num div sem role não é anunciado, e aria-label em
      // div sem role é violação de ARIA — o trio é o que faz o leitor dizer
      // "carregando conteúdo".
      await expect(regiao).toHaveAttribute('role', 'status');
      await expect(regiao).toHaveAttribute('aria-busy', 'true');
      await expect(regiao).toHaveAccessibleName('Carregando conteúdo');
      await expect(regiao.contains(sk)).toBe(true);
    });

    await step('Papel e estado não são sobrescrevíveis por atributo de passagem', async () => {
      // Montagem à parte, fora do template da story: o painel Code e a foto
      // não mostram a tentativa. Fora de `waitFor` — mexe no DOM.
      const host = canvasElement.ownerDocument.createElement('div');
      canvasElement.appendChild(host);
      const app = createApp(SkeletonRegion, {
        label: 'Tentativa de sobrescrita',
        role: 'alert',
        'aria-busy': 'false',
      });
      try {
        app.mount(host);
        const attempt = host.querySelector('[data-slot="skeleton-region"]') as HTMLElement;
        await expect(attempt).toHaveAttribute('role', 'status');
        await expect(attempt).toHaveAttribute('aria-busy', 'true');

        const skApp = createApp(Skeleton, { 'aria-hidden': 'false', 'data-shape': 'text' });
        const skHost = canvasElement.ownerDocument.createElement('div');
        attempt.appendChild(skHost);
        skApp.mount(skHost);
        try {
          await expect(skHost.querySelector('[data-slot="skeleton"]')).toHaveAttribute(
            'aria-hidden',
            'true',
          );
        } finally {
          skApp.unmount();
        }
      } finally {
        app.unmount();
        host.remove();
      }
    });

    await step('O atributo desenha a caixa — medida no que foi renderizado', async () => {
      // Mede o que foi DESENHADO, não a classe: foi exatamente assim que
      // `h-4 w-[250px]` sobreviveu como texto inerte, com o esqueleto do
      // Playground renderizando altura zero.
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
