/**
 * Transforms do painel Code do seletor do gatilho.
 *
 * O renderer Angular imprime no painel o `template` da story como está escrito,
 * com os bindings apontando para `props` que só existem no arquivo. O que se
 * copia tem de ser o uso REAL: um componente que declara os rótulos, os
 * gatilhos e escuta o envio.
 *
 * A LISTA DE OPÇÕES NÃO ENTRA no snippet. Ela é dado do exemplo — quatro
 * pessoas e dois comandos —, e despejá-la faria o painel ensinar o andaime em
 * vez do componente. O snippet nomeia a constante e mostra o que se faz com
 * ela, que é onde estão as duas decisões que importam: onde o gatilho vale e o
 * que a lista oferece.
 *
 * Cada linha é item de um `join`, e não uma linha de literal recuado: o recuo
 * entraria no snippet que a pessoa copia. Também é o que mantém a crase fora
 * de um literal de template — dentro de `template:` ela encerraria a cadeia.
 */

const IMPORT_COMPOSER = "import { NdsComposer } from '@/components/ui/composer';";

export type TriggerSnippetOptions = {
  /** Quais gatilhos a story declara. */
  mention?: boolean;
  command?: boolean;
  /** Texto inicial do campo, quando a story precisa de um. */
  value?: string;
};

export function triggerSnippet(opts: TriggerSnippetOptions = {}): string {
  const mention = opts.mention !== false;
  const command = opts.command === true;

  const entries: string[] = [];
  if (mention) entries.push('{ spec: MENTION_TRIGGER, options: pessoas }');
  if (command) entries.push('{ spec: COMMAND_TRIGGER, options: comandos }');

  const importTrigger = [
    'import {',
    command ? '  COMMAND_TRIGGER,' : undefined,
    mention ? '  MENTION_TRIGGER,' : undefined,
    "} from '@shared/primitives/composer-trigger';",
  ]
    .filter((line): line is string => line !== undefined)
    .join('\n');

  const inner: string[] = ['    <nds-composer'];
  inner.push('      [labels]="labels"');
  inner.push('      [triggerLabels]="triggerLabels"');
  inner.push('      [triggers]="triggers"');
  if (opts.value) inner.push(`      value="${opts.value}"`);
  // O envio entra SEMPRE, mesmo quando a story não escuta nada: sem ele o
  // snippet ensinaria um campo que não faz nada com o que foi escrito.
  inner.push('      (submitted)="send($event)"');
  inner.push('    />');

  const body: string[] = [
    '  readonly labels = composerLabels();',
    '  readonly triggerLabels = triggerLabels();',
    entries.length === 1
      ? `  readonly triggers = [${entries[0]}];`
      : ['  readonly triggers = [', ...entries.map((e) => `    ${e},`), '  ];'].join('\n'),
  ];

  return [
    IMPORT_COMPOSER,
    importTrigger,
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

/** O tipo que o painel Code espera: recebe o gerado e os args, devolve o uso. */
export type TriggerPopoverSourceTransform = (
  code: string,
  ctx?: { args?: TriggerSnippetOptions },
) => string;

/** Transform do `meta` — lê os args da story e devolve a chamada. */
export const triggerPopoverSource: TriggerPopoverSourceTransform = (_code, ctx) =>
  triggerSnippet(ctx?.args ?? {});

/**
 * Transforms de story: mesmo componente, opções fixas por cima dos args.
 *
 * Uma por configuração, e não uma fábrica exportada que recebe a configuração.
 * A fábrica devolvia FUNÇÃO, e a guarda transversal (`source-snippets.test.ts`)
 * chama todo export sem argumento esperando string — curried, as checagens que
 * LEEM o snippet nunca chegavam ao snippet. Nomeadas, cada uma é verificada.
 */
const comFixas =
  (fixed: TriggerSnippetOptions): TriggerPopoverSourceTransform =>
  (_code, ctx) =>
    triggerSnippet({ ...(ctx?.args ?? {}), ...fixed });

/** A forma básica, para os `meta` que não fixam nada. */
export const triggerPopoverBaseSource = comFixas({});

/** Só o gatilho de menção. */
export const triggerPopoverMentionSource = comFixas({ mention: true });

/** Só o gatilho de comando. */
export const triggerPopoverCommandSource = comFixas({ mention: false, command: true });

/** A lista filtrada pelo que já foi digitado depois do gatilho. */
export const triggerPopoverFilteredSource = comFixas({ value: 'avisa a @an' });

/** O filtro sem resultado nenhum. */
export const triggerPopoverEmptySource = comFixas({ value: 'avisa a @zzz' });
