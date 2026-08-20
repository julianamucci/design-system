import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { userEvent, within, expect, waitFor, fn } from 'storybook/test';
import { NdsCodeBlock } from './code-block';
import { withClipboardStub } from './code-block.fixtures';
import { NdsCodeBlockDocs } from '@/components/docs/CodeBlockDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

// ─── Meta ─────────────────────────────────────────────────────────────────────

type CodeBlockArgs = {
  code: string;
  language: string;
  title: string;
  showLineNumbers: boolean;
  highlightLines: string;
  footer: string;
  /** Documentadas na aba API Reference; o Playground não as encaminha. */
  copyLabel?: string;
  copiedLabel?: string;
  class?: string;
};

/**
 * Trecho do Playground. Montado por `join('\n')` porque o próprio código leva
 * crase (o `template` de um @Component) — escapá-las dentro de outra crase
 * deixaria de ser o texto que a pessoa copia.
 */
const DEMO_CODE = [
  "import { NdsCodeBlock } from '@/components/ui/code-block';",
  '',
  '@Component({',
  '  imports: [NdsCodeBlock],',
  '  template: `<nds-code-block [code]="source" language="ts" />`,',
  '})',
  'export class Exemplo {',
  "  readonly source = 'const total = items.length;';",
  '}',
].join('\n');

/**
 * Ver a nota em separator.stories.ts: o renderer Angular imprime no painel Code
 * o `template` da story como está escrito, com os bindings ligados aos args.
 * Aqui vai o uso real, montado a partir de `ctx.args` — só o que difere do
 * default entra.
 */
function playgroundSource(_gerado: string, ctx: { args?: Partial<CodeBlockArgs> }): string {
  const {
    language = 'text',
    title = '',
    showLineNumbers = true,
    highlightLines = '',
    footer = '',
  } = ctx.args ?? {};

  const atributos = ['      [code]="source"'];
  if (language && language !== 'text') atributos.push(`      language="${language}"`);
  if (title) atributos.push(`      title="${title}"`);
  if (!showLineNumbers) atributos.push('      [showLineNumbers]="false"');
  if (highlightLines) atributos.push(`      [highlightLines]="'${highlightLines}'"`);
  if (footer) atributos.push(`      footer="${footer}"`);

  return [
    "import { NdsCodeBlock } from '@/components/ui/code-block';",
    '',
    '@Component({',
    '  imports: [NdsCodeBlock],',
    '  template: `',
    '    <nds-code-block',
    ...atributos,
    '    />',
    '  `,',
    '})',
    'export class Exemplo {',
    '  readonly source = fonte;',
    '}',
  ].join('\n');
}

const meta: Meta<CodeBlockArgs> = {
  title: 'UI/CodeBlock',
  tags: ['autodocs', 'display'],
  decorators: [moduleMetadata({ imports: [NdsCodeBlock] })],
  parameters: {
    layout: 'padded',
    docs: { page: withAutoDocsTab(NdsCodeBlockDocs) },
  },
  // Sem compodoc nesta stack: a aba API Reference sai só destes argTypes.
  argTypes: {
    code: {
      control: 'text',
      description: 'Código a exibir. É exatamente o que o botão copiar entrega à área de transferência.',
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
      description: 'Rótulo do header, normalmente o nome do arquivo. O botão copiar aparece com ou sem rótulo.',
      table: { type: { summary: 'string' } },
    },
    showLineNumbers: {
      control: 'boolean',
      description: 'Numeração de linha. A numeração nunca entra no texto copiado nem na seleção com o mouse.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    highlightLines: {
      control: 'text',
      description: "Linhas destacadas, contadas a partir de 1. Aceita '3, 5-7' ou [3, '5-7'].",
      table: { type: { summary: 'string | ReadonlyArray<number | string>' } },
    },
    footer: {
      control: 'text',
      description: 'Observação abaixo do código, separada por borda. Texto simples.',
      table: { type: { summary: 'string' } },
    },
    copyLabel: {
      control: false,
      description: 'Rótulo acessível do botão copiar no estado inicial.',
      table: { type: { summary: 'string' }, defaultValue: { summary: "'Copiar código'" } },
    },
    copiedLabel: {
      control: false,
      description: 'Texto de confirmação, exibido ao lado do ícone e anunciado pela região de status.',
      table: { type: { summary: 'string' }, defaultValue: { summary: "'Copiado!'" } },
    },
    class: {
      control: false,
      description:
        'Atributo nativo do elemento, não input: o Angular mescla com a classe base. Use para sobrescrever as custom properties do bloco.',
      table: { type: { summary: 'string' } },
    },
  },
  args: {
    code: DEMO_CODE,
    language: 'ts',
    title: 'exemplo.ts',
    showLineNumbers: true,
    highlightLines: '3, 5-7',
    footer: '',
  },
};

export default meta;
type Story = StoryObj<CodeBlockArgs>;

// ─── Playground ───────────────────────────────────────────────────────────────

