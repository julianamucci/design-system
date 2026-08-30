import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { NdsMarkdown } from './markdown';
import { NdsMarkdownDocs } from '@/components/docs/MarkdownDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import { markdownSource } from './markdown.source';
import type { MdBlockKind } from '@shared/primitives/markdown-ast';
import { MARKDOWN_PROSE } from '@shared/primitives/markdown-examples';

// ─── Meta ─────────────────────────────────────────────────────────────────────

type MarkdownArgs = {
  content: string;
  streaming: boolean;
  allow: MdBlockKind[];
  allowedProtocols: string[];
  linkClick: (url: string) => void;
  class?: string;
};

/** Todo bloco que a lista branca pode nomear, para o control marcar. */
const BLOCKS: MdBlockKind[] = [
  'paragraph', 'heading', 'code', 'blockquote', 'list', 'thematicBreak', 'table', 'raw',
];

const meta: Meta<MarkdownArgs> = {
  title: 'Primitives/Conversational/Markdown',
  tags: ['autodocs', 'conversational'],
  decorators: [moduleMetadata({ imports: [NdsMarkdown] })],
  parameters: {
    layout: 'padded',
    docs: {
      page: withAutoDocsTab(NdsMarkdownDocs),
      // O renderer Angular imprime o `template` da story com os bindings; o
      // documento precisa aparecer como literal, senão o que se copia perde as
      // quebras de linha — e aqui a linha em branco entre parágrafos É a
      // sintaxe.
      source: { transform: markdownSource },
    },
  },
  // Sem compodoc nesta stack: a aba API Reference sai só destes argTypes.
  argTypes: {
    content: {
      control: 'text',
      description: 'O texto em Markdown. Vem de fora do código e é tratado como não confiável.',
      table: { type: { summary: 'string' } },
    },
    streaming: {
      control: 'boolean',
      description:
        'Ligue enquanto o texto ainda chega: construção ainda aberta fica como texto, e a raiz é marcada como ocupada.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    allow: {
      control: 'check',
      options: BLOCKS,
      description: 'Quais blocos podem ser estruturados. O que fica de fora vira texto, e nunca some.',
      table: { type: { summary: 'MdBlockKind[]' }, defaultValue: { summary: 'todos' } },
    },
    allowedProtocols: {
      control: 'check',
      options: ['http:', 'https:', 'mailto:', 'tel:'],
      description: 'Esquemas de endereço aceitos. Endereço recusado perde o destino e mantém o texto.',
      table: {
        type: { summary: 'string[]' },
        defaultValue: { summary: "['http:', 'https:', 'mailto:']" },
      },
    },
    linkClick: {
      // Documentado, não controlável: um control de função não tem forma.
      control: false,
      description: 'Evento de clique num link. Com um ouvinte, quem navega é a aplicação.',
      table: { type: { summary: 'OutputEmitterRef<string>' } },
    },
    class: {
      control: false,
      description:
        'Atributo nativo do elemento, não input: o Angular mescla com a classe base. É por aqui que a página define a medida de leitura.',
      table: { type: { summary: 'string' } },
    },
  },
  args: {
    content: MARKDOWN_PROSE,
    streaming: false,
    allow: BLOCKS,
    allowedProtocols: ['http:', 'https:', 'mailto:'],
    linkClick: fn(),
  },
};

export default meta;
type Story = StoryObj<MarkdownArgs>;

// ─── Playground ───────────────────────────────────────────────────────────────

export const Playground: Story = {
  parameters: {
    covers: [
      'functional.item1',
      // `accessibility.item5` é contraste, e `item1` é o axe: as duas saem do
      // addon-a11y, que roda em toda story — mas o audit só as enxerga se
      // alguma story as declarar.
      'accessibility.item1', 'accessibility.item3', 'accessibility.item4', 'accessibility.item5',
      'visual.item1',
    ],
  },
  render: (args) => ({
    props: { ...args },
    template: `
      <nds-markdown
        [content]="content"
        [streaming]="streaming"
        [allow]="allow"
        [allowedProtocols]="allowedProtocols"
        (linkClick)="linkClick($event)"
      />
    `,
  }),
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="markdown"]')!;

    await step('A raiz registra a configuração recebida', async () => {
      await expect(root).toHaveAttribute('data-streaming', String(args.streaming));
      // Parada, e não gerando: sem `aria-busy`, o documento é definitivo.
      await expect(root).not.toHaveAttribute('aria-busy');
    });

    await step('Título vira título de verdade, no nível que o texto declarou', async () => {
      // `##` no texto: dois sustenidos, nível dois. Buscar por papel e nível é
      // o que prova que o leitor de tela navega por ele.
      await expect(canvas.getByRole('heading', { level: 2 })).toBeVisible();
    });

    await step('Lista é lista, e citação é citação', async () => {
      await expect(canvas.getAllByRole('listitem').length).toBeGreaterThan(2);
      await expect(root.querySelector('blockquote.nds-markdown-quote')).toBeInTheDocument();
    });

    await step('Ênfase e código curto saem como elementos, não como texto cru', async () => {
      await expect(root.querySelector('strong')).toBeInTheDocument();
      await expect(root.querySelector('em')).toBeInTheDocument();
      const inlineCode = root.querySelector('code.nds-markdown-inline-code');
      await expect(inlineCode).toHaveTextContent('content');
      // A crase não sobrevive: ela é sintaxe, e virou o elemento.
      await expect(root.textContent).not.toContain('`content`');
    });

    await step('A ênfase não injeta espaço em volta de si', async () => {
      // `**texto**,` no documento: o elemento termina COLADO na vírgula. Recuo
      // do template entre a tag e o texto vira um espaço visível ali, e
      // `toHaveTextContent` não veria — ele normaliza o espaço antes de
      // comparar. Por isso a leitura é do `textContent` cru.
      await expect(root.textContent).toContain('como texto, e sai como');
    });

    await step('O link leva o endereço, e o clique chega a quem consome', async () => {
      const link = canvas.getByRole('link', { name: /guia de escrita/i });
      await expect(link).toHaveAttribute('href', '/guias/escrita');
      await userEvent.click(link);
      await expect(args.linkClick).toHaveBeenCalledWith('/guias/escrita');
    });

    await step('Só o link recebe foco — o resto do documento é texto', async () => {
      const link = canvas.getByRole('link', { name: /guia de escrita/i });
      link.blur();
      await userEvent.tab();
      await expect(link).toHaveFocus();
      // O anel é visível, e não herdado do navegador: a folha declara sombra.
      await expect(getComputedStyle(link).boxShadow).not.toBe('none');
    });
  },
};
