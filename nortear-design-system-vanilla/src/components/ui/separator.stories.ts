import type { Meta, StoryObj } from '@storybook/html-vite';
import { expect } from 'storybook/test';
import { createSeparator } from './separator';
import { createSeparatorDocs } from '@/components/docs/SeparatorDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

// ─── Meta ─────────────────────────────────────────────────────────────────────

type SeparatorArgs = {
  orientation: 'horizontal' | 'vertical';
  decorative: boolean;
  emphasis: 'default' | 'strong';
};

/**
 * O painel Code do renderer HTML imprime o `outerHTML` do que a story montou —
 * um `<div class="nds-stack">` inteiro com os dois parágrafos de exemplo. É o
 * andaime, não o uso. O `transform` devolve a chamada real da factory com os
 * valores atuais dos controls resolvidos.
 */
function playgroundSource(_gerado: string, ctx: { args?: Partial<SeparatorArgs> }): string {
  const { orientation = 'horizontal', decorative = true, emphasis = 'default' } = ctx.args ?? {};
  // Só o que difere do padrão entra no snippet: documentação não deve ensinar a
  // repetir o valor que já vem por default.
  const opcoes = [
    `orientation: '${orientation}'`,
    decorative ? '' : 'decorative: false',
    emphasis === 'strong' ? "emphasis: 'strong'" : '',
  ].filter(Boolean).join(', ');

  return `import { createSeparator } from '@/components/ui/separator';

container.append(
  topo,
  createSeparator({ ${opcoes} }),
  base,
);`;
}

const meta: Meta<SeparatorArgs> = {
  title: 'UI/Separator',
  tags: ['autodocs', 'layout'],
  parameters: {
    layout: 'padded',
    docs: { page: withAutoDocsTab(createSeparatorDocs), source: { transform: playgroundSource } },
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
  render: (args) => {
    const wrapper = document.createElement('div');
    const opcoes = {
      orientation: args.orientation,
      decorative: args.decorative,
      emphasis: args.emphasis,
    };

    if (args.orientation === 'horizontal') {
      wrapper.className = 'nds-stack nds-w-full nds-max-w-md';
      wrapper.dataset.spacing = 'md';

      const top = document.createElement('p');
      top.className = 'nds-text-body';
      top.textContent = 'Seção superior';

      const bottom = document.createElement('p');
      bottom.className = 'nds-text-body';
      bottom.textContent = 'Seção inferior';

      wrapper.append(top, createSeparator(opcoes), bottom);
    } else {
      // Sem altura cravada: o `align-self: stretch` da folha faz a linha
      // acompanhar a linha do flex. Cravar altura aqui esconderia o contrato.
      wrapper.className = 'nds-cluster nds-docs-demo-row nds-w-full nds-max-w-md';
      wrapper.dataset.spacing = 'md';

      const left = document.createElement('span');
      left.className = 'nds-text-body';
      left.textContent = 'Item A';

      const right = document.createElement('span');
      right.className = 'nds-text-body nds-text-muted-foreground';
      right.textContent = 'Item B';

      wrapper.append(left, createSeparator(opcoes), right);
    }

    return wrapper;
  },
  play: async ({ canvasElement, step, args }) => {
    const separador = canvasElement.querySelector<HTMLElement>('.nds-separator');

    await step('A linha existe e reflete a orientação escolhida', async () => {
      await expect(separador).toBeInTheDocument();
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
