import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { expect, fn } from 'storybook/test';
import { Composer } from './index';
import { composerLabels } from './composer.fixtures';
import { attachmentLabels, one } from './composer-attachments.fixtures';
import {
  attachmentsFailedSource,
  attachmentsQueueSource,
  attachmentsUploadingSource,
} from './composer-attachments.source';
import type { Attachment } from '@shared/primitives/chat-protocol';

// ─── Meta ─────────────────────────────────────────────────────────────────────
//
// Os quatro estados por que um anexo passa. A fila com todos eles juntos é o
// Playground, e não se repete aqui.

const meta: Meta<typeof Composer> = {
  title: 'UI/ComposerAttachments/States',
  component: Composer,
  tags: ['conversational'],
  parameters: {
    layout: 'padded',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: attachmentsQueueSource },
      description: {
        component: 'Cada story fixa um estado e verifica o que ele muda no item.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Composer>;

/** Espião de escopo de módulo: dentro do render, a play não o alcança. */
const onRemoveAttachment = fn();

const mount = (attachments: Attachment[]) => ({
  Component: Composer,
  props: {
    labels: composerLabels(),
    attachmentLabels: attachmentLabels(),
    attachments,
    onRemoveAttachment,
    class: 'nds-max-w-lg',
  },
});

const itemOf = (canvasElement: HTMLElement) =>
  canvasElement.querySelector<HTMLElement>('[data-slot="composer-attachment"]')!;

export const Pending: Story = {
  parameters: { covers: ['visual.item2'] },
  render: () => mount(one('pending')),
  play: async ({ canvasElement, step }) => {
    const item = itemOf(canvasElement);

    await step('Na fila, ainda não há barra', async () => {
      // O item já ocupa lugar na tela — é isso que separa `pending` de
      // `uploading` —, e barra sem progresso seria uma barra mentindo.
      await expect(item.dataset.state).toBe('pending');
      await expect(item.querySelector('.nds-composer-attachment-bar')).toBeNull();
      await expect(item).not.toHaveAttribute('aria-busy');
    });
  },
};

export const Uploading: Story = {
  parameters: {
    covers: ['functional.item5', 'accessibility.item2', 'accessibility.item3', 'visual.item3'],
    docs: { source: { transform: attachmentsUploadingSource } },
  },
  render: () => mount(one('uploading', { progress: 0.4 })),
  play: async ({ canvasElement, step }) => {
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="composer"]')!;
    const item = itemOf(canvasElement);

    await step('O item que sobe se declara OCUPADO', async () => {
      // É como a espera é comunicada sem repetir número: a palavra e o estado
      // de ocupado, nunca a fração.
      await expect(item).toHaveAttribute('aria-busy', 'true');
      await expect(item).toHaveTextContent(attachmentLabels().state.uploading);
    });

    await step('A barra desenha a fração', async () => {
      const fill = item.querySelector<HTMLElement>('.nds-composer-attachment-bar-fill')!;
      await expect(fill.style.getPropertyValue('--nds-attachment-progress')).toBe('40%');
    });

    await step('E a barra está FORA do que é lido em voz', async () => {
      // A mesma armadilha do contador de caracteres e do relógio do media
      // player: número que se reanuncia a cada instante torna a tela
      // impossível de ouvir.
      const bar = item.querySelector<HTMLElement>('.nds-composer-attachment-bar')!;
      await expect(bar).toHaveAttribute('aria-hidden', 'true');
      await expect(root.querySelector('[aria-live]')).toBeNull();
      await expect(root.querySelector('[role="progressbar"]')).toBeNull();
    });
  },
};

export const Ready: Story = {
  parameters: { covers: ['visual.item4'] },
  render: () => mount(one('ready')),
  play: async ({ canvasElement, step }) => {
    const item = itemOf(canvasElement);

    await step('Pronto: a barra some e o item deixa de estar ocupado', async () => {
      await expect(item.dataset.state).toBe('ready');
      await expect(item.querySelector('.nds-composer-attachment-bar')).toBeNull();
      await expect(item).not.toHaveAttribute('aria-busy');
      await expect(item).toHaveTextContent(attachmentLabels().state.ready);
    });
  },
};

export const Failed: Story = {
  parameters: {
    covers: ['accessibility.item5', 'visual.item5'],
    docs: { source: { transform: attachmentsFailedSource } },
  },
  render: () => mount(one('failed')),
  play: async ({ canvasElement, step }) => {
    const item = itemOf(canvasElement);

    await step('O que falhou traz a PALAVRA, e não só a cor', async () => {
      // Cor sozinha não descreve estado para quem não a percebe (WCAG 1.4.1).
      // A borda muda, e a palavra também.
      await expect(item.dataset.state).toBe('failed');
      await expect(item).toHaveTextContent(attachmentLabels().state.failed);
    });

    await step('E continua na fila — tirar sozinho esconderia o problema', async () => {
      // Quem precisa decidir o que fazer com o arquivo precisa vê-lo ali.
      await expect(item.isConnected).toBe(true);
    });
  },
};
