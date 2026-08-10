import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect } from 'storybook/test';
import { NdsSkeleton } from './skeleton';
import { NdsSkeletonDocs } from '@/components/docs/SkeletonDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

// O CSS do .nds-skeleton não traz forma nem dimensão de propósito — quem usa
// define a caixa que o conteúdo real vai ocupar.
const FORMAS: Record<'line' | 'circle' | 'rectangle', string> = {
  line:      'height: 1rem; width: 15rem',
  circle:    'height: 3rem; width: 3rem; border-radius: 9999px',
  rectangle: 'height: 8rem; width: 100%',
};

type SkeletonArgs = {
  shape: 'line' | 'circle' | 'rectangle';
  loading: boolean;
};

/** Ver a nota em separator.stories.ts. */
function playgroundSource(_gerado: string, ctx: { args?: Partial<SkeletonArgs> }): string {
  const { shape = 'line' } = ctx.args ?? {};
  // Dimensão vai em style, não em classe: o esqueleto imita a caixa do
  // conteúdo que vai substituir, e classe fixa daria sempre o retângulo errado.
  // É o que o comentário do skeleton.css documenta.
  const estilo = FORMAS[shape];
  return `import { NdsSkeleton } from '@/components/ui/skeleton';

@Component({
  imports: [NdsSkeleton],
  template: \`
    <!-- aria-busy no CONTAINER: o esqueleto é aria-hidden e quem anuncia
         o carregamento é a região que vai receber o conteúdo. -->
    <div role="status" [attr.aria-busy]="carregando()" aria-label="Carregando conteúdo">
      <div ndsSkeleton style="${estilo}"></div>
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
      options: ['line', 'circle', 'rectangle'],
      description: 'Forma do esqueleto. Vem da classe utilitária, não de input.',
    },
    loading: { control: 'boolean', description: 'Estado de carregamento do container.' },
  },
  args: { shape: 'line', loading: true },
};

export default meta;
type Story = StoryObj<SkeletonArgs>;

export const Playground: Story = {
  parameters: {
    docs: { source: { transform: playgroundSource } },
    covers: ['functional.item1', 'accessibility.item1', 'accessibility.item2'],
  },
  render: (args) => ({
    props: {
      ...args,
      estilo: FORMAS[args.shape],
    },
    template: `
      <div role="status" [attr.aria-busy]="loading" aria-label="Carregando conteúdo">
        <div ndsSkeleton [style]="estilo"></div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step, args }) => {
    await step('O esqueleto sai da árvore de acessibilidade', async () => {
      // É ruído para leitor de tela: não tem conteúdo, só ocupa o espaço.
      const sk = canvasElement.querySelector<HTMLElement>('[data-slot="skeleton"]')!;
      await expect(sk).toHaveAttribute('aria-hidden', 'true');
    });

    await step('Quem anuncia o carregamento é o container', async () => {
      // O par é sempre este: esqueleto aria-hidden dentro de região aria-busy.
      // Sem o container, o leitor não sabe que algo está sendo carregado.
      const container = canvasElement.querySelector<HTMLElement>('[aria-busy]')!;
      await expect(container.getAttribute('aria-busy')).toBe(String(args.loading));
      await expect(container.querySelector('[data-slot="skeleton"]')).toBeTruthy();
    });

    await step('A classe base existe e a caixa vem do style', async () => {
      const sk = canvasElement.querySelector<HTMLElement>('[data-slot="skeleton"]')!;
      await expect(sk).toHaveClass(/nds-skeleton/);
      // A dimensão vem do style de quem usa, não do componente.
      await expect(sk.getBoundingClientRect().height).toBeGreaterThan(0);
    });
  },
};
