import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { NdsComposer } from './composer';
import { composerLabels } from './composer.fixtures';
import { attachmentLabels, one, queueWithoutSize } from './composer-attachments.fixtures';
import { attachmentsAbsentSource, composerAttachmentsSource } from './composer-attachments.source';

// ─── Meta ─────────────────────────────────────────────────────────────────────
//
// A fila junto do campo, o pedido de remoção, e o caso em que ela não existe.

const meta: Meta = {
  title: 'Primitives/Conversational/ComposerAttachments/Compositions',
  tags: ['conversational'],
  decorators: [moduleMetadata({ imports: [NdsComposer] })],
  // Sem argTypes nem callbacks: sem isto os painéis Controls e Actions abrem vazios.
  parameters: {
    layout: 'padded',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: composerAttachmentsSource },
      description: {
        component: 'A fila dentro da moldura do campo, e o que acontece ao pedir para remover.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

/** Espião de escopo de módulo: dentro do render, a play não o alcança. */
const onRemoveAttachment = fn();

export const WithField: Story = {
  parameters: { covers: ['functional.item3', 'visual.item6'] },
  render: () => ({
    props: {
      labels: composerLabels(),
      attachmentLabels: attachmentLabels(),
      // O terceiro não tem tamanho: é o caso em que nada é inventado.
      files: queueWithoutSize(),
      onRemoveAttachment,
    },
    template: `
      <nds-composer
        class="nds-max-w-lg"
        [labels]="labels"
        [attachmentLabels]="attachmentLabels"
        [attachments]="files"
        (removeAttachment)="onRemoveAttachment($event)"
      />
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="composer"]')!;
    const field = root.querySelector<HTMLElement>('.nds-composer-field')!;
    const list = root.querySelector<HTMLElement>('[data-slot="composer-attachments"]')!;

    await step('A fila vive DENTRO da moldura do campo', async () => {
      // Os anexos fazem parte do que está sendo escrito. Fora da moldura,
      // pareceriam uma lista de outra coisa.
      await expect(field.contains(list)).toBe(true);
    });

    await step('E vem ANTES do campo, na ordem de leitura', async () => {
      const input = root.querySelector<HTMLElement>('[data-slot="composer-input"]')!;
      await expect(
        list.compareDocumentPosition(input) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    });

    await step('Sem tamanho, nenhum número é inventado', async () => {
      // Quem produz o dado nem sempre sabe quanto o arquivo tem, e um zero ali
      // seria informação inventada.
      const withoutSize = [...list.children].find((li) =>
        li.textContent?.includes('anotacoes.txt'),
      )!;
      const support = withoutSize.querySelector('.nds-composer-attachment-meta')!;
      await expect(support.textContent).toBe(attachmentLabels().state.ready);
    });
  },
};

export const Removing: Story = {
  parameters: {
    covers: ['functional.item6', 'functional.item8', 'accessibility.item6'],
  },
  render: () => ({
    props: {
      labels: composerLabels(),
      attachmentLabels: attachmentLabels(),
      // O progresso vem fora da faixa de propósito: é o caso que a barra
      // precisa aguentar sem estourar.
      files: one('uploading', { progress: 2.5 }),
      onRemoveAttachment,
    },
    template: `
      <nds-composer
        class="nds-max-w-lg"
        [labels]="labels"
        [attachmentLabels]="attachmentLabels"
        [attachments]="files"
        (removeAttachment)="onRemoveAttachment($event)"
      />
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="composer"]')!;
    const labels = attachmentLabels();
    const removeButton = () =>
      canvas.getByRole('button', { name: labels.remove.replace('{name}', 'planta.pdf') });

    await step('O progresso fora da faixa não estoura a barra', async () => {
      const fill = root.querySelector<HTMLElement>('.nds-composer-attachment-bar-fill')!;
      await expect(fill.style.getPropertyValue('--nds-attachment-progress')).toBe('100%');
    });

    await step('O alvo de toque tem pelo menos vinte e quatro pixels', async () => {
      // WCAG 2.5.8. Um botão de ícone dentro de um chip estreito é onde a
      // tentação de encolher é maior.
      const box = removeButton().getBoundingClientRect();
      await expect(box.width).toBeGreaterThanOrEqual(24);
      await expect(box.height).toBeGreaterThanOrEqual(24);
    });

    await step('Acionar o botão avisa quem consome, com o anexo junto', async () => {
      // O componente NÃO remove: quem sobe o arquivo é quem sabe se dá para
      // cancelar, e é ele que decide.
      onRemoveAttachment.mockClear();
      await userEvent.click(removeButton());
      await expect(onRemoveAttachment).toHaveBeenCalledTimes(1);
      await expect(onRemoveAttachment).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'a1', name: 'planta.pdf' }),
      );
    });

    await step('E o item continua lá — remover de verdade é de quem recebe', async () => {
      await expect(root.querySelectorAll('[data-slot="composer-attachment"]')).toHaveLength(1);
    });
  },
};

export const WithoutAttachments: Story = {
  parameters: {
    covers: ['functional.item7'],
    docs: { source: { transform: attachmentsAbsentSource } },
  },
  render: () => ({
    props: { labels: composerLabels() },
    template: '<nds-composer class="nds-max-w-lg" [labels]="labels" />',
  }),
  play: async ({ canvasElement, step }) => {
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="composer"]')!;

    await step('Sem anexo, a fila não existe no documento', async () => {
      // Não é uma lista vazia escondida: é ausência. Uma lista vazia seria
      // anunciada como "lista com zero itens", que promete algo que não há.
      await expect(root.querySelector('[data-slot="composer-attachments"]')).toBeNull();
    });
  },
};
