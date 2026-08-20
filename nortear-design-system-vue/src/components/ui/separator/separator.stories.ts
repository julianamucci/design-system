import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect } from 'storybook/test';
import { Separator } from './index';
import SeparatorDocs from '@/components/docs/SeparatorDocs.vue';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import { separatorSource } from './separator.source';

/**
 * Os três controls, com valor sempre presente — o `meta` os declara em `args`.
 * A transform do painel Code recebe os mesmos campos como opcionais, porque uma
 * story sem `args` cai nos padrões do componente.
 */
type SeparatorArgs = {
  orientation: 'horizontal' | 'vertical';
  decorative: boolean;
  emphasis: 'default' | 'strong';
};

const meta: Meta<any> = {
  title: 'UI/Separator',
  component: Separator,
  tags: ['autodocs', 'layout'],
  parameters: {
    layout: 'padded',
    docs: {
      page: withAutoDocsTab(SeparatorDocs),
      source: { transform: separatorSource },
      description: {
        component:
          'Separator é um divisor de 1px que separa grupos de conteúdo em layouts horizontais ou verticais. Componente passivo, decorativo por padrão e semântico sob pedido.',
      },
    },
  },
  argTypes: {
    orientation: {
      control: { type: 'inline-radio' },
      options: ['horizontal', 'vertical'],
      description: 'Direção do divisor.',
      table: { type: { summary: "'horizontal' | 'vertical'" }, defaultValue: { summary: "'horizontal'" } },
    },
    decorative: {
      control: { type: 'boolean' },
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
// `StoryObj<SeparatorArgs>` e não `StoryObj<typeof meta>`: o meta é
// `Meta<any>` (o componente é um wrapper do reka-ui), e daí o `args` da play
// chega como `{}` — o `vue-tsc` reprova cada leitura de `args.orientation`.
type Story = StoryObj<SeparatorArgs>;

export const Playground: Story = {
  parameters: {
    covers: ['functional.item1', 'functional.item3', 'accessibility.item1', 'accessibility.item5'],
  },
  render: (args) => ({
    components: { Separator },
    setup() {
      return { args };
    },
    // Sem altura cravada no ramo vertical: o `align-self: stretch` da folha faz
    // a linha acompanhar a linha do flex. Cravar altura esconderia o contrato.
    template: `
      <div
        :class="args.orientation === 'vertical'
          ? 'nds-cluster nds-docs-demo-row nds-w-cap-md'
          : 'nds-stack nds-w-cap-md'"
        data-spacing="md"
      >
        <p class="nds-text-body">{{ args.orientation === 'vertical' ? 'Item A' : 'Seção superior' }}</p>
        <Separator :orientation="args.orientation" :decorative="args.decorative" :emphasis="args.emphasis" />
        <p class="nds-text-body">{{ args.orientation === 'vertical' ? 'Item B' : 'Seção inferior' }}</p>
      </div>
    `,
  }),
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
