import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { expect, within } from 'storybook/test';
import { ChatThread } from './index';
import { chatThreadLabels, jumpToEndName, toMessages } from './chat-thread.fixtures';
import { chatThreadSource } from './chat-thread.source';
import ChatThreadDocs from '@/components/docs/ChatThreadDocs.svelte';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import { CHAT_CONVERSA } from '@shared/primitives/chat-examples';

/**
 * A altura vem de fora, na escada do sistema: sem limite não há transbordo, e
 * sem transbordo a ancoragem no fim — que é a razão do componente existir — não
 * acontece.
 */
const HEIGHT = 'lg' as const;

const meta = {
  title: 'Primitives/Conversational/ChatThread',
  component: ChatThread,
  tags: ['autodocs', 'conversational'],
  parameters: {
    layout: 'padded',
    docs: {
      page: withAutoDocsTab(ChatThreadDocs),
      // Sem docgen, o gerador de source monta a tag a partir do nome interno da
      // função compilada. A transform devolve o uso real.
      source: { transform: chatThreadSource },
    },
  },
  // O docgen do Svelte está desligado no .storybook/main.ts: a aba
  // "API Reference" sai só destes argTypes.
  argTypes: {
    messages: {
      control: false,
      description:
        'As mensagens, em ordem. Cada uma traz papel, conteúdo e o que mais tiver a mostrar.',
      table: { type: { summary: 'ChatMessage[]' } },
    },
    labels: {
      control: false,
      description:
        'O texto da interface: botão de ir ao fim, resumo do raciocínio, título das fontes e o estado de cada ferramenta.',
      table: { type: { summary: 'ChatThreadLabels' } },
    },
    error: {
      control: 'text',
      description:
        'Falha da execução. É a resposta que não vem, e não um passo que deu errado dentro de uma que veio.',
      table: { type: { summary: 'string' } },
    },
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg', 'xl'],
      description:
        'Altura da janela da conversa, na escada do sistema. Sem ela não há transbordo, e sem transbordo não há ancoragem.',
      table: { type: { summary: "'xs' | 'sm' | 'md' | 'lg' | 'xl'" } },
    },
    class: {
      control: false,
      description: 'Classes extras na raiz. É por aqui que a página define a medida de leitura.',
      table: { type: { summary: 'string' } },
    },
  },
  args: { messages: [], labels: chatThreadLabels(), error: '', size: HEIGHT },
} satisfies Meta<typeof ChatThread>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  parameters: {
    covers: [
      'functional.item1',
      'accessibility.item1', 'accessibility.item2', 'accessibility.item3',
      'visual.item1',
    ],
  },
  render: (args) => ({
    Component: ChatThread,
    props: { ...args, messages: toMessages(CHAT_CONVERSA), labels: chatThreadLabels() },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="chat-thread"]')!;
    const viewport = root.querySelector<HTMLElement>('.nds-chat-thread-viewport')!;

    await step('A conversa é uma lista ordenada de verdade', async () => {
      // É o que faz o leitor de tela anunciar a posição de cada turno. Uma
      // pilha de `div` não anuncia nada.
      //
      // A busca é pela classe, e não por `getByRole('list')`: a resposta traz
      // uma lista de Markdown dentro dela, e o papel casaria com as duas.
      const turns = root.querySelector<HTMLElement>('.nds-chat-thread-list')!;
      await expect(turns.tagName).toBe('OL');
      await expect(turns.children).toHaveLength(CHAT_CONVERSA.length);
    });

    await step('Cada mensagem declara o próprio papel', async () => {
      const roles = [...root.querySelectorAll('[data-slot="chat-message"]')].map(
        (el) => (el as HTMLElement).dataset.role,
      );
      await expect(roles).toEqual(['user', 'assistant', 'system']);
    });

    await step('A resposta é desenhada pelo Markdown, e não como texto cru', async () => {
      await expect(root.querySelector('.nds-markdown')).toBeInTheDocument();
      await expect(root.querySelector('.nds-markdown-list')).toBeInTheDocument();
      await expect(root.textContent).not.toContain('- a medida sai');
    });

    await step('A conversa NÃO é região viva', async () => {
      // A decisão que governa o componente: texto em streaming numa região viva
      // é anunciado a cada trecho, e a leitura fica impossível. A única região
      // viva é o anunciador, fora do fluxo, e ele começa vazio.
      await expect(viewport.getAttribute('role')).toBeNull();
      await expect(viewport.querySelector('[aria-live]')).toBeNull();
      const announcer = root.querySelector('.nds-chat-thread-announcer')!;
      await expect(announcer).toHaveAttribute('aria-live', 'polite');
      await expect(announcer.textContent).toBe('');
    });

    await step('A área que rola é alcançável por teclado', async () => {
      await expect(viewport).toHaveAttribute('tabindex', '0');
      viewport.focus();
      await expect(viewport).toHaveFocus();
    });

    await step('Sem nada a alcançar, o botão de ir ao fim não existe', async () => {
      const jump = root.querySelector<HTMLElement>('[data-slot="chat-thread-jump"]')!;
      await expect(jump.hidden).toBe(true);
      await expect(canvas.queryByRole('button', { name: jumpToEndName(0) })).toBeNull();
    });
  },
};
