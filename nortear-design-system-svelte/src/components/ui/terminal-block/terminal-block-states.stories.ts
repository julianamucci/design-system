import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { expect } from 'storybook/test';
import { TerminalBlock } from './index';
import TerminalBlockEveryStatusStory from './TerminalBlockEveryStatusStory.svelte';
import TerminalBlockWithoutOutputStory from './TerminalBlockWithoutOutputStory.svelte';
import { exitCodeFor, linesFor, terminalBlockLabels } from './terminal-block.fixtures';
import {
  terminalBlockCompleteSource,
  terminalBlockEveryStatusSource,
  terminalBlockFailedSource,
  terminalBlockRunningSource,
  terminalBlockStoppedSource,
  terminalBlockWithoutOutputSource,
} from './terminal-block.source';
import { RUN_STATUSES, type RunStatus } from '@shared/primitives/chat-protocol';
import {
  TERMINAL_COMMAND,
  TERMINAL_LINES_COMPLETE,
  TERMINAL_LINES_FAILED,
} from '@shared/primitives/terminal-block-examples';

// ─── Meta ─────────────────────────────────────────────────────────────────────
//
// Os cinco momentos de um comando, e o caso em que ele não escreveu nada. Não há
// eixo de forma nesta peça: a estrutura é sempre a mesma — o que rodou, o que
// voltou, como terminou — e o que muda é o que cada parte tem para dizer.

const meta: Meta<typeof TerminalBlock> = {
  title: 'Components/Conversational/TerminalBlock/States',
  component: TerminalBlock,
  tags: ['conversational'],
  parameters: {
    layout: 'padded',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: terminalBlockEveryStatusSource },
      description: {
        component:
          'O estado decide a palavra, a cor do ponto, se a peça se declara ocupada e se há cursor — e o código de saída só existe depois que a execução acabou.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof TerminalBlock>;

/**
 * A saída de exemplo acompanha o estado, de propósito.
 *
 * Aqui o estado MUDA a saída: o que corre para no meio porque ainda escreve, o
 * interrompido para no meio porque alguém o cortou, o que terminou traz a tabela
 * alinhada e o que falhou traz a linha larga. Uma saída só para os cinco faria
 * as fotos mostrarem o mesmo texto com palavras diferentes embaixo, que é
 * exatamente o que esta peça não faz.
 */
const mount = (status: RunStatus) => ({
  Component: TerminalBlock,
  props: {
    command: TERMINAL_COMMAND,
    lines: linesFor(status),
    status,
    exitCode: exitCodeFor(status),
    labels: terminalBlockLabels(),
  },
});

const pieceOf = (canvasElement: HTMLElement) =>
  canvasElement.querySelector<HTMLElement>('[data-slot="terminal-block"]')!;

const outputOf = (piece: HTMLElement) =>
  piece.querySelector<HTMLElement>('[data-slot="terminal-block-output"]');

const cursorOf = (piece: HTMLElement) =>
  piece.querySelector<HTMLElement>('[data-slot="terminal-block-cursor"]');

const wordOf = (piece: HTMLElement) =>
  piece.querySelector<HTMLElement>('[data-slot="terminal-block-status"]')!;

const exitOf = (piece: HTMLElement) =>
  piece.querySelector<HTMLElement>('[data-slot="terminal-block-exit"]');

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
      'functional.item1', 'functional.item7',
      'accessibility.item1', 'accessibility.item4',
      'visual.item2',
    ],
  },
  render: () => ({
    Component: TerminalBlockEveryStatusStory,
    props: { command: TERMINAL_COMMAND, labels: terminalBlockLabels() },
  }),
  play: async ({ canvasElement, step }) => {
    const pieces = [...canvasElement.querySelectorAll<HTMLElement>('[data-slot="terminal-block"]')];
    const labels = terminalBlockLabels();

    await step('Há uma peça por estado, na ordem do vocabulário', async () => {
      await expect(pieces).toHaveLength(RUN_STATUSES.length);
      await expect(pieces.map((p) => p.dataset.status)).toEqual([...RUN_STATUSES]);
    });

    await step('Cada uma traz a PALAVRA daquele estado', async () => {
      // E as cinco palavras são cinco: estado que reusasse a palavra de outro
      // apagaria a diferença justamente para quem não vê a cor do ponto.
      const words = pieces.map((piece) => wordOf(piece).textContent);
      for (const [i, status] of RUN_STATUSES.entries()) {
        await expect(words[i]).toBe(labels.status[status]);
      }
      await expect(new Set(words).size).toBe(RUN_STATUSES.length);
    });

    await step('Só o que corre se declara ocupado, e só ele tem cursor', async () => {
      // Cursor que fica é cursor que mente: ele marca a costura entre o que
      // chegou e o que ainda vem, e quando nada mais vem não há costura.
      for (const [i, status] of RUN_STATUSES.entries()) {
        const piece = pieces[i]!;
        await expect(piece.getAttribute('aria-busy')).toBe(status === 'running' ? 'true' : null);
        if (status === 'running') await expect(cursorOf(piece)).not.toBeNull();
        else await expect(cursorOf(piece)).toBeNull();
      }
    });

    await step('O código de saída só aparece onde a execução já acabou', async () => {
      for (const [i, status] of RUN_STATUSES.entries()) {
        const expected = exitCodeFor(status);
        const exit = exitOf(pieces[i]!);
        if (expected === undefined) await expect(exit).toBeNull();
        else await expect(exit!.textContent).toContain(String(expected));
      }
    });

    await step('E nenhuma das cinco carrega região viva', async () => {
      for (const piece of pieces) {
        await expect(
          piece.querySelector('[role="status"], [role="alert"], [role="log"], [aria-live]'),
        ).toBeNull();
      }
    });
  },
};

