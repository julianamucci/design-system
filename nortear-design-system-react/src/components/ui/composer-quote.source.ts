/**
 * Snippet do painel Code da citação — ver `@/lib/story-source`.
 *
 * Módulo de TS puro — nada de `.tsx` em valor. É o que deixa as funções rodarem
 * no projeto `unit` do vitest, a única guarda que elas têm: a saída do painel
 * não chega ao DOM durante a `play`.
 *
 * O TRECHO ENTRA DECLARADO, com o nome do ramo. A versão anterior citava
 * `citacao`, `citacaoLonga` e `labels` sem nunca declará-los, e quem copiava
 * recebia um símbolo indefinido na primeira renderização.
 *
 * O TEXTO CITADO ENTRA INTEIRO, e é o único lugar deste módulo em que não se
 * resume: o corte é do DESENHO, e encurtar aqui apagaria o resto para quem lê
 * por audição. É por isso que a citação longa do exemplo continua longa no
 * snippet — ela é o caso que prova o corte.
 */
import { attrsMultilinha, jsxSnippet, type SourceTransform } from '@/lib/story-source';

const IMPORT = 'import { Composer } from "@/components/ui/composer";';

/** Os rótulos do campo, por inteiro. `{key}` e `{max}` são moldes. */
const LABELS_BLOCK = [
  'const labels = {',
  '  input: "Mensagem",',
  '  placeholder: "Escreva sua mensagem…",',
  '  submit: "Enviar",',
  '  stop: "Parar",',
  '  hint: "{key} envia",',
  '  limit: "Até {max} caracteres",',
  '};',
].join('\n');

/** Os rótulos da citação, por inteiro. `{author}` vira o nome de quem escreveu. */
const QUOTE_LABELS_BLOCK = [
  'const quoteLabels = {',
  '  dismiss: "Remover citação de {author}",',
  '  describes: "Respondendo a {author}",',
  '};',
].join('\n');

/** A citação de cada ramo, pelo nome com que o ramo a cita. */
const QUOTES: Record<string, string[]> = {
  citacao: [
    'const citacao = {',
    '  id: "m-0",',
    '  author: "Você",',
    '  role: "user",',
    '  excerpt: "Como o componente decide se acompanha o fim da conversa?",',
    '};',
  ],
  citacaoLonga: [
    '// O texto vai INTEIRO: o corte é do desenho, e cortar aqui apagaria o',
    '// resto para quem lê por audição.',
    'const citacaoLonga = {',
    '  id: "m-1",',
    '  author: "Assistente",',
    '  role: "assistant",',
    '  excerpt:',
    '    "A rolagem só acompanha o fim se já estava no fim. Quem está lendo uma resposta antiga continua onde está, e o botão de ir ao fim aparece com a contagem do que chegou.",',
    '};',
  ],
};

/** Os anexos do ramo que mostra os dois blocos na mesma moldura. */
const ATTACHMENTS_BLOCK = [
  '// A fila do exemplo tem um arquivo por estado — aqui, os dois primeiros.',
  'const arquivos = [',
  '  { id: "a1", name: "planta.pdf", size: 2516582, state: "ready" },',
  '  { id: "a2", name: "medidas.csv", size: 840, state: "uploading", progress: 0.4 },',
  '];',
  '',
  'const attachmentLabels = {',
  '  list: "Anexos",',
  '  remove: "Remover {name}",',
  '  state: {',
  '    pending: "Na fila",',
  '    uploading: "Enviando",',
  '    ready: "Pronto",',
  '    failed: "Falhou",',
  '  },',
  '  unit: { byte: "B", kb: "KB", mb: "MB", gb: "GB" },',
  '};',
].join('\n');

/**
 * O que se faz quando alguém dispensa a citação.
 *
 * Uma linha, e o corpo é de quem consome: a peça relata o pedido, e quem manda
 * a citação nova — ou nenhuma — é quem a mantém.
 */
const DISMISS_BLOCK = 'const responder = (citada) => { /* … */ };';

export type QuoteSnippetOptions = {
  /** Nome da constante da citação que o snippet declara. */
  quote?: string;
  /** A story mostra anexos junto? */
  withAttachments?: boolean;
};

/** O import, a citação do ramo, os rótulos e o manipulador. */
function preamble(opts: QuoteSnippetOptions): string {
  const name = opts.quote ?? 'citacao';
  const parts = [IMPORT, '', QUOTES[name] ? QUOTES[name].join('\n') : QUOTES.citacao.join('\n'), ''];
  parts.push(LABELS_BLOCK, '', QUOTE_LABELS_BLOCK);
  if (opts.withAttachments) parts.push('', ATTACHMENTS_BLOCK);
  parts.push('', DISMISS_BLOCK);
  return parts.join('\n');
}

function build(opts: QuoteSnippetOptions = {}): string {
  return jsxSnippet(
    preamble(opts),
    `<Composer${attrsMultilinha([
      'labels={labels}',
      'quoteLabels={quoteLabels}',
      `quote={${opts.quote ?? 'citacao'}}`,
      opts.withAttachments ? 'attachmentLabels={attachmentLabels}' : undefined,
      opts.withAttachments ? 'attachments={arquivos}' : undefined,
      'onDismissQuote={() => responder(null)}',
    ])} />`,
  );
}

/**
 * Transform do `meta` — a forma básica.
 *
 * Não lê `ctx.args`, e não é esquecimento: o eixo desta peça é ESTADO — com
 * citação, com trecho longo, sem citação —, então ela não tem `argTypes` nem
 * controls, e não há arg de onde ler.
 */
export const composerQuoteSource: SourceTransform<QuoteSnippetOptions> = () => build();

/** A citação curta. */
export function quoteShortSource(): string {
  return build({ quote: 'citacao' });
}

/** A citação longa, que o desenho corta. */
export function quoteLongSource(): string {
  return build({ quote: 'citacaoLonga' });
}

/** Citação e anexos na mesma moldura. */
export function quoteWithAttachmentsSource(): string {
  return build({ quote: 'citacao', withAttachments: true });
}

/**
 * O composer SEM citação.
 *
 * O snippet não passa a citação nem os rótulos dela: sem citação o bloco não
 * existe, e mostrar as duas props ensinaria a declarar o que não se usa.
 */
export function quoteAbsentSource(): string {
  return jsxSnippet([IMPORT, '', LABELS_BLOCK].join('\n'), '<Composer labels={labels} />');
}
