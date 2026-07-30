import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { userEvent, within, expect, waitFor, fn } from 'storybook/test';
import { CodeBlock } from './index';

/** Snippet canônico das stories e da docs page nas 4 stacks. */
const DEMO_CODE = `<script lang="ts">
  import { CodeBlock } from '@/components/ui/code-block';

  const source = 'const x = 1';
  const marked = [3, '5-7'];
</script>

<CodeBlock
  code={source}
  language="ts"
  highlightLines={marked}
/>`;

type CodeBlockArgs = {
  code: string;
  language: string;
  title: string;
  showLineNumbers: boolean;
  highlightLines: string;
};

const meta = {
  title: 'UI/CodeBlock',
  component: CodeBlock,
  tags: ['autodocs', 'display'],
  // O docgen do Svelte está desligado no .storybook/main.ts: a aba
  // "API Reference" sai só destes argTypes.
  argTypes: {
    code: {
      control: 'text',
      description: 'Código a exibir. É exatamente o que o botão copiar coloca no clipboard.',
      table: { type: { summary: 'string' } },
    },
    language: {
      control: 'select',
      options: ['ts', 'tsx', 'js', 'jsx', 'vue', 'svelte', 'html', 'css', 'json', 'bash', 'text'],
      description: 'Linguagem ou extensão. Valor desconhecido cai em text (sem cor), não quebra.',
      table: { type: { summary: 'string' }, defaultValue: { summary: "'text'" } },
    },
    title: {
      control: 'text',
      description: 'Rótulo do header, normalmente o nome do arquivo. O botão copiar aparece com ou sem título.',
      table: { type: { summary: 'string' } },
    },
    showLineNumbers: {
      control: 'boolean',
      description: 'Numeração de linha. A numeração nunca entra no texto copiado.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    highlightLines: {
      control: 'text',
      description: "Linhas destacadas. Aceita '3, 5-7' ou [3, '5-7'].",
      table: { type: { summary: 'string | Array<number | string>' } },
    },
    footer: {
      control: 'text',
      description: 'Observações abaixo do código. Aceita string ou snippet; o control cobre o caso string.',
      table: { type: { summary: 'string | Snippet' } },
    },
    copyLabel: {
      control: false,
      description: 'Rótulo acessível do botão copiar.',
      table: { type: { summary: 'string' }, defaultValue: { summary: "'Copiar código'" } },
    },
    copiedLabel: {
      control: false,
      description: 'Rótulo de confirmação, anunciado por aria-live.',
      table: { type: { summary: 'string' }, defaultValue: { summary: "'Copiado!'" } },
    },
    class: {
      control: false,
      description: 'Classes adicionais na raiz. Use para sobrescrever --code-block-highlight-bg.',
      table: { type: { summary: 'string' } },
    },
  },
  args: {
    code: DEMO_CODE,
    language: 'svelte',
    title: 'exemplo.svelte',
    showLineNumbers: true,
    highlightLines: '3, 5-7',
    footer: '',
  },
} satisfies Meta<typeof CodeBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  // Sem docgen, o gerador de source monta a tag a partir do nome interno da
  // função compilada. O snippet vai explícito, montado a partir dos args.
  parameters: {
    docs: {
      source: {
        transform: (_generated: string, ctx: { args?: Partial<CodeBlockArgs> }) => {
          const a = ctx.args ?? {};
          const attrs = [
            'code={source}',
            `language="${a.language ?? 'text'}"`,
            a.title ? `title="${a.title}"` : '',
            a.showLineNumbers === false ? 'showLineNumbers={false}' : '',
            a.highlightLines ? `highlightLines="${a.highlightLines}"` : '',
          ].filter(Boolean).join('\n  ');
          return `<script lang="ts">
  import { CodeBlock } from "@/components/ui/code-block";
  const source = "…";
<\/script>

<CodeBlock
  ${attrs}
/>`;
        },
      },
    },
  },
  render: (args) => ({ Component: CodeBlock, props: args }),
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="code-block"]')!;

    await step('A raiz registra a configuração recebida', async () => {
      await expect(root).toHaveAttribute('data-numbered', String(args.showLineNumbers));
    });

    await step('Uma linha por linha do código', async () => {
      const lines = root.querySelectorAll('.nds-code-block-line');
      await expect(lines).toHaveLength(args.code.split('\n').length);
    });

    await step('O highlight marca exatamente as linhas pedidas', async () => {
      const marked = [...root.querySelectorAll('.nds-code-block-line')]
        .map((el, i) => (el.getAttribute('data-highlighted') === 'true' ? i + 1 : 0))
        .filter(Boolean);
      await expect(marked).toEqual([3, 5, 6, 7]);
    });

    await step('A numeração não é selecionável, então não entra no texto copiado', async () => {
      const gutter = root.querySelector<HTMLElement>('.nds-code-block-gutter')!;
      await expect(getComputedStyle(gutter).userSelect).toBe('none');
    });

    await step('Copiar coloca no clipboard só o código, sem os números de linha', async () => {
      // Stub do writeText: o clipboard real não funciona no browser de teste
      // (rejeita por permissão, e o fallback via execCommand exige user
      // activation, que evento sintético não tem). O que interessa verificar é
      // nosso lado — o que é copiado e o feedback — não a API do browser.
      const writeText = fn((text: string) => Promise.resolve(text));
      const original = navigator.clipboard;
      Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });

      try {
        await userEvent.click(canvas.getByRole('button', { name: /copiar código/i }));
        await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
        await expect(writeText).toHaveBeenCalledWith(args.code);
        // A numeração é 1..N; se tivesse vazado, apareceria no texto copiado.
        await expect(writeText).not.toHaveBeenCalledWith(expect.stringMatching(/^1</));
      } finally {
        Object.defineProperty(navigator, 'clipboard', { value: original, configurable: true });
      }
    });

    await step('O feedback aparece e é anunciado por aria-live', async () => {
      // Um ícone por vez. A primeira versão do Vanilla mantinha os dois no DOM
      // alternando o atributo hidden, que não esconde SVG — e os dois apareciam.
      const button = canvasElement.querySelector('[data-slot="code-block-copy"]');
      await expect(button?.querySelectorAll('svg')).toHaveLength(1);
      await waitFor(() =>
        expect(canvas.getByRole('button', { name: /copiado/i })).toBeInTheDocument(),
      );
      await expect(root.querySelector('.nds-sr-only')).toHaveTextContent('Copiado!');
    });
  },
};
