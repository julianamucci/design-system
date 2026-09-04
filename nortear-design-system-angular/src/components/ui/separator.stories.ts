import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect } from 'storybook/test';
import { NdsSeparator } from './separator';
import { NdsSeparatorDocs } from '@/components/docs/SeparatorDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import { separatorPlaygroundSource, type SeparatorArgs } from './separator.source';

// ─── Meta ─────────────────────────────────────────────────────────────────────

// A nota sobre POR QUE o painel Code precisa de `transform` — o renderer
// imprime o andaime da story, não o uso real — mora agora em
// `separator.source.ts`, junto do construtor que ela explica. Vários
// construtores desta stack a citam pelo nome DESTE arquivo; o ponteiro fica
// para quem chegar por ali.

const meta: Meta<SeparatorArgs> = {
  title: 'Components/Layout/Separator',
  tags: ['autodocs', 'layout'],
  decorators: [moduleMetadata({ imports: [NdsSeparator] })],
  parameters: {
    layout: 'padded',
    docs: { page: withAutoDocsTab(NdsSeparatorDocs), source: { transform: separatorPlaygroundSource } },
  },
  argTypes: {
    orientation: {
      control: { type: 'inline-radio' },
      options: ['horizontal', 'vertical'],
      description: 'Direção do divisor.',
      table: { type: { summary: "'horizontal' | 'vertical'" }, defaultValue: { summary: "'horizontal'" } },
    },
    decorative: {
      control: 'boolean',
      description:
        'Quando true (padrão), aplica role=none e aria-hidden, sem anunciar orientação. Quando false, expõe role=separator + aria-orientation.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    emphasis: {
      control: { type: 'inline-radio' },
      options: ['default', 'strong'],
      description: 'Peso da linha. O valor forte dobra a espessura e troca o token de cor.',
      table: { type: { summary: "'default' | 'strong'" }, defaultValue: { summary: "'default'" } },
    },
  },
  args: {
    orientation: 'horizontal',
    decorative: true,
    emphasis: 'default',
  },
};

export default meta;
type Story = StoryObj<SeparatorArgs>;

// ─── Playground ───────────────────────────────────────────────────────────────

export const Playground: Story = {
  parameters: {
    covers: ['functional.item1', 'functional.item3', 'accessibility.item1', 'accessibility.item5'],
  },
  render: (args) => ({
    props: { ...args, horizontalIs: args.orientation === 'horizontal' },
    template: `
      @if (horizontalIs) {
        <div class="nds-stack nds-w-md" data-spacing="md">
          <p class="nds-text-body">Seção superior</p>
          <div ndsSeparator [orientation]="orientation" [decorative]="decorative" [emphasis]="emphasis"></div>
          <p class="nds-text-body">Seção inferior</p>
        </div>
      } @else {
        <div class="nds-cluster nds-docs-demo-row nds-w-md" data-spacing="md">
          <span class="nds-text-body">Item A</span>
          <div ndsSeparator [orientation]="orientation" [decorative]="decorative" [emphasis]="emphasis"></div>
          <span class="nds-text-body nds-text-muted-foreground">Item B</span>
        </div>
      }
    `,
  }),
  play: async ({ canvasElement, step, args }) => {
    const separator = canvasElement.querySelector<HTMLElement>('.nds-separator');

    await step('A linha existe e reflete a orientação escolhida', async () => {
      await expect(separator).toBeInTheDocument();
      // Prova que o input `orientation` chegou ao componente: sem AOT o binding
      // cai em silêncio no default e este atributo não acompanharia o control.
      await expect(separator).toHaveAttribute('data-orientation', args.orientation);
    });

    await step('Espessura de 1px no eixo da orientação', async () => {
      // Medida computada, não nome de classe: é a espessura que a pessoa vê, e
      // é o que uma troca de folha quebraria sem mudar atributo nenhum.
      const box = separator!.getBoundingClientRect();
      await expect(Math.min(box.width, box.height)).toBeCloseTo(1, 1);
      await expect(Math.max(box.width, box.height)).toBeGreaterThan(8);
    });

    await step('Semântica conforme o modo escolhido', async () => {
      if (args.decorative) {
        await expect(separator).toHaveAttribute('role', 'none');
        await expect(separator).toHaveAttribute('aria-hidden', 'true');
        // O atributo não é permitido em role="none" e nada informaria fora da
        // árvore de acessibilidade.
        await expect(separator).not.toHaveAttribute('aria-orientation');
      } else {
        await expect(separator).toHaveAttribute('role', 'separator');
        await expect(separator).toHaveAttribute('aria-orientation', args.orientation);
        await expect(separator).not.toHaveAttribute('aria-hidden');
      }
    });

    await step('Fora da ordem de tabulação e sem aceitar foco', async () => {
      await expect(separator).not.toHaveAttribute('tabindex');
      // `focus()` num elemento não focável não muda o `activeElement` — a
      // asserção é idempotente e sobrevive ao replay do painel Interactions.
      separator!.focus?.();
      await expect(canvasElement.ownerDocument.activeElement).not.toBe(separator);
    });
  },
};
