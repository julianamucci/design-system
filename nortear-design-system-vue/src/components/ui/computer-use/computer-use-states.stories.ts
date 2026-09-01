import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect } from 'storybook/test';
import { ComputerUse } from './index';
import {
  ComputerUseDemoScreen,
  computerUseLabels,
  useComputerUseLabels,
} from './computer-use.fixtures';
import {
  computerUseClampedSource,
  computerUseEveryStatusSource,
  computerUseFinishedSource,
  computerUseFirstStepSource,
  computerUseRunningSource,
  computerUseWithoutStepsSource,
} from './computer-use.source';
import { RUN_STATUSES, type ComputerStep, type RunStatus } from '@shared/primitives/chat-protocol';
import {
  COMPUTER_STEPS_LOGIN,
  COMPUTER_STEPS_SHORT,
  COMPUTER_URL,
} from '@shared/primitives/computer-use-examples';

// ─── Meta ─────────────────────────────────────────────────────────────────────
//
// Os cinco momentos de uma sessão, mais os dois em que o rastro não está cheio:
// o começo, quando ainda não há três marcas, e a moldura antes do primeiro
// toque. Não há eixo de forma nesta peça — a estrutura é sempre a mesma,
// endereço, quadro e legenda — e o que muda é quanto cada parte tem para dizer.

