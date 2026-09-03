/**
 * Transforms do painel Code do rascunho recuperado.
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
 * O rascunho aparece como VARIÁVEL, e não como o texto por extenso: o assunto
 * de todos estes snippets é o que a faixa faz com o rascunho, e despejar seis
 * linhas de prosa dentro da chamada faria o painel ensinar o exemplo em vez da
 * peça.
 */
import { attrsMultilinha, svelteSnippet } from '@/lib/story-source';

/** O que as stories mudam e que o snippet precisa mostrar. */
export type DraftSnippetOptions = {
  /** Quando o rascunho foi escrito, já escrito. Ausente quando não se sabe. */
  timestamp?: string;
  /** O nome da variável que carrega o rascunho — é o que muda entre os casos. */
  draft?: string;
};

/** O contexto que o painel Code entrega à transform. */
type StoryContext = { args?: DraftSnippetOptions };

// O caminho é o do ÍNDICE da moldura, e não o do arquivo: é assim que as peças
// irmãs entram, e um snippet que ensinasse o atalho direto ensinaria a furar a
// única porta que a família tem.
const IMPORT = "import { DraftRestore } from '@/components/ui/composer';";

const IMPORT_WITH_COMPOSER =
  "import { Composer, DraftRestore } from '@/components/ui/composer';";

/**
 * O retorno, escrito por extenso.
 *
 * A escolha sai como AVISO, e o que ela significa é de quem consome: quem lê
 * precisa ver os dois lados na mesma linha para entender que a faixa não sabe
 * o que descartar apaga.
 */
const ON_ACTION =
  "onAction={(action) => (action === 'restore' ? restaurar() : descartar())}";

/** Os atributos da faixa, na ordem em que o tipo os declara. */
function attributesFor(opts: DraftSnippetOptions, indent = '  '): string {
  return attrsMultilinha(
    [
      'labels={rotulos}',
      // O rascunho vai INTEIRO. O corte de duas linhas é da folha, e é o que o
      // mantém achável pela busca do navegador e audível por completo.
      `draft={${opts.draft ?? 'rascunhoGuardado'}}`,
      opts.timestamp ? `timestamp="${opts.timestamp}"` : undefined,
      ON_ACTION,
    ],
    indent,
  );
}

/**
 * As declarações do exemplo, escritas por extenso.
 *
 * NOME LIGADO É NOME DECLARADO. O comentário acima já dizia que a faixa não
 * sabe o que descartar apaga; faltava o bloco do painel declarar quem sabe.
 */
function declaracoes(opts: DraftSnippetOptions, rotulos: string): string {
  return [
    `const ${rotulos} = { /* os rótulos da faixa */ };`,
    '',
    '// O rascunho é de quem o guardou, e vai INTEIRO para a faixa.',
    `const ${opts.draft ?? 'rascunhoGuardado'} = '/* o texto guardado */';`,
    '',
    '// A escolha é um AVISO: a faixa diz qual foi, e o que ela significa é de',
    '// quem consome.',
    'function restaurar() { /* devolve o rascunho ao campo */ }',
    'function descartar() { /* joga o rascunho fora */ }',
  ].join('\n');
}

/** O uso real da faixa, sozinha. */
function draftSnippet(opts: DraftSnippetOptions = {}): string {
  return svelteSnippet(
    [IMPORT, '', declaracoes(opts, 'rotulos')].join('\n'),
    `<DraftRestore${attributesFor(opts)} />`,
  );
}

/** Transform do `meta` — o Playground, que segue os controls. */
export function draftRestoreSource(_generated?: unknown, ctx?: StoryContext): string {
  return draftSnippet({ timestamp: ctx?.args?.timestamp });
}

/** Um rascunho encontrado, sem carimbo: não se sabe de quando ele é. */
export function draftFoundSource(): string {
  return draftSnippet();
}

/** Com o carimbo, que chega já escrito — formato de data é decisão de idioma. */
export function draftDatedSource(): string {
  return draftSnippet({ timestamp: 'ontem, 14:32' });
}

/** Longo: quem corta é a folha, e o texto inteiro continua no documento. */
export function draftLongSource(): string {
  return draftSnippet({ draft: 'rascunhoLongoInteiro' });
}

/**
 * A faixa acima do campo.
 *
 * É o único snippet que mostra os dois juntos, porque é a única coisa que a
 * composição ensina: a faixa é peça própria e fica ACIMA do campo — o campo
 * não sabe que ela existe, e nada nele muda por causa dela. Os dois são irmãos
 * num invólucro, e não pai e filho.
 */
export function draftAboveComposerSource(): string {
  const attributes = attributesFor({ timestamp: 'ontem, 14:32' }, '    ');

  return svelteSnippet(
    [
      IMPORT_WITH_COMPOSER,
      '',
      declaracoes({ timestamp: 'ontem, 14:32' }, 'rotulos'),
      '',
      'const rotulosDoCampo = { /* os rótulos do campo */ };',
    ].join('\n'),
    [
      '<div class="nds-max-w-lg">',
      '  <!-- A faixa vem ANTES do campo na ordem de leitura, e não leva o foco. -->',
      `  <DraftRestore${attributes}  />`,
      '  <Composer labels={rotulosDoCampo} />',
      '</div>',
    ].join('\n'),
  );
}
