import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { expect, fn, within } from 'storybook/test';
import ComposerContextStory from './ComposerContextStory.svelte';
import { contextLabels } from './composer-context.fixtures';
import { composerContextSource } from './composer-context.source';
import { CONTEXT_KINDS, type ContextKind } from '@shared/primitives/chat-protocol';
import ComposerContextDocs from '@/components/docs/ComposerContextDocs.svelte';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

/** Espião de escopo de módulo: dentro do render, a play não o alcança. */
const onRemoveContext = fn();

/**
 * Os três eixos da etiqueta, num item só.
 *
 * A grade das cinco espécies mora em `Variants`; aqui o assunto é o que muda
 * quando se mexe em cada eixo — a espécie troca ícone e palavra, o recorte
 * separa o pedaço do todo, e a marca de automático tira o botão de remover.
 */
type PlaygroundArgs = {
  kind: ContextKind;
  detail: string;
  automatic: boolean;
};

// O docgen do Svelte está desligado no .storybook/main.ts: a aba
// "API Reference" sai só destes argTypes.
const meta: Meta<PlaygroundArgs> = {
  title: 'Components/Conversational/ComposerContext',
  component: ComposerContextStory,
  tags: ['autodocs', 'conversational'],
  parameters: {
    layout: 'padded',
    actions: { disable: true },
    docs: {
      page: withAutoDocsTab(ComposerContextDocs),
      // Sem docgen, o gerador de source monta a tag a partir do nome interno da
      // função compilada. A transform devolve o uso real.
      source: { transform: composerContextSource },
    },
  },
  argTypes: {
    kind: {
      control: 'select',
      options: [...CONTEXT_KINDS],
      description:
        'De onde o item veio. Decide o ícone e a palavra que entra no nome acessível.',
      table: {
        type: { summary: CONTEXT_KINDS.map((k) => `'${k}'`).join(' | ') },
        defaultValue: { summary: '—' },
      },
    },
    detail: {
      control: 'text',
      description:
        'Onde dentro do item — intervalo de linhas, seção, aba. Vazio quando o item é o todo.',
      table: { type: { summary: 'string' }, defaultValue: { summary: '—' } },
    },
    automatic: {
      control: 'boolean',
      description:
        'O item entrou sem ninguém pedir. Tira o botão de remover e acrescenta a marca escrita.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
  },
  args: {
    kind: 'selection',
    detail: 'linhas 12–48',
    automatic: false,
  },
};

export default meta;
type Story = StoryObj<PlaygroundArgs>;

export const Playground: Story = {
  parameters: {
    covers: [
      'functional.item3',
      'accessibility.item1', 'accessibility.item4',
      'visual.item1',
    ],
  },
  render: (args) => ({
    Component: ComposerContextStory,
    props: { ...args, onRemoveContext },
  }),
  play: async ({ canvasElement, step, args }) => {
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="composer"]')!;
    const list = root.querySelector<HTMLElement>('[data-slot="composer-context"]')!;
    const rotulos = contextLabels();

    await step('A lista é uma LISTA, com nome próprio', async () => {
      // É o que faz o leitor de tela dizer quantos itens a pergunta leva antes
      // de percorrê-los — e aqui a contagem é a informação.
      await expect(list.tagName).toBe('UL');
      await expect(list).toHaveAccessibleName(rotulos.list);
      await expect(list.children).toHaveLength(1);
    });

    const item = list.children[0] as HTMLElement;

    await step('A espécie escolhida chega em PALAVRA, e o ícone fica fora', async () => {
      // O ícone é a única pista visual de que aquilo é um trecho e não o
      // arquivo inteiro, e pista que só existe em desenho não chega a quem
      // ouve (WCAG 1.1.1).
      await expect(item.dataset.kind).toBe(args.kind);
      await expect(item).toHaveTextContent(rotulos.kind[args.kind]);
      const icon = item.querySelector<SVGElement>('.nds-composer-context-icon')!;
      await expect(icon.getAttribute('aria-hidden')).toBe('true');
    });

    await step('O recorte aparece depois do nome', async () => {
      const labelEl = item.querySelector<HTMLElement>('.nds-composer-context-label')!;
      const detailEl = item.querySelector<HTMLElement>('.nds-composer-context-detail')!;
      await expect(labelEl.textContent).toBe('relatorio.ts');
      await expect(detailEl.textContent).toBe(args.detail);
      await expect(
        labelEl.compareDocumentPosition(detailEl) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    });

    await step('E o botão de remover diz QUAL item remove', async () => {
      // Uma lista de botões chamados "Remover" é um botão só para quem navega
      // por audição.
      const canvas = within(canvasElement);
      await expect(
        canvas.getByRole('button', { name: rotulos.remove.replace('{label}', 'relatorio.ts') }),
      ).toBeInTheDocument();
    });
  },
};
