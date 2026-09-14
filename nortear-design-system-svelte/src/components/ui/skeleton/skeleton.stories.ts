import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { mount, unmount } from 'svelte';
import { expect } from 'storybook/test';
import SkeletonStory from './SkeletonStory.svelte';
import SkeletonRegion from './skeleton-region.svelte';
import Skeleton from './skeleton.svelte';
import SkeletonDocs from '@/components/docs/SkeletonDocs.svelte';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import { WIDTH_FRACTION, boxDesenhada } from '@shared/testing/skeleton-probe';
import { skeletonSource, type SkeletonArgs } from './skeleton.source';

// O docgen está desligado neste stack: `argTypes` é a única fonte da aba API
// Reference, e sem `docs.source.transform` o snippet sai com o nome interno da
// função compilada, que ninguém pode importar.
const meta: Meta<SkeletonArgs> = {
  title: 'Components/Feedback/Skeleton',
  component: SkeletonStory,
  tags: ['autodocs', 'feedback'],
  parameters: {
    layout: 'padded',
    docs: {
      page: withAutoDocsTab(SkeletonDocs),
      source: { transform: skeletonSource },
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
  },
  args: {
    shape: 'text',
    width: '3-4',
  },
};

export default meta;
type Story = StoryObj<SkeletonArgs>;

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
    const regiao = canvasElement.querySelector('[data-slot="skeleton-region"]') as HTMLElement;

    await step('O placeholder fica fora da árvore de acessibilidade', async () => {
      // Anunciar cada barrinha é ruído: o esqueleto não tem conteúdo.
      await expect(sk).toHaveAttribute('aria-hidden', 'true');
    });

    await step('Quem anuncia o carregamento é a peça de região', async () => {
      // `aria-busy` sozinho num div sem role não é anunciado, e aria-label em
      // div sem role é violação de ARIA — o trio é o que faz o leitor dizer
      // "carregando conteúdo". O estado é FIXO: a região sai quando o conteúdo
      // chega, em vez de alternar.
      await expect(regiao).not.toBeNull();
      await expect(regiao).toHaveAttribute('role', 'status');
      await expect(regiao).toHaveAttribute('aria-busy', 'true');
      await expect(regiao).toHaveAccessibleName('Carregando conteúdo');
      await expect(regiao.contains(sk)).toBe(true);
    });

    await step('Papel, estado e ocultação não são sobrescrevíveis', async () => {
      // Montagem avulsa, fora da story: o Playground mostra o uso canônico e não
      // pode ensinar a tentativa. Os atributos saem do tipo, por isso o cast —
      // é exatamente o consumidor que força que a peça precisa ignorar.
      const alvo = canvasElement.ownerDocument.createElement('div');
      canvasElement.appendChild(alvo);
      const instancia = mount(SkeletonRegion, {
        target: alvo,
        props: { label: 'Sonda', role: 'presentation', 'aria-busy': 'false' } as never,
      });
      try {
        const sonda = alvo.querySelector('[data-slot="skeleton-region"]') as HTMLElement;
        await expect(sonda).toHaveAttribute('role', 'status');
        await expect(sonda).toHaveAttribute('aria-busy', 'true');

        // O placeholder também não devolve a ocultação: `aria-hidden` forçado
        // pelo consumidor continua `true`.
        const skAlvo = canvasElement.ownerDocument.createElement('div');
        sonda.appendChild(skAlvo);
        const skInstancia = mount(Skeleton, {
          target: skAlvo,
          props: { 'aria-hidden': 'false', 'data-shape': 'text' } as never,
        });
        try {
          await expect(skAlvo.querySelector('[data-slot="skeleton"]')).toHaveAttribute(
            'aria-hidden',
            'true',
          );
        } finally {
          await unmount(skInstancia);
          skAlvo.remove();
        }
      } finally {
        await unmount(instancia);
        alvo.remove();
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
