/**
 * Transforms do painel Code do ditado por voz.
 *
 * O renderer Angular imprime no painel o `template` da story como está escrito,
 * com os bindings apontando para `props` que só existem no arquivo. O que se
 * copia tem de ser o uso REAL: um componente que declara os rótulos, guarda o
 * estado do ditado e faz alguma coisa com o pedido de começar ou parar.
 *
 * O Playground é o único que escreve nível e tempo por extenso, e é de
 * propósito: lá os controls mexem nos dois, e um snippet que os omitisse
 * mentiria sobre o que a story renderiza. Nas demais o assunto é o ESTADO, e
 * despejar o resto faria o painel ensinar o andaime em vez da peça.
 *
 * Cada linha é item de um `join('\n')`, e não uma linha de template literal
 * recuado: o recuo entraria no snippet que a pessoa copia.
 */

const IMPORT_VOICE =
  "import { NdsComposerVoice, type ComposerVoiceIntent } from '@/components/ui/composer-voice';";
const IMPORT_COMPOSER = "import { NdsComposer } from '@/components/ui/composer';";

/** O que as stories usam da API e que o snippet precisa mostrar. */
export type VoiceSnippetOptions = {
  /** Em que ponto o ditado está. */
  state?: string;
  /** O som que entra, de 0 a 1. Ausente quando o snippet não é do Playground. */
  level?: number;
  /** O tempo decorrido, já escrito. */
  elapsed?: string;
  /** Ditar não está disponível agora. */
  disabled?: boolean;
};

/** O corpo do `@Component`, com o que a story de fato liga. */
function build(inner: string[], body: string[], imports: string[]): string {
  return [
    ...imports,
    '',
    '@Component({',
    `  imports: [${imports.length > 1 ? 'NdsComposer, NdsComposerVoice' : 'NdsComposerVoice'}],`,
    '  template: `',
    ...inner,
    '  `,',
    '})',
    'export class Example {',
    ...body,
    '}',
  ].join('\n');
}

/**
 * As linhas do retorno, que só existem onde ele pode disparar.
 *
 * Na transcrição o alternador não responde, então a saída não teria como sair:
 * mostrá-la ali ensinaria a ligar um fio solto.
 */
function toggleHandler(): string[] {
  return [
    '',
    '  // Começar e parar de verdade é daqui. O componente só avisa que alguém',
    '  // pediu — entre pedir para começar e estar captando existe uma permissão',
    '  // que pode demorar ou ser negada, e só quem consome a resolve.',
    '  onToggle(intent: ComposerVoiceIntent): void {',
    "    if (intent === 'start') this.start();",
    '    else this.stop();',
    '  }',
  ];
}

function voiceSnippet(opts: VoiceSnippetOptions = {}): string {
  const state = opts.state ?? 'idle';
  // Na transcrição o alternador já se desabilita sozinho, e nenhum pedido sai
  // dele.
  const emits = state !== 'transcribing';

  const inner = [
    '    <nds-composer-voice',
    '      [labels]="labels"',
    '      [state]="state()"',
    // O nível só desenha enquanto capta: fora daí ele seria um número que a
    // peça recebe e não usa.
    ...(state === 'recording' && opts.level !== undefined
      ? [`      [level]="${opts.level}"`]
      : []),
    ...(opts.elapsed ? [`      elapsed="${opts.elapsed}"`] : []),
    ...(opts.disabled ? ['      [disabled]="true"'] : []),
    ...(emits ? ['      (toggle)="onToggle($event)"'] : []),
    '    />',
  ];

  const body = [
    '  readonly labels = voiceLabels();',
    '',
    '  // Em que ponto o ditado está é de quem capta: o componente desenha o',
    '  // estado que recebe, e não pede permissão nem transcreve nada.',
    `  readonly state = signal<VoiceState>('${state}');`,
    ...(emits ? toggleHandler() : []),
  ];

  return build(inner, body, [IMPORT_VOICE]);
}

/** O tipo que o painel Code espera: recebe o gerado e os args, devolve o uso. */
export type VoiceSourceTransform = (
  code?: string,
  ctx?: { args?: VoiceSnippetOptions },
) => string;

/**
 * Transform do `meta` — o Playground, que segue os controls.
 *
 * Os args vêm dos controls: estado, nível, tempo decorrido e desligado.
 */
export const composerVoiceSource: VoiceSourceTransform = (_code, ctx) =>
  voiceSnippet(ctx?.args ?? {});

/**
 * Transforms de story: uma função NOMEADA por configuração.
 *
 * Uma por configuração, e não uma fábrica exportada que recebe a configuração. A
 * fábrica devolveria FUNÇÃO, e a guarda transversal (`source-snippets.test.ts`)
 * chama todo export sem argumento esperando string — curried, as checagens que
 * LEEM o snippet nunca chegariam ao snippet.
 */

/** Em repouso: o alternador espera, e não há medidor. */
export function voiceIdleSource(): string {
  return voiceSnippet({ state: 'idle' });
}

/** Captando: o medidor aparece, e o nível desenha o som que entra. */
export function voiceRecordingSource(): string {
  return voiceSnippet({ state: 'recording', level: 0.62, elapsed: '0:12' });
}

/** Transcrevendo: já parou de captar, e o alternador não responde. */
export function voiceTranscribingSource(): string {
  return voiceSnippet({ state: 'transcribing', elapsed: '0:34' });
}

/** Desligado: ditar não está disponível agora. */
export function voiceDisabledSource(): string {
  return voiceSnippet({ state: 'idle', disabled: true });
}

/**
 * O controle no trilho do campo.
 *
 * É o único snippet que mostra os dois juntos, porque é a única coisa que a
 * composição ensina: o ditado é peça própria, e quem consome a põe no trilho.
 *
 * O trilho recebe um `TemplateRef` nesta stack, então o uso real passa por um
 * `<ng-template>` — omiti-lo daria um snippet que não compila na mão de quem
 * copia.
 */
export function voiceInRailSource(): string {
  const inner = [
    '    <ng-template #voiceTpl>',
    '      <nds-composer-voice',
    '        [labels]="voiceText"',
    '        [state]="state()"',
    '        [level]="0.62"',
    '        elapsed="0:12"',
    '        (toggle)="onToggle($event)"',
    '      />',
    '    </ng-template>',
    '',
    '    <nds-composer [labels]="labels" [railStart]="voiceTpl" />',
  ];

  const body = [
    '  readonly labels = composerLabels();',
    '  readonly voiceText = voiceLabels();',
    '',
    '  // O campo não sabe que o ditado existe: o trilho é um espaço, e quem',
    '  // consome põe o controle nele.',
    "  readonly state = signal<VoiceState>('recording');",
    ...toggleHandler(),
  ];

  return build(inner, body, [IMPORT_COMPOSER, IMPORT_VOICE]);
}
