import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect } from 'storybook/test';
import { NdsSeparator, type SeparatorEmphasis, type SeparatorOrientation } from './separator';
import { NdsSeparatorDocs } from '@/components/docs/SeparatorDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

// ─── Meta ─────────────────────────────────────────────────────────────────────

type SeparatorArgs = {
  orientation: SeparatorOrientation;
  decorative: boolean;
  emphasis: SeparatorEmphasis;
};

/**
 * O painel Code mostra o `template` da story como está escrito — inclusive o
 * `@if` que alterna exemplos e os bindings ligados aos args
 * (`[orientation]="orientation"`). Isso é o andaime da story, não o que alguém
 * escreve para usar um Separator. O `transform` devolve o uso real, com os
 * valores atuais dos controls resolvidos — mesma decisão do Vanilla, onde um
 * dump de DOM também não era o que o consumidor escreve.
 */
function playgroundSource(_gerado: string, ctx: { args?: Partial<SeparatorArgs> }): string {
  const { orientation = 'horizontal', decorative = true, emphasis = 'default' } = ctx.args ?? {};
  // Só o que difere do default aparece — snippet de documentação não deve
  // ensinar a repetir o valor que já vem por padrão.
  const attrs = [
    `orientation="${orientation}"`,
    decorative ? '' : '[decorative]="false"',
    emphasis === 'strong' ? 'emphasis="strong"' : '',
  ].filter(Boolean).join(' ');

  return `import { NdsSeparator } from '@/components/ui/separator';

@Component({
  imports: [NdsSeparator],
  template: \`
    <p>Seção superior</p>
    <div ndsSeparator ${attrs}></div>
    <p>Seção inferior</p>
  \`,
})
export class Exemplo {}`;
}

const meta: Meta<SeparatorArgs> = {
  title: 'UI/Separator',
  tags: ['autodocs', 'layout'],
  decorators: [moduleMetadata({ imports: [NdsSeparator] })],
  parameters: {
    layout: 'padded',
    docs: { page: withAutoDocsTab(NdsSeparatorDocs), source: { transform: playgroundSource } },
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
    props: { ...args, isHorizontal: args.orientation === 'horizontal' },
    template: `
      @if (isHorizontal) {
        <div class="nds-stack nds-w-cap-md" data-spacing="md">
          <p class="nds-text-body">Seção superior</p>
          <div ndsSeparator [orientation]="orientation" [decorative]="decorative" [emphasis]="emphasis"></div>
          <p class="nds-text-body">Seção inferior</p>
        </div>
      } @else {
        <div class="nds-cluster nds-docs-demo-row nds-w-cap-md" data-spacing="md">
          <span class="nds-text-body">Item A</span>
          <div ndsSeparator [orientation]="orientation" [decorative]="decorative" [emphasis]="emphasis"></div>
          <span class="nds-text-body nds-text-muted-foreground">Item B</span>
        </div>
      }
    `,
  }),
  play: async ({ canvasElement, step, args }) => {
    const separador = canvasElement.querySelector<HTMLElement>('.nds-separator');

    await step('A linha existe e reflete a orientação escolhida', async () => {
      await expect(separador).toBeInTheDocument();
      // Prova que o input `orientation` chegou ao componente: sem AOT o binding
      // cai em silêncio no default e este atributo não acompanharia o control.
      await expect(separador).toHaveAttribute('data-orientation', args.orientation);
    });

    await step('Espessura de 1px no eixo da orientação', async () => {
      // Medida computada, não nome de classe: é a espessura que a pessoa vê, e
      // é o que uma troca de folha quebraria sem mudar atributo nenhum.
      const caixa = separador!.getBoundingClientRect();
      await expect(Math.min(caixa.width, caixa.height)).toBeCloseTo(1, 1);
      await expect(Math.max(caixa.width, caixa.height)).toBeGreaterThan(8);
    });

    await step('Semântica conforme o modo escolhido', async () => {
      if (args.decorative) {
        await expect(separador).toHaveAttribute('role', 'none');
        await expect(separador).toHaveAttribute('aria-hidden', 'true');
        // O atributo não é permitido em role="none" e nada informaria fora da
        // árvore de acessibilidade.
        await expect(separador).not.toHaveAttribute('aria-orientation');
      } else {
        await expect(separador).toHaveAttribute('role', 'separator');
        await expect(separador).toHaveAttribute('aria-orientation', args.orientation);
        await expect(separador).not.toHaveAttribute('aria-hidden');
      }
    });

    await step('Fora da ordem de tabulação e sem aceitar foco', async () => {
      await expect(separador).not.toHaveAttribute('tabindex');
      // `focus()` num elemento não focável não muda o `activeElement` — a
      // asserção é idempotente e sobrevive ao replay do painel Interactions.
      separador!.focus?.();
      await expect(canvasElement.ownerDocument.activeElement).not.toBe(separador);
    });
  },
};
