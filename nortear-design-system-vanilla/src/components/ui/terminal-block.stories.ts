import type { Meta, StoryObj } from '@storybook/html-vite';
import { expect } from 'storybook/test';
import { createTerminalBlock } from './terminal-block';
import { linesFor, terminalBlockLabels } from './terminal-block.fixtures';
import { terminalBlockSource } from './terminal-block.source';
import { isRunFinished, RUN_STATUSES, type RunStatus } from '@shared/primitives/chat-protocol';
import { TERMINAL_COMMAND } from '@shared/primitives/terminal-block-examples';
import { createTerminalBlockDocs } from '@/components/docs/TerminalBlockDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

/**
 * Os três eixos da peça, numa peça só.
 *
 * O estado decide a palavra, a cor do ponto, se a peça se declara ocupada e se
 * há cursor; o código de saída só existe depois que a execução acabou; e a
 * ausência de saída decide se há caixa que rola. A grade dos cinco estados mora
 * em `States`; aqui o assunto é o que muda quando se mexe em cada eixo.
 */
type PlaygroundArgs = {
  status: RunStatus;
  exitCode: number;
  withOutput: boolean;
};

const meta: Meta<PlaygroundArgs> = {
  title: 'Components/Conversational/TerminalBlock',
  tags: ['autodocs', 'conversational'],
  parameters: {
    layout: 'padded',
    actions: { disable: true },
    docs: {
      page: withAutoDocsTab(createTerminalBlockDocs),
      source: { transform: terminalBlockSource },
    },
  },
  argTypes: {
    status: {
      control: 'select',
      options: [...RUN_STATUSES],
      description:
        'Em que pé está o comando. Decide a palavra, a cor do ponto, se a peça se declara ocupada e se há cursor.',
      table: {
        type: { summary: RUN_STATUSES.map((s) => `'${s}'`).join(' | ') },
        defaultValue: { summary: "'idle'" },
      },
    },
    exitCode: {
      control: { type: 'number' },
      description:
        'O que o processo devolveu ao terminar. Só aparece depois que a execução acabou, e não decide o estado — há comando que devolve um sem ter falhado.',
      table: { type: { summary: 'number' }, defaultValue: { summary: '—' } },
    },
    withOutput: {
      control: 'boolean',
      description:
        'Houve saída? Sem linha nenhuma não há caixa que rola, e é o caso de um comando que terminou sem escrever nada.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
  },
  args: {
    status: 'complete',
    exitCode: 0,
    withOutput: true,
  },
};

export default meta;
type Story = StoryObj<PlaygroundArgs>;

export const Playground: Story = {
  parameters: {
    covers: [
      'functional.item1', 'functional.item2', 'functional.item3', 'functional.item5',
      'accessibility.item1', 'accessibility.item2', 'accessibility.item4',
      'visual.item1',
    ],
  },
  render: (args) =>
    createTerminalBlock({
      command: TERMINAL_COMMAND,
      lines: args.withOutput ? linesFor(args.status) : [],
      status: args.status,
      exitCode: Number.isFinite(args.exitCode) ? args.exitCode : undefined,
      labels: terminalBlockLabels(),
    }),
  play: async ({ canvasElement, step, args }) => {
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="terminal-block"]')!;
    const labels = terminalBlockLabels();

    await step('A palavra do estado escolhido está na peça', async () => {
      // O ponto ao lado é REFORÇO, e ponto colorido não descreve estado sozinho
      // (WCAG 1.4.1): três dos cinco só se distinguiriam por cor.
      await expect(root.dataset.status).toBe(args.status);
      const word = root.querySelector<HTMLElement>('[data-slot="terminal-block-status"]')!;
      await expect(word.textContent).toBe(labels.status[args.status]);
      const dot = root.querySelector<HTMLElement>('[data-slot="terminal-block-dot"]')!;
      await expect(dot.getAttribute('aria-hidden')).toBe('true');
    });

    await step('O comando aparece como escrito, e o sinal fica fora do que é lido', async () => {
      // Lido em voz, o sinal viraria uma palavra que ninguém executou — e ele
      // não faz parte nem do que se executou nem do que se copiaria.
      const text = root.querySelector<HTMLElement>('[data-slot="terminal-block-command-text"]')!;
      await expect(text.textContent).toBe(TERMINAL_COMMAND);
      await expect(text.getAttribute('lang')).toBe('en');
      const sigil = root.querySelector<HTMLElement>('[data-slot="terminal-block-sigil"]')!;
      await expect(sigil.getAttribute('aria-hidden')).toBe('true');
    });

    await step('A monoespaçada está nos dois lugares que dependem dela', async () => {
      // Ela vem de uma utilitária que mora na marcação, não nesta folha — e por
      // isso some em silêncio quando alguém copia a árvore pela metade. Esta
      // asserção é o que impede o silêncio: saída de terminal se alinha em
      // COLUNAS, e coluna só fecha com avanço fixo.
      const commandLine = root.querySelector<HTMLElement>('[data-slot="terminal-block-command"]')!;
      await expect(commandLine.classList.contains('nds-font-mono')).toBe(true);
      const output = root.querySelector<HTMLElement>('[data-slot="terminal-block-output"]');
      if (output) await expect(output.classList.contains('nds-font-mono')).toBe(true);
    });

    await step('A caixa de saída existe quando há o que mostrar, e tem o comando por nome', async () => {
      const output = root.querySelector<HTMLElement>('[data-slot="terminal-block-output"]');
      const shouldExist = (args.withOutput && linesFor(args.status).length > 0) || args.status === 'running';
      if (!shouldExist) {
        // Caixa vazia com parada de tabulação dentro seria dar foco a lugar
        // nenhum — e um comando que não escreveu nada é caso real.
        await expect(output).toBeNull();
        return;
      }
      await expect(output!.tabIndex).toBe(0);
      await expect(output).toHaveAccessibleName(TERMINAL_COMMAND);
    });

    await step('O código de saída só existe depois do fim', async () => {
      // Quem responde "já acabou?" é o vocabulário compartilhado, e não um `if`
      // desta stack: código de saída ao lado de "Em andamento" é um resultado
      // que ainda não aconteceu.
      const exit = root.querySelector<HTMLElement>('[data-slot="terminal-block-exit"]');
      if (!isRunFinished(args.status) || !Number.isFinite(args.exitCode)) {
        await expect(exit).toBeNull();
        return;
      }
      await expect(exit!.textContent).toBe(
        labels.exitCode.replace('{code}', String(args.exitCode)),
      );
      // Ele CHEGA a quem ouve: não se reescreve, então não é o número de que a
      // folha se defende.
      await expect(exit!.closest('[aria-hidden="true"]')).toBeNull();
    });

    await step('Nada na peça é região viva', async () => {
      // Saída de comando chega em rajada, e anunciá-la pedaço a pedaço torna a
      // tela impossível de ouvir (regra 1 da §8 da guideline 17). O que existe
      // no lugar é a peça se declarar ocupada.
      await expect(root.hasAttribute('aria-live')).toBe(false);
      const alive = root.querySelectorAll(
        '[role="status"], [role="alert"], [role="log"], [aria-live]',
      );
      await expect([...alive]).toEqual([]);
      await expect(root.getAttribute('aria-busy')).toBe(
        args.status === 'running' ? 'true' : null,
      );
    });
  },
};
