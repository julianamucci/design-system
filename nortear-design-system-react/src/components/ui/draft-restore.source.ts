/**
 * Snippet do painel Code do rascunho recuperado — ver `@/lib/story-source`.
 *
 * Módulo de TS puro — nada de `.tsx` em valor. É o que deixa as funções rodarem
 * no projeto `unit` do vitest, a única guarda que elas têm: a saída do painel
 * não chega ao DOM durante a `play`.
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
import { attrsMultilinha, jsxSnippet, text, type SourceTransform } from '@/lib/story-source';

const IMPORT = 'import { DraftRestore } from "@/components/ui/draft-restore";';

/**
 * O retorno, escrito por extenso.
 *
 * A escolha sai como AVISO, e o que ela significa é de quem consome: o que
 * descartar apaga, se dá para desfazer e quando um rascunho expira são política
 * de produto, e política envelhece por produto, não por sistema.
 */
const ON_ACTION =
  'onAction={(action) => (action === "restore" ? restaurar() : descartar())}';

export type DraftSnippetOptions = {
  /** Quando o rascunho foi escrito, já escrito. Ausente quando não se sabe. */
  timestamp?: string;
  /** O nome da variável que carrega o rascunho — é o que muda entre os casos. */
  draft?: string;
};

function build(opts: DraftSnippetOptions): string {
  const timestamp = text(opts.timestamp);

  return jsxSnippet(
    IMPORT,
    `<DraftRestore${attrsMultilinha([
      'labels={rotulos}',
      // O rascunho vai INTEIRO. O corte de duas linhas é da folha, e é o que o
      // mantém achável pela busca do navegador e audível por completo.
      `draft={${opts.draft ?? 'rascunhoGuardado'}}`,
      timestamp === undefined ? undefined : `timestamp="${timestamp}"`,
      ON_ACTION,
    ])} />`,
  );
}

/** Transform do `meta` — o Playground, que segue os controls. */
export const draftRestoreSource: SourceTransform<DraftSnippetOptions> = (_generated, ctx) => {
  // Só o carimbo vem dos controls. O `draft` do Playground é o texto do
  // exemplo, e interpolá-lo faria o painel ensinar a prosa em vez da peça.
  return build({ timestamp: ctx?.args?.timestamp });
};

/** Um rascunho encontrado, sem carimbo: não se sabe de quando ele é. */
export function draftFoundSource(): string {
  return build({});
}

/** Com o carimbo, que chega já escrito — formato de data é decisão de idioma. */
export function draftDatedSource(): string {
  return build({ timestamp: 'ontem, 14:32' });
}

/** Longo: quem corta é a folha, e o texto inteiro continua no documento. */
export function draftLongSource(): string {
  return build({ draft: 'rascunhoLongoInteiro' });
}

/**
 * A faixa acima do campo.
 *
 * É o único snippet que mostra os dois juntos, porque é a única coisa que a
 * composição ensina: a faixa é peça própria e fica ACIMA do campo — o campo
 * não sabe que ela existe, e nada nele muda por causa dela.
 */
export function draftAboveComposerSource(): string {
  const band = `<DraftRestore${attrsMultilinha(
    [
      'labels={rotulosDoRascunho}',
      'draft={rascunhoGuardado}',
      'timestamp="ontem, 14:32"',
      ON_ACTION,
    ],
    '    ',
  )}  />`;

  return jsxSnippet(
    `import { Composer } from "@/components/ui/composer";\n${IMPORT}`,
    [
      '<>',
      '  {/* A faixa vem ANTES do campo na ordem de leitura, e não leva o foco. */}',
      `  ${band}`,
      '  <Composer labels={rotulos} />',
      '</>',
    ].join('\n'),
  );
}
