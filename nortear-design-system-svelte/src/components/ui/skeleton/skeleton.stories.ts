import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { expect } from 'storybook/test';
import SkeletonStory from './SkeletonStory.svelte';
import SkeletonDocs from '@/components/docs/SkeletonDocs.svelte';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import { FRACAO_DE_LARGURA, caixaDesenhada } from '@shared/testing/skeleton-probe';

// O docgen está desligado neste stack: `argTypes` é a única fonte da aba API
// Reference, e sem `docs.source.transform` o snippet sai como `<wrapper …/>`.
type PlaygroundArgs = {
  shape: 'text' | 'heading' | 'avatar' | 'fill';
  width: 'full' | '3-4' | '2-3' | '1-2' | '1-3';
  loading: boolean;
};

function playgroundSource(_gerado: string, ctx: { args?: Partial<PlaygroundArgs> }): string {
  const { shape = 'text', width = '3-4' } = ctx.args ?? {};
  const largura = shape === 'text' || shape === 'heading' ? ` data-width="${width}"` : '';
  return `<div role="status" aria-busy={isLoading} aria-label="Carregando conteúdo">
  <Skeleton data-shape="${shape}"${largura} />
</div>`;
}

const meta: Meta<PlaygroundArgs> = {
  title: 'UI/Skeleton',
  component: SkeletonStory,
  tags: ['autodocs', 'feedback'],
  parameters: {
    layout: 'padded',
    docs: {
      page: withAutoDocsTab(SkeletonDocs),
      source: { transform: playgroundSource },
    },
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