const meta: Meta = {
  title: 'Primitives/Conversational/ComputerUse/States',
  tags: ['conversational'],
  parameters: {
    layout: 'padded',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: computerUseEveryStatusSource },
      description: {
        component:
          'O estado decide se a peça se declara ocupada e se a marca em curso ganha o anel que pulsa; o índice decide qual passo a legenda descreve e quais duas marcas o antecedem no rastro.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

/** Uma sessão só, no estado e no índice pedidos. */
const mount = (status: RunStatus, activeIndex: number, steps: readonly ComputerStep[] = COMPUTER_STEPS_LOGIN) => ({
  components: { ComputerUse, ComputerUseDemoScreen },
  setup() {
    return {
      url: COMPUTER_URL,
      status,
      activeIndex,
      steps,
      labels: useComputerUseLabels(),
    };
  },
  template: `<ComputerUse
    :url="url"
    :steps="steps"
    :active-index="activeIndex"
    :status="status"
    :labels="labels"
  >
    <template #screen><ComputerUseDemoScreen /></template>
  </ComputerUse>`,
});

const pieceOf = (canvasElement: HTMLElement) =>
  canvasElement.querySelector<HTMLElement>('[data-slot="computer-use"]')!;

const marksIn = (piece: HTMLElement) => [
  ...piece.querySelectorAll<HTMLElement>('[data-slot="computer-use-mark"]'),
];

const captionOf = (piece: HTMLElement) =>
  piece.querySelector<HTMLElement>('[data-slot="computer-use-caption"]');

const positionOf = (piece: HTMLElement) =>
  piece.querySelector<HTMLElement>('[data-slot="computer-use-position"]');

/**
 * Os cinco, um abaixo do outro.
 *
 * A lista sai de `RUN_STATUSES`, e não de cinco linhas escritas à mão: estado
 * novo no vocabulário compartilhado entra nesta story sozinho, e ninguém
 * precisa lembrar de mexer aqui.
 */
export const EveryStatus: Story = {
  parameters: {
    covers: ['functional.item5', 'functional.item6', 'visual.item2'],
    docs: { source: { transform: computerUseEveryStatusSource } },
  },
  render: () => ({
    components: { ComputerUse, ComputerUseDemoScreen },
    setup() {
      return {
        statuses: RUN_STATUSES,
        url: COMPUTER_URL,
        steps: COMPUTER_STEPS_LOGIN,
        labels: useComputerUseLabels(),
      };
    },
    template: `<div class="nds-stack nds-max-w-md" data-spacing="lg">
      <ComputerUse
        v-for="status in statuses"
        :key="status"
        :url="url"
        :steps="steps"
        :active-index="3"
        :status="status"
        :labels="labels"
      >
        <template #screen><ComputerUseDemoScreen /></template>
      </ComputerUse>
    </div>`,
  }),
  play: async ({ canvasElement, step }) => {
    const pieces = [...canvasElement.querySelectorAll<HTMLElement>('[data-slot="computer-use"]')];

    await step('Há uma peça por estado, e cada uma diz qual é o seu', async () => {
      await expect(pieces).toHaveLength(RUN_STATUSES.length);
      await expect(pieces.map((piece) => piece.dataset.status)).toEqual([...RUN_STATUSES]);
    });

    await step('Só a que corre se declara ocupada', async () => {
      // `aria-busy` é o que substitui a região viva nesta família: ele diz que
      // aquele pedaço da tela ainda se escreve, sem anunciar nada.
      for (const piece of pieces) {
        await expect(piece.getAttribute('aria-busy')).toBe(
          piece.dataset.status === 'running' ? 'true' : null,
        );
      }
    });

    await step('A legenda existe em todos, porque o passo em curso não some', async () => {
      // O estado não apaga o passo: uma sessão interrompida continua tendo
      // parado em algum lugar, e é isso que a legenda diz.
      for (const piece of pieces) await expect(captionOf(piece)).not.toBeNull();
    });
  },
};

/** Enquanto o agente dirige: a marca em curso ganha o anel que pulsa. */
export const Running: Story = {
  parameters: {
    covers: ['functional.item5', 'functional.item7', 'accessibility.item5', 'visual.item3'],
    docs: { source: { transform: computerUseRunningSource } },
  },
  render: () => mount('running', 3),
  play: async ({ canvasElement, step }) => {
    const piece = pieceOf(canvasElement);

    await step('A peça se declara ocupada e a marca em curso é a última do rastro', async () => {
      await expect(piece.getAttribute('aria-busy')).toBe('true');
      const marks = marksIn(piece);
      await expect(marks).toHaveLength(3);
      await expect(marks.at(-1)!.dataset.active).toBe('true');
      // As duas anteriores NÃO são a em curso: o que separa o rastro da marca
      // ativa é tamanho e papel de cor, e o atributo é o que a folha lê.
      await expect(marks.slice(0, -1).every((mark) => mark.dataset.active === undefined)).toBe(true);
    });

    await step('O ponto de cada marca chega em porcentagem do quadro', async () => {
      // Leitura pura: o valor é dado, e entra em propriedade personalizada
      // porque não existe token de "42%".
      const marks = marksIn(piece);
      const trailSteps = COMPUTER_STEPS_LOGIN.slice(1, 4);
      for (const [index, mark] of marks.entries()) {
        await expect(mark.style.getPropertyValue('--computer-use-mark-x').trim()).toBe(
          String(trailSteps[index]!.x),
        );
        await expect(mark.style.getPropertyValue('--computer-use-mark-y').trim()).toBe(
          String(trailSteps[index]!.y),
        );
      }
    });
  },
};

/** Quando a sessão termina: o anel some, e o último passo continua marcado. */
export const Finished: Story = {
  parameters: {
    covers: ['functional.item6', 'visual.item4'],
    docs: { source: { transform: computerUseFinishedSource } },
  },
  render: () => mount('complete', COMPUTER_STEPS_LOGIN.length - 1),
  play: async ({ canvasElement, step }) => {
    const piece = pieceOf(canvasElement);

    await step('A peça deixa de se declarar ocupada', async () => {
      // Marca que pulsa depois do fim diz que o agente ainda trabalha — é o
      // cursor que fica mentindo do bloco de terminal, na outra ponta da folha.
      await expect(piece.getAttribute('aria-busy')).toBeNull();
      await expect(piece.dataset.status).toBe('complete');
    });

    await step('A legenda aponta para o último passo', async () => {
      const total = COMPUTER_STEPS_LOGIN.length;
      await expect(positionOf(piece)!.textContent).toBe(
        computerUseLabels()
          .position.replace('{index}', String(total))
          .replace('{total}', String(total)),
      );
    });
  },
};

/**
 * O começo da sessão, quando o rastro ainda não encheu.
 *
 * Com o índice no primeiro passo há uma marca só. É o que toda sessão
 * atravessa, e o que mais escapa de quem só fotografa o meio.
 */
export const FirstStep: Story = {
  parameters: {
    covers: ['functional.item8', 'visual.item5'],
    docs: { source: { transform: computerUseFirstStepSource } },
  },
  render: () => mount('running', 0, COMPUTER_STEPS_SHORT),
  play: async ({ canvasElement, step }) => {
    const piece = pieceOf(canvasElement);

    await step('Há uma marca só, e ela é a do passo em curso', async () => {
      const marks = marksIn(piece);
      await expect(marks).toHaveLength(1);
      await expect(marks[0]!.dataset.active).toBe('true');
    });

    await step('A contagem diz que é o primeiro de dois', async () => {
      await expect(positionOf(piece)!.textContent).toBe(
        computerUseLabels().position.replace('{index}', '1').replace('{total}', '2'),
      );
    });
  },
};

/**
 * A moldura antes do primeiro toque.
 *
 * Sem passo nenhum não há rastro nem legenda: sobra o endereço e a tela, que é
 * o que existe antes de o agente tocar em qualquer coisa. Uma legenda vazia
 * daria à figura um nome em branco.
 */
export const WithoutSteps: Story = {
  parameters: {
    covers: ['functional.item4', 'visual.item6'],
    docs: { source: { transform: computerUseWithoutStepsSource } },
  },
  render: () => mount('idle', 0, []),
  play: async ({ canvasElement, step }) => {
    const piece = pieceOf(canvasElement);

    await step('Não há rastro nem legenda', async () => {
      await expect(piece.querySelector('[data-slot="computer-use-trail"]')).toBeNull();
      await expect(captionOf(piece)).toBeNull();
    });

    await step('A moldura e a tela continuam de pé', async () => {
      await expect(piece.querySelector('[data-slot="computer-use-address"]')).not.toBeNull();
      const surface = piece.querySelector<HTMLElement>('[data-slot="computer-use-surface"]')!;
      await expect(surface.children.length).toBe(1);
    });
  },
};

/**
 * O índice preso ao alcance.
 *
 * Quem avança uma sessão incrementa um número, e o passo seguinte ao último é
 * o último — recusar deixaria a tela sem marca justamente quando a sessão
 * acabou de terminar.
 */
export const ClampedIndex: Story = {
  parameters: {
    covers: ['functional.item9', 'visual.item7'],
    docs: { source: { transform: computerUseClampedSource } },
  },
  render: () => mount('complete', 99),
  play: async ({ canvasElement, step }) => {
    const piece = pieceOf(canvasElement);

    await step('A legenda aponta para o último passo, e não para lugar nenhum', async () => {
      const total = COMPUTER_STEPS_LOGIN.length;
      await expect(positionOf(piece)!.textContent).toBe(
        computerUseLabels()
          .position.replace('{index}', String(total))
          .replace('{total}', String(total)),
      );
      await expect(marksIn(piece)).toHaveLength(3);
    });
  },
};
