import type { Meta, StoryObj } from '@storybook/html-vite';
import { expect } from 'storybook/test';
import { createTerminalBlock } from './terminal-block';
import { createAgentStatus } from './agent-status';
import { exitCodeFor, linesFor, terminalBlockLabels } from './terminal-block.fixtures';
import { agentStatusLabels, elapsedOf } from './agent-status.fixtures';
import {
  terminalBlockBesideRunSource,
  terminalBlockLongOutputSource,
  terminalBlockSequenceSource,
} from './terminal-block.source';
import {
  TERMINAL_COMMAND,
  TERMINAL_LINES_COMPLETE,
} from '@shared/primitives/terminal-block-examples';

// ─── Meta ─────────────────────────────────────────────────────────────────────
//
// Onde a peça mora em relação às irmãs, e o que acontece com a saída quando ela
// é maior que o espaço — que é a pergunta de desenho mais difícil desta peça.

const meta: Meta = {
  title: 'Components/Conversational/TerminalBlock/Compositions',
  tags: ['conversational'],
  parameters: {
    layout: 'padded',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: terminalBlockBesideRunSource },
      description: {
        component:
          'A peça é autônoma: ela não sabe que as irmãs existem, não conhece a sequência em que está e não executa nada — parar e repetir são do estado da execução.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

const blocksIn = (canvasElement: HTMLElement) => [
  ...canvasElement.querySelectorAll<HTMLElement>('[data-slot="terminal-block"]'),
];

/**
 * Três comandos em sequência, cada um no seu estado.
 *
 * A sequência é de quem consome: a peça desenha UM comando, e empilhá-las é o
 * que produz a sequência. Uma peça que recebesse a lista decidiria ordenação e
 * agrupamento, que são política de produto.
 */
export const CommandSequence: Story = {
  parameters: {
    covers: ['functional.item11', 'visual.item8'],
    docs: { source: { transform: terminalBlockSequenceSource } },
  },
  render: () => {
    const stack = document.createElement('div');
    stack.className = 'nds-stack nds-max-w-lg';
    stack.dataset.spacing = 'lg';
    for (const status of ['complete', 'failed', 'idle'] as const) {
      stack.appendChild(
        createTerminalBlock({
          command: TERMINAL_COMMAND,
          lines: linesFor(status),
          status,
          exitCode: exitCodeFor(status),
          labels: terminalBlockLabels(),
        }),
      );
    }
    return stack;
  },
  play: async ({ canvasElement, step }) => {
    const pieces = blocksIn(canvasElement);

    await step('Cada peça é autônoma, e nenhuma contém a outra', async () => {
      await expect(pieces).toHaveLength(3);
      for (const piece of pieces) {
        for (const other of pieces.filter((p) => p !== piece)) {
          await expect(piece.contains(other)).toBe(false);
        }
      }
    });

    await step('Cada caixa que rola tem o NOME do comando que a produziu', async () => {
      // Três comandos empilhados são três caixas roláveis na ordem de
      // tabulação. Sem nome, o leitor anunciaria "grupo" três vezes, e quem
      // navega por teclado não saberia em qual delas parou.
      for (const piece of pieces) {
        const output = piece.querySelector<HTMLElement>('[data-slot="terminal-block-output"]');
        if (output) await expect(output).toHaveAccessibleName(TERMINAL_COMMAND);
      }
    });

    await step('E o que ainda não rodou não desenha caixa nenhuma', async () => {
      const queued = pieces[2]!;
      await expect(queued.dataset.status).toBe('idle');
      await expect(queued.querySelector('[data-slot="terminal-block-output"]')).toBeNull();
    });
  },
};

/**
 * A peça abaixo da linha de estado da execução.
 *
 * O par que mostra por que os dois escopos são separados: aquela linha descreve
 * a resposta inteira e carrega as ações de parar e repetir, esta mostra o que
 * um comando dentro dela escreveu. Se fossem uma coisa só, haveria dois botões
 * de parar na tela para uma execução — e quem apertasse um não saberia qual
 * parou.
 */
export const BesideRunStatus: Story = {
  parameters: { covers: ['functional.item12', 'visual.item9'] },
  render: () => {
    const stack = document.createElement('div');
    stack.className = 'nds-stack nds-max-w-lg';
    stack.dataset.spacing = 'lg';
    stack.append(
      createAgentStatus({
        status: 'running',
        elapsed: elapsedOf('running'),
        labels: agentStatusLabels(),
      }),
      createTerminalBlock({
        command: TERMINAL_COMMAND,
        lines: linesFor('running'),
        status: 'running',
        labels: terminalBlockLabels(),
      }),
    );
    return stack;
  },
  play: async ({ canvasElement, step }) => {
    const block = blocksIn(canvasElement)[0]!;
    const run = canvasElement.querySelector<HTMLElement>('[data-slot="agent-status"]')!;

    await step('As duas existem, e uma não contém a outra', async () => {
      await expect(block.contains(run)).toBe(false);
      await expect(run.contains(block)).toBe(false);
    });

    await step('A ação de parar existe numa só', async () => {
      // O controle da execução é da linha de estado; o bloco é o REGISTRO do
      // que rodou. Dar a ele um botão próprio duplicaria a pergunta.
      await expect(run.querySelector('[data-slot="agent-status-action"]')).not.toBeNull();
      await expect(block.querySelector('button')).toBeNull();
    });

    await step('E nenhuma das duas carrega região viva', async () => {
      // A exceção da folha é do estado da ligação, do indicador de geração e do
      // cartão de autorização, e nenhuma das duas é isso: aqui nada está
      // bloqueado, e o que se escreve sozinho se declara ocupado.
      await expect(block.querySelector('[role="status"], [aria-live]')).toBeNull();
      await expect(run.querySelector('[role="status"], [aria-live]')).toBeNull();
      await expect(block.getAttribute('aria-busy')).toBe('true');
    });
  },
};

/**
 * A saída longa, com o teto apertado de propósito.
 *
 * O teto entra por custom property, e não por altura em `style`: é a única
 * maneira de mudá-lo sem tirar o valor do tema e da escala de tipo. Ele está em
 * `rem`, então cresce com a fonte do navegador — a 200% de texto a caixa fica
 * maior, em vez de mostrar metade das linhas no mesmo espaço.
 */
export const LongOutput: Story = {
  parameters: {
    covers: ['functional.item10', 'accessibility.item3', 'accessibility.item6', 'visual.item10'],
    docs: { source: { transform: terminalBlockLongOutputSource } },
  },
  render: () => {
    const stack = document.createElement('div');
    stack.className = 'nds-stack nds-max-w-lg';
    stack.dataset.spacing = 'lg';
    // O teto apertado é a única coisa que esta story muda, e é custom property:
    // valor de runtime entra por custom property, nunca por declaração de
    // desenho em `style`.
    stack.style.setProperty('--terminal-block-max-block-size', '6rem');
    stack.appendChild(
      createTerminalBlock({
        command: TERMINAL_COMMAND,
        // A saída inteira, repetida, para transbordar o teto com folga.
        lines: [...TERMINAL_LINES_COMPLETE, ...TERMINAL_LINES_COMPLETE],
        status: 'complete',
        exitCode: 0,
        labels: terminalBlockLabels(),
      }),
    );
    return stack;
  },
  play: async ({ canvasElement, step }) => {
    const piece = blocksIn(canvasElement)[0]!;
    const output = piece.querySelector<HTMLElement>('[data-slot="terminal-block-output"]')!;

    await step('A caixa rola, e o bloco não cresce com ela', async () => {
      // Medido no elemento que de fato RECORTA, e não na raiz do documento —
      // que não transborda porque quem rola é outro, e é assim que um guarda de
      // rolagem fica verde com a barra visível na tela.
      await expect(output.scrollHeight).toBeGreaterThan(output.clientHeight);
      await expect(piece.scrollHeight).toBeLessThanOrEqual(piece.clientHeight + 1);
      await expect(canvasElement.scrollWidth).toBeLessThanOrEqual(canvasElement.clientWidth + 1);
    });

    await step('E ela é alcançável pelo teclado, com o comando por nome', async () => {
      // WCAG 2.1.1, regra `scrollable-region-focusable` do axe: sem isto a
      // saída seria legível só para quem tem mouse.
      //
      // O foco é pedido DIRETO, e não por tabulação: `focus()` só assenta em
      // elemento que de fato pode receber foco, então a asserção prova a mesma
      // coisa sem depender de quantos alvos o canvas da story tem antes dele.
      await expect(output.tabIndex).toBe(0);
      await expect(output).toHaveAccessibleName(TERMINAL_COMMAND);
      output.focus();
      await expect(document.activeElement).toBe(output);
    });
  },
};