export const Running: Story = {
  parameters: {
    covers: ['functional.item6', 'accessibility.item5', 'accessibility.item8', 'visual.item3'],
    docs: { source: { transform: terminalBlockRunningSource } },
  },
  render: () => mount('running'),
  play: async ({ canvasElement, step }) => {
    const piece = pieceOf(canvasElement);

    await step('Enquanto a saída chega, a peça se declara ocupada', async () => {
      // `aria-busy` diz que aquele pedaço da tela ainda se escreve, sem anunciar
      // nada — é o contrário da região viva (decisão 1 da folha).
      await expect(piece.getAttribute('aria-busy')).toBe('true');
    });

    await step('O cursor fica no FIM da saída, e fora do que é lido em voz', async () => {
      // Ele marca onde a próxima linha vai aparecer; lido em voz não marcaria
      // nada, porque não há palavra que descreva um lugar.
      const output = outputOf(piece)!;
      const cursor = cursorOf(piece)!;
      await expect(cursor.getAttribute('aria-hidden')).toBe('true');
      await expect(output.lastElementChild).toBe(cursor);
    });

    await step('E ainda não há código de saída', async () => {
      await expect(exitOf(piece)).toBeNull();
    });
  },
};

/**
 * Concluído, com a tabela alinhada.
 *
 * A tabela de arquivos é o assunto: as três colunas só ficam alinhadas com
 * avanço fixo e com o espaçamento preservado. É a foto que prova a decisão 7 da
 * folha — quebrar a linha para caber desmancharia as colunas em que a leitura
 * estava.
 */
export const Complete: Story = {
  parameters: {
    covers: ['functional.item8', 'accessibility.item7', 'visual.item4'],
    docs: { source: { transform: terminalBlockCompleteSource } },
  },
  render: () => mount('complete'),
  play: async ({ canvasElement, step }) => {
    const piece = pieceOf(canvasElement);
    const labels = terminalBlockLabels();

    await step('A saída chega com o espaçamento intacto', async () => {
      // Sem `white-space: pre` os espaços seguidos colapsariam, e a tabela que
      // alinhava os números viraria um parágrafo.
      const output = outputOf(piece)!;
      await expect(output.textContent).toContain(TERMINAL_LINES_COMPLETE[3]);
      await expect(getComputedStyle(output).whiteSpace).toBe('pre');
    });

    await step('O código de saída chega escrito, e a quem ouve', async () => {
      const exit = exitOf(piece)!;
      await expect(exit.textContent).toBe(labels.exitCode.replace('{code}', '0'));
      await expect(exit.closest('[aria-hidden="true"]')).toBeNull();
    });

    await step('E o cursor já não existe', async () => {
      await expect(cursorOf(piece)).toBeNull();
      await expect(piece.hasAttribute('aria-busy')).toBe(false);
    });
  },
};

/**
 * Falhou, com uma linha mais larga que o bloco.
 *
 * É o caso que a decisão 7 existe para não errar: a linha rola na horizontal
 * DENTRO do próprio bloco, e o bloco não cresce para acomodá-la.
 */
