/**
 * Transforms do painel Code do ditado por voz.
 *
 * Módulo de TS puro, sem import de `.svelte`: é o que deixa as funções rodarem
 * no projeto `unit` do vitest, a única guarda que elas têm — a saída do painel
 * não chega ao DOM durante a `play`.
 *
 * Existem porque nesta stack o docgen está DESLIGADO: sem transform, o gerador
 * monta a tag a partir do nome interno da função compilada e publica
 * `<wrapper …/>`, que não é um componente que alguém possa importar.
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
import { attrsMultilinha, svelteSnippet } from '@/lib/story-source';

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

/** O contexto que o painel Code entrega à transform. */
type StoryContext = { args?: VoiceArgs };

const IMPORT = "import { ComposerVoice } from '@/components/ui/composer';";

const IMPORT_RAIL = "import { Composer, ComposerVoice } from '@/components/ui/composer';";

/**
 * O retorno, escrito por extenso.
 *
 * O pedido é INTENÇÃO, e não estado novo: quem lê precisa ver os dois lados na
 * mesma linha para entender que começar e parar saem do MESMO botão.
 */
const ON_TOGGLE = "onToggle={(intent) => (intent === 'start' ? comecar() : parar())}";

/** Os atributos do controle, na ordem em que o tipo os declara. */
function attributesFor(opts: VoiceArgs): string {
  return attrsMultilinha([
    'labels={rotulos}',
    // `idle` é o padrão do componente, e documentação não ensina a repetir o
    // que já vem por padrão.
    opts.state && opts.state !== 'idle' ? `state="${opts.state}"` : undefined,
    // O nível só desenha enquanto capta: fora daí ele seria um número que a
    // peça recebe e não usa.
    opts.state === 'recording' && opts.level !== undefined
      ? `level={${opts.level}}`
      : undefined,
    opts.elapsed ? `elapsed="${opts.elapsed}"` : undefined,
    opts.disabled ? 'disabled' : undefined,
    // Na transcrição o alternador não responde, então o retorno não teria como
    // disparar: mostrá-lo ali ensinaria a ligar um fio solto.
    opts.state === 'transcribing' ? undefined : ON_TOGGLE,
  ]);
}

/** O uso real do controle, sozinho. */
function voiceSnippet(opts: VoiceArgs = {}): string {
  return svelteSnippet(IMPORT, `<ComposerVoice${attributesFor(opts)} />`);
}

/** Transform do `meta` — o Playground, que segue os controls. */
export function composerVoiceSource(_generated?: unknown, ctx?: StoryContext): string {
  return voiceSnippet(ctx?.args ?? {});
}

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
 * Nesta stack o trilho é um `{#snippet}`, então o exemplo precisa declará-lo
 * antes de quem o usa — declarado depois, a referência apontaria para o nada.
 */
export function voiceInRailSource(): string {
  const attributes = attrsMultilinha(
    [
      'labels={rotulosDaVoz}',
      'state="recording"',
      'level={0.62}',
      'elapsed="0:12"',
      ON_TOGGLE,
    ],
    '    ',
  );

  return svelteSnippet(
    IMPORT_RAIL,
    [
      `{#snippet railStart()}`,
      `  <ComposerVoice${attributes}  />`,
      `{/snippet}`,
      ``,
      `<Composer labels={rotulos} {railStart} />`,
    ].join('\n'),
  );
}
