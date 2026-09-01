import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect, waitFor, within } from 'storybook/test';
import { MessageTiming } from './index';
import {
  statsOf,
  useMessageTimingLabels,
  useMessageTimingStats,
  useMessageTimingTriggerLabel,
  messageTimingLabels,
  messageTimingTriggerLabel,
} from './message-timing.fixtures';
import {
  messageTimingInsideTooltipSource,
  messageTimingInTightSpaceSource,
} from './message-timing.source';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { balaoDe } from '@/components/ui/tooltip/tooltip.fixtures';

// ─── Meta ─────────────────────────────────────────────────────────────────────
//
// As duas perguntas de espaço que esta peça responde SEM ganhar argumento
// nenhum: o que ela faz quando a largura acaba, e o que se monta quando o
// espaço disponível é de uma linha só.
//
// A segunda é a forma compacta da fonte, e aqui ela é COMPOSIÇÃO: um controle
// de verdade com uma dica de ferramenta. A peça não abre camada flutuante nem
// herda a política de foco que vem com ela.

const meta: Meta = {
  title: 'Primitives/Conversational/MessageTiming/Compositions',
  tags: ['conversational'],
  parameters: {
    layout: 'padded',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: messageTimingInTightSpaceSource },
      description: {
        component:
          'A linha quebra sozinha quando a largura acaba, e não há argumento de forma para isso. Quando o espaço é de uma linha só, o que se monta é um controle com uma dica de ferramenta guardando a linha inteira.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

const rootOf = (canvasElement: HTMLElement) =>
  canvasElement.querySelector<HTMLElement>('[data-slot="message-timing"]')!;

/**
 * A linha num espaço estreito.
 *
 * O assunto é a AUSÊNCIA de argumento: a peça ocupa a largura que tem e quebra
 * sozinha, um par por linha, porque o par é a unidade que quebra. Quem
 * procurasse uma prop de layout não a encontraria, e é isso que esta story
 * responde.
 */
export const InTightSpace: Story = {
  parameters: {
    covers: ['functional.item7', 'visual.item6'],
  },
  render: () => ({
    components: { MessageTiming },
    setup() {
      return { stats: useMessageTimingStats(), labels: useMessageTimingLabels() };
    },
    // A largura vem de uma classe do design system, e não de um `style`: é o
    // container que responde pela forma, e a peça não sabe onde está.
    template: `<div class="nds-max-w-3xs">
      <MessageTiming
        :stats="stats.settled"
        :labels="labels"
      />
    </div>`,
  }),
  play: async ({ canvasElement, step }) => {
    const root = rootOf(canvasElement);
    const pairs = [...root.querySelectorAll<HTMLElement>('[data-slot="message-timing-stat"]')];

    await step('A linha desenha as mesmas medidas, sem argumento de forma', async () => {
      // Nenhum atributo de forma na raiz: a única resposta é a do container
      // (o bloco "A FORMA É DO CONTAINER" da folha).
      await expect(pairs.length).toBe(statsOf('settled').length);
      await expect(root.dataset.form).toBeUndefined();
    });

    await step('E o termo nunca se separa do seu valor ao quebrar', async () => {
      // O `<div>` de cada par é o que faz o PAR quebrar inteiro. Sem ele, o
      // termo terminaria uma linha e o valor abriria a seguinte.
      for (const pair of pairs) {
        const term = pair.querySelector<HTMLElement>('dt')!;
        const value = pair.querySelector<HTMLElement>('dd')!;
        await expect(term.parentElement).toBe(pair);
        await expect(value.parentElement).toBe(pair);
      }
    });
  },
};

/**
 * A forma compacta: um controle guarda a linha inteira.
 *
 * É como a fonte resolve o espaço de uma linha, e aqui ela é composição em vez
 * de variante — o gatilho é um controle de verdade, com nome próprio, e a peça
 * continua sendo a mesma linha por dentro (decisão 8 da folha).
 */
export const InsideTooltip: Story = {
  parameters: {
    covers: ['functional.item8', 'accessibility.item7', 'visual.item7'],
    docs: { source: { transform: messageTimingInsideTooltipSource } },
  },
  render: () => ({
    components: { MessageTiming, Button, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger },
    setup() {
      return {
        stats: useMessageTimingStats(),
        labels: useMessageTimingLabels(),
        triggerLabel: useMessageTimingTriggerLabel(),
      };
    },
    // O gatilho tem NOME PRÓPRIO: em toque não há ponteiro, e o controle
    // precisa dizer o que mostra mesmo com a dica fechada.
    template: `<div
      class="nds-cluster nds-min-h-40"
      data-align="center"
      data-justify="center"
    >
      <TooltipProvider :delay-duration="0">
        <Tooltip :default-open="true">
          <TooltipTrigger as-child>
            <Button
              variant="ghost"
              size="sm"
              :aria-label="labels.title"
            >{{ triggerLabel }}</Button>
          </TooltipTrigger>
          <TooltipContent side="top">
            <MessageTiming
              :stats="stats.settled"
              :labels="labels"
            />
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>`,
  }),
  play: async ({ canvasElement, step }) => {
    const labels = messageTimingLabels();
    const expected = statsOf('settled');
    const trigger = within(canvasElement).getByRole('button', { name: labels.title });

    await step('O gatilho tem nome PRÓPRIO, e não depende da dica', async () => {
      // Em toque não há ponteiro: o controle precisa dizer o que mostra mesmo
      // com a dica fechada.
      await expect(trigger).toHaveAttribute('aria-label', labels.title);
      await expect(trigger.textContent).toBe(messageTimingTriggerLabel());
    });

    await step('A linha inteira mora dentro da dica', async () => {
      // Leitura PURA dentro do `waitFor`: nada aqui toca o DOM, e por isso a
      // condição não provoca a própria reagendagem.
      await waitFor(async () => {
        await expect(balaoDe(trigger)).not.toBeNull();
      });
      const timing = balaoDe(trigger)!.querySelector<HTMLElement>('[data-slot="message-timing"]')!;
      const values = [...timing.querySelectorAll<HTMLElement>('[data-slot="message-timing-value"]')];
      await expect(values.map((el) => el.textContent)).toEqual(expected.map((stat) => stat.value));
    });

    await step('E a peça não abriu camada nenhuma: quem a abriu foi a composição', async () => {
      const timing = balaoDe(trigger)!.querySelector<HTMLElement>('[data-slot="message-timing"]')!;
      await expect(timing.closest('[data-slot="tooltip-content"]')).not.toBeNull();
      await expect(timing.querySelector('[data-slot="tooltip-content"]')).toBeNull();
    });
  },
};
