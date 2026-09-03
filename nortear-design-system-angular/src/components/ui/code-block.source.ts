/**
 * Transform do painel Code do CodeBlock.
 *
 * Módulo próprio, e não função solta no arquivo de story, porque é o que põe
 * este construtor sob o `source-snippets.test.ts`: aquela guarda varre
 * `./**\/*.source.ts` por glob e CHAMA cada export para ler a saída. Construtor
 * inline é função local — nem exportada, nem alcançável —, então o que ele
 * publica ao leitor não tem portão nenhum.
 *
 * O que este snippet ensina é que o código entra por PROPRIEDADE e não por
 * conteúdo projetado: `[code]="source"` é o que o botão copiar entrega à área
 * de transferência, byte a byte. O resto — linguagem, título, numeração,
 * destaque de linhas, rodapé — só aparece escrito quando difere do padrão.
 *
 * O snippet é montado por `join('\n')`, e não com crase, pelo mesmo motivo do
 * `DEMO_CODE` da story: o texto ensinado contém o `template:` de um
 * `@Component`, que já leva crase. Escapá-las aqui deixaria de ser o texto que
 * a pessoa copia.
 */

export type CodeBlockArgs = {
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
 * Ver a nota em separator.stories.ts: o renderer Angular imprime no painel Code
 * o `template` da story como está escrito, com os bindings ligados aos args.
 * Aqui vai o uso real, montado a partir de `ctx.args` — só o que difere do
 * default entra.
 */
export function codeBlockPlaygroundSource(
  _gerado?: string,
  ctx: { args?: Partial<CodeBlockArgs> } = {},
): string {
  const {
    language = 'text',
    title = '',
    showLineNumbers = true,
    highlightLines = '',
    footer = '',
  } = ctx.args ?? {};

  const attrs = ['      [code]="source"'];
  if (language && language !== 'text') attrs.push(`      language="${language}"`);
  if (title) attrs.push(`      title="${title}"`);
  if (!showLineNumbers) attrs.push('      [showLineNumbers]="false"');
  if (highlightLines) attrs.push(`      [highlightLines]="'${highlightLines}'"`);
  if (footer) attrs.push(`      footer="${footer}"`);

  return [
    "import { NdsCodeBlock } from '@/components/ui/code-block';",
    '',
    '@Component({',
    '  imports: [NdsCodeBlock],',
    '  template: `',
    '    <nds-code-block',
    ...attrs,
    '    />',
    '  `,',
    '})',
    'export class Exemplo {',
    '  readonly source = fonte;',
    '}',
  ].join('\n');
}
