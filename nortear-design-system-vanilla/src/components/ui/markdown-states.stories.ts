import type { Meta, StoryObj } from '@storybook/html-vite';
import { expect, within } from 'storybook/test';
import { createMarkdown } from './markdown';
import { markdownSource, markdownSourceWith } from './markdown.source';
import { MARKDOWN_STREAMING, MARKDOWN_UNSAFE } from '@shared/primitives/markdown-examples';

// ─── Meta ─────────────────────────────────────────────────────────────────────
//
// Os estados que a docs page lista: gerando, com conteúdo recusado, e vazio. O
// estado "pronto" é o Playground, e não se repete aqui.

const meta: Meta = {
  tags: ['conversational'],
  title: 'Components/Conversational/Markdown/States',
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      // O piso do arquivo: story sem transform própria cairia no

      // `outerHTML` — o componente inteiro já desenhado, em vez da chamada.

      source: { transform: markdownSource },
      description: {
        component: 'Cada story fixa um estado e verifica o que ele muda no documento.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Streaming: Story = {
  parameters: {
    covers: ['accessibility.item2', 'visual.item3'],
    docs: {
      source: {
        transform: markdownSourceWith({ content: MARKDOWN_STREAMING, streaming: true }),
      },
    },
  },
  render: () => createMarkdown({ content: MARKDOWN_STREAMING, streaming: true }),
  play: async ({ canvasElement, step }) => {
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="markdown"]')!;

    await step('A raiz se declara ocupada enquanto o texto chega', async () => {
      await expect(root).toHaveAttribute('data-streaming', 'true');
      await expect(root).toHaveAttribute('aria-busy', 'true');
    });

    await step('NÃO existe região viva anunciando cada trecho', async () => {
      // Anunciar a cada token tornaria a leitura impossível. A resposta é
      // anunciada uma vez, inteira, quando termina.
      await expect(root.querySelector('[aria-live]')).toBeNull();
      await expect(root.querySelector('[role="status"], [role="alert"]')).toBeNull();
    });

    await step('A cerca ainda aberta fica como TEXTO, e não vira bloco', async () => {
      // É o que evita a estrutura piscando: sem isto, o bloco de código nasce,
      // some e renasce a cada trecho que chega.
      await expect(root.querySelector('.nds-code-block-root')).toBeNull();
      const tail = root.querySelector('.nds-markdown-raw');
      await expect(tail).toHaveTextContent('const tree = parseMarkdown(answer');
      // A crase da cerca continua visível: ela ainda não significou nada.
      //
      // `startsWith`, e não `toContain`: `.nds-markdown-raw` desenha com
      // `white-space: pre-wrap`, então espaço no começo do texto APARECE na
      // tela. Um recuo que o template deixasse entrar seria invisível para
      // `toHaveTextContent`, que normaliza o espaço antes de comparar.
      await expect(tail?.textContent?.startsWith('```ts')).toBe(true);
    });

    await step('O que veio ANTES da cerca já é documento', async () => {
      const paragraph = root.querySelector('.nds-markdown-paragraph');
      await expect(paragraph).toHaveTextContent('O caminho mais curto é este');
    });
  },
};

export const RefusedContent: Story = {
  parameters: {
    covers: ['functional.item3', 'functional.item4', 'visual.item4'],
    docs: { source: { transform: markdownSourceWith({ content: MARKDOWN_UNSAFE }) } },
  },
  render: () => createMarkdown({ content: MARKDOWN_UNSAFE }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="markdown"]')!;

    await step('O HTML não vira markup — vira texto visível', async () => {
      // O vetor mais direto de XSS num chat. Se um dia virar markup, este
      // `querySelector` acha o elemento e a story reprova.
      await expect(root.querySelector('script')).toBeNull();
      await expect(root.querySelector('img')).toBeNull();
      await expect(canvasElement).toHaveTextContent('<script>alert(1)</script>');
      await expect(canvasElement).toHaveTextContent('onerror=alert(1)');
    });

    await step('O link de esquema recusado deixa de ser link, e o texto fica', async () => {
      // Apagar o link inteiro esconderia de quem lê que o modelo tentou mandar
      // um. Some o destino, permanece a frase.
      await expect(canvas.queryByRole('link')).toBeNull();
      await expect(canvasElement).toHaveTextContent('link que promete navegar');
    });

    await step('A imagem embutida também sai, e a descrição dela permanece', async () => {
      await expect(canvasElement).toHaveTextContent('imagem embutida');
    });
  },
};

export const Empty: Story = {
  parameters: {
    covers: ['visual.item5'],
    docs: { source: { transform: markdownSourceWith({ content: '' }) } },
  },
  render: () => createMarkdown({ content: '   \n  ' }),
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="markdown"]')!;

    // Nada desenhado, e a raiz não ocupa espaço: sem a regra de `:empty` ela
    // continuaria sendo um bloco e herdaria a margem de quem está em volta.
    await expect(root.childElementCount).toBe(0);
    await expect(getComputedStyle(root).display).toBe('none');
  },
};
