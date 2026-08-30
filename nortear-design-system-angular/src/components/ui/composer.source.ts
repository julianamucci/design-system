/**
 * Transforms do painel Code do Composer.
 *
 * O renderer Angular imprime no painel o `template` da story como está escrito,
 * com os bindings apontando para `props` que só existem no arquivo — e, nas
 * stories que precisam de `TemplateRef`, para um andaime que não é o
 * componente. O que se copia tem de ser o uso REAL: um componente que declara
 * os rótulos e liga o que a story liga.
 *
 * O `(submitted)` entra SEMPRE, mesmo quando a story não escuta nada. Sem ele o
 * snippet ensinaria um composer que não faz nada com o que foi escrito — que é
 * o erro mais provável de quem copia, porque o componente não limpa o campo nem
 * envia por conta própria. A linha existe para dizer onde a responsabilidade
 * continua.
 *
 * Cada linha é item de um `join('\n')`, e não uma linha de template literal
 * recuado: o recuo entraria no snippet que a pessoa copia.
 */

const IMPORT = "import { NdsComposer } from '@/components/ui/composer';";

/** O que as stories usam da API e que o snippet precisa mostrar. */
export type ComposerSnippetOptions = {
  value?: string;
  rows?: number;
  maxLength?: number;
  disabled?: boolean;
  submitOn?: 'enter' | 'modifier';
  /** A story põe controles no trilho? */
  rail?: boolean;
  /** A story liga o estado de geração? */
  running?: boolean;
};

/** O corpo do `@Component`, com o que a story de fato liga. */
function build(inner: string[], body: string[]): string {
  return [
    IMPORT,
    '',
    '@Component({',
    '  imports: [NdsComposer],',
    '  template: `',
    ...inner,
    '  `,',
    '})',
    'export class Example {',
    ...body,
    '}',
  ].join('\n');
}

export function composerSnippet(opts: ComposerSnippetOptions = {}): string {
  const inner: string[] = [];

  if (opts.rail) {
    // O trilho é um ESPAÇO, e nesta stack ele é um template.
    inner.push(
      '    <ng-template #attach>',
      '      <button ndsButton variant="ghost" size="sm">Anexar</button>',
      '    </ng-template>',
      '',
    );
  }

  inner.push('    <nds-composer');
  inner.push('      [labels]="labels"');
  if (opts.value) inner.push(`      value="${opts.value}"`);
  if (opts.rows !== undefined) inner.push(`      [rows]="${opts.rows}"`);
  if (opts.maxLength !== undefined) inner.push(`      [maxLength]="${opts.maxLength}"`);
  if (opts.submitOn) inner.push(`      submitOn="${opts.submitOn}"`);
  if (opts.disabled) inner.push('      [disabled]="true"');
  if (opts.rail) inner.push('      [railStart]="attach"');
  // O estado de geração é de quem consome: o componente não acompanha a rede.
  if (opts.running) inner.push('      [running]="generating()"');
  inner.push('      (submitted)="send($event)"');
  if (opts.running) inner.push('      (stopped)="cancel()"');
  inner.push('    />');

  const body = ['  readonly labels = composerLabels();'];
  if (opts.running) body.push('  readonly generating = signal(true);');

  return build(inner, body);
}

/** O tipo que o painel Code espera: recebe o gerado e os args, devolve o uso. */
export type ComposerSourceTransform = (
  code: string,
  ctx?: { args?: ComposerSnippetOptions },
) => string;

/** Transform do `meta` — lê os args da story e devolve a chamada. */
export const composerSource: ComposerSourceTransform = (_code, ctx) =>
  composerSnippet(ctx?.args ?? {});

/** Transform de story que fixa opções por cima dos args do arquivo. */
export function composerSourceWith(fixed: ComposerSnippetOptions): ComposerSourceTransform {
  return (_code, ctx) => composerSnippet({ ...(ctx?.args ?? {}), ...fixed });
}
