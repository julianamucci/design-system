import type { Meta, StoryObj } from '@storybook/html-vite';
import { expect, within } from 'storybook/test';
import { createMessageTiming } from './message-timing';
import {
  isMeasuring,
  messageTimingLabels,
  statsOf,
  type MessageTimingCase,
} from './message-timing.fixtures';
import {
  messageTimingSourceEmpty,
  messageTimingSourceEveryCase,
  messageTimingSourceMeasuring,
  messageTimingSourcePartial,
  messageTimingSourceSettled,
} from './message-timing.source';

// ─── Meta ─────────────────────────────────────────────────────────────────────
//
// O que a linha diz nas bordas: a medição que ainda anda, a que acabou, a que
// só conheceu metade das medidas e a que não conheceu nenhuma. Nas quatro o
// desenho sozinho falharia — duas delas ficam com a mesma cor e o mesmo peso —,
// e o que responde é a palavra que abre a linha, ou a sua ausência.

const meta: Meta = {
  title: 'Primitives/Conversational/MessageTiming/States',
  tags: ['conversational'],
  parameters: {
    layout: 'padded',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: messageTimingSourceEveryCase },
      description: {
        component:
          'Nas bordas o desenho sozinho falha: a linha fica igual com quatro medidas e com duas, e não muda de cor quando a medição ainda anda. O que responde é a palavra que abre a linha, e o aviso de que aquilo ainda está mudando.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

const rootOf = (canvasElement: HTMLElement) =>
  canvasElement.querySelector<HTMLElement>('[data-slot="message-timing"]')!;

/** A linha daquele exemplo, com as medidas já escritas. */
const timingOf = (name: MessageTimingCase) =>
  createMessageTiming({
    stats: statsOf(name),
    streaming: isMeasuring(name),
    labels: messageTimingLabels(),
  });

/**
 * A medição ainda em andamento.
 *
 * É o único estado que a peça guarda, e ele existe porque o número ainda não
 * vale: sem a ressalva, um total parcial se lê como final.
 */
export const Measuring: Story = {
  parameters: {
    covers: ['functional.item3', 'accessibility.item3', 'accessibility.item4', 'visual.item2'],
    docs: { source: { transform: messageTimingSourceMeasuring } },
  },
  render: () => timingOf('measuring'),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const root = rootOf(canvasElement);
    const labels = messageTimingLabels();

    await step('A peça AVISA que aquilo ainda está mudando', async () => {
      // `aria-busy` é o oposto de anunciar: ele diz que o valor ainda não
      // assentou sem tirar nada da leitura (decisão 3 da folha).
      await expect(root.getAttribute('aria-busy')).toBe('true');
    });

    await step('E o aviso NÃO é uma região viva', async () => {
      // A regra da família continua valendo: um contador que se reanuncia torna
      // a tela impossível de ouvir enquanto a resposta é gerada logo acima.
      await expect(root.hasAttribute('aria-live')).toBe(false);
      await expect(root.querySelector('[aria-live]')).toBeNull();
    });

    await step('O estado chega em PALAVRA, e ela abre a linha', async () => {
      // Cor sozinha não descreve estado (WCAG 1.4.1, decisão 4), e aqui ela
      // descreveria justamente o estado de que o número ainda não vale.
      const state = root.querySelector<HTMLElement>('[data-slot="message-timing-state"]')!;
      await expect(state.textContent).toBe(labels.measuring);
      await expect(canvas.getByText(labels.measuring)).toBeInTheDocument();
    });

    await step('E a palavra vem ANTES dos números que ela ressalva', async () => {
      // Um aviso de que o valor não é final chega tarde se vier depois do valor
      // (decisão 5 da folha).
      const state = root.querySelector<HTMLElement>('[data-slot="message-timing-state"]')!;
      const list = root.querySelector<HTMLElement>('[data-slot="message-timing-stats"]')!;
      const posicao = state.compareDocumentPosition(list);
      await expect(posicao & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });
  },
};

/**
 * A medição encerrada.
 *
 * Nenhuma ressalva, e é decisão: uma linha de números sem etiqueta já se lê
 * como o que ela é. Uma etiqueta permanente dizendo "final" nunca variaria, e o
 * que nunca varia não informa (decisão 6 da folha).
 */
export const Settled: Story = {
  parameters: {
    covers: ['functional.item4', 'visual.item3'],
    docs: { source: { transform: messageTimingSourceSettled } },
  },
  render: () => timingOf('settled'),
  play: async ({ canvasElement, step }) => {
    const root = rootOf(canvasElement);
    const labels = messageTimingLabels();

    await step('O aviso de mudança SAI quando a medição acaba', async () => {
      // O atributo some em vez de virar `false`: um `aria-busy="false"`
      // permanente diria exatamente o que a ausência já diz.
      await expect(root.hasAttribute('aria-busy')).toBe(false);
    });

    await step('E a palavra do estado não é montada', async () => {
      await expect(root.querySelector('[data-slot="message-timing-state"]')).toBeNull();
      await expect(root.textContent).not.toContain(labels.measuring);
    });

    await step('As quatro medidas continuam todas na linha', async () => {
      const values = [...root.querySelectorAll<HTMLElement>('[data-slot="message-timing-value"]')];
      await expect(values.map((el) => el.textContent))
        .toEqual(statsOf('settled').map((stat) => stat.value));
    });
  },
};

/**
 * Só parte das medidas.
 *
 * Duas medições são uma linha honesta: o que não foi medido não deixa espaço
 * reservado nem um traço no lugar. Quantas medidas existem é de quem mede.
 */
export const PartialMeasures: Story = {
  parameters: {
    covers: ['functional.item5', 'visual.item4'],
    docs: { source: { transform: messageTimingSourcePartial } },
  },
  render: () => timingOf('partial'),
  play: async ({ canvasElement, step }) => {
    const root = rootOf(canvasElement);
    const expected = statsOf('partial');

    await step('Só as medidas que chegaram aparecem', async () => {
      const terms = [...root.querySelectorAll<HTMLElement>('[data-slot="message-timing-label"]')];
      await expect(terms.map((el) => el.textContent)).toEqual(expected.map((stat) => stat.label));
    });

    await step('E não há espaço reservado nem traço no lugar das que faltam', async () => {
      // O contraexemplo que a peça recusa: uma medida vazia parece uma medição
      // que deu zero, e zero é uma resposta.
      const pairs = [...root.querySelectorAll<HTMLElement>('[data-slot="message-timing-stat"]')];
      await expect(pairs.length).toBe(expected.length);
      await expect(root.textContent).not.toContain('—');
    });

    await step('A linha segue sem ressalva: parte medida não é medição em curso', async () => {
      // São duas perguntas diferentes — quantas medidas existem, e se as que
      // existem já assentaram —, e só a segunda é um estado da peça.
      await expect(root.hasAttribute('aria-busy')).toBe(false);
      await expect(root.querySelector('[data-slot="message-timing-state"]')).toBeNull();
    });
  },
};

/**
 * Nenhuma medida.
 *
 * A lista não é montada. Uma lista vazia deixaria na árvore um endereço que não
 * descreve nada, e um espaço que ninguém pediu — quem não mediu nada não monta
 * a peça.
 */
export const NoMeasures: Story = {
  parameters: {
    covers: ['functional.item6', 'visual.item5'],
    docs: { source: { transform: messageTimingSourceEmpty } },
  },
  render: () => timingOf('none'),
  play: async ({ canvasElement, step }) => {
    const root = rootOf(canvasElement);
    const labels = messageTimingLabels();

    await step('A lista não é montada', async () => {
      await expect(root.querySelector('[data-slot="message-timing-stats"]')).toBeNull();
      await expect(root.querySelector('[data-slot="message-timing-stat"]')).toBeNull();
    });

    await step('E o nome da medição segue sendo o único conteúdo', async () => {
      const title = root.querySelector<HTMLElement>('[data-slot="message-timing-title"]')!;
      await expect(title.textContent).toBe(labels.title);
      await expect(root.children.length).toBe(1);
    });
  },
};
