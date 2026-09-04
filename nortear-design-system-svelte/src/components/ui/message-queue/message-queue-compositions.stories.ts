import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import MessageQueueAboveComposerStory from './MessageQueueAboveComposerStory.svelte';
import { longQueue, queueLabels, waiting } from './message-queue.fixtures';
import { queueAboveFieldSource, queueLongSource } from './message-queue.source';

// ─── Meta ─────────────────────────────────────────────────────────────────────
//
// A fila é AUTÔNOMA: o campo não sabe que ela existe, e nem precisa saber.
// Contexto, anexo e citação vivem DENTRO da moldura porque descrevem o que
// ainda está sendo escrito; a fila é o oposto — é o que já saiu das mãos de
// quem escreve. Quem consome empilha as duas peças, e é isso que estas stories
// mostram.

const meta: Meta<typeof MessageQueueAboveComposerStory> = {
  title: 'Components/Conversational/MessageQueue/Compositions',
  component: MessageQueueAboveComposerStory,
  tags: ['conversational'],
  parameters: {
    layout: 'padded',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: queueAboveFieldSource },
      description: {
        component:
          'O lugar da fila em relação ao campo, e o que ela deliberadamente NÃO faz quando alguém pede para retirar.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof MessageQueueAboveComposerStory>;

/** Espião de escopo de módulo: dentro do render, a play não o alcança. */
const onWithdraw = fn();

export const AboveComposer: Story = {
  parameters: { covers: ['functional.item7', 'visual.item5'] },
  render: () => ({
    Component: MessageQueueAboveComposerStory,
    props: { messages: waiting(), onWithdraw },
  }),
  play: async ({ canvasElement, step }) => {
    const list = canvasElement.querySelector<HTMLElement>('[data-slot="composer-queue"]')!;
    const composer = canvasElement.querySelector<HTMLElement>('[data-slot="composer"]')!;
    const field = composer.querySelector<HTMLElement>('.nds-composer-field')!;

    await step('A fila vem ANTES do campo na ordem do documento', async () => {
      // A ordem do documento é a ordem de leitura: primeiro o que já saiu,
      // depois onde se escreve o próximo.
      await expect(
        list.compareDocumentPosition(composer) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    });

    await step('E FORA da moldura dele — a fila não descreve o que se escreve', async () => {
      // Contexto e citação moram dentro porque mudam o que se escreve. A fila
      // não: ela é o que já saiu, e dentro da moldura se misturaria com o que
      // ainda não saiu.
      await expect(field.contains(list)).toBe(false);
      await expect(composer.contains(list)).toBe(false);
    });

    await step('O campo tampouco a cita na própria descrição', async () => {
      // Três mensagens ali virariam ruído que se ouve a cada foco no campo, e a
      // fila já se anuncia sozinha, com nome e contagem, ao ser percorrida.
      const input = composer.querySelector<HTMLElement>('[data-slot="composer-input"]')!;
      const ids = (input.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(Boolean);
      const describedBy = ids.map((id) => canvasElement.ownerDocument.getElementById(id));
      await expect(describedBy).not.toContain(list);
      for (const el of describedBy) {
        await expect(el?.contains(list)).toBe(false);
      }
    });
  },
};

export const Withdrawing: Story = {
  parameters: { covers: ['functional.item5', 'accessibility.item7'] },
  render: () => ({
    Component: MessageQueueAboveComposerStory,
    props: { messages: waiting(), onWithdraw },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const list = canvasElement.querySelector<HTMLElement>('[data-slot="composer-queue"]')!;
    const labels = queueLabels();
    const target = waiting()[1]!;
    const withdrawButton = () =>
      canvas.getByRole('button', {
        name: labels.withdraw.replace('{text}', target.text),
      });

    await step('O alvo de toque tem pelo menos vinte e quatro pixels', async () => {
      // WCAG 2.5.8. Um botão de ícone dentro de uma linha estreita é onde a
      // tentação de encolher é maior.
      const box = withdrawButton().getBoundingClientRect();
      await expect(box.width).toBeGreaterThanOrEqual(24);
      await expect(box.height).toBeGreaterThanOrEqual(24);
    });

    await step('Acionar o botão avisa quem consome, com a mensagem junto', async () => {
      // A peça NÃO retira nada: quem envia é quem sabe se a mensagem ainda dá
      // para segurar, e é ele que decide.
      onWithdraw.mockClear();
      await userEvent.click(withdrawButton());
      await expect(onWithdraw).toHaveBeenCalledTimes(1);
      await expect(onWithdraw).toHaveBeenCalledWith(
        expect.objectContaining({ id: target.id, text: target.text, state: 'waiting' }),
      );
    });

    await step('E a fila continua igual — retirar de verdade é de quem recebe', async () => {
      await expect(list.querySelectorAll('[data-slot="composer-queue-item"]')).toHaveLength(3);
    });
  },
};

export const LongQueue: Story = {
  parameters: {
    covers: ['visual.item6'],
    docs: { source: { transform: queueLongSource } },
  },
  render: () => ({
    Component: MessageQueueAboveComposerStory,
    props: { messages: longQueue(), onWithdraw },
  }),
  play: async ({ canvasElement, step }) => {
    const list = canvasElement.querySelector<HTMLElement>('[data-slot="composer-queue"]')!;

    await step('Passando de nove, a posição ganha dois dígitos e segue no documento', async () => {
      // É o único caso em que o número de dois dígitos tem o que provar, e ele
      // não aparece em fila curta.
      const positions = [...list.children].map(
        (li) => li.querySelector('[data-slot="composer-queue-position"]')!.textContent,
      );
      await expect(positions).toEqual(
        Array.from({ length: 12 }, (_, i) => String(i + 1)),
      );
    });
  },
};
