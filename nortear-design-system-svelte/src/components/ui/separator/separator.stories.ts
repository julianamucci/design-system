import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { expect } from 'storybook/test';
import SeparatorStory from './SeparatorStory.svelte';
import SeparatorDocs from '@/components/docs/SeparatorDocs.svelte';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import { separatorSource } from './separator.source';

const meta: Meta = {
  title: 'UI/Separator',
  component: SeparatorStory,
  tags: ['autodocs', 'layout'],
  parameters: {
    layout: 'padded',
    docs: {
      page: withAutoDocsTab(SeparatorDocs),
      source: { transform: separatorSource },
      description: {
        component:
          'Divisor de 1px que separa grupos de conteúdo em layouts horizontais ou verticais. Decorativo por padrão e semântico sob pedido.',
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
type Story = StoryObj;

export const Playground: Story = {
  parameters: {
    covers: ['functional.item1', 'functional.item3', 'accessibility.item1', 'accessibility.item5'],
  },
  play: async ({ canvasElement, step, args }) => {
    const separador = canvasElement.querySelector<HTMLElement>('.nds-separator');
    const orientation = (args.orientation as string) ?? 'horizontal';

    await step('A linha existe e reflete a orientação escolhida', async () => {
      await expect(separador).toBeInTheDocument();
      await expect(separador).toHaveAttribute('data-orientation', orientation);
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
        await expect(separador).toHaveAttribute('aria-orientation', orientation);
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
