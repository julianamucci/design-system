import type { Meta, StoryObj } from '@storybook/html-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { createChatThread, type ChatThreadElement } from './chat-thread';
import { chatLabels, paraMensagens } from './chat-thread.fixtures';
import { chatThreadSourceWith } from './chat-thread.source';
import {
  CHAT_EM_STREAMING,
  CHAT_FERRAMENTA_FALHOU,
  CHAT_LONGA,
} from '@shared/primitives/chat-examples';

// ─── Meta ─────────────────────────────────────────────────────────────────────
//
// Os estados que a docs page lista. O estado "no fim" é o Playground, e não se
// repete aqui.

const meta: Meta = {
  tags: ['conversational'],
  title: 'UI/ChatThread/States',
  parameters: {
    layout: 'padded',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: chatThreadSourceWith({ append: true }) },
      description: {
        component: 'Cada story fixa um estado e verifica o que ele muda na conversa.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

/** Rola até um ponto e espera o evento de rolagem ser processado. */
async function scrollTo(viewport: HTMLElement, top: number) {
  viewport.scrollTop = top;
  viewport.dispatchEvent(new Event('scroll'));
  await waitFor(() => expect(viewport.scrollTop).toBe(top));
}

export const ReadingBack: Story = {
  parameters: {
    covers: [
      'functional.item2', 'functional.item3', 'functional.item4',
      'accessibility.item5', 'visual.item5',
    ],
  },
  render: () =>
    createChatThread({
      messages: paraMensagens(CHAT_LONGA),
      labels: chatLabels(),
      size: 'md',
    }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector<ChatThreadElement>('[data-slot="chat-thread"]')!;
    const viewport = root.querySelector<HTMLElement>('.nds-chat-thread-viewport')!;
    const jump = () => canvas.queryByRole('button', { name: /ir para o fim/i });

    await step('A conversa abre no fim, e o botão não existe', async () => {
      // O passo estabelece a própria precondição: a play REEXECUTA no mesmo
      // DOM, e herdar a rolagem da rodada anterior inverteria o resultado.
      root.jumpToEnd();
      await expect(jump()).toBeNull();
    });

    await step('Rolando para trás, o botão aparece — sem contagem ainda', async () => {
      await scrollTo(viewport, 0);
      await waitFor(() => expect(jump()).not.toBeNull());
      await expect(jump()).toHaveAccessibleName(/ir para o fim · 0/i);
    });

    await step('Mensagem nova NÃO move a rolagem, e entra na contagem', async () => {
      // É a regra que protege quem está lendo uma resposta antiga.
      const antes = viewport.scrollTop;
      root.append({ role: 'assistant', author: 'Assistente', content: 'Resposta nova.' });
      root.append({ role: 'assistant', author: 'Assistente', content: 'Outra.' });

      await expect(viewport.scrollTop).toBe(antes);
      await expect(jump()).toHaveAccessibleName(/ir para o fim · 2/i);
    });

    await step('O botão devolve ao fim, zera a contagem e sai do percurso', async () => {
      await userEvent.click(jump()!);
      await waitFor(() =>
        expect(viewport.scrollHeight - viewport.clientHeight - viewport.scrollTop)
          .toBeLessThanOrEqual(32),
      );
      await expect(jump()).toBeNull();
    });

    await step('De volta ao fim, a rolagem acompanha a mensagem seguinte', async () => {
      const antes = viewport.scrollTop;
      root.append({ role: 'assistant', author: 'Assistente', content: 'Mais uma.' });
      await expect(viewport.scrollTop).toBeGreaterThan(antes);
      await expect(jump()).toBeNull();
    });
  },
};

export const Streaming: Story = {
  parameters: { covers: ['accessibility.item2', 'visual.item3'] },
  render: () => {
    const messages = paraMensagens(CHAT_EM_STREAMING);
    // A última ainda está chegando.
    messages[messages.length - 1].streaming = true;
    return createChatThread({ messages, labels: chatLabels(), size: 'md' });
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
  render: () =>
    createChatThread({
      messages: paraMensagens(CHAT_FERRAMENTA_FALHOU),
      labels: chatLabels(),
      size: 'md',
    }),
  play: async ({ canvasElement, step }) => {
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="chat-thread"]')!;

    await step('O estado da ferramenta aparece no TEXTO, não só na cor', async () => {
      // Cor sozinha não descreve estado para quem não a percebe. O ícone leva a
      // cor de erro, e o resumo leva a palavra.
      const call = root.querySelector<HTMLElement>('.nds-chat-tool-call')!;
      await expect(call.dataset.state).toBe('failed');
      await expect(call).toHaveTextContent(/falhou/i);
    });

    await step('O detalhe existe, e nasce fechado', async () => {
      const call = root.querySelector<HTMLDetailsElement>('.nds-chat-tool-call')!;
      await expect(call.open).toBe(false);
      await expect(call).toHaveTextContent(/falta a versão/i);
    });
  },
};
