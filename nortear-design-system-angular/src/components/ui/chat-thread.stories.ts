import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect, within } from 'storybook/test';
import { NdsChatThread, type ChatMessage, type ChatThreadLabels } from './chat-thread';
import { chatLabels, toMessages } from './chat-thread.fixtures';
import { chatThreadSource } from './chat-thread.source';
import { NdsChatThreadDocs } from '@/components/docs/ChatThreadDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import { CHAT_CONVERSA } from '@shared/primitives/chat-examples';

// ─── Meta ─────────────────────────────────────────────────────────────────────

type ChatThreadArgs = {
  messages: ChatMessage[];
  labels: ChatThreadLabels;
  error: string;
  size: string;
  class?: string;
};

/**
 * A altura vem de fora, na escada do sistema: sem limite não há transbordo, e
 * sem transbordo a ancoragem no fim — que é a razão do componente existir — não
 * acontece.
 */
const HEIGHT = 'lg' as const;

const meta: Meta<ChatThreadArgs> = {
  title: 'UI/ChatThread',
  tags: ['autodocs', 'conversational'],
  decorators: [moduleMetadata({ imports: [NdsChatThread] })],
  parameters: {
    layout: 'padded',
    docs: {
      page: withAutoDocsTab(NdsChatThreadDocs),
      // O renderer Angular imprime o `template` da story com os bindings
      // apontando para `props` que só existem aqui. A transform devolve o uso
      // real: um componente que declara a lista e a passa adiante.
      source: { transform: chatThreadSource },
    },
  },
  // Sem compodoc nesta stack: a aba API Reference sai só destes argTypes.
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
      description:
        'Atributo nativo do elemento, não input: o Angular mescla com a classe base. É por aqui que a página define a medida de leitura.',
      table: { type: { summary: 'string' } },
    },
  },
  args: {
    messages: [],
    labels: {} as ChatThreadLabels,
    error: '',
    size: HEIGHT,
  },
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
  render: (args) => ({
    // A conversa e os rótulos vêm do andaime compartilhado, e não dos args: uma
    // lista de mensagens não cabe num control, e os rótulos têm três idiomas.
    props: { ...args, messages: toMessages(CHAT_CONVERSA), labels: chatLabels() },
    template: `
      <nds-chat-thread
        [messages]="messages"
        [labels]="labels"
        [error]="error"
        [size]="size"
      />
    `,
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
      const list = root.querySelector<HTMLElement>('.nds-chat-thread-list')!;
      await expect(list.tagName).toBe('OL');
      await expect(list.children).toHaveLength(CHAT_CONVERSA.length);
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
