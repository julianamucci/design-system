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

/**
 * Os rótulos, por inteiro.
 *
 * Não cabe resumir: os três são obrigatórios, e os dois últimos são o nome
 * acessível dos controles — um objeto pela metade não compila para quem copia e
 * deixaria um botão anônimo na tela.
 */
const LABELS_BLOCK = [
  'const rotulos = {',
  '  title: "Você tinha um rascunho",',
  '  restore: "Restaurar rascunho",',
  '  discard: "Descartar rascunho",',
  '};',
].join('\n');

/**
 * As duas escolhas, declaradas.
 *
 * Uma linha cada, e não uma elisão: o que descartar apaga, se dá para desfazer
 * e quando um rascunho expira são política de produto — mas os nomes precisam
 * EXISTIR, ou quem copia recebe um símbolo indefinido no primeiro clique.
 */
const ACTIONS_BLOCK = [
  'const restaurar = () => { /* … */ };',
  'const descartar = () => { /* … */ };',
].join('\n');

/** Os rótulos do campo de mensagem, também por inteiro. */
const FIELD_LABELS_BLOCK = [
  'const rotulosDoCampo = {',
  '  input: "Mensagem",',
  '  placeholder: "Escreva sua mensagem…",',
  '  submit: "Enviar",',
  '  stop: "Parar",',
  '  hint: "{key} envia",',
  '  limit: "Até {max} caracteres",',
  '};',
].join('\n');

/**
 * O rascunho, declarado com o nome que aquele ramo usa.
 *
 * O TEXTO ENTRA RESUMIDO no ramo longo, e é a única elisão: o que aquele caso
 * ensina é que quem corta é a folha, e seis linhas de prosa dentro do painel
 * fariam o snippet ensinar o exemplo em vez da peça. Resumido, porém, e não
 * ELIDIDO — a versão anterior citava o nome sem nunca declará-lo.
 */
function draftBlock(name: string): string {
  if (name === 'rascunhoLongoInteiro') {
    return [
      '// O texto inteiro continua no documento; quem corta em duas linhas é a',
      '// folha. Aqui ele vai resumido — o assunto é o corte, não a prosa.',
      `const ${name} =`,
      '  "Sobre o orçamento de agosto: separei os três itens que estouraram e " +',
      '  "queria entender se o desvio veio do câmbio ou do contrato novo de " +',
      '  "infraestrutura. Se der, traga a comparação com julho lado a lado.";',
    ].join('\n');
  }
  return `const ${name} = "Sobre o orçamento de agosto: separei os três itens que estouraram.";`;
}

/**
 * O preâmbulo do snippet: o import, o rascunho, os rótulos e as duas escolhas.
 *
 * Ele entra em TODOS os ramos, e é o que os torna copiáveis: a versão anterior
 * passava `labels={rotulos}` e chamava `restaurar()` sem declarar nada disso.
 */
function preamble(draft: string, imports: string[] = [], blocks: string[] = []): string {
  const partes = [draftBlock(draft), LABELS_BLOCK, ...blocks, ACTIONS_BLOCK].flatMap(
    (bloco) => ['', bloco],
  );
  return [[...imports, IMPORT].join('\n'), ...partes].join('\n');
}

export type DraftSnippetOptions = {
  /** Quando o rascunho foi escrito, já escrito. Ausente quando não se sabe. */
  timestamp?: string;
  /** O nome da variável que carrega o rascunho — é o que muda entre os casos. */
  draft?: string;
};

function build(opts: DraftSnippetOptions): string {
  const timestamp = text(opts.timestamp);
  const draft = opts.draft ?? 'rascunhoGuardado';

  return jsxSnippet(
    preamble(draft),
    `<DraftRestore${attrsMultilinha([
      'labels={rotulos}',
      // O rascunho vai INTEIRO. O corte de duas linhas é da folha, e é o que o
      // mantém achável pela busca do navegador e audível por completo.
      `draft={${draft}}`,
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
      'labels={rotulos}',
      'draft={rascunhoGuardado}',
      'timestamp="ontem, 14:32"',
      ON_ACTION,
    ],
    '    ',
  )}  />`;

  return jsxSnippet(
    preamble('rascunhoGuardado', ['import { Composer } from "@/components/ui/composer";'], [
      FIELD_LABELS_BLOCK,
    ]),
    [
      '<>',
      '  {/* A faixa vem ANTES do campo na ordem de leitura, e não leva o foco. */}',
      `  ${band}`,
      '  <Composer labels={rotulosDoCampo} />',
      '</>',
    ].join('\n'),
  );
}
