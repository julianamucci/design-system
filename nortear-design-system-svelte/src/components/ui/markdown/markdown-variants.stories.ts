import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { expect, within } from 'storybook/test';
import { Markdown } from './index';
import {
  markdownChatSource,
  markdownCommentSource,
  markdownFullSource,
} from './markdown.source';
import { ALLOW_PRESETS } from '@shared/primitives/markdown-ast';
import { MARKDOWN_COMMENT } from '@shared/primitives/markdown-examples';

// A variação deste componente é o que ele ACEITA estruturar, não a aparência.
// As três stories passam o MESMO texto e mudam só a lista branca — é assim que
// se vê que o documento muda de forma sem perder conteúdo.

const meta = {
  title: 'Primitives/Conversational/Markdown/Variants',
  component: Markdown,
  tags: ['conversational'],
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: markdownFullSource },
      description: {
        component:
          'O mesmo texto sob as três listas brancas. O que fica de fora de cada uma vira texto, e nada some.',
      },
    },
  },
} satisfies Meta<typeof Markdown>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Full: Story = {
  parameters: {
    covers: ['visual.item2'],
    docs: { source: { transform: markdownFullSource } },
  },
  args: { content: MARKDOWN_COMMENT, allow: ALLOW_PRESETS.full },
  render: (args) => ({ Component: Markdown, props: args }),
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
    docs: { source: { transform: markdownChatSource } },
  },
  args: { content: MARKDOWN_COMMENT, allow: ALLOW_PRESETS.chat },
  render: (args) => ({ Component: Markdown, props: args }),
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
    docs: { source: { transform: markdownCommentSource } },
  },
  args: { content: MARKDOWN_COMMENT, allow: ALLOW_PRESETS.comment },
  render: (args) => ({ Component: Markdown, props: args }),
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
