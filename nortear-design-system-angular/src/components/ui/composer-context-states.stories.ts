import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect, fn } from 'storybook/test';
import { isContextRemovable, type ContextItem } from '@shared/primitives/chat-protocol';
import { NdsComposer } from './composer';
import {
  automatic,
  composerLabels,
  contextLabels,
  mixed,
} from './composer-context.fixtures';
import {
  contextAbsentSource,
  contextAutomaticSource,
  contextEveryKindSource,
} from './composer-context.source';

// ─── Meta ─────────────────────────────────────────────────────────────────────
//
// O que ACONTECE com a etiqueta: ela foi posta à mão, ela entrou sozinha, ou não
// há etiqueta nenhuma. A espécie — que é forma — mora em `Variants`.

const meta: Meta = {
  title: 'Primitives/Conversational/ComposerContext/States',
  tags: ['conversational'],
  decorators: [moduleMetadata({ imports: [NdsComposer] })],
  // Sem argTypes nem callbacks: sem isto os painéis Controls e Actions abrem vazios.
  parameters: {
    layout: 'padded',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: contextEveryKindSource },
      description: {
        component:
          'Quem pôs o item decide se há botão para tirá-lo — e é a única diferença de interação da peça.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

/** Espião de escopo de módulo: dentro do render, a play não o alcança. */
const onRemoveContext = fn();

const mount = (items: ContextItem[]) => ({
  props: {
    labels: composerLabels(),
    contextLabels: contextLabels(),
    references: items,
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
});

const listOf = (canvasElement: HTMLElement) =>
  canvasElement.querySelector<HTMLElement>('[data-slot="composer-context"]');

export const Manual: Story = {
  render: () => mount(mixed()),
  play: async ({ canvasElement, step }) => {
    const list = listOf(canvasElement)!;
    const placed = list.children[0] as HTMLElement;

    await step('O posto à mão traz o botão que o tira', async () => {
      await expect(placed.dataset.automatic).toBeUndefined();
      // Pela CLASSE: o `ndsButton` liga `data-slot="button"` por host binding e
      // disputa com o estático do template (§8 do RULES.md).
      const removeButton = placed.querySelector<HTMLElement>('.nds-composer-context-remove')!;
      await expect(removeButton).toHaveAccessibleName(
        contextLabels().remove.replace('{label}', 'relatorio.ts'),
      );
    });

    await step('E a decisão sai do vocabulário, não de um `if` da tela', async () => {
      // O componente pergunta ao protocolo quem pode ser tirado; a tela só
      // desenha a resposta. Sem isso, cinco stacks escreveriam cinco versões da
      // mesma regra e uma delas discordaria.
      const [byHand, onItsOwn] = mixed();
      await expect(isContextRemovable(byHand!)).toBe(true);
      await expect(isContextRemovable(onItsOwn!)).toBe(false);
    });
  },
};

export const Automatic: Story = {
  parameters: {
    covers: [
      'functional.item4',
      'accessibility.item3', 'accessibility.item5',
      'visual.item4',
    ],
    docs: { source: { transform: contextAutomaticSource } },
  },
  render: () => mount(automatic()),
  play: async ({ canvasElement, step }) => {
    const list = listOf(canvasElement)!;
    const item = list.children[0] as HTMLElement;

    await step('O que entrou sozinho NÃO oferece botão de remover', async () => {
      // Ele voltaria na próxima pergunta, e botão que desfaz o que se refaz
      // sozinho é armadilha: promete o que não cumpre.
      await expect(item.dataset.automatic).toBe('true');
      await expect(item.querySelector('.nds-composer-context-remove')).toBeNull();
      await expect(list.querySelectorAll('button')).toHaveLength(0);
    });

    await step('E a marca é TEXTO, não só a moldura mais discreta', async () => {
      // Cor e traço sozinhos não descrevem estado (WCAG 1.4.1). A palavra é o
      // que chega a quem ouve, e é ela que diz por que o item está ali.
      const mark = item.querySelector<HTMLElement>(
        '[data-slot="composer-context-automatic"]',
      )!;
      await expect(mark.textContent).toBe(contextLabels().automatic);
      await expect(item).toHaveTextContent(contextLabels().automatic);
    });
  },
};

export const Empty: Story = {
  parameters: {
    covers: ['functional.item6', 'visual.item5'],
    docs: { source: { transform: contextAbsentSource } },
  },
  render: () => ({
    props: { labels: composerLabels() },
    template: '<nds-composer class="nds-max-w-lg" [labels]="labels" />',
  }),
  play: async ({ canvasElement, step }) => {
    await step('Sem item, a lista não existe no documento', async () => {
      // Não é uma lista vazia escondida: é ausência. Uma lista vazia seria
      // anunciada como "lista com zero itens", que promete algo que não há.
      await expect(listOf(canvasElement)).toBeNull();
    });
  },
};
