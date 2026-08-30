/**
 * Transforms do painel Code do ditado por voz.
 *
 * Módulo de TS puro, sem import de `.vue`: é o que deixa as funções rodarem no
 * projeto `unit` do vitest, a única guarda que elas têm — a saída do painel não
 * chega ao DOM durante a `play`.
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
import { attrsMultilinha, indentar, text, vueSnippet, type SourceTransform } from '@/lib/story-source';

/** O que as stories mudam e que o snippet precisa mostrar. */
export type VoiceArgs = {
  /** Em que ponto o ditado está. */
  state?: string;
  /** O som que entra, de 0 a 1. Ausente quando o snippet não é do Playground. */
  level?: number;
  /** O tempo decorrido, já escrito. */
  elapsed?: string;
  /** Ditar não está disponível agora. */
  disabled?: boolean;
};

const IMPORT = "import { ComposerVoice } from '@/components/ui/composer';";

const IMPORT_IN_RAIL =
  "import { Composer, ComposerVoice } from '@/components/ui/composer';";

/**
 * A tag do controle, só com o que difere do padrão.
 *
 * Na transcrição o alternador não responde, então o ouvinte não teria como
 * disparar: mostrá-lo ali ensinaria a ligar um fio solto.
 */
function voiceTag(opts: VoiceArgs, labelsName = 'rotulos'): string {
  const attrs = attrsMultilinha([
    `:labels="${labelsName}"`,
    // `idle` é o padrão do componente, e documentação não ensina a repetir o
    // que já vem por padrão.
    opts.state && opts.state !== 'idle' ? `state="${text(opts.state)}"` : undefined,
    // O nível só desenha enquanto capta: fora daí ele seria um número que a
    // peça recebe e não usa.
    opts.state === 'recording' && opts.level !== undefined
      ? `:level="${opts.level}"`
      : undefined,
    opts.elapsed ? `elapsed="${text(opts.elapsed)}"` : undefined,
    opts.disabled ? 'disabled' : undefined,
    opts.state === 'transcribing' ? undefined : '@toggle="aoAlternar"',
  ]);
  return `<ComposerVoice${attrs} />`;
}

function build(opts: VoiceArgs): string {
  return vueSnippet(IMPORT, voiceTag(opts));
}

/** Transform do `meta` — o Playground, que segue os controls. */
export const composerVoiceSource: SourceTransform<VoiceArgs> = (_gerado, ctx) =>
  build(ctx?.args ?? {});

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
 * composição ensina: o ditado é peça própria, e quem consome a põe no trilho —
 * que nesta stack é um slot com escopo, a forma daqui para "marcação que quem
 * consome fornece".
 */
export function voiceInRailSource(): string {
  const voice = voiceTag(
    { state: 'recording', level: 0.62, elapsed: '0:12' },
    'rotulosDaVoz',
  );
  const rail = `<template #railStart>\n${indentar(voice)}\n</template>`;
  return vueSnippet(
    IMPORT_IN_RAIL,
    `<Composer :labels="rotulos">\n${indentar(rail)}\n</Composer>`,
  );
}
