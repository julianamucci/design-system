import type { Meta, StoryObj } from '@storybook/html-vite';
import { expect, within } from 'storybook/test';
import { createMarkdown } from './markdown';
import { markdownSource, markdownSourceWith } from './markdown.source';
import { ALLOW_PRESETS } from '@shared/primitives/markdown-ast';
import { MARKDOWN_COMMENT } from '@shared/primitives/markdown-examples';

// ─── Meta ─────────────────────────────────────────────────────────────────────
//
// A variação deste componente é o que ele ACEITA estruturar, não a aparência.
// As três stories passam o MESMO texto e mudam só a lista branca — é assim que
// se vê que o documento muda de forma sem perder conteúdo.

const meta: Meta = {
  tags: ['conversational'],
  title: 'UI/Markdown/Variants',
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      // O piso do arquivo: story sem transform própria cairia no

      // `outerHTML` — o componente inteiro já desenhado, em vez da chamada.

      source: { transform: markdownSource },
      description: {
        component:
          'O mesmo texto sob as três listas brancas. O que fica de fora de cada uma vira texto, e nada some.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

/** Todas as stories deste arquivo mostram o mesmo documento. */
const SAME_SOURCE = MARKDOWN_COMMENT;

export const Full: Story = {
  parameters: {
    covers: ['visual.item2'],
    docs: { source: { transform: markdownSourceWith({ content: SAME_SOURCE }) } },
  },
  render: () => createMarkdown({ content: SAME_SOURCE, allow: ALLOW_PRESETS.full }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // A lista padrão estrutura tudo: o título é título e a tabela é tabela.
    await expect(canvas.getByRole('heading', { level: 2 })).toBeVisible();
    await expect(canvas.getByRole('table')).toBeVisible();
  },
};

export const Chat: Story = {
  parameters: {
    covers: ['functional.item5'],
    docs: {
      source: {
        transform: markdownSourceWith({ content: SAME_SOURCE, allow: [...ALLOW_PRESETS.chat] }),
      },
    },
  },
  render: () => createMarkdown({ content: SAME_SOURCE, allow: ALLOW_PRESETS.chat }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Numa bolha de conversa, título compete com a hierarquia da página em
    // volta — e tabela raramente cabe na largura.
    await expect(canvas.queryByRole('heading')).toBeNull();
    await expect(canvas.queryByRole('table')).toBeNull();

    // E nada some: o texto dos dois continua legível.
    await expect(canvasElement).toHaveTextContent('Um título dentro de um comentário');
    await expect(canvasElement).toHaveTextContent('ponto principal');
  },
};

export const Comment: Story = {
  parameters: {
    covers: ['visual.item2'],
    docs: {
      source: {
        transform: markdownSourceWith({ content: SAME_SOURCE, allow: [...ALLOW_PRESETS.comment] }),
      },
    },
  },
  render: () => createMarkdown({ content: SAME_SOURCE, allow: ALLOW_PRESETS.comment }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="markdown"]')!;

    // Onde estrutura é ruído, sobra só texto corrido — e a ênfase, que é da
    // frase e não do bloco.
    await expect(canvas.queryByRole('heading')).toBeNull();
    await expect(canvas.queryByRole('table')).toBeNull();
    await expect(root.querySelector('strong')).toBeInTheDocument();
    await expect([...root.children].every((el) => el.tagName === 'P')).toBe(true);
  },
};
