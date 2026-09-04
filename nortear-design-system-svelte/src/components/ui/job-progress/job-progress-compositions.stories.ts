import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { expect, fn, userEvent } from 'storybook/test';
import { JobProgress } from './index';
import JobProgressQueueStory from './JobProgressQueueStory.svelte';
import JobProgressBesideRunStory from './JobProgressBesideRunStory.svelte';
import { jobLabel, jobProgressLabels, JOB_COUNT } from './job-progress.fixtures';
import {
  jobProgressBesideRunSource,
  jobProgressQueueSource,
  jobProgressRunningSource,
} from './job-progress.source';

// ─── Meta ─────────────────────────────────────────────────────────────────────
//
// Onde a peça mora em relação às irmãs, e o que acontece quando alguém aperta a
// ação — que, do lado de cá, é só um aviso.

const meta: Meta<typeof JobProgress> = {
  title: 'Components/Conversational/JobProgress/Compositions',
  component: JobProgress,
  tags: ['conversational'],
  parameters: {
    layout: 'padded',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: jobProgressBesideRunSource },
      description: {
        component:
          'A peça é autônoma: ela não sabe que as irmãs existem, não conhece a fila em que está e não executa nada do que oferece.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof JobProgress>;

/** Espião de escopo de módulo: dentro do render, a play não o alcança. */
const onAction = fn();

/**
 * Três trabalhos ao mesmo tempo, cada um no seu estado.
 *
 * A fila é de quem consome: a peça desenha UM trabalho, e empilhá-las é o que
 * produz a fila. Uma peça que recebesse a lista decidiria ordenação e
 * agrupamento, que são política de produto.
 */
export const JobQueue: Story = {
  parameters: {
    covers: ['visual.item8'],
    docs: { source: { transform: jobProgressQueueSource } },
  },
  render: () => ({
    Component: JobProgressQueueStory,
    props: { label: jobLabel(), labels: jobProgressLabels(), onAction },
  }),
  play: async ({ canvasElement, step }) => {
    const pieces = [...canvasElement.querySelectorAll<HTMLElement>('[data-slot="job-progress"]')];

    await step('Cada peça é autônoma, e nenhuma contém a outra', async () => {
      await expect(pieces).toHaveLength(3);
      for (const piece of pieces) {
        const others = pieces.filter((other) => other !== piece);
        for (const other of others) await expect(piece.contains(other)).toBe(false);
      }
    });

    await step('O que espera não traz conta, e a trilha vazia é a verdade dele', async () => {
      // Aqui zero não mente: nada começou. É o outro lado da decisão 5 da
      // folha — o traço correndo é do que ANDA sem estimativa, e não do que
      // ainda não saiu da fila.
      const queued = pieces[2]!;
      await expect(queued.querySelector('[data-slot="job-progress-count"]')).toBeNull();
      const bar = queued.querySelector<HTMLElement>('[data-slot="progress"]')!;
      await expect(bar.getAttribute('aria-valuenow')).toBe('0');
      await expect(bar.hasAttribute('data-indeterminate')).toBe(false);
    });
  },
};

/**
 * A peça ao lado da linha de estado da execução.
 *
 * A resposta já terminou e o trabalho continua correndo — o par que mostra por
 * que os dois escopos são separados: se fossem um só, este estado não teria como
 * ser escrito.
 */
export const BesideRunStatus: Story = {
  parameters: { covers: ['functional.item11', 'visual.item9'] },
  render: () => ({
    Component: JobProgressBesideRunStory,
    props: { label: jobLabel(), labels: jobProgressLabels(), onAction },
  }),
  play: async ({ canvasElement, step }) => {
    const job = canvasElement.querySelector<HTMLElement>('[data-slot="job-progress"]')!;
    const run = canvasElement.querySelector<HTMLElement>('[data-slot="agent-status"]')!;

    await step('As duas existem, e uma não contém a outra', async () => {
      // Cada uma responde a uma pergunta: em que pé está a resposta que se
      // escreve agora, e o quanto andou uma tarefa que sobrevive a ela.
      // Aninhá-las faria a segunda parecer detalhe da primeira.
      await expect(job.contains(run)).toBe(false);
      await expect(run.contains(job)).toBe(false);
    });

    await step('A resposta terminou e o trabalho continua', async () => {
      // O par que só existe porque os dois escopos são separados.
      await expect(run.dataset.status).toBe('complete');
      await expect(job.dataset.status).toBe('running');
      await expect(job.getAttribute('aria-busy')).toBe('true');
    });

    await step('E nenhuma das duas carrega região viva', async () => {
      // A exceção da folha é do estado da ligação e do cartão de autorização, e
      // nenhuma das duas é isto: aqui nada está bloqueado.
      await expect(job.querySelector('[role="status"], [aria-live]')).toBeNull();
      await expect(run.querySelector('[role="status"], [aria-live]')).toBeNull();
    });
  },
};

export const Requesting: Story = {
  parameters: {
    covers: ['functional.item10', 'accessibility.item7'],
    docs: { source: { transform: jobProgressRunningSource } },
  },
  render: () => ({
    Component: JobProgress,
    props: {
      label: jobLabel(),
      status: 'running',
      count: JOB_COUNT,
      labels: jobProgressLabels(),
      onAction,
    },
  }),
  play: async ({ canvasElement, step }) => {
    const piece = canvasElement.querySelector<HTMLElement>('[data-slot="job-progress"]')!;
    const action = piece.querySelector<HTMLButtonElement>('[data-slot="job-progress-action"]')!;
    const labels = jobProgressLabels();

    await step('O alvo de toque tem pelo menos vinte e quatro pixels', async () => {
      // WCAG 2.5.8. Uma ação encostada no canto de uma peça estreita é onde a
      // tentação de encolher é maior — e a coluna da direita é compartilhada com
      // a conta, que é larga.
      const box = action.getBoundingClientRect();
      await expect(box.width).toBeGreaterThanOrEqual(24);
      await expect(box.height).toBeGreaterThanOrEqual(24);
    });

    await step('Acionar avisa quem consome, com a INTENÇÃO daquele estado', async () => {
      // Enquanto o trabalho não terminou a ação interrompe; depois de terminado
      // ela começa de novo. Quem responde "já terminou?" é o vocabulário
      // compartilhado, e não um teste escrito nesta stack.
      onAction.mockClear();
      await userEvent.click(action);
      await expect(onAction).toHaveBeenCalledTimes(1);
      await expect(onAction).toHaveBeenCalledWith('stop');
    });

    await step('E a peça continua como estava — ela não para nada', async () => {
      // Parar de verdade é de quem consome, e é ele quem devolve o estado novo.
      // Uma peça que se parasse sozinha estaria adivinhando o que ainda não
      // aconteceu.
      await expect(piece.dataset.status).toBe('running');
      await expect(piece.getAttribute('aria-busy')).toBe('true');
      await expect(action).toHaveAccessibleName(labels.action!.running!);
    });
  },
};
