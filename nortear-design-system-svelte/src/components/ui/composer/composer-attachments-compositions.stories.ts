import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { Composer } from './index';
import { composerLabels } from './composer.fixtures';
import { attachmentLabels, one, queueWithUnknownSize } from './composer-attachments.fixtures';
import {
  attachmentsAbsentSource,
  attachmentsWithFieldSource,
} from './composer-attachments.source';

// ─── Meta ─────────────────────────────────────────────────────────────────────
//
// A fila junto do campo, o pedido de remoção, e o caso em que ela não existe.

const meta: Meta<typeof Composer> = {
  title: 'Primitives/Conversational/ComposerAttachments/Compositions',
  component: Composer,
  tags: ['conversational'],
  parameters: {
    layout: 'padded',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: attachmentsWithFieldSource },
      description: {
        component: 'A fila dentro da moldura do campo, e o que acontece ao pedir para remover.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Composer>;

/** Espião de escopo de módulo: dentro do render, a play não o alcança. */
const onRemoveAttachment = fn();

export const WithField: Story = {
  parameters: { covers: ['functional.item3', 'visual.item6'] },
  render: () => ({
    Component: Composer,
    props: {
      labels: composerLabels(),
      attachmentLabels: attachmentLabels(),
      // O terceiro não tem tamanho: é o caso em que nada é inventado.
      attachments: queueWithUnknownSize(),
      onRemoveAttachment,
      class: 'nds-max-w-lg',
    },
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
      await expect(list.compareDocumentPosition(input) & Node.DOCUMENT_POSITION_FOLLOWING)
        .toBeTruthy();
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
    Component: Composer,
    props: {
      labels: composerLabels(),
      attachmentLabels: attachmentLabels(),
      // O progresso vem fora da faixa de propósito: é o caso que a barra
      // precisa aguentar sem estourar.
      attachments: one('uploading', { progress: 2.5 }),
      onRemoveAttachment,
      class: 'nds-max-w-lg',
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="composer"]')!;
    const rotulos = attachmentLabels();
    const removeButton = () =>
      canvas.getByRole('button', { name: rotulos.remove.replace('{name}', 'planta.pdf') });

    await step('O progresso fora da faixa não estoura a barra', async () => {
      const fill = root.querySelector<HTMLElement>('.nds-composer-attachment-bar-fill')!;
      await expect(fill.style.getPropertyValue('--nds-attachment-progress')).toBe('100%');
    });

    await step('O alvo de toque tem pelo menos vinte e quatro pixels', async () => {
      // WCAG 2.5.8. Um botão de ícone dentro de um chip estreito é onde a
      // tentação de encolher é maior.
      const caixa = removeButton().getBoundingClientRect();
      await expect(caixa.width).toBeGreaterThanOrEqual(24);
      await expect(caixa.height).toBeGreaterThanOrEqual(24);
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
      await expect(
        root.querySelectorAll('[data-slot="composer-attachment"]'),
      ).toHaveLength(1);
    });
  },
};

export const WithoutAttachments: Story = {
  parameters: {
    covers: ['functional.item7'],
    docs: { source: { transform: attachmentsAbsentSource } },
  },
  render: () => ({
    Component: Composer,
    props: { labels: composerLabels(), class: 'nds-max-w-lg' },
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