export const Playground: Story = {
  parameters: {
    docs: { source: { transform: playgroundSource } },
    // accessibility.item5 é 'sem violações axe-core': o addon-a11y roda em toda
    // story, mas o audit só enxerga o critério se alguma story o declarar.
    covers: [
      'functional.item1', 'functional.item2', 'functional.item3', 'functional.item4',
      'accessibility.item1', 'accessibility.item2', 'accessibility.item3', 'accessibility.item5',
      'visual.item1',
    ],
  },
  render: (args) => ({
    props: { ...args },
    template: `
      <nds-code-block
        [code]="code"
        [language]="language"
        [title]="title"
        [showLineNumbers]="showLineNumbers"
        [highlightLines]="highlightLines"
        [footer]="footer"
      />
    `,
  }),
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="code-block"]')!;

    await step('A raiz registra a configuração recebida', async () => {
      await expect(root).toHaveAttribute('data-numbered', String(args.showLineNumbers));
      await expect(root).toHaveAttribute('data-language', args.language);
    });

    await step('Uma linha por quebra do código, numeradas a partir de 1', async () => {
      const linhas = [...root.querySelectorAll<HTMLElement>('.nds-code-block-line')];
      await expect(linhas).toHaveLength(args.code.split('\n').length);
      const numeros = linhas.map(
        (l) => l.querySelector<HTMLElement>('.nds-code-block-gutter')!.textContent?.trim(),
      );
      await expect(numeros[0]).toBe('1');
      await expect(numeros.at(-1)).toBe(String(linhas.length));
    });

    await step('A linguagem suportada recebe classificação com cor própria', async () => {
      // Núcleo do componente: sem esta verificação um tokenizador que devolvesse
      // tudo `plain` passaria em todos os outros testes. `plain` não vira
      // elemento — vira nó de texto —, então todo [data-token] aqui é sintaxe.
      //
      // Sem fixar QUAL token: cada linguagem acende um conjunto diferente, e
      // exigir `keyword` reprovava o trecho de marcação — cujo tokenizador
      // classifica tag, atributo e string, e nenhuma palavra reservada.
      const classificados = [
        ...root.querySelectorAll<HTMLElement>('[data-token]:not([data-token="plain"])'),
      ];
      await expect(classificados.length).toBeGreaterThan(0);
      // A cor sai de --code-token-*, não da cor de corpo herdada.
      const corDeCorpo = getComputedStyle(root).color;
      const proprias = classificados.filter((el) => getComputedStyle(el).color !== corDeCorpo);
      await expect(proprias.length).toBeGreaterThan(0);
    });

    await step('O destaque marca exatamente as linhas pedidas', async () => {
      const marcadas = [...root.querySelectorAll('.nds-code-block-line')]
        .map((el, i) => (el.getAttribute('data-highlighted') === 'true' ? i + 1 : 0))
        .filter(Boolean);
      await expect(marcadas).toEqual([3, 5, 6, 7]);
    });

    await step('A numeração fica fora da leitura e da seleção', async () => {
      const gutter = root.querySelector<HTMLElement>('.nds-code-block-gutter')!;
      await expect(gutter).toHaveAttribute('aria-hidden', 'true');
      // user-select: none é o que faz "copiar apenas o código" valer também
      // para a seleção manual, não só para o botão.
      await expect(getComputedStyle(gutter).userSelect).toBe('none');
    });

    await step('Copiar entrega à API só o código, sem os números de linha', async () => {
      // O spy observa o que o COMPONENTE entrega à Clipboard API; a área de
      // transferência do browser de teste não é lida em momento nenhum.
      const writeText = fn((_texto: string) => Promise.resolve());
      await withClipboardStub(async () => {
        await userEvent.click(root.querySelector<HTMLElement>('[data-slot="code-block-copy"]')!);
        await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
        await expect(writeText).toHaveBeenCalledWith(args.code);
        // A numeração é 1..N; se tivesse vazado, o texto começaria por "1import".
        await expect(writeText).not.toHaveBeenCalledWith(expect.stringMatching(/^1import/));

        await step('O feedback aparece e é anunciado pela região de status', async () => {
          // Um ícone por vez: [hidden] não esconde SVG (a regra da folha do
          // browser é namespaced para XHTML), então o componente TROCA o nó.
          await waitFor(() =>
            expect(canvas.getByRole('button', { name: /copiado/i })).toBeInTheDocument(),
          );
          const botao = root.querySelector<HTMLElement>('[data-slot="code-block-copy"]')!;
          await expect(botao.querySelectorAll('svg')).toHaveLength(1);
          await expect(botao.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');

          // Selecionada pelo papel, não pela classe: `.nds-sr-only` é só o jeito
          // de esconder visualmente — trocar o `role` passaria despercebido.
          const live = root.querySelector('[role="status"]')!;
          await expect(live).toHaveAttribute('aria-live', 'polite');
          await expect(live).toHaveTextContent('Copiado!');
          // FORA do botão, que é a metade do critério que ninguém verificava:
          // uma live region DENTRO do botão faria o leitor reanunciar o rótulo
          // inteiro no meio da interação em vez de só a confirmação.
          await expect(botao.contains(live)).toBe(false);

          const rotulo = root.querySelector<HTMLElement>('.nds-code-block-copy-label')!;
          await expect(rotulo).toBeVisible();
        });
      }, writeText);
    });

    await step('Depois de 2s o botão volta ao rótulo inicial', async () => {
      await waitFor(
        () => expect(canvas.getByRole('button', { name: /copiar código/i })).toBeInTheDocument(),
        { timeout: 4000 },
      );
      await expect(root.querySelector('[role="status"]')).toHaveTextContent('');
    });

    await step('A região de scroll é alcançável pelo teclado', async () => {
      // tabindex=0 existe para quem rola o código sem mouse; se o foco não
      // chegar nela, o trecho longo fica inacessível (WCAG 2.1.1).
      const scroll = root.querySelector<HTMLElement>('.nds-code-block-scroll')!;
      await expect(scroll).toHaveAttribute('tabindex', '0');
      (document.activeElement as HTMLElement | null)?.blur();
      await userEvent.tab();
      await expect(canvas.getByRole('button', { name: /copiar código/i })).toHaveFocus();
      await userEvent.tab();
      await expect(scroll).toHaveFocus();
    });
  },
};
