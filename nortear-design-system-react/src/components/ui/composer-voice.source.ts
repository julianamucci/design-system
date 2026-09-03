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
 *
 * O NOME DO OBJETO DE RÓTULOS MUDA COM O RAMO, e a declaração acompanha: sozinho
 * o ditado recebe `labels`, e dentro do trilho quem recebe `labels` é o CAMPO —
 * o ditado passa a ser `voiceLabels`. Gerar a declaração com o nome do ramo é o
 * que impede o snippet de citar um símbolo que ele não declara.
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

/**
 * Os rótulos do ditado, por INTEIRO e com o nome do ramo.
 *
 * `start` e `stop` são o nome do MESMO botão em dois momentos — ele troca de
 * nome, e não só de desenho. `status` é `Record` completo de propósito: é a
 * palavra do estado que chega a quem não vê o medidor, e é nela que vai o
 * motivo de o alternador não responder durante a transcrição.
 */
function voiceLabelsBlock(name: string): string {
  return [
    `const ${name} = {`,
    '  start: "Ditar",',
    '  stop: "Parar de ditar",',
    '  status: {',
    '    idle: "Ditado desligado",',
    '    recording: "Gravando",',
    '    transcribing: "Transcrevendo — não dá para interromper",',
    '  },',
    '};',
  ].join('\n');
}

/**
 * O que a peça faz com a intenção que recebe.
 *
 * Uma linha cada, e o corpo é de quem consome: pedir o microfone, começar a
 * captar e mandar o áudio para transcrever são coisas do produto.
 */
const HANDLERS_BLOCK = [
  'const comecar = () => { /* … */ };',
  'const parar = () => { /* … */ };',
].join('\n');

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
  // Na transcrição o alternador não responde, então o retorno não teria como
  // disparar: mostrá-lo ali ensinaria a ligar um fio solto — e sem retorno não
  // há manipulador a declarar.
  const withToggle = state !== 'transcribing';

  const parts = [IMPORT, '', voiceLabelsBlock('labels')];
  if (withToggle) parts.push('', HANDLERS_BLOCK);

  return jsxSnippet(
    parts.join('\n'),
    `<ComposerVoice${attrsMultilinha([
      'labels={labels}',
      // `idle` é o padrão do componente, e documentação não ensina a repetir o
      // que já vem por padrão.
      state && state !== 'idle' ? `state="${state}"` : undefined,
      level === undefined ? undefined : `level={${level}}`,
      elapsed === undefined ? undefined : `elapsed="${elapsed}"`,
      opts.disabled === true ? 'disabled' : undefined,
      withToggle ? ON_TOGGLE : undefined,
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
 * Cada um leva os SEUS rótulos, que é o que a autonomia significa em código.
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
    [
      `import { Composer } from "@/components/ui/composer";\n${IMPORT}`,
      '',
      // O campo exige os seis rótulos: um objeto pela metade não compila para
      // quem copia, e `{key}` e `{max}` são moldes que o componente preenche.
      'const labels = {',
      '  input: "Mensagem",',
      '  placeholder: "Escreva sua mensagem…",',
      '  submit: "Enviar",',
      '  stop: "Parar",',
      '  hint: "{key} envia",',
      '  limit: "Até {max} caracteres",',
      '};',
      '',
      voiceLabelsBlock('voiceLabels'),
      '',
      HANDLERS_BLOCK,
    ].join('\n'),
    `<Composer\n  labels={labels}\n${rail}\n/>`,
  );
}
