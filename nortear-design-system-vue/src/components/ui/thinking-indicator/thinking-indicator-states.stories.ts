import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect, within } from 'storybook/test';
import { Markdown } from '@/components/ui/markdown';
import { ThinkingIndicator } from './index';
import {
  answerText,
  generatingLabel,
  questionText,
  useIndicatorLabels,
} from './thinking-indicator.fixtures';
import {
  indicatorArrivedSource,
  indicatorWaitingSource,
} from './thinking-indicator.source';

// ─── Meta ─────────────────────────────────────────────────────────────────────
//
// O estado desta peça é o do LUGAR que ela ocupa, e não o dela: ou a resposta
// não chegou e o indicador está ali, ou ela chegou e ele saiu. Não há terceiro
// — e é justamente por não haver que sumir precisa ser regra escrita.
//
// O movimento reduzido está na tabela de estados e não vira story: a suíte não
// emula a preferência, e uma story que dependesse dela fotografaria o mesmo
// desenho de sempre, prometendo uma verificação que não acontece.

const meta: Meta = {
  title: 'Primitives/Conversational/ThinkingIndicator/States',
  tags: ['conversational'],
  parameters: {
    layout: 'padded',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: indicatorWaitingSource },
      description: {
        component:
          'O lugar da resposta antes e depois de ela chegar — e o indicador existe só na primeira metade.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

/**
 * A pergunta feita, e embaixo dela o lugar do que vem a seguir.
 *
 * A pergunta entra por Markdown, e não por marcação escrita à mão: o que se
 * demonstra aqui é ONDE o indicador mora, e o lugar só existe se houver uma
 * conversa acima dele.
 */
const answerPlace = (tail: string) => ({
  components: { Markdown, ThinkingIndicator },
  setup() {
    return {
      labels: useIndicatorLabels(),
      question: questionText(),
      answer: answerText(),
    };
  },
  template: `<div class="nds-stack nds-max-w-lg" data-spacing="md">
    <Markdown :content="question" />
    ${tail}
  </div>`,
});

export const Waiting: Story = {
  parameters: {
    covers: ['functional.item5', 'visual.item2'],
  },
  render: () => answerPlace('<ThinkingIndicator :label="labels.generating" />'),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const indicator = canvasElement.querySelector<HTMLElement>(
      '[data-slot="thinking-indicator"]',
    )!;

    await step('O indicador é o ÚLTIMO da conversa', async () => {
      // Ele ocupa o lugar do que ainda não veio. Acima dele, o que já foi dito;
      // abaixo, nada — porque não há nada.
      const place = indicator.parentElement!;
      await expect(place.lastElementChild).toBe(indicator);
      await expect(place.querySelector('[data-slot="markdown"]')).not.toBeNull();
    });

    await step('E enquanto se espera ele é a região de estado da tela', async () => {
      await expect(canvas.getByRole('status')).toBe(indicator);
      await expect(indicator).toHaveTextContent(generatingLabel());
    });
  },
};

export const Arrived: Story = {
  parameters: {
    covers: ['accessibility.item1', 'visual.item3'],
    docs: { source: { transform: indicatorArrivedSource } },
  },
  render: () => answerPlace('<Markdown :content="answer" />'),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Chegou o texto, e o indicador não está mais no documento', async () => {
      // Indicador que fica é indicador que mente, e quem ouve não tem como
      // saber que ele parou de valer.
      await expect(
        canvasElement.querySelector('[data-slot="thinking-indicator"]'),
      ).toBeNull();
      await expect(canvas.queryByRole('status')).toBeNull();
    });

    await step('O lugar passou a ser da resposta', async () => {
      const blocks = canvasElement.querySelectorAll('[data-slot="markdown"]');
      // O trecho sai do próprio exemplo compartilhado: escrito à mão aqui, ele
      // envelheceria sozinho no dia em que a conversa de exemplo mudasse.
      await expect(blocks).toHaveLength(2);
      await expect(blocks[1]).toHaveTextContent(answerText().slice(0, 24));
    });
  },
};
