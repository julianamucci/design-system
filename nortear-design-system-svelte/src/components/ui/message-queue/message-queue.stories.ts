import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { expect, fn } from 'storybook/test';
import MessageQueueStory from './MessageQueueStory.svelte';
import { SAMPLE_TEXT, queueLabels } from './message-queue.fixtures';
import { messageQueueSource } from './message-queue.source';
import {
  QUEUED_MESSAGE_STATES,
  canWithdraw,
  type QueuedMessageState,
} from '@shared/primitives/chat-protocol';
import MessageQueueDocs from '@/components/docs/MessageQueueDocs.svelte';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

/** Espião de escopo de módulo: dentro do render, a play não o alcança. */
const onWithdraw = fn();

/**
 * Os dois eixos de uma mensagem na fila, numa mensagem só.
 *
 * A fila com várias mora em `States`; aqui o assunto é o que muda quando se
 * mexe em cada eixo — o estado decide quem oferece retirar e quem se marca como
 * ocupada, e o texto é o que identifica a mensagem na tela e no botão que a
 * retira.
 */
type PlaygroundArgs = {
  state: QueuedMessageState;
  text: string;
};

// O docgen do Svelte está desligado no .storybook/main.ts: a aba
// "API Reference" sai só destes argTypes.
const meta: Meta<PlaygroundArgs> = {
  title: 'Components/Conversational/MessageQueue',
  component: MessageQueueStory,
  tags: ['autodocs', 'conversational'],
  parameters: {
    layout: 'padded',
    actions: { disable: true },
    docs: {
      page: withAutoDocsTab(MessageQueueDocs),
      // Sem docgen, o gerador de source monta a tag a partir do nome interno da
      // função compilada. A transform devolve o uso real.
      source: { transform: messageQueueSource },
    },
  },
  argTypes: {
    state: {
      control: 'select',
      options: [...QUEUED_MESSAGE_STATES],
      description:
        'Em que ponto a mensagem está. Decide quem oferece retirar e quem se marca como ocupada.',
      table: {
        type: { summary: QUEUED_MESSAGE_STATES.map((s) => `'${s}'`).join(' | ') },
        defaultValue: { summary: '—' },
      },
    },
    text: {
      control: 'text',
      description:
        'O que foi escrito. É ele que identifica a mensagem na tela, e é ele que entra no botão que a retira.',
      table: { type: { summary: 'string' }, defaultValue: { summary: '—' } },
    },
  },
  args: {
    state: 'waiting',
    text: SAMPLE_TEXT,
  },
};

export default meta;
type Story = StoryObj<PlaygroundArgs>;

export const Playground: Story = {
  parameters: {
    covers: [
      'functional.item2',
      'accessibility.item1', 'accessibility.item2',
      'visual.item1',
    ],
  },
  render: (args) => ({
    Component: MessageQueueStory,
    props: { ...args, onWithdraw },
  }),
  play: async ({ canvasElement, step, args }) => {
    const list = canvasElement.querySelector<HTMLElement>('[data-slot="composer-queue"]')!;
    const labels = queueLabels();

    await step('A fila é uma lista ORDENADA, com nome próprio', async () => {
      // Ordenada porque aqui a ordem É a informação: uma lista sem ordem
      // anuncia quantos itens há sem dizer em que lugar cada um está, e o lugar
      // é justamente o que quem espera quer saber.
      await expect(list.tagName).toBe('OL');
      await expect(list).toHaveAccessibleName(labels.list);
      await expect(list.children).toHaveLength(1);
    });

    const item = list.children[0] as HTMLElement;

    await step('A posição está ESCRITA no documento, e não desenhada pela folha', async () => {
      // Conteúdo gerado por folha não é confiável para leitor de tela e some
      // quando a folha não carrega — e um número que some é pior que número
      // nenhum.
      const position = item.querySelector<HTMLElement>(
        '[data-slot="composer-queue-position"]',
      )!;
      await expect(position.textContent).toBe('1');
      await expect(item).toHaveTextContent('1');
    });

    await step('O texto escolhido chega inteiro, e o estado chega em PALAVRA', async () => {
      await expect(item.dataset.state).toBe(args.state);
      const text = item.querySelector<HTMLElement>('[data-slot="composer-queue-text"]')!;
      await expect(text.textContent).toBe(args.text);
      const stateLabel = item.querySelector<HTMLElement>(
        '[data-slot="composer-queue-state"]',
      )!;
      await expect(stateLabel.textContent).toBe(labels.state[args.state]);
    });

    await step('E quem pode ser retirada sai do vocabulário, não de um `if` da tela', async () => {
      // O componente pergunta ao protocolo; a tela só desenha a resposta. Sem
      // isso, cinco stacks escreveriam cinco versões da mesma regra e uma delas
      // discordaria.
      const withdrawable = canWithdraw({ text: args.text, state: args.state });
      const button = item.querySelector('[data-slot="composer-queue-withdraw"]');
      await expect(button !== null).toBe(withdrawable);
    });
  },
};
