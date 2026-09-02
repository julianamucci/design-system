import type { Meta, StoryObj } from '@storybook/html-vite';
import { expect, within } from 'storybook/test';
import { createChatThread } from './chat-thread';
import { chatLabels, paraMensagens } from './chat-thread.fixtures';
import { chatThreadSource } from './chat-thread.source';
import { createChatThreadDocs } from '@/components/docs/ChatThreadDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import { CHAT_CONVERSA } from '@shared/primitives/chat-examples';

// ─── Meta ─────────────────────────────────────────────────────────────────────

type ChatThreadArgs = {
  class?: string;
};

/** A altura vem de fora, na escada do sistema: sem limite não há transbordo,
 *  e sem transbordo a ancoragem no fim — que é a razão do componente existir —
 *  não acontece. */
const ALTURA = 'lg' as const;

const meta: Meta<ChatThreadArgs> = {
  title: 'Primitives/Conversational/ChatThread',
  tags: ['autodocs', 'conversational'],
  parameters: {
    layout: 'padded',
    docs: {
      page: withAutoDocsTab(createChatThreadDocs),
      // O renderer html imprime o `outerHTML` — aqui, a conversa inteira já
      // desenhada. A transform devolve a chamada da fábrica.
      source: { transform: chatThreadSource },
    },
  },
  // Esta stack não tem docgen: a aba "API Reference" sai só destes argTypes.
  argTypes: {
    class: {
      control: false,
      description:
        'Classes extras na raiz. É por aqui que a página define a altura e a medida de leitura.',
      table: { type: { summary: 'string' } },
    },
  },
  args: {},
};

export default meta;
type Story = StoryObj<ChatThreadArgs>;

// ─── Playground ───────────────────────────────────────────────────────────────

export const Playground: Story = {
  parameters: {
    covers: [
      'functional.item1',
      'accessibility.item1', 'accessibility.item2', 'accessibility.item3',
      'visual.item1',
    ],
  },
  render: () =>
    createChatThread({
      messages: paraMensagens(CHAT_CONVERSA),
      labels: chatLabels(),
      size: ALTURA,
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
      // uma lista de Markdown dentro dela, e o papel casaria com as duas. Pelo
      // mesmo motivo a contagem é dos FILHOS diretos — `getAllByRole` traria
      // os itens da lista de dentro junto.
      const list = root.querySelector<HTMLElement>('.nds-chat-thread-list')!;
      await expect(list.tagName).toBe('OL');
      await expect(list.children).toHaveLength(CHAT_CONVERSA.length);
    });

    await step('Cada mensagem declara o próprio papel', async () => {
      const papeis = [...root.querySelectorAll('[data-slot="chat-message"]')].map(
        (el) => (el as HTMLElement).dataset.role,
      );
      await expect(papeis).toEqual(['user', 'assistant', 'system']);
    });

    await step('A resposta é desenhada pelo Markdown, e não como texto cru', async () => {
      // A lista de dentro da resposta prova a delegação: se o conteúdo saísse
      // como texto, os hifens continuariam à vista.
      await expect(root.querySelector('.nds-markdown')).toBeInTheDocument();
      await expect(root.querySelector('.nds-markdown-list')).toBeInTheDocument();
      await expect(root.textContent).not.toContain('- a medida sai');
    });

    await step('A conversa NÃO é região viva', async () => {
      // A decisão que governa o componente: texto em streaming numa região viva
      // é anunciado a cada trecho, e a leitura fica impossível. A única região
      // viva é o anunciador, fora do fluxo, e ele começa vazio.
      //
      // O papel `group` NÃO é região viva, e a asserção precisa dizer isso em
      // vez de exigir papel NENHUM: enquanto o viewport não tinha papel, "sem
      // papel" servia de atalho para "não anuncia sozinho", e o atalho passou a
      // reprovar no dia em que a regra 6 da §8 da guideline 17 deu à camada que
      // rola o par `role="group"` + nome. O que se mede é a LIVENESS — nenhum
      // dos papéis que anunciam sozinhos, e nenhum `aria-live` dentro.
      await expect(viewport).toHaveAttribute('role', 'group');
      await expect(['log', 'status', 'alert', 'marquee', 'timer'])
        .not.toContain(viewport.getAttribute('role'));
      await expect(viewport.querySelector('[aria-live]')).toBeNull();
      const announcer = root.querySelector('.nds-chat-thread-announcer')!;
      await expect(announcer).toHaveAttribute('aria-live', 'polite');
      await expect(announcer.textContent).toBe('');
    });

    await step('A área que rola é alcançável por teclado', async () => {
      // WCAG 2.1.1: sem isto, o que ficou fora da tela não tem como ser lido
      // por quem não usa ponteiro.
      await expect(viewport).toHaveAttribute('tabindex', '0');
      viewport.focus();
      await expect(viewport).toHaveFocus();
    });

    await step('Sem nada a alcançar, o botão de ir ao fim não existe', async () => {
      // A conversa abre no fim. Um botão que oferece ir para onde já se está é
      // ruído no percurso do Tab — por isso `hidden`, e não só invisível.
      const jump = root.querySelector<HTMLElement>('[data-slot="chat-thread-jump"]')!;
      await expect(jump.hidden).toBe(true);
      await expect(canvas.queryByRole('button', { name: /ir para o fim/i })).toBeNull();
    });
  },
};
