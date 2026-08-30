import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { NdsComposer } from './composer';
import {
  composerLabels,
  contextLabels,
  everyKind,
  mixed,
  selection,
} from './composer-context.fixtures';
import { quoteLabels, shortQuote } from './composer-quote.fixtures';
import { attachmentLabels, one } from './composer-attachments.fixtures';
import { contextWithFieldSource } from './composer-context.source';

// ─── Meta ─────────────────────────────────────────────────────────────────────
//
// A lista dentro da moldura, o pedido de remoção, e o que acontece quando ela
// divide o campo com uma mensagem citada.

const meta: Meta = {
  title: 'Primitives/Conversational/ComposerContext/Compositions',
  tags: ['conversational'],
  decorators: [moduleMetadata({ imports: [NdsComposer] })],
  // Sem argTypes nem callbacks: sem isto os painéis Controls e Actions abrem vazios.
  parameters: {
    layout: 'padded',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: contextWithFieldSource },
      description: {
        component:
          'O lugar da lista dentro da moldura, e o que ela deliberadamente NÃO faz com a descrição do campo.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

/** Espião de escopo de módulo: dentro do render, a play não o alcança. */
const onRemoveContext = fn();

export const WithField: Story = {
  parameters: { covers: ['functional.item7', 'visual.item6'] },
  render: () => ({
    props: {
      labels: composerLabels(),
      contextLabels: contextLabels(),
      references: everyKind(),
      attachmentLabels: attachmentLabels(),
      // Um anexo só, ao lado das cinco referências: o assunto é a diferença
      // entre as duas listas, e não o que cada uma carrega.
      files: one('ready'),
      onRemoveContext,
    },
    template: `
      <nds-composer
        class="nds-max-w-lg"
        [labels]="labels"
        [contextLabels]="contextLabels"
        [context]="references"
        [attachmentLabels]="attachmentLabels"
        [attachments]="files"
        (removeContext)="onRemoveContext($event)"
      />
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="composer"]')!;
    const field = root.querySelector<HTMLElement>('.nds-composer-field')!;
    const list = root.querySelector<HTMLElement>('[data-slot="composer-context"]')!;

    await step('A lista vive DENTRO da moldura do campo', async () => {
      // O que a pergunta leva junto faz parte do que está sendo escrito. Fora
      // da moldura, pareceria uma lista de outra coisa.
      await expect(field.contains(list)).toBe(true);
    });

    await step('Ela vem ANTES dos anexos e antes do campo', async () => {
      // A ordem do documento é a ordem de leitura: primeiro o que já existe,
      // depois o que ainda está subindo, e por fim onde se escreve.
      const queue = root.querySelector<HTMLElement>('[data-slot="composer-attachments"]')!;
      const input = root.querySelector<HTMLElement>('[data-slot="composer-input"]')!;
      await expect(
        list.compareDocumentPosition(queue) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
      await expect(
        queue.compareDocumentPosition(input) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    });

    await step('E as duas listas são DISTINGUÍVEIS pelo nome', async () => {
      // Referência e carga se parecem na tela; duas listas sem nome próprio
      // seriam a mesma lista para quem navega por audição.
      const queue = root.querySelector<HTMLElement>('[data-slot="composer-attachments"]')!;
      await expect(list).toHaveAccessibleName(contextLabels().list);
      await expect(queue).toHaveAccessibleName(attachmentLabels().list);
      await expect(contextLabels().list).not.toBe(attachmentLabels().list);
    });
  },
};

export const Removing: Story = {
  parameters: { covers: ['functional.item5', 'accessibility.item6'] },
  render: () => ({
    props: {
      labels: composerLabels(),
      contextLabels: contextLabels(),
      references: selection(),
      onRemoveContext,
    },
    template: `
      <nds-composer
        class="nds-max-w-lg"
        [labels]="labels"
        [contextLabels]="contextLabels"
        [context]="references"
        (removeContext)="onRemoveContext($event)"
      />
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="composer"]')!;
    const labels = contextLabels();
    const removeButton = () =>
      canvas.getByRole('button', { name: labels.remove.replace('{label}', 'relatorio.ts') });

    await step('O alvo de toque tem pelo menos vinte e quatro pixels', async () => {
      // WCAG 2.5.8. Um botão de ícone dentro de uma etiqueta estreita é onde a
      // tentação de encolher é maior.
      const box = removeButton().getBoundingClientRect();
      await expect(box.width).toBeGreaterThanOrEqual(24);
      await expect(box.height).toBeGreaterThanOrEqual(24);
    });

    await step('Acionar o botão avisa quem consome, com o item junto', async () => {
      // O componente NÃO tira nada: quem monta a pergunta é quem sabe o que
      // sobra sem aquele item, e é ele que decide.
      onRemoveContext.mockClear();
      await userEvent.click(removeButton());
      await expect(onRemoveContext).toHaveBeenCalledTimes(1);
      await expect(onRemoveContext).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'c1', label: 'relatorio.ts', kind: 'selection' }),
      );
    });

    await step('E a etiqueta continua lá — tirar de verdade é de quem recebe', async () => {
      await expect(root.querySelectorAll('[data-slot="composer-context-item"]')).toHaveLength(1);
    });
  },
};

export const WithQuote: Story = {
  parameters: { covers: ['functional.item8'] },
  render: () => ({
    props: {
      labels: composerLabels(),
      quote: shortQuote(),
      quoteLabels: quoteLabels(),
      contextLabels: contextLabels(),
      references: mixed(),
      onRemoveContext,
    },
    template: `
      <nds-composer
        class="nds-max-w-lg"
        [labels]="labels"
        [quote]="quote"
        [quoteLabels]="quoteLabels"
        [contextLabels]="contextLabels"
        [context]="references"
        (removeContext)="onRemoveContext($event)"
      />
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="composer"]')!;
    const input = root.querySelector<HTMLElement>('[data-slot="composer-input"]')!;
    const list = root.querySelector<HTMLElement>('[data-slot="composer-context"]')!;
    const quote = root.querySelector<HTMLElement>('[data-slot="composer-quote"]')!;

    await step('A citação vem PRIMEIRO, e o contexto logo depois', async () => {
      await expect(
        quote.compareDocumentPosition(list) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    });

    await step('Só a citação DESCREVE o campo — a lista fica de fora', async () => {
      // Saber a quem se responde muda o que se escreve, então a citação entra
      // na descrição. Sete arquivos ali virariam ruído que se ouve a cada foco,
      // e a lista já se anuncia sozinha, com nome e contagem, ao ser percorrida.
      const ids = (input.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(Boolean);
      const describers = ids.map((id) => root.ownerDocument.getElementById(id));
      await expect(describers).toContain(quote);
      await expect(describers).not.toContain(list);
      for (const el of describers) {
        await expect(el?.contains(list)).toBe(false);
      }
    });
  },
};
