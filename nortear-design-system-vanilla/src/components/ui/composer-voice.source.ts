// Snippet do painel Code do ditado por voz — ver `@/lib/story-source`.
//
// Cada configuração tem a SUA função exportada, chamável SEM argumento. Fábrica
// curried devolveria função em vez de string, e as checagens que leem o snippet
// nunca chegariam ao snippet.
//
// O Playground é o único que escreve nível e tempo por extenso, e é de
// propósito: lá os controls mexem nos dois, e um snippet que os omitisse
// mentiria sobre o que a story renderiza. Nas demais o assunto é o ESTADO, e
// despejar o resto faria o painel ensinar o andaime em vez da peça.

import {
  appendLine,
  callLine,
  importing,
  options,
  snippet,
  text,
  type SourceTransform,
} from '@/lib/story-source';

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

function build(opts: VoiceSnippetOptions): string {
  const lines = options([
    ['labels', 'rotulos'],
    // `idle` é o padrão da fábrica, e documentação não ensina a repetir o que
    // já vem por padrão.
    ['state', opts.state && opts.state !== 'idle' ? text(opts.state) : undefined],
    // O nível só desenha enquanto capta: fora daí ele seria um número que a
    // peça recebe e não usa.
    ['level', opts.state === 'recording' && opts.level !== undefined
      ? String(opts.level)
      : undefined],
    ['elapsed', opts.elapsed ? text(opts.elapsed) : undefined],
    ['disabled', opts.disabled ? 'true' : undefined],
    // Na transcrição o alternador não responde, então o retorno não teria como
    // disparar: mostrá-lo ali ensinaria a ligar um fio solto.
    ['onToggle', opts.state === 'transcribing'
      ? undefined
      : "(intent) => (intent === 'start' ? comecar() : parar())"],
  ]);

  return snippet(
    importing('composer-voice', 'createComposerVoice'),
    `const voz = ${callLine('createComposerVoice', lines)};`,
    appendLine('voz'),
  );
}

/** Transform do `meta` — o Playground, que segue os controls. */
export const composerVoiceSource: SourceTransform<VoiceSnippetOptions> = (_c, ctx) => {
  return build(ctx?.args ?? {});
};

/** Em repouso: o alternador espera, e não há medidor. */
export function voiceIdleSource(): string {
  return build({ state: 'idle' });
}

/** Captando: o medidor aparece, e o nível desenha o som que entra. */
export function voiceRecordingSource(): string {
  return build({ state: 'recording', level: 0.62, elapsed: '0:12' });
}

/** Transcrevendo: já parou de captar, e o alternador não responde. */
export function voiceTranscribingSource(): string {
  return build({ state: 'transcribing', elapsed: '0:34' });
}

/** Desligado: ditar não está disponível agora. */
export function voiceDisabledSource(): string {
  return build({ state: 'idle', disabled: true });
}

/**
 * O controle no trilho do campo.
 *
 * É o único snippet que mostra os dois juntos, porque é a única coisa que a
 * composição ensina: o ditado é peça própria, e quem consome a põe no trilho.
 */
export function voiceInRailSource(): string {
  const voice = callLine('createComposerVoice', options([
    ['labels', 'rotulosDaVoz'],
    ['state', text('recording')],
    ['level', '0.62'],
    ['elapsed', text('0:12')],
    ['onToggle', "(intent) => (intent === 'start' ? comecar() : parar())"],
  ]));

  const composer = callLine('createComposer', options([
    ['labels', 'rotulos'],
    ['railStart', '[voz]'],
  ]));

  return snippet(
    importing('composer', 'createComposer'),
    importing('composer-voice', 'createComposerVoice'),
    `const voz = ${voice};`,
    `const composer = ${composer};`,
    appendLine('composer'),
  );
}
