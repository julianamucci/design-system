/**
 * Snippet do painel Code do ditado por voz — ver `@/lib/story-source`.
 *
 * Módulo de TS puro — nada de `.tsx` em valor. É o que deixa as funções rodarem
 * no projeto `unit` do vitest, a única guarda que elas têm: a saída do painel
 * não chega ao DOM durante a `play`.
 *
 * Cada configuração tem a SUA função exportada, chamável SEM argumento. Fábrica
 * curried devolveria função em vez de string, e as checagens que leem o snippet
 * nunca chegariam ao snippet.
 *
 * O Playground é o único que escreve nível e tempo por extenso, e é de
 * propósito: lá os controls mexem nos dois, e um snippet que os omitisse
 * mentiria sobre o que a story renderiza. Nas demais o assunto é o ESTADO, e
 * despejar o resto faria o painel ensinar o andaime em vez da peça.
 */
import { attrsMultilinha, jsxSnippet, text, type SourceTransform } from '@/lib/story-source';

const IMPORT = 'import { ComposerVoice } from "@/components/ui/composer-voice";';

/**
 * O retorno, escrito por extenso.
 *
 * O pedido chega como INTENÇÃO, e não como estado novo: entre pedir para
 * começar e estar captando existe uma permissão que só quem consome resolve, e
 * é ela que decide o que acontece depois.
 */
const ON_TOGGLE = 'onToggle={(intent) => (intent === "start" ? comecar() : parar())}';

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
  const state = text(opts.state);
  const elapsed = text(opts.elapsed);
  // O nível só desenha enquanto capta: fora daí ele seria um número que a peça
  // recebe e não usa.
  const level =
    state === 'recording' && typeof opts.level === 'number' && Number.isFinite(opts.level)
      ? opts.level
      : undefined;

  return jsxSnippet(
    IMPORT,
    `<ComposerVoice${attrsMultilinha([
      'labels={labels}',
      // `idle` é o padrão do componente, e documentação não ensina a repetir o
      // que já vem por padrão.
      state && state !== 'idle' ? `state="${state}"` : undefined,
      level === undefined ? undefined : `level={${level}}`,
      elapsed === undefined ? undefined : `elapsed="${elapsed}"`,
      opts.disabled === true ? 'disabled' : undefined,
      // Na transcrição o alternador não responde, então o retorno não teria
      // como disparar: mostrá-lo ali ensinaria a ligar um fio solto.
      state === 'transcribing' ? undefined : ON_TOGGLE,
    ])} />`,
  );
}

/** Transform do `meta` — o Playground, que segue os controls. */
export const composerVoiceSource: SourceTransform<VoiceSnippetOptions> = (_generated, ctx) => {
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
  const rail = [
    '  railStart={',
    '    <ComposerVoice',
    '      labels={voiceLabels}',
    '      state="recording"',
    '      level={0.62}',
    '      elapsed="0:12"',
    `      ${ON_TOGGLE}`,
    '    />',
    '  }',
  ].join('\n');

  return jsxSnippet(
    `import { Composer } from "@/components/ui/composer";\n${IMPORT}`,
    `<Composer\n  labels={labels}\n${rail}\n/>`,
  );
}
