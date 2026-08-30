import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { ChatThread, type ChatMessage } from './index';
import { chatThreadLabels, jumpToEndName, toMessages } from './chat-thread.fixtures';
import ChatThreadApprovalStory from './ChatThreadApprovalStory.svelte';
import ChatThreadHarnessStory from './ChatThreadHarnessStory.svelte';
import {
  chatThreadErrorSource,
  chatThreadLongSource,
  chatThreadStreamingSource,
} from './chat-thread.source';
import {
  CHAT_CONVERSA,
  CHAT_EM_STREAMING,
  CHAT_FERRAMENTA_FALHOU,
  CHAT_LONGA,
} from '@shared/primitives/chat-examples';

// ─── Meta ─────────────────────────────────────────────────────────────────────
//
// Os estados que a docs page lista. O estado "no fim" é o Playground, e não se
// repete aqui.

const meta: Meta<typeof ChatThread> = {
  title: 'UI/ChatThread/States',
  component: ChatThread,
  tags: ['conversational'],
  parameters: {
    layout: 'padded',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: chatThreadLongSource },
      description: {
        component: 'Cada story fixa um estado e verifica o que ele muda na conversa.',
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof ChatThread>;
/**
 * As stories que mudam de estado montam OUTRO componente — a marcação de um
 * controle na tela não cabe no `render` desta stack. O tipo acompanha o
 * componente montado; herdar o do `meta` cobraria as props da thread de um
 * andaime que não as tem.
 */
type HarnessStory = StoryObj<typeof ChatThreadHarnessStory>;
type ApprovalStory = StoryObj<typeof ChatThreadApprovalStory>;

/** Rola até um ponto e espera o evento de rolagem ser processado. */
async function scrollViewportTo(viewport: HTMLElement, top: number): Promise<void> {
  viewport.scrollTop = top;
  viewport.dispatchEvent(new Event('scroll'));
  await waitFor(() => expect(viewport.scrollTop).toBe(top));
}

/** Troca campos da mensagem de `id`, preservando as demais — o `patch` da stack. */
const patch =
  (id: string, fields: Partial<ChatMessage>) =>
  (current: ChatMessage[]): ChatMessage[] =>
    current.map((m) => (m.id === id ? { ...m, ...fields } : m));

/** A folga de "no fim" que `chat-scroll` publica, repetida aqui como número. */
const BOTTOM_SLACK = 32;

export const OpensAtEnd: Story = {
  parameters: { covers: ['functional.item10'] },
  render: () => ({
    Component: ChatThread,
    props: { messages: toMessages(CHAT_LONGA), labels: chatThreadLabels(), size: 'md' },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="chat-thread"]')!;
    const viewport = root.querySelector<HTMLElement>('.nds-chat-thread-viewport')!;

    await step('A conversa abre no FIM, e não no primeiro turno', async () => {
      // O estado inicial sempre DISSE que a conversa está no fim; até o
      // observador de tamanho existir, ninguém levava a rolagem lá. O sintoma
      // aparecia na demonstração: a conversa abria no turno mais antigo e o
      // botão nascia visível, oferecendo ir para onde ela devia ter aberto.
      //
      // A espera é pelo primeiro layout: na montagem o `scrollHeight` ainda é
      // zero, e é o crescimento que dispara a ancoragem. Leitura PURA dentro
      // do `waitFor`.
      await waitFor(() =>
        expect(
          viewport.scrollHeight - viewport.clientHeight - viewport.scrollTop,
        ).toBeLessThanOrEqual(BOTTOM_SLACK),
      );
      await expect(viewport.scrollTop).toBeGreaterThan(0);
    });

    await step('E o botão de ir ao fim não aparece', async () => {
      await expect(canvas.queryByRole('button', { name: jumpToEndName(0) })).toBeNull();
    });
  },
};

export const ReadingBack: HarnessStory = {
  parameters: {
    covers: [
      'functional.item2',
      'functional.item3',
      'functional.item4',
      'accessibility.item5',
      'visual.item5',
    ],
  },
  render: () => ({
    Component: ChatThreadHarnessStory,
    props: {
      initial: toMessages(CHAT_LONGA),
      controls: [
        {
          label: 'Anexar duas',
          apply: (current: ChatMessage[]): ChatMessage[] => [
            ...current,
            { id: 'nova-1', role: 'assistant', author: 'Assistente', content: 'Resposta nova.' },
            { id: 'nova-2', role: 'assistant', author: 'Assistente', content: 'Outra.' },
          ],
        },
        {
          label: 'Anexar mais uma',
          apply: (current: ChatMessage[]): ChatMessage[] => [
            ...current,
            { id: 'nova-3', role: 'assistant', author: 'Assistente', content: 'Mais uma.' },
          ],
        },
      ],
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="chat-thread"]')!;
    const viewport = root.querySelector<HTMLElement>('.nds-chat-thread-viewport')!;
    const jump = (count: number) => canvas.queryByRole('button', { name: jumpToEndName(count) });
    const anyJump = () => root.querySelector<HTMLButtonElement>('[data-slot="chat-thread-jump"]:not([hidden])');

    await step('A conversa abre no fim, e o botão não existe', async () => {
      // O passo estabelece a própria precondição: a play REEXECUTA no mesmo
      // DOM, e herdar a rolagem da rodada anterior inverteria o resultado.
      await userEvent.click(canvas.getByRole('button', { name: 'Reiniciar' }));
      const pending = anyJump();
      if (pending) await userEvent.click(pending);
      await waitFor(() => expect(anyJump()).toBeNull());
    });

    await step('Rolando para trás, o botão aparece — sem contagem ainda', async () => {
      await scrollViewportTo(viewport, 0);
      await waitFor(() => expect(jump(0)).not.toBeNull());
    });

    await step('Mensagem nova NÃO move a rolagem, e entra na contagem', async () => {
      // É a regra que protege quem está lendo uma resposta antiga.
      const before = viewport.scrollTop;
      await userEvent.click(canvas.getByRole('button', { name: 'Anexar duas' }));

      await waitFor(() => expect(jump(2)).not.toBeNull());
      await expect(viewport.scrollTop).toBe(before);
    });

    await step('O botão devolve ao fim, zera a contagem e sai do percurso', async () => {
      await userEvent.click(jump(2)!);
      await waitFor(() =>
        expect(
          viewport.scrollHeight - viewport.clientHeight - viewport.scrollTop,
        ).toBeLessThanOrEqual(BOTTOM_SLACK),
      );
      await expect(anyJump()).toBeNull();
    });

    await step('De volta ao fim, a rolagem acompanha a mensagem seguinte', async () => {
      const before = viewport.scrollTop;
      await userEvent.click(canvas.getByRole('button', { name: 'Anexar mais uma' }));
      await waitFor(() => expect(viewport.scrollTop).toBeGreaterThan(before));
      await expect(anyJump()).toBeNull();
    });
  },
};

export const Streaming: Story = {
  parameters: { covers: ['accessibility.item2', 'visual.item3'] },
  render: () => {
    const messages = toMessages(CHAT_EM_STREAMING);
    // A última ainda está chegando.
    messages[messages.length - 1].streaming = true;
    return {
      Component: ChatThread,
      props: { messages, labels: chatThreadLabels(), size: 'md' },
    };
  },
  play: async ({ canvasElement, step }) => {
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="chat-thread"]')!;

    await step('A mensagem que chega se declara ocupada', async () => {
      const last = [...root.querySelectorAll('[data-slot="chat-message"]')].at(-1)!;
      await expect(last).toHaveAttribute('aria-busy', 'true');
    });

    await step('E NÃO é anunciada a cada trecho', async () => {
      // A decisão que governa o componente: o anunciador só recebe a resposta
      // quando ela termina. Enquanto chega, ele fica vazio.
      const announcer = root.querySelector('.nds-chat-thread-announcer')!;
      await expect(announcer.textContent).toBe('');
      await expect(root.querySelectorAll('[aria-live]')).toHaveLength(1);
    });

    await step('A cerca ainda aberta fica como texto, e não vira bloco', async () => {
      // Herdado do Markdown, e é o que evita a estrutura piscando a cada trecho.
      await expect(root.querySelector('.nds-code-block-root')).toBeNull();
      const tail = root.querySelector('.nds-markdown-raw');
      await expect(tail).toHaveTextContent('const view = createChatThread');
    });
  },
};

export const ToolFailed: Story = {
  parameters: { covers: ['functional.item6', 'visual.item4'] },
  render: () => ({
    Component: ChatThread,
    props: { messages: toMessages(CHAT_FERRAMENTA_FALHOU), labels: chatThreadLabels(), size: 'md' },
  }),
  play: async ({ canvasElement, step }) => {
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="chat-thread"]')!;
    const labels = chatThreadLabels();

    await step('O estado da ferramenta aparece no TEXTO, não só na cor', async () => {
      // Cor sozinha não descreve estado para quem não a percebe. O ícone leva a
      // cor de erro, e o resumo leva a palavra.
      const call = root.querySelector<HTMLElement>('.nds-chat-tool-call')!;
      await expect(call.dataset.state).toBe('failed');
      await expect(call).toHaveTextContent(labels.toolState.failed);
    });

    await step('O detalhe existe, e nasce fechado', async () => {
      const call = root.querySelector<HTMLDetailsElement>('.nds-chat-tool-call')!;
      await expect(call.open).toBe(false);
      await expect(call).toHaveTextContent('falta a versão');
    });
  },
};

// ── A conversa em movimento ───────────────────────────────────────────────────
//
// A metade que um protocolo de agente exige: endereço, chegada em pedaços,
// autorização e falha da execução. Um protocolo não manda mensagens prontas —
// manda um começo, uma sequência de trechos e um fim, todos com o MESMO id.

const FIRST_ANSWER: ChatMessage[] = [
  ...toMessages(CHAT_CONVERSA.slice(0, 1)),
  // O turno que vai crescer nasce vazio, endereçado e ocupado — como um
  // protocolo o abriria. As ações do turno entram pelo andaime, que é quem tem
  // marcação para declarar o `{#snippet}`.
  {
    id: 'resposta',
    role: 'assistant',
    author: 'Assistente',
    content: '',
    streaming: true,
    reasoning: 'Vou responder em partes.',
  },
];

export const StreamingUpdate: HarnessStory = {
  parameters: {
    covers: ['functional.item7', 'functional.item8', 'accessibility.item2'],
    docs: { source: { transform: chatThreadStreamingSource } },
  },
  render: () => ({
    Component: ChatThreadHarnessStory,
    props: {
      initial: FIRST_ANSWER,
      actionsFor: 'resposta',
      controls: [
        { label: 'Primeiro trecho', apply: patch('resposta', { content: 'A resposta' }) },
        {
          label: 'Segundo trecho',
          apply: patch('resposta', { content: 'A resposta chega **em partes**.' }),
        },
        {
          label: 'Terceiro trecho',
          apply: patch('resposta', { content: 'A resposta chega **em partes**, e cresce.' }),
        },
        { label: 'Encerrar', apply: patch('resposta', { streaming: false }) },
      ],
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="chat-thread"]')!;
    const message = () => root.querySelector<HTMLElement>('[data-message-id="resposta"]')!;
    const announcer = root.querySelector<HTMLElement>('.nds-chat-thread-announcer')!;
    const click = (name: string) => userEvent.click(canvas.getByRole('button', { name }));

    await step('A mensagem endereçada nasce ocupada e vazia', async () => {
      // Precondição própria: o painel Interactions reexecuta no mesmo DOM.
      await click('Reiniciar');
      await expect(message()).toHaveAttribute('aria-busy', 'true');
    });

    await step('Cada trecho pousa no MESMO id, e o texto cresce', async () => {
      // Sem endereço, cada um destes viraria uma mensagem nova — o `id` é o que
      // vira chave do `{#each}`, e é a chave que faz o compilador remendar em
      // vez de remontar.
      const howMany = root.querySelectorAll('[data-slot="chat-message"]').length;
      // O anunciador de ANTES dos trechos. Comparar com ele — em vez de exigir
      // vazio — é o que deixa o passo estabelecer a própria precondição: o
      // painel Interactions reexecuta a play no mesmo DOM, e ali o anunciador
      // já carrega o resultado da rodada anterior.
      const announcedBefore = announcer.textContent;

      await click('Primeiro trecho');
      await waitFor(() => expect(message()).toHaveTextContent('A resposta'));

      await click('Segundo trecho');
      await waitFor(() => expect(message().querySelector('strong')).toHaveTextContent('em partes'));
      await expect(root.querySelectorAll('[data-slot="chat-message"]')).toHaveLength(howMany);

      // Trecho não anuncia: quem anuncia é a transição, e ela ainda não veio.
      await expect(announcer.textContent).toBe(announcedBefore);
    });

    await step('O trecho novo REMENDA a mensagem, e não a remonta', async () => {
      // É a promessa do componente, e é ela que decide a API: a mensagem tem
      // `id`, o `id` é a chave, e por isso o nó sobrevive ao trecho seguinte.
      // Remontar a mensagem a cada trecho tiraria o foco de dentro dela e
      // fecharia o colapsável.
      //
      // A prova NÃO é o foco, e a diferença importa: aqui quem provoca o
      // trecho é um botão da tela, e clicar num botão dá foco a ele — a
      // asserção mediria o andaime, não o componente. O que um remonte
      // destruiria e um remendo preserva é a IDENTIDADE do nó, e com ela o
      // `open` do colapsável, que ninguém controla por props.
      const disclosure = message().querySelector<HTMLDetailsElement>('.nds-chat-reasoning')!;
      disclosure.open = true;
      const copyBefore = canvas.getByRole('button', { name: 'Copiar' });
      const messageBefore = message();

      await click('Terceiro trecho');

      await waitFor(() => expect(message()).toHaveTextContent('e cresce'));
      await expect(message()).toBe(messageBefore);
      await expect(canvas.getByRole('button', { name: 'Copiar' })).toBe(copyBefore);
      await expect(disclosure.open).toBe(true);
    });

    await step('Desligar o streaming anuncia UMA vez — é a transição que anuncia', async () => {
      // O buraco da primeira versão: a mensagem nascia em streaming e nada
      // podia desligá-lo, então o anúncio único era inalcançável.
      await click('Encerrar');

      await waitFor(() => expect(message()).not.toHaveAttribute('aria-busy'));
      await waitFor(() => expect(announcer.textContent).toContain('A resposta chega'));
    });
  },
};

export const ToolAwaitingApproval: ApprovalStory = {
  parameters: { covers: ['visual.item6'] },
  render: () => ({ Component: ChatThreadApprovalStory, props: {} }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="chat-thread"]')!;
    const labels = chatThreadLabels();

    await step('A chamada que espera por uma pessoa nasce ABERTA', async () => {
      // Pedir autorização dentro de uma caixa fechada é pedir sem mostrar.
      const call = root.querySelector<HTMLDetailsElement>('.nds-chat-tool-call')!;
      await expect(call.open).toBe(true);
      await expect(call.dataset.state).toBe('pending');
    });

    await step('O estado aparece no TEXTO, e não só na cor da moldura', async () => {
      const call = root.querySelector<HTMLElement>('.nds-chat-tool-call')!;
      await expect(call).toHaveTextContent(labels.toolState.pending);
    });

    await step('Os controles de autorização são de quem consome, e estão lá', async () => {
      const approval = root.querySelector<HTMLElement>('.nds-chat-tool-call-approval')!;
      await expect(within(approval).getAllByRole('button')).toHaveLength(2);
      await expect(canvas.getByRole('button', { name: 'Autorizar' })).toBeInTheDocument();
    });
  },
};

export const RunError: HarnessStory = {
  parameters: {
    covers: ['functional.item9', 'accessibility.item6', 'visual.item7'],
    docs: { source: { transform: chatThreadErrorSource } },
  },
  render: () => ({
    Component: ChatThreadHarnessStory,
    props: {
      initial: toMessages(CHAT_CONVERSA.slice(0, 1)),
      initialError: 'A execução parou: o modelo não respondeu.',
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="chat-thread"]')!;
    const errorStrip = () => root.querySelector<HTMLElement>('[data-slot="chat-thread-error"]')!;

    await step('A falha da execução é anunciada, e de imediato', async () => {
      // Precondição própria: a rodada anterior pode ter limpado o erro.
      await userEvent.click(canvas.getByRole('button', { name: 'Reiniciar' }));
      // Não contradiz a regra de que a conversa não é região viva: aquela é
      // sobre texto em streaming, que chega em cem pedaços. Isto é uma frase
      // curta, definitiva, e quem não vê a tela precisa saber na hora.
      await waitFor(() => expect(errorStrip()).toHaveAttribute('role', 'alert'));
      await waitFor(() => expect(errorStrip().hidden).toBe(false));
      await expect(errorStrip()).toHaveTextContent('não respondeu');
    });

    await step('Ela NÃO é um turno da conversa', async () => {
      // Ninguém disse isto: não é fala de ninguém, e por isso mora fora da
      // lista. Dentro dela, o leitor de tela a anunciaria como mensagem.
      const turns = root.querySelector<HTMLElement>('.nds-chat-thread-list')!;
      await expect(turns.contains(errorStrip())).toBe(false);
      await expect(turns.children).toHaveLength(1);
    });

    await step('E some quando o erro é limpo', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'Limpar erro' }));
      await waitFor(() => expect(errorStrip().hidden).toBe(true));
    });
  },
};
