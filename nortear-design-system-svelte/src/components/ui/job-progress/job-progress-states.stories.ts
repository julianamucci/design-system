import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { expect, fn } from 'storybook/test';
import { JobProgress } from './index';
import JobProgressEveryStatusStory from './JobProgressEveryStatusStory.svelte';
import JobProgressUnknownTotalStory from './JobProgressUnknownTotalStory.svelte';
import {
  jobLabel,
  jobProgressLabels,
  JOB_COUNT,
  JOB_COUNT_WITHOUT_TOTAL,
} from './job-progress.fixtures';
import {
  jobProgressCompleteSource,
  jobProgressEveryStatusSource,
  jobProgressFailedSource,
  jobProgressRunningSource,
  jobProgressStoppedSource,
  jobProgressUnknownTotalSource,
} from './job-progress.source';
import { RUN_STATUSES, type RunStatus } from '@shared/primitives/chat-protocol';

// ─── Meta ─────────────────────────────────────────────────────────────────────
//
// Os cinco momentos de um trabalho longo, e o caso em que ninguém sabe de
// quantas. Não há eixo de forma nesta peça: a grade é sempre a mesma, e o que
// muda é o que a barra pode dizer.

const meta: Meta<typeof JobProgress> = {
  title: 'Components/Conversational/JobProgress/States',
  component: JobProgress,
  tags: ['conversational'],
  parameters: {
    layout: 'padded',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: jobProgressEveryStatusSource },
      description: {
        component:
          'O estado decide a palavra, a cor da barra, se a peça se declara ocupada e o que a ação oferece — e a ação troca de nome quando troca de função.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof JobProgress>;

/** Espião de escopo de módulo: dentro do render, a play não o alcança. */
const onAction = fn();

/**
 * A MESMA conta vai para os cinco, de propósito.
 *
 * É o que faz a story provar as decisões da folha em vez de só ilustrá-las: com
 * um número só, concluído desenha cheio, interrompido congela onde chegou e em
 * andamento mostra a fração. Quem decide isso é o vocabulário compartilhado, e
 * não este andaime.
 */
const mount = (status: RunStatus) => ({
  Component: JobProgress,
  props: {
    label: jobLabel(),
    status,
    count: JOB_COUNT,
    labels: jobProgressLabels(),
    onAction,
  },
});

const pieceOf = (canvasElement: HTMLElement) =>
  canvasElement.querySelector<HTMLElement>('[data-slot="job-progress"]')!;

const barOf = (piece: HTMLElement) =>
  piece.querySelector<HTMLElement>('[data-slot="progress"]')!;

const actionOf = (piece: HTMLElement) =>
  piece.querySelector<HTMLButtonElement>('[data-slot="job-progress-action"]');

const wordOf = (piece: HTMLElement) =>
  piece.querySelector<HTMLElement>('[data-slot="job-progress-status"]')!;

/**
 * Os cinco, um abaixo do outro.
 *
 * A lista sai de `RUN_STATUSES`, e não de cinco linhas escritas à mão: estado
 * novo no vocabulário compartilhado entra nesta story sozinho, que é exatamente
 * o que aquela constante existe para garantir.
 */
export const EveryStatus: Story = {
  parameters: {
    covers: [
      'functional.item1', 'functional.item7', 'functional.item9',
      'accessibility.item3', 'accessibility.item6',
      'visual.item2',
    ],
  },
  render: () => ({
    Component: JobProgressEveryStatusStory,
    props: { label: jobLabel(), labels: jobProgressLabels(), onAction },
  }),
  play: async ({ canvasElement, step }) => {
    const pieces = [...canvasElement.querySelectorAll<HTMLElement>('[data-slot="job-progress"]')];
    const labels = jobProgressLabels();

    await step('Há uma peça por estado, na ordem do vocabulário', async () => {
      await expect(pieces).toHaveLength(RUN_STATUSES.length);
      await expect(pieces.map((p) => p.dataset.status)).toEqual([...RUN_STATUSES]);
    });

    await step('Cada uma traz a PALAVRA daquele estado', async () => {
      for (const [i, status] of RUN_STATUSES.entries()) {
        await expect(wordOf(pieces[i]!).textContent).toBe(labels.status[status]);
      }
    });

    await step('A barra guarda o papel e o NOME do trabalho', async () => {
      // Barra sem nome é anunciada como "barra de progresso, 24%": o leitor diz
      // quanto, nunca de quê. E ela não é escondida — "não se anuncia" e "não se
      // lê" são coisas diferentes (decisão 4 da folha).
      for (const piece of pieces) {
        const bar = barOf(piece);
        await expect(bar.getAttribute('role')).toBe('progressbar');
        await expect(bar.getAttribute('aria-label')).toBe(jobLabel());
        await expect(bar.closest('[aria-hidden="true"]')).toBeNull();
      }
    });

    await step('Só o que corre se declara ocupado', async () => {
      for (const [i, status] of RUN_STATUSES.entries()) {
        const busy = pieces[i]!.getAttribute('aria-busy');
        await expect(busy).toBe(status === 'running' ? 'true' : null);
      }
    });

    await step('E os rótulos de ação são TRÊS nomes diferentes', async () => {
      // Interromper, retomar e repetir são três coisas (decisão 6 da folha).
      // Botão que troca de função sem trocar de nome é o mesmo botão fazendo
      // coisas diferentes.
      for (const [i, status] of RUN_STATUSES.entries()) {
        const expected = labels.action?.[status];
        const button = actionOf(pieces[i]!);
        if (expected) await expect(button).toHaveAccessibleName(expected);
        else await expect(button).toBeNull();
      }
      const names = [...canvasElement.querySelectorAll<HTMLElement>(
        '[data-slot="job-progress-action"]',
      )].map((b) => b.textContent);
      await expect(names).toHaveLength(3);
      await expect(new Set(names).size).toBe(3);
    });
  },
};

export const Running: Story = {
  parameters: {
    covers: ['functional.item6', 'accessibility.item5', 'visual.item3'],
    docs: { source: { transform: jobProgressRunningSource } },
  },
  render: () => mount('running'),
  play: async ({ canvasElement, step }) => {
    const piece = pieceOf(canvasElement);
    const labels = jobProgressLabels();

    await step('Enquanto corre, a peça se declara ocupada', async () => {
      // `aria-busy` diz que aquele pedaço da tela ainda se escreve, sem anunciar
      // nada — é o contrário da região viva (decisão 1 da folha).
      await expect(piece.getAttribute('aria-busy')).toBe('true');
    });

    await step('A barra mostra a fração, arredondada para BAIXO', async () => {
      // 1 240 de 5 000 é 24,8 — e a barra mostra 24. Ao mais próximo, faltando
      // uma unidade de cinco mil ela encheria, e barra cheia ao lado de "em
      // andamento" é a peça discordando de si.
      await expect(barOf(piece).getAttribute('aria-valuenow')).toBe('24');
    });

    await step('E a ação oferece INTERROMPER', async () => {
      await expect(actionOf(piece)).toHaveAccessibleName(labels.action!.running!);
    });
  },
};

/**
 * Sem total conhecido — o que a peça existe para não errar.
 *
 * Duas peças, e as duas dizem a mesma coisa por caminhos diferentes: uma omite o
 * total, a outra manda zero. Zero é o erro mais fácil de cometer, porque parece
 * um número, e é justamente o que desenharia trilha vazia — "acabou de
 * começar" — para algo que já andou muito.
 */
export const UnknownTotal: Story = {
  parameters: {
    covers: ['functional.item3', 'functional.item4', 'visual.item4'],
    docs: { source: { transform: jobProgressUnknownTotalSource } },
  },
  render: () => ({
    Component: JobProgressUnknownTotalStory,
    props: { label: jobLabel(), labels: jobProgressLabels(), onAction },
  }),
  play: async ({ canvasElement, step }) => {
    const pieces = [...canvasElement.querySelectorAll<HTMLElement>('[data-slot="job-progress"]')];

    await step('Nenhuma das duas mostra um número', async () => {
      // Zero mentiria: ele diz "acabou de começar", e a verdade é "não se sabe
      // quanto falta". Sem `aria-valuenow`, o leitor anuncia ocupado.
      for (const piece of pieces) {
        const bar = barOf(piece);
        await expect(bar.hasAttribute('aria-valuenow')).toBe(false);
        await expect(bar.hasAttribute('data-indeterminate')).toBe(true);
      }
    });

    await step('E a conta escrita não promete um fim', async () => {
      // O molde sem total é o que faz a peça LER diferente, e não só desenhar
      // diferente: com um molde só, "de " ficaria pendurado no fim da frase.
      for (const piece of pieces) {
        const tally = piece.querySelector<HTMLElement>('[data-slot="job-progress-count"]')!;
        await expect(tally.textContent).toBe(
          jobProgressLabels().countWithoutTotal.replace(
            '{done}',
            JOB_COUNT_WITHOUT_TOTAL.done.toLocaleString(),
          ),
        );
      }
    });
  },
};

export const Stopped: Story = {
  parameters: {
    covers: ['visual.item5'],
    docs: { source: { transform: jobProgressStoppedSource } },
  },
  render: () => mount('stopped'),
  play: async ({ canvasElement, step }) => {
    const piece = pieceOf(canvasElement);
    const labels = jobProgressLabels();

    await step('A barra congela onde chegou, e a peça deixa de estar ocupada', async () => {
      await expect(barOf(piece).getAttribute('aria-valuenow')).toBe('24');
      await expect(piece.hasAttribute('aria-busy')).toBe(false);
    });

    await step('E a ação oferece RETOMAR, com nome próprio', async () => {
      // Interromper não é erro, e o que a pessoa escolheu fazer se retoma — não
      // se tenta de novo.
      const action = actionOf(piece)!;
      await expect(action).toHaveAccessibleName(labels.action!.stopped!);
      await expect(labels.action!.stopped).not.toBe(labels.action!.failed);
    });
  },
};

export const Complete: Story = {
  parameters: {
    covers: ['functional.item8', 'visual.item6'],
    docs: { source: { transform: jobProgressCompleteSource } },
  },
  render: () => mount('complete'),
  play: async ({ canvasElement, step }) => {
    const piece = pieceOf(canvasElement);

    await step('A barra fica CHEIA, ainda que a conta seja parcial', async () => {
      // A conta é a mesma das outras stories — 1 240 de 5 000. Quem decide a
      // barra cheia é o estado: um trabalho que terminou está inteiro feito, e
      // uma barra pela metade ao lado da palavra é a peça discordando de si.
      const bar = barOf(piece);
      await expect(bar.getAttribute('aria-valuenow')).toBe('100');
      await expect(bar.dataset.variant).toBe('success');
    });

    await step('E não há ação: sobre um trabalho pronto não há o que fazer aqui', async () => {
      await expect(actionOf(piece)).toBeNull();
    });
  },
};

export const Failed: Story = {
  parameters: {
    covers: ['visual.item7'],
    docs: { source: { transform: jobProgressFailedSource } },
  },
  render: () => mount('failed'),
  play: async ({ canvasElement, step }) => {
    const piece = pieceOf(canvasElement);
    const labels = jobProgressLabels();

    await step('A barra congela na cor de erro, e a palavra diz o que houve', async () => {
      // A cor é REFORÇO: ela foi medida contra a trilha nos três temas, e ainda
      // assim quem descreve é a palavra ao lado.
      await expect(barOf(piece).dataset.variant).toBe('destructive');
      await expect(wordOf(piece).textContent).toBe(labels.status.failed);
    });

    await step('E a ação oferece TENTAR DE NOVO', async () => {
      await expect(actionOf(piece)).toHaveAccessibleName(labels.action!.failed!);
    });
  },
};
