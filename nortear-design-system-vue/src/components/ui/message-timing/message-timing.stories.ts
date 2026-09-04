import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { computed } from 'vue';
import { expect, within } from 'storybook/test';
import { MessageTiming } from './index';
import {
  messageTimingLabels,
  statsOf,
  useMessageTimingLabels,
  useSettledStatsSlice,
} from './message-timing.fixtures';
import { messageTimingSource } from './message-timing.source';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import MessageTimingDocs from '@/components/docs/MessageTimingDocs.vue';

/**
 * Os dois eixos desta peça: quantas medidas chegaram, e se a medição já acabou.
 *
 * O control das medidas é uma CONTAGEM, e não um campo de texto com os números
 * dentro: o que a story precisa mostrar é que a peça desenha quantas vierem sem
 * reservar espaço para as que faltam, e os números em si já chegam escritos do
 * andaime, no idioma da página.
 *
 * Não há control de forma, e a ausência é o assunto de uma das composições: a
 * linha quebra sozinha conforme o espaço que tem.
 */
type PlaygroundArgs = {
  measures: number;
  streaming: boolean;
};

const meta: Meta<PlaygroundArgs> = {
  title: 'Components/Conversational/MessageTiming',
  tags: ['autodocs', 'conversational'],
  parameters: {
    layout: 'padded',
    actions: { disable: true },
    docs: {
      page: withAutoDocsTab(MessageTimingDocs),
      source: { transform: messageTimingSource },
    },
  },
  argTypes: {
    measures: {
      control: { type: 'number', min: 0, max: 4, step: 1 },
      description:
        'Quantas das medidas do exemplo chegaram. A peça desenha quantas vierem, na ordem em que vierem.',
      table: { type: { summary: 'number' }, defaultValue: { summary: '4' } },
    },
    streaming: {
      control: { type: 'boolean' },
      description:
        'A medição ainda está andando? Enquanto está, a peça avisa que aquilo muda e abre a linha com a palavra do estado.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
  },
  args: {
    measures: 4,
    streaming: false,
  },
};

export default meta;
type Story = StoryObj<PlaygroundArgs>;

export const Playground: Story = {
  parameters: {
    covers: [
      'functional.item1', 'functional.item2',
      'accessibility.item1', 'accessibility.item2',
      'accessibility.item5', 'accessibility.item6',
      'visual.item1',
    ],
  },
  render: (args) => ({
    components: { MessageTiming },
    setup() {
      // As medidas e os rótulos saem de composables, então o render passa por um
      // `setup`. A contagem entra por getter: os controls trocam com a story
      // montada, e um número lido uma vez congelaria a foto.
      return {
        labels: useMessageTimingLabels(),
        stats: useSettledStatsSlice(() => args.measures),
        streaming: computed(() => args.streaming),
      };
    },
    template: `<MessageTiming
      :stats="stats"
      :streaming="streaming"
      :labels="labels"
    />`,
  }),
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="message-timing"]')!;
    const labels = messageTimingLabels();
    const expected = statsOf('settled').slice(0, args.measures);

    await step('A linha NÃO é região viva, e nada nela se reanuncia', async () => {
      // Os números trocam entre uma resposta e a seguinte, e anunciá-los a cada
      // troca corta a leitura da própria resposta (decisão 3 da folha).
      await expect(root.hasAttribute('aria-live')).toBe(false);
      await expect(root.hasAttribute('role')).toBe(false);
      await expect(root.querySelector('[aria-live]')).toBeNull();
      await expect(root.querySelector('[role="status"], [role="alert"], [role="log"]')).toBeNull();
    });

    await step('A medição tem nome, e o nome não aparece na tela', async () => {
      // "1,24 s" ao pé de uma mensagem não diz de que resposta se trata
      // (decisão 7 da folha).
      const title = root.querySelector<HTMLElement>('[data-slot="message-timing-title"]')!;
      await expect(title.textContent).toBe(labels.title);
      await expect(title).toHaveClass('nds-sr-only');
    });

    await step('Cada medida desenha o termo e o valor que chegaram', async () => {
      // A peça não reescreve nenhum dos dois: tudo chega escrito de quem mediu.
      const terms = [...root.querySelectorAll<HTMLElement>('[data-slot="message-timing-label"]')];
      const values = [...root.querySelectorAll<HTMLElement>('[data-slot="message-timing-value"]')];

      await expect(terms.length).toBe(expected.length);
      await expect(values.length).toBe(expected.length);
      for (const [i, stat] of expected.entries()) {
        await expect(terms[i].textContent).toBe(stat.label);
        await expect(values[i].textContent).toBe(stat.value);
      }
    });

    await step('E a ORDEM é a de quem mediu — a peça não reordena', async () => {
      // A linha se lê por posição, e uma medida que subisse de lugar entre uma
      // resposta e a seguinte faria comparar duas fotos diferentes.
      const drawn = [...root.querySelectorAll<HTMLElement>('[data-slot="message-timing-label"]')]
        .map((el) => el.textContent);
      await expect(drawn).toEqual(expected.map((stat) => stat.label));
    });

    await step('Termo e valor são um par de lista de definição', async () => {
      // Com `<dl>`, o par sobrevive a quem navega de item em item (decisão 1 da
      // folha), e é o `<div>` de cada par que o faz quebrar de linha inteiro.
      if (expected.length === 0) {
        await expect(root.querySelector('[data-slot="message-timing-stats"]')).toBeNull();
        return;
      }
      const list = root.querySelector<HTMLElement>('[data-slot="message-timing-stats"]')!;
      await expect(list.tagName).toBe('DL');
      const pair = list.querySelector<HTMLElement>('[data-slot="message-timing-stat"]')!;
      await expect(pair.querySelector('dt')).not.toBeNull();
      await expect(pair.querySelector('dd')).not.toBeNull();
    });

    await step('Os números ficam DENTRO do que é lido em voz', async () => {
      // A divergência em relação ao relógio do estado da execução: lá o número
      // corre e se esconde; aqui os números são o conteúdo (decisão 2 da folha).
      for (const stat of expected) {
        await expect(canvas.getByText(stat.value)).toBeInTheDocument();
      }
      await expect(root.querySelector('[aria-hidden="true"]')).toBeNull();
    });
  },
};
