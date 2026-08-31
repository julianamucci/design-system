import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect, fn } from 'storybook/test';
import { canWithdraw, type QueuedMessage } from '@shared/primitives/chat-protocol';
import { NdsMessageQueue } from './message-queue';
import { queueLabels, sending, waiting } from './message-queue.fixtures';
import {
  queueEmptySource,
  queueSendingSource,
  queueWaitingSource,
} from './message-queue.source';

// ─── Meta ─────────────────────────────────────────────────────────────────────
//
// ESTA PEÇA NÃO TEM ARQUIVO DE VARIANTES, e a ausência é decisão.
//
// Variante é FORMA — quem monta a escolhe e ela não muda durante o uso, como a
// espécie de uma etiqueta de contexto. Aqui não existe eixo assim: a fila tem um
// desenho só, e tudo o que muda nela é SITUAÇÃO — a mensagem espera, a mensagem
// está saindo, não há mensagem nenhuma. Um arquivo de variantes com estados
// dentro diria que há uma escolha de forma onde não há, e a próxima pessoa
// procuraria a diferença que não existe.

const meta: Meta = {
  title: 'Primitives/Conversational/MessageQueue/States',
  tags: ['conversational'],
  decorators: [moduleMetadata({ imports: [NdsMessageQueue] })],
  // Sem argTypes nem callbacks: sem isto os painéis Controls e Actions abrem vazios.
  parameters: {
    layout: 'padded',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: queueWaitingSource },
      description: {
        component:
          'Quem ainda espera pode ser retirada; quem já está indo, não — e é a única diferença de interação da peça.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

/** Espião de escopo de módulo: dentro do render, a play não o alcança. */
const onWithdraw = fn();

const mount = (messages: QueuedMessage[]) => ({
  props: { labels: queueLabels(), messages, onWithdraw },
  template: `
    <nds-message-queue
      class="nds-max-w-lg"
      [labels]="labels"
      [messages]="messages"
      (withdraw)="onWithdraw($event)"
    />
  `,
});

const listOf = (canvasElement: HTMLElement) =>
  canvasElement.querySelector<HTMLElement>('[data-slot="composer-queue"]');

export const Waiting: Story = {
  parameters: {
    covers: [
      'functional.item1', 'functional.item3',
      'accessibility.item4',
      'visual.item2',
    ],
  },
  render: () => mount(waiting()),
  play: async ({ canvasElement, step }) => {
    const list = listOf(canvasElement)!;
    const labels = queueLabels();
    const queued = waiting();

    await step('Um item por mensagem, na ORDEM recebida', async () => {
      // A ordem é a fila: reordenar aqui seria inventar uma decisão que é de
      // quem envia.
      await expect(list.children).toHaveLength(queued.length);
      const texts = [...list.children].map(
        (li) => li.querySelector('[data-slot="composer-queue-text"]')!.textContent,
      );
      await expect(texts).toEqual(queued.map((message) => message.text));
    });

    await step('E a posição acompanha, de um até a última', async () => {
      const positions = [...list.children].map(
        (li) => li.querySelector('[data-slot="composer-queue-position"]')!.textContent,
      );
      await expect(positions).toEqual(['1', '2', '3']);
    });

    await step('Cada botão de retirar diz QUAL mensagem retira', async () => {
      // Uma fila de três botões chamados "Retirar" é um botão só para quem
      // navega por audição.
      for (const message of queued) {
        const li = list.querySelector<HTMLElement>(
          `[data-slot="composer-queue-item"][data-message-id="${message.id}"]`,
        )!;
        // Pela CLASSE: o `ndsButton` liga `data-slot="button"` por host binding
        // e disputa com o estático do template (§8 do RULES.md).
        const button = li.querySelector<HTMLElement>('.nds-composer-queue-withdraw')!;
        await expect(button).toHaveAccessibleName(
          labels.withdraw.replace('{text}', message.text),
        );
      }
    });
  },
};

export const Sending: Story = {
  parameters: {
    covers: [
      'functional.item4',
      'accessibility.item3', 'accessibility.item5', 'accessibility.item6',
      'visual.item3',
    ],
    docs: { source: { transform: queueSendingSource } },
  },
  render: () => mount(sending()),
  play: async ({ canvasElement, step }) => {
    const list = listOf(canvasElement)!;
    const labels = queueLabels();
    const first = list.children[0] as HTMLElement;

    await step('A que já está indo se marca como OCUPADA e não oferece retirar', async () => {
      // Ela já saiu, e o que acontece depois disso é do produto. Botão que
      // promete desfazer o que não desfaz é pior que botão nenhum.
      await expect(first.dataset.state).toBe('sending');
      await expect(first.getAttribute('aria-busy')).toBe('true');
      await expect(first.querySelector('.nds-composer-queue-withdraw')).toBeNull();
      await expect(canWithdraw(sending()[0]!)).toBe(false);
    });

    await step('E a PALAVRA do estado é o que a distingue, não a transparência', async () => {
      // Cor e opacidade sozinhas não descrevem estado (WCAG 1.4.1). A palavra é
      // o que chega a quem ouve, e é ela que diz o que está acontecendo.
      const stateLabel = first.querySelector<HTMLElement>(
        '[data-slot="composer-queue-state"]',
      )!;
      await expect(stateLabel.textContent).toBe(labels.state.sending);
      const second = list.children[1] as HTMLElement;
      await expect(
        second.querySelector('[data-slot="composer-queue-state"]')!.textContent,
      ).toBe(labels.state.waiting);
      await expect(labels.state.sending).not.toBe(labels.state.waiting);
    });

    await step('A fila NÃO é região viva: nada aqui se anuncia sozinho', async () => {
      // Cada item entrou porque a própria pessoa o escreveu, e devolver em voz
      // o que se acabou de digitar é repetir, não informar.
      await expect(list.getAttribute('aria-live')).toBeNull();
      await expect(list.getAttribute('role')).toBeNull();
      await expect(
        list.querySelectorAll('[aria-live], [role="log"], [role="status"]'),
      ).toHaveLength(0);
    });
  },
};

export const Empty: Story = {
  parameters: {
    covers: ['functional.item6', 'visual.item4'],
    docs: { source: { transform: queueEmptySource } },
  },
  // Sem mensagem nenhuma: o elemento continua no documento — customizado não
  // deixa de existir —, e o que some é a LISTA.
  render: () => ({
    props: { labels: queueLabels() },
    template: '<nds-message-queue class="nds-max-w-lg" [labels]="labels" />',
  }),
  play: async ({ canvasElement, step }) => {
    await step('Sem mensagem, a fila não existe no documento', async () => {
      // Não é uma lista vazia escondida: é ausência. Uma lista vazia seria
      // anunciada como "lista com zero itens", que promete algo que não há.
      await expect(listOf(canvasElement)).toBeNull();
    });
  },
};
