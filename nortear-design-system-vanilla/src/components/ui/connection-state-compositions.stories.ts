import type { Meta, StoryObj } from '@storybook/html-vite';
import { expect, fn, userEvent } from 'storybook/test';
import { createConnectionState } from './connection-state';
import { createAgentStatus } from './agent-status';
import { connectionStateLabels, CONNECTION_COUNTDOWN } from './connection-state.fixtures';
import { agentStatusLabels, elapsedOf } from './agent-status.fixtures';
import {
  connectionStateBesideRunSource,
  connectionStateReconnectingSource,
} from './connection-state.source';

// ─── Meta ─────────────────────────────────────────────────────────────────────
//
// Onde a linha mora em relação à linha do estado da execução, e o que acontece
// quando alguém aperta a ação — que, do lado de cá, é só um aviso.

const meta: Meta = {
  title: 'Primitives/Conversational/ConnectionState/Compositions',
  tags: ['conversational'],
  parameters: {
    layout: 'padded',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: connectionStateBesideRunSource },
      description: {
        component:
          'As duas linhas respondem a perguntas diferentes, e nenhuma sabe que a outra existe — a peça não reconecta nada do que oferece.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

/** Espião de escopo de módulo: dentro do render, a play não o alcança. */
const onRetry = fn();

/**
 * As duas linhas, uma sobre a outra.
 *
 * A execução parou e a ligação caiu — o par que mostra por que os dois
 * vocabulários são separados: se fossem um só, este estado não teria como ser
 * escrito.
 */
export const BesideRunStatus: Story = {
  parameters: { covers: ['functional.item8', 'visual.item6'] },
  render: () => {
    const stack = document.createElement('div');
    stack.className = 'nds-stack nds-max-w-lg';
    stack.dataset.spacing = 'sm';
    stack.append(
      createConnectionState({
        state: 'reconnecting',
        countdown: CONNECTION_COUNTDOWN,
        labels: connectionStateLabels(),
        onRetry,
      }),
      createAgentStatus({
        status: 'stopped',
        elapsed: elapsedOf('stopped'),
        labels: agentStatusLabels(),
      }),
    );
    return stack;
  },
  play: async ({ canvasElement, step }) => {
    const connection = canvasElement.querySelector<HTMLElement>('[data-slot="connection-state"]')!;
    const run = canvasElement.querySelector<HTMLElement>('[data-slot="agent-status"]')!;

    await step('As duas linhas existem, e uma não contém a outra', async () => {
      // Cada uma responde a uma pergunta: se ainda há por onde pedir, e o que o
      // agente está fazendo com o que já foi pedido. Aninhá-las faria a segunda
      // parecer detalhe da primeira.
      await expect(connection.contains(run)).toBe(false);
      await expect(run.contains(connection)).toBe(false);
    });

    await step('A ligação vem ANTES na ordem de leitura', async () => {
      // Sem ligação não há execução que valha, então ela é a primeira coisa a
      // ser encontrada por quem percorre a tela.
      await expect(
        connection.compareDocumentPosition(run) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    });

    await step('Só a ligação carrega região viva; a execução, nenhuma', async () => {
      // A exceção é DESTA peça, e não da folha inteira: a linha da execução
      // continua muda, porque quem lê está ouvindo a resposta ser gerada.
      const label = connection.querySelector<HTMLElement>('[data-slot="connection-state-label"]')!;
      await expect(label.getAttribute('role')).toBe('status');
      await expect(run.querySelector('[role="status"], [aria-live]')).toBeNull();
    });
  },
};

export const Requesting: Story = {
  parameters: {
    covers: ['functional.item7', 'accessibility.item6'],
    docs: { source: { transform: connectionStateReconnectingSource } },
  },
  render: () =>
    createConnectionState({
      state: 'reconnecting',
      countdown: CONNECTION_COUNTDOWN,
      labels: connectionStateLabels(),
      onRetry,
    }),
  play: async ({ canvasElement, step }) => {
    const line = canvasElement.querySelector<HTMLElement>('[data-slot="connection-state"]')!;
    const action = line.querySelector<HTMLButtonElement>('[data-slot="connection-state-action"]')!;
    const rotulos = connectionStateLabels();

    await step('O alvo de toque tem pelo menos vinte e quatro pixels', async () => {
      // WCAG 2.5.8. Uma ação encostada no fim de uma linha estreita é onde a
      // tentação de encolher é maior.
      const caixa = action.getBoundingClientRect();
      await expect(caixa.width).toBeGreaterThanOrEqual(24);
      await expect(caixa.height).toBeGreaterThanOrEqual(24);
    });

    await step('Acionar avisa quem consome', async () => {
      onRetry.mockClear();
      await userEvent.click(action);
      await expect(onRetry).toHaveBeenCalledTimes(1);
    });

    await step('E a linha continua como estava — a peça não religa nada', async () => {
      // Reconectar de verdade é de quem consome, e é ele quem devolve o estado
      // novo. Uma linha que se religasse sozinha estaria adivinhando o que
      // ainda não aconteceu.
      await expect(line.dataset.state).toBe('reconnecting');
      const label = line.querySelector<HTMLElement>('[data-slot="connection-state-label"]')!;
      await expect(label.textContent).toBe(rotulos.state.reconnecting);
      await expect(action).toHaveAccessibleName(rotulos.action!.reconnecting!);
    });
  },
};
