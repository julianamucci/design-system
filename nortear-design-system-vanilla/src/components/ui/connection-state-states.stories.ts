import type { Meta, StoryObj } from '@storybook/html-vite';
import { expect, fn } from 'storybook/test';
import { createConnectionState } from './connection-state';
import { connectionStateLabels, CONNECTION_COUNTDOWN } from './connection-state.fixtures';
import {
  connectionStateConnectedSource,
  connectionStateDisconnectedSource,
  connectionStateEveryStateSource,
  connectionStateReconnectingSource,
} from './connection-state.source';
import { CONNECTION_STATES, type ConnectionState } from '@shared/primitives/chat-protocol';

// ─── Meta ─────────────────────────────────────────────────────────────────────
//
// Os três estados de uma ligação. Não há eixo de forma nesta peça: a linha é
// sempre a mesma, e o que muda é se ainda há por onde pedir.

const meta: Meta = {
  title: 'Components/Conversational/ConnectionState/States',
  tags: ['conversational'],
  parameters: {
    layout: 'padded',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: connectionStateEveryStateSource },
      description: {
        component:
          'O estado decide a palavra, a cor do ponto, se a contagem tem o que contar e o que a ação oferece — e a ação troca de nome quando troca de função.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

const onRetry = fn();

/**
 * A MESMA contagem vai para os três, de propósito.
 *
 * É o que faz a story provar a decisão 3 da folha em vez de só ilustrá-la: a
 * peça recusa desenhá-la onde nenhuma tentativa está marcada, e a recusa é do
 * vocabulário compartilhado, não deste andaime.
 */
const mount = (state: ConnectionState) =>
  createConnectionState({
    state,
    countdown: CONNECTION_COUNTDOWN,
    labels: connectionStateLabels(),
    onRetry,
  });

const lineOf = (canvasElement: HTMLElement) =>
  canvasElement.querySelector<HTMLElement>('[data-slot="connection-state"]')!;

const actionOf = (line: HTMLElement) =>
  line.querySelector<HTMLButtonElement>('[data-slot="connection-state-action"]');

const countdownOf = (line: HTMLElement) =>
  line.querySelector<HTMLElement>('[data-slot="connection-state-countdown"]');

/**
 * Os três, um abaixo do outro.
 *
 * A lista sai de `CONNECTION_STATES`, e não de três linhas escritas à mão:
 * estado novo no vocabulário compartilhado entra nesta story sozinho, que é
 * exatamente o que aquela constante existe para garantir.
 */
export const EveryState: Story = {
  parameters: {
    covers: [
      'functional.item1', 'functional.item5', 'functional.item6',
      'accessibility.item5',
      'visual.item2',
    ],
  },
  render: () => {
    const stack = document.createElement('div');
    stack.className = 'nds-stack';
    stack.dataset.spacing = 'md';
    for (const state of CONNECTION_STATES) stack.appendChild(mount(state));
    return stack;
  },
  play: async ({ canvasElement, step }) => {
    const lines = [...canvasElement.querySelectorAll<HTMLElement>('[data-slot="connection-state"]')];
    const rotulos = connectionStateLabels();

    await step('Há uma linha por estado, na ordem do vocabulário', async () => {
      await expect(lines).toHaveLength(CONNECTION_STATES.length);
      await expect(lines.map((l) => l.dataset.state)).toEqual([...CONNECTION_STATES]);
    });

    await step('Cada uma traz a PALAVRA daquele estado, e o ponto sai da leitura', async () => {
      for (const [i, state] of CONNECTION_STATES.entries()) {
        const line = lines[i]!;
        const label = line.querySelector<HTMLElement>('[data-slot="connection-state-label"]')!;
        await expect(label.textContent).toBe(rotulos.state[state]);
        const dot = line.querySelector<HTMLElement>('[data-slot="connection-state-dot"]')!;
        await expect(dot.getAttribute('aria-hidden')).toBe('true');
      }
    });

    await step('A ligação de pé não traz botão nenhum', async () => {
      // Sobre uma ligação que está funcionando não há o que fazer aqui.
      for (const [i, state] of CONNECTION_STATES.entries()) {
        const expected = rotulos.action?.[state];
        const button = actionOf(lines[i]!);
        if (expected) await expect(button).toHaveAccessibleName(expected);
        else await expect(button).toBeNull();
      }
    });

    await step('E os rótulos de ação são DOIS nomes diferentes', async () => {
      // Apressar a tentativa que já está marcada é outra coisa que começar uma
      // quando não há nenhuma (decisão 5 da folha). Botão que troca de função
      // sem trocar de nome é o mesmo botão fazendo coisas diferentes.
      const nomes = [...canvasElement.querySelectorAll<HTMLElement>(
        '[data-slot="connection-state-action"]',
      )].map((b) => b.textContent);
      await expect(nomes).toHaveLength(2);
      await expect(new Set(nomes).size).toBe(2);
    });
  },
};

export const Connected: Story = {
  parameters: {
    covers: ['visual.item5'],
    docs: { source: { transform: connectionStateConnectedSource } },
  },
  render: () => mount('connected'),
  play: async ({ canvasElement, step }) => {
    const line = lineOf(canvasElement);
    const rotulos = connectionStateLabels();

    await step('A ligação de pé se diz em palavra, e não só na cor do ponto', async () => {
      await expect(line.dataset.state).toBe('connected');
      const label = line.querySelector<HTMLElement>('[data-slot="connection-state-label"]')!;
      await expect(label.textContent).toBe(rotulos.state.connected);
    });

    await step('E não há contagem nem ação: nada caiu, nada a fazer', async () => {
      // O andaime passa a mesma contagem aos três; aqui ela não é desenhada
      // porque nenhuma tentativa está marcada.
      await expect(countdownOf(line)).toBeNull();
      await expect(actionOf(line)).toBeNull();
    });
  },
};

export const Reconnecting: Story = {
  parameters: {
    covers: ['visual.item3'],
    docs: { source: { transform: connectionStateReconnectingSource } },
  },
  render: () => mount('reconnecting'),
  play: async ({ canvasElement, step }) => {
    const line = lineOf(canvasElement);
    const rotulos = connectionStateLabels();

    await step('Enquanto algo tenta, a contagem tem o que contar', async () => {
      const clock = countdownOf(line)!;
      await expect(clock.textContent).toBe(CONNECTION_COUNTDOWN);
      await expect(clock.getAttribute('aria-hidden')).toBe('true');
    });

    await step('E a ação oferece APRESSAR a tentativa que já existe', async () => {
      await expect(actionOf(line)).toHaveAccessibleName(rotulos.action!.reconnecting!);
    });
  },
};

export const Disconnected: Story = {
  parameters: {
    covers: ['functional.item3', 'visual.item4'],
    docs: { source: { transform: connectionStateDisconnectedSource } },
  },
  render: () => mount('disconnected'),
  play: async ({ canvasElement, step }) => {
    const line = lineOf(canvasElement);
    const rotulos = connectionStateLabels();

    await step('Sem tentativa marcada, a contagem NÃO é desenhada', async () => {
      // O andaime passa a mesma contagem que a story anterior recebe. Quem a
      // recusa aqui é `isRetryScheduled`, do vocabulário compartilhado: "em 5 s"
      // ao lado de "Sem ligação" é um relógio que não corre.
      await expect(countdownOf(line)).toBeNull();
    });

    await step('E a ação oferece COMEÇAR uma, com nome próprio', async () => {
      const acao = actionOf(line)!;
      await expect(acao).toHaveAccessibleName(rotulos.action!.disconnected!);
      await expect(rotulos.action!.disconnected).not.toBe(rotulos.action!.reconnecting);
    });
  },
};