export const Failed: Story = {
  parameters: {
    covers: ['functional.item9', 'accessibility.item6', 'visual.item5'],
    docs: { source: { transform: terminalBlockFailedSource } },
  },
  render: () => mount('failed'),
  play: async ({ canvasElement, step }) => {
    const piece = pieceOf(canvasElement);
    const output = outputOf(piece)!;

    await step('A linha larga transborda a CAIXA, e a caixa rola', async () => {
      // Leitura pura, e medida no elemento que de fato recorta — nunca na raiz
      // do documento, que não transborda porque quem rola é outro.
      await expect(output.textContent).toContain(TERMINAL_LINES_FAILED[3]);
      await expect(output.scrollWidth).toBeGreaterThan(output.clientWidth);
    });

    await step('E o BLOCO não cresce com ela', async () => {
      // A rolagem horizontal fica dentro do bloco, e nunca no corpo da página
      // (regra do repositório). Um pixel de folga para arredondamento de layout.
      await expect(piece.scrollWidth).toBeLessThanOrEqual(piece.clientWidth + 1);
      await expect(canvasElement.scrollWidth).toBeLessThanOrEqual(canvasElement.clientWidth + 1);
    });

    await step('O ponto é vermelho, e a PALAVRA é que diz o que houve', async () => {
      await expect(piece.dataset.status).toBe('failed');
      await expect(wordOf(piece).textContent).toBe(terminalBlockLabels().status.failed);
    });
  },
};

/**
 * Interrompido, e o número que prova que a peça não o interpreta.
 *
 * A saída para no meio, que é o que um Ctrl-C produz, e o código de saída é
 * 130 — não é zero, e ainda assim ninguém falhou. Quem diz o que aconteceu é a
 * palavra.
 */
export const Stopped: Story = {
  parameters: {
    covers: ['visual.item6'],
    docs: { source: { transform: terminalBlockStoppedSource } },
  },
  render: () => mount('stopped'),
  play: async ({ canvasElement, step }) => {
    const piece = pieceOf(canvasElement);
    const labels = terminalBlockLabels();

    await step('A saída fica onde parou, e o cursor some', async () => {
      await expect(outputOf(piece)).not.toBeNull();
      await expect(cursorOf(piece)).toBeNull();
      await expect(piece.hasAttribute('aria-busy')).toBe(false);
    });

    await step('O número não é zero, e a palavra não é a de falha', async () => {
      // Interromper não é erro: se a peça deduzisse o estado do número, este
      // comando apareceria como quebrado — e ninguém o quebrou.
      await expect(exitOf(piece)!.textContent).toContain('130');
      await expect(wordOf(piece).textContent).toBe(labels.status.stopped);
      await expect(labels.status.stopped).not.toBe(labels.status.failed);
    });
  },
};

/**
 * O comando que terminou sem escrever nada.
 *
 * Caso real, e não borda — é o que um terminal de verdade mostra. A ausência da
 * caixa é o assunto: caixa vazia com parada de tabulação dentro seria dar foco a
 * lugar nenhum.
 */
export const WithoutOutput: Story = {
  parameters: {
    covers: ['functional.item4', 'visual.item7'],
    docs: { source: { transform: terminalBlockWithoutOutputSource } },
  },
  render: () => ({
    Component: TerminalBlockWithoutOutputStory,
    props: { command: TERMINAL_COMMAND, labels: terminalBlockLabels() },
  }),
  play: async ({ canvasElement, step }) => {
    const pieces = [...canvasElement.querySelectorAll<HTMLElement>('[data-slot="terminal-block"]')];

    await step('Nenhuma das duas desenha caixa de saída', async () => {
      // Uma terminou sem escrever nada, a outra ainda não rodou. Os dois casos
      // dizem a mesma coisa sobre a caixa: não há o que mostrar.
      for (const piece of pieces) await expect(outputOf(piece)).toBeNull();
    });

    await step('E não sobra parada de tabulação nenhuma', async () => {
      // Sem a caixa, a peça inteira é texto: nada aqui recebe foco, e nada aqui
      // aparece na ordem de tabulação sem ter o que fazer.
      for (const piece of pieces) {
        await expect([...piece.querySelectorAll('[tabindex]')]).toEqual([]);
      }
    });

    await step('A palavra continua respondendo o que aconteceu', async () => {
      const labels = terminalBlockLabels();
      await expect(wordOf(pieces[0]!).textContent).toBe(labels.status.complete);
      await expect(exitOf(pieces[0]!)!.textContent).toContain('0');
      await expect(wordOf(pieces[1]!).textContent).toBe(labels.status.idle);
      await expect(exitOf(pieces[1]!)).toBeNull();
    });
  },
};
