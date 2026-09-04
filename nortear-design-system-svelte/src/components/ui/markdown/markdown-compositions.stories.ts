import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { expect, within } from 'storybook/test';
import { Markdown } from './index';
import { markdownCodeBlockSource, markdownTableSource } from './markdown.source';
import { MARKDOWN_CODE, MARKDOWN_TABLE } from '@shared/primitives/markdown-examples';

// Os dois blocos que este componente NÃO desenha sozinho: bloco de código é do
// CodeBlock, tabela é da Table. Ficam aqui porque cada story é a costura de
// dois componentes, e é a costura que pode quebrar.

const meta = {
  title: 'Components/Conversational/Markdown/Compositions',
  component: Markdown,
  tags: ['conversational'],
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: markdownCodeBlockSource },
      description: {
        component:
          'O documento delega o bloco de código e a tabela aos componentes do sistema, em vez de desenhar os seus.',
      },
    },
  },
} satisfies Meta<typeof Markdown>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithCodeBlock: Story = {
  parameters: {
    covers: ['functional.item2'],
    docs: { source: { transform: markdownCodeBlockSource } },
  },
  args: { content: MARKDOWN_CODE },
  render: (args) => ({ Component: Markdown, props: args }),
  play: async ({ canvasElement, step }) => {
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="markdown"]')!;

    await step('A cerca vira um CodeBlock, com a linguagem que o texto declarou', async () => {
      const block = root.querySelector<HTMLElement>('[data-slot="code-block"]');
      await expect(block).toBeInTheDocument();
      await expect(block).toHaveAttribute('data-language', 'ts');
    });

    await step('O destaque de sintaxe vem dos tokens do tema, e não de uma segunda paleta', async () => {
      // Sem esta verificação, um bloco que saísse como texto simples passaria
      // em todo o resto.
      const highlighted = root.querySelectorAll('[data-token]:not([data-token="plain"])');
      await expect(highlighted.length).toBeGreaterThan(0);
    });

    await step('O código curto do parágrafo NÃO é o bloco', async () => {
      // Dois desenhos diferentes para duas coisas diferentes: um é do sistema
      // de código, o outro é da prosa.
      const inline = root.querySelector('code.nds-markdown-inline-code');
      await expect(inline).toHaveTextContent('streaming');
      await expect(inline?.closest('[data-slot="code-block"]')).toBeNull();
    });
  },
};

export const WithTable: Story = {
  parameters: {
    covers: ['functional.item6'],
    docs: { source: { transform: markdownTableSource } },
  },
  args: { content: MARKDOWN_TABLE },
  render: (args) => ({ Component: Markdown, props: args }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="markdown"]')!;

    await step('A grade é uma TABELA de verdade, com cabeçalho de coluna', async () => {
      await expect(canvas.getByRole('table')).toBeVisible();
      const headers = canvas.getAllByRole('columnheader');
      await expect(headers).toHaveLength(3);
      // `scope` é o que faz o leitor de tela dizer de que coluna veio a célula.
      await expect(headers[0]).toHaveAttribute('scope', 'col');
    });

    await step('O alinhamento declarado pelo texto chega à célula', async () => {
      // `|:------|:-----------------:|-----------------------:|`
      const row = canvas.getAllByRole('row')[1];
      const cells = within(row).getAllByRole('cell');
      await expect(cells[1]).toHaveAttribute('data-align', 'center');
      await expect(cells[2]).toHaveAttribute('data-align', 'right');
      await expect(getComputedStyle(cells[2]).textAlign).toBe('right');
    });

    await step('A região que rola é alcançável por teclado', async () => {
      // Tabela larga rola dentro da própria caixa. Sem o `tabindex` da wrapper,
      // quem navega por teclado não alcança o que ficou fora da tela.
      const wrapper = root.querySelector<HTMLElement>('.nds-table-wrapper');
      await expect(wrapper).toHaveAttribute('tabindex', '0');
    });

    await step('Item de tarefa anuncia marcada ou não marcada, e não é operável', async () => {
      const boxes = canvas.getAllByRole('checkbox');
      await expect(boxes).toHaveLength(2);
      await expect(boxes[0]).toBeChecked();
      await expect(boxes[1]).not.toBeChecked();
      await expect(boxes[0]).toBeDisabled();
    });
  },
};
