/**
 * Transforms do painel Code do rascunho recuperado.
 *
 * Módulo de TS puro, sem import de `.vue`: é o que deixa as funções rodarem no
 * projeto `unit` do vitest, a única guarda que elas têm — a saída do painel não
 * chega ao DOM durante a `play`.
 *
 * Cada configuração tem a SUA função exportada, chamável SEM argumento. Fábrica
 * curried devolveria função em vez de string, e as checagens que leem o snippet
 * nunca chegariam ao snippet.
 *
 * O rascunho aparece como VÍNCULO, e não como o texto por extenso: o assunto de
 * todos estes snippets é o que a faixa faz com o rascunho, e despejar seis
 * linhas de prosa dentro do atributo faria o painel ensinar o exemplo em vez da
 * peça.
 */
import {
  attrsMultilinha,
  indentar,
  text,
  vueSnippet,
  type SourceTransform,
} from '@/lib/story-source';

/** O que as stories mudam e que o snippet precisa mostrar. */
export type DraftArgs = {
  /** Quando o rascunho foi escrito, já escrito. Ausente quando não se sabe. */
  timestamp?: string;
  /** O nome do vínculo que carrega o rascunho — é o que muda entre os exemplos. */
  draft?: string;
};

// O caminho é o do ÍNDICE da moldura, e não o do arquivo: é assim que as peças
// irmãs entram, e um snippet que ensinasse o atalho direto ensinaria a furar a
// única porta que a família tem.
const IMPORT = "import { DraftRestore } from '@/components/ui/composer';";

const IMPORT_ABOVE =
  "import { Composer, DraftRestore } from '@/components/ui/composer';";

/**
 * O que o exemplo DECLARA, e não só o que ele importa.
 *
 * `:labels="rotulos"` e `@action="aoResponder"` nomeiam coisas de quem consome,
 * e nenhum exemplo as declarava: quem copiasse recebia um `labels` indefinido e
 * um ouvinte que não existe. RESTAURAR E DESCARTAR são de fora — a faixa só
 * avisa qual dos dois foi pedido.
 */
function draftLabels(name: string): string {
  return [
    `const ${name} = {`,
    "  title: 'Você tinha um rascunho',",
    "  restore: 'Restaurar rascunho',",
    "  discard: 'Descartar rascunho',",
    '};',
  ].join('\n');
}

const AO_RESPONDER = [
  "function aoResponder(intent: 'restore' | 'discard') {",
  '  // Restaurar e descartar são de quem consome: a faixa só avisa.',
  "  if (intent === 'restore') recuperarRascunho();",
  '  else apagarRascunho();',
  '}',
].join('\n');

/** Os rótulos do CAMPO, a peça vizinha, que tem o vocabulário dela. */
const ROTULOS_DO_CAMPO = [
  'const rotulos = {',
  "  input: 'Mensagem',",
  "  placeholder: 'Escreva sua mensagem…',",
  "  submit: 'Enviar',",
  "  stop: 'Parar',",
  "  hint: '{key} envia',",
  '};',
].join('\n');

/** O `<script setup>` de cada exemplo: o que importa e o que declara. */
const SETUP = [IMPORT, '', draftLabels('rotulos'), '', AO_RESPONDER].join('\n');
const SETUP_ABOVE = [
  IMPORT_ABOVE,
  '',
  ROTULOS_DO_CAMPO,
  '',
  draftLabels('rotulosDoRascunho'),
  '',
  AO_RESPONDER,
].join('\n');

/**
 * A tag da faixa, só com o que o exemplo precisa dizer.
 *
 * O aviso sai por EVENTO nesta stack, e por isso ele está aqui como `@action`:
 * quem consome o escuta e decide o que restaurar e descartar significam.
 */
function draftTag(opts: DraftArgs, labelsName = 'rotulos'): string {
  const attrs = attrsMultilinha([
    `:labels="${labelsName}"`,
    // O rascunho vai INTEIRO. O corte de duas linhas é da folha, e é o que o
    // mantém achável pela busca do navegador e audível por completo.
    `:draft="${opts.draft ?? 'rascunhoGuardado'}"`,
    opts.timestamp ? `timestamp="${text(opts.timestamp)}"` : undefined,
    '@action="aoResponder"',
  ]);
  return `<DraftRestore${attrs} />`;
}

function build(opts: DraftArgs): string {
  return vueSnippet(SETUP, draftTag(opts));
}

/** Transform do `meta` — o Playground, que segue os controls. */
export const draftRestoreSource: SourceTransform<DraftArgs> = (_gerado, ctx) =>
  build({ timestamp: ctx?.args?.timestamp });

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
  const band = draftTag({ timestamp: 'ontem, 14:32' }, 'rotulosDoRascunho');
  const body = [
    '<!-- A faixa vem ANTES do campo na ordem de leitura, e não leva o foco. -->',
    band,
    '<Composer :labels="rotulos" />',
  ].join('\n');

  return vueSnippet(
    SETUP_ABOVE,
    `<div class="nds-max-w-lg">\n${indentar(body)}\n</div>`,
  );
}
