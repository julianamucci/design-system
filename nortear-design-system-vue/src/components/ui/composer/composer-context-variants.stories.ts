import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect, fn } from 'storybook/test';
import { Composer } from './index';
import { useComposerLabels } from './composer.fixtures';
import {
  contextLabels,
  everyKind,
  repository,
  selection,
  useContextLabels,
} from './composer-context.fixtures';
import {
  contextEveryKindSource,
  contextRepositorySource,
  contextSelectionSource,
} from './composer-context.source';
import { CONTEXT_KINDS, type ContextItem } from '@shared/primitives/chat-protocol';

// ─── Meta ─────────────────────────────────────────────────────────────────────
//
// A ESPÉCIE é forma, e não situação: quem monta a pergunta a escolhe ao pôr o
// item, e ela não muda durante o uso. Por isso as cinco moram aqui, e não em
// `States`.

const meta: Meta = {
  title: 'Primitives/Conversational/ComposerContext/Variants',
  tags: ['conversational'],
  parameters: {
    layout: 'padded',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: contextEveryKindSource },
      description: {
        component:
          'Uma story por espécie de referência, do mais estreito para o mais largo.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

/** Espião de escopo de módulo: dentro do render, a play não o alcança. */
const onRemoveContext = fn();

const mount = (items: ContextItem[]) => ({
  components: { Composer },
  setup() {
    return {
      labels: useComposerLabels(),
      contextLabels: useContextLabels(),
      items,
      onRemoveContext,
    };
  },
  template: `<Composer
    :labels="labels"
    :context-labels="contextLabels"
    :context="items"
    class="nds-max-w-lg"
    @remove-context="onRemoveContext"
  />`,
});

const listOf = (canvasElement: HTMLElement) =>
  canvasElement.querySelector<HTMLElement>('[data-slot="composer-context"]')!;

export const EveryKind: Story = {
  parameters: {
    covers: [
      'functional.item1', 'functional.item2',
      'accessibility.item2',
      'visual.item2',
    ],
  },
  render: () => mount(everyKind()),
  play: async ({ canvasElement, step }) => {
    const list = listOf(canvasElement);
    const rotulos = contextLabels();

    await step('Uma etiqueta por item, na ORDEM recebida', async () => {
      // A ordem vem do vocabulário compartilhado — do mais estreito para o mais
      // largo —, e é ela que a lista repete sem reordenar nada.
      await expect(list.children).toHaveLength(CONTEXT_KINDS.length);
      const especies = [...list.children].map((li) => (li as HTMLElement).dataset.kind);
      await expect(especies).toEqual([...CONTEXT_KINDS]);
    });

    await step('Cada espécie leva a SUA palavra, e um ícone só de desenho', async () => {
      // Duas afirmações por item, e as duas precisam valer: a palavra chega a
      // quem ouve, e o ícone não — se o ícone fosse anunciado, cada etiqueta
      // seria lida duas vezes.
      for (const li of [...list.children] as HTMLElement[]) {
        const kind = li.dataset.kind as keyof typeof rotulos.kind;
        await expect(li).toHaveTextContent(rotulos.kind[kind]);
        const icon = li.querySelector<SVGElement>('.nds-composer-context-icon')!;
        await expect(icon.getAttribute('aria-hidden')).toBe('true');
      }
    });

    await step('E o desenho de cada espécie é DIFERENTE', async () => {
      // Cinco palavras com o mesmo ícone seria pior que ícone nenhum: promete
      // uma distinção visual que não existe.
      const desenhos = [...list.children].map(
        (li) => li.querySelector('.nds-composer-context-icon')!.innerHTML,
      );
      await expect(new Set(desenhos).size).toBe(CONTEXT_KINDS.length);
    });
  },
};

export const Selection: Story = {
  parameters: {
    covers: ['visual.item3'],
    docs: { source: { transform: contextSelectionSource } },
  },
  render: () => mount(selection()),
  play: async ({ canvasElement, step }) => {
    const item = listOf(canvasElement).children[0] as HTMLElement;

    await step('O trecho traz o RECORTE — sem ele seria um nome repetido', async () => {
      // Um trecho sem dizer qual trecho não é contexto: é o nome de um arquivo
      // escrito de novo.
      await expect(item.dataset.kind).toBe('selection');
      const recorte = item.querySelector<HTMLElement>('.nds-composer-context-detail')!;
      await expect(recorte.textContent).toBe('linhas 12–48');
    });
  },
};

export const Repository: Story = {
  parameters: {
    docs: { source: { transform: contextRepositorySource } },
  },
  render: () => mount(repository()),
  play: async ({ canvasElement, step }) => {
    const item = listOf(canvasElement).children[0] as HTMLElement;

    await step('A espécie mais larga não tem recorte, e nem deveria', async () => {
      // Recorte é onde DENTRO do item; o repositório inteiro não tem dentro.
      await expect(item.dataset.kind).toBe('repository');
      await expect(item.querySelector('.nds-composer-context-detail')).toBeNull();
      await expect(item).toHaveTextContent(contextLabels().kind.repository);
    });
  },
};
