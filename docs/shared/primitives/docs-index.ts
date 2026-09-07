/**
 * ─── Recuperação léxica sobre o conteúdo compartilhado ───────────────────────
 *
 * Recebe o corpus e a pergunta, devolve os slugs mais prováveis. Nada mais.
 *
 * **Por que léxico, e não vetorial.** Um índice de embeddings é um ARTEFATO
 * separado: nasce de um passo de build, é gravado em algum lugar e a partir daí
 * envelhece sozinho. Quando alguém corrige uma frase em
 * `docs/shared/content/<slug>/translations.json`, o índice continua respondendo
 * pela frase antiga — e o defeito é invisível, porque o índice não reprova em
 * portão nenhum. Aqui o corpus É o conteúdo: quem chama lê os arquivos, monta
 * as entradas e pergunta. Não há segunda cópia para divergir.
 *
 * **O que torna o léxico viável.** 56 dos 84 slugs trazem `seo.aiEntities` —
 * palavras-chave escritas para consumo de modelo — e `seo.aiSummary`. Isso é um
 * campo de alta densidade e baixo ruído por componente, e é ele que separa
 * "como anuncio erro de formulário" (que não cita nenhum nome) do resto do
 * corpus. Sem esses campos, a recuperação por termo cairia na frequência bruta,
 * onde ganha o documento mais comprido.
 *
 * **Módulo puro.** Sem rede, sem `fs`, sem DOM, sem relógio. É o que permite
 * testá-lo em nó, que é a única parte deste protótipo verificável sem chave de
 * API — e ele é o coração: uma recuperação errada faz o modelo responder sobre
 * o componente errado com toda a confiança do mundo.
 */

/** Uma entrada do corpus — um componente, num idioma. */
export interface DocsIndexEntry {
  /** O diretório em `docs/shared/content/`. É a resposta que sai daqui. */
  slug: string;
  /** `translations[locale].title`. */
  title: string;
  /** `translations[locale].category`. */
  category: string;
  /** `seo.aiEntities` — vazio nos 28 slugs que ainda não o têm. */
  entities: string;
  /** `seo.aiSummary` + `seo.description` + `description`. */
  summary: string;
  /** Todo o resto do conteúdo, achatado. Entra por frequência, não por posição. */
  body: string;
}

/** Um slug candidato, com a nota que o pôs ali. */
export interface DocsIndexHit {
  slug: string;
  /**
   * Nota normalizada pelo peso dos termos da pergunta.
   *
   * NORMALIZADA é o ponto: sem isso a nota cresceria com o tamanho da pergunta
   * e nenhum limiar fixo separaria "achei" de "não achei". Aqui a escala é a
   * mesma para uma pergunta de três palavras e para uma de vinte.
   */
  score: number;
  /** Os termos da pergunta que casaram. Serve para explicar a nota. */
  matched: string[];
}

export interface DocsIndexOptions {
  /** Quantos devolver. O prompt do servidor usa de 3 a 5. */
  limit?: number;
}

/**
 * Abaixo disto, a recuperação veio fraca e quem chama diz que não sabe.
 *
 * MEDIDO contra o corpus real (84 slugs, nas três línguas), 30 perguntas em
 * três grupos:
 *
 * | grupo | melhor nota |
 * |---|---|
 * | cita o componente pelo nome | 7,5 a 15,7 |
 * | só conceito, sem nome nenhum | 0,70 a 9,39 |
 * | sem resposta no corpus | 0,00 a 0,39 |
 *
 * 0,6 fica na faixa vazia entre os dois últimos grupos — não no meio da escala,
 * que não significaria nada.
 *
 * **A colisão que este número não resolve, e nenhum limiar resolveria.**
 * "preciso trocar o óleo do motor do carro" pontua 0,857 em `media-player`,
 * porque o resumo daquele componente fala de "motor" (de mídia) sete vezes.
 * Recuperação léxica não sabe que são dois motores. É por isso que o piso NÃO é
 * o único guarda: a instrução de sistema do servidor obriga o modelo a dizer
 * que não sabe quando os trechos não respondem, e essa é a defesa que pega o
 * caso em que o léxico se engana com confiança.
 */
export const RETRIEVAL_FLOOR = 0.6;

/**
 * Palavras que não distinguem documento nenhum, nas três línguas do corpus.
 *
 * A lista é curta de propósito. O IDF já derruba quase tudo que é comum — o que
 * ela evita é o caso em que uma palavra vazia aparece em POUCOS documentos por
 * acidente de escrita e ganha peso alto por isso.
 */
const STOPWORDS = new Set([
  // pt-BR
  'a', 'ao', 'aos', 'as', 'com', 'como', 'da', 'das', 'de', 'do', 'dos', 'e',
  'em', 'essa', 'esse', 'esta', 'este', 'eu', 'faco', 'fazer', 'isso', 'ja',
  'mais', 'mas', 'me', 'meu', 'na', 'nas', 'no', 'nos', 'num', 'numa', 'o',
  'os', 'ou', 'para', 'pelo', 'pela', 'por', 'posso', 'pra', 'qual', 'quais',
  'quando', 'que', 'quero', 'se', 'sem', 'ser', 'seu', 'sobre', 'sua', 'tem',
  'ter', 'um', 'uma', 'usar', 'uso', 'vou',
  // en
  'an', 'and', 'are', 'at', 'be', 'by', 'can', 'do', 'does', 'for', 'from',
  'how', 'i', 'in', 'is', 'it', 'of', 'on', 'or', 'the', 'this', 'to', 'use',
  'want', 'what', 'when', 'which', 'with',
  // es
  'al', 'como', 'con', 'de', 'del', 'el', 'en', 'es', 'la', 'las', 'lo', 'los',
  'para', 'por', 'que', 'quiero', 'se', 'sin', 'sobre', 'su', 'un', 'una',
  'usar', 'uso', 'y',
]);

/** Peso de cada campo quando o termo casa nele. */
const WEIGHT = {
  slug: 6,
  entities: 4,
  title: 3,
  category: 2,
  summary: 2,
  /** Teto do corpo. Satura: o quinto uso do termo não vale o que valeu o primeiro. */
  body: 1.5,
} as const;

/** Quantas ocorrências levam o corpo à metade do teto. */
const BODY_HALF = 2;

/** Bônus por citar o componente pelo nome, fora da normalização. */
const PHRASE_BONUS_BASE = 4;
const PHRASE_BONUS_PER_EXTRA_TOKEN = 2;

/**
 * Tira acento e caixa.
 *
 * O corpus é trilíngue e quem pergunta digita sem acento na metade das vezes.
 * Sem esta passagem, "formulario" e "formulário" seriam termos diferentes — e o
 * segundo é o que está escrito no conteúdo.
 */
export function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase();
}

/**
 * Quebra em termos.
 *
 * Hífen separa: `chat-thread` vira dois termos, e é o que faz `alert-dialog`
 * casar com "alert dialog".
 *
 * MAIÚSCULA NO MEIO TAMBÉM SEPARA, e isso não é refinamento — era um buraco.
 * A quebra acontecia DEPOIS de minuscular, então `ComputerUse` virava o único
 * termo `computeruse`, que não casa com `computer` nem com `use`. A pergunta
 * "pra que serve o componente ComputerUse?" devolvia button, chart, dialog,
 * card e input-group, e o chat respondia que o componente não existe — sobre um
 * componente documentado, cujo nome a pessoa acabara de LER na barra lateral.
 *
 * É o caso comum, não o exótico: a barra lateral mostra `ComputerUse`,
 * `HoverCard`, `DataTable`, `InputOTP`. Ninguém digita o slug com hífen; a
 * pessoa copia o que está na tela.
 *
 * Dois cortes, nesta ordem: sigla seguida de palavra (`InputOTPField` →
 * `Input OTP Field`) e minúscula ou dígito seguida de maiúscula (`ComputerUse`
 * → `Computer Use`). O primeiro precisa vir antes, senão o segundo parte a
 * sigla no meio.
 */
export function tokenize(text: string): string[] {
  const separado = text
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2');
  return normalize(separado)
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 2);
}

/**
 * Nome de componente escrito TUDO JUNTO, em minúsculas.
 *
 * A quebra por maiúscula resolve `ComputerUse`. Não resolve `computeruse`, que
 * é como a pessoa escreve quando digita de memória em vez de copiar da barra
 * lateral — e não há maiúscula onde cortar. O termo vira um só, não casa com
 * `computer` nem com `use`, e a busca devolve qualquer coisa.
 *
 * A saída é perguntar ao próprio corpus: cada slug tem uma forma compacta
 * (`computer-use` → `computeruse`), e quando um termo da pergunta é igual a
 * ela, o termo é trocado pelas partes do slug. Continua sem índice paralelo — o
 * mapa é montado do corpus a cada chamada, como o IDF.
 */
function compactosDoCorpus(corpus: readonly DocsIndexEntry[]): Map<string, string[]> {
  const mapa = new Map<string, string[]>();
  for (const entry of corpus) {
    const partes = tokenize(entry.slug);
    if (partes.length < 2) continue;
    mapa.set(partes.join(''), partes);
  }
  return mapa;
}

/**
 * Os tokens da pergunta com a forma compacta já expandida.
 *
 * Sem tirar palavra vazia e sem deduplicar: esta é a lista que o bônus de
 * sequência lê, e ele depende de ADJACÊNCIA. Remover uma palavra no meio
 * juntaria termos que não estavam juntos.
 */
function expandirTokens(question: string, compactos?: Map<string, string[]>): string[] {
  const saida: string[] = [];
  for (const token of tokenize(question)) {
    const partes = compactos?.get(token);
    if (partes) saida.push(...partes);
    else saida.push(token);
  }
  return saida;
}

/**
 * Termos úteis da pergunta, sem repetição e sem palavra vazia.
 *
 * Vale saber que `use` É palavra vazia (da lista do inglês) e ao mesmo tempo
 * metade do slug `computer-use` — então esse termo não pontua sozinho. Não é
 * descuido: quem sustenta a nota nesse caso é o bônus de SEQUÊNCIA, que lê a
 * lista completa de tokens e enxerga "computer use" adjacente.
 *
 * Cheguei a excluir da lista de vazias todo token que aparece em algum slug.
 * Rendia +0,3 nas perguntas reais e fazia a consulta degenerada "use" devolver
 * `computer-use` com 7,36 — resposta confiante para uma pergunta que não é
 * pergunta. Nenhum teste conseguia distinguir as duas versões, que é o sinal de
 * que a complexidade não estava carregando peso.
 */
function queryTerms(question: string, compactos?: Map<string, string[]>): string[] {
  const seen = new Set<string>();
  const terms: string[] = [];
  for (const token of expandirTokens(question, compactos)) {
    if (seen.has(token) || STOPWORDS.has(token)) continue;
    seen.add(token);
    terms.push(token);
  }
  return terms;
}

/** Uma entrada já preparada para pontuar. Nada aqui depende da pergunta. */
interface PreparedEntry {
  entry: DocsIndexEntry;
  slugTokens: string[];
  slugSet: Set<string>;
  titleSet: Set<string>;
  entitySet: Set<string>;
  categorySet: Set<string>;
  summarySet: Set<string>;
  bodyCounts: Map<string, number>;
  /** Todo termo que aparece em qualquer campo. É o que alimenta o DF. */
  allTerms: Set<string>;
}

function countTokens(text: string): Map<string, number> {
  const counts = new Map<string, number>();
  for (const token of tokenize(text)) {
    counts.set(token, (counts.get(token) ?? 0) + 1);
  }
  return counts;
}

function prepare(entry: DocsIndexEntry): PreparedEntry {
  const slugTokens = tokenize(entry.slug);
  const slugSet = new Set(slugTokens);
  const titleSet = new Set(tokenize(entry.title));
  const entitySet = new Set(tokenize(entry.entities));
  const categorySet = new Set(tokenize(entry.category));
  const summarySet = new Set(tokenize(entry.summary));
  const bodyCounts = countTokens(entry.body);

  const allTerms = new Set<string>([
    ...slugSet,
    ...titleSet,
    ...entitySet,
    ...categorySet,
    ...summarySet,
    ...bodyCounts.keys(),
  ]);

  return {
    entry,
    slugTokens,
    slugSet,
    titleSet,
    entitySet,
    categorySet,
    summarySet,
    bodyCounts,
    allTerms,
  };
}

/**
 * A pergunta cita o slug inteiro, em sequência?
 *
 * Sequência, e não substring: "formulário" contém "form" como texto e não como
 * termo, e casar por substring faria toda pergunta sobre formulário puxar o
 * componente `form` de graça.
 */
function mentionsSlug(questionTokens: string[], slugTokens: string[]): boolean {
  if (slugTokens.length === 0) return false;
  for (let start = 0; start + slugTokens.length <= questionTokens.length; start += 1) {
    let hit = true;
    for (let offset = 0; offset < slugTokens.length; offset += 1) {
      if (questionTokens[start + offset] !== slugTokens[offset]) {
        hit = false;
        break;
      }
    }
    if (hit) return true;
  }
  return false;
}

/**
 * Pontua o corpus contra a pergunta e devolve os melhores.
 *
 * O IDF sai do PRÓPRIO corpus a cada chamada — é o que dispensa o passo de
 * build sem abrir mão de saber que "componente" não distingue nada e
 * "assertiva" distingue muito. Com 84 documentos a conta é irrisória, e ela
 * mantém a promessa do módulo: o conteúdo é a fonte, e não há índice paralelo.
 */
export function searchDocs(
  corpus: readonly DocsIndexEntry[],
  question: string,
  options: DocsIndexOptions = {},
): DocsIndexHit[] {
  const limit = options.limit ?? 5;
  if (corpus.length === 0) return [];

  const compactos = compactosDoCorpus(corpus);
  const terms = queryTerms(question, compactos);
  if (terms.length === 0) return [];

  const prepared = corpus.map(prepare);
  const total = prepared.length;

  // Frequência documental, só dos termos que a pergunta usa: varrer o
  // vocabulário inteiro custaria mais e não mudaria uma nota.
  const idf = new Map<string, number>();
  for (const term of terms) {
    let df = 0;
    for (const doc of prepared) if (doc.allTerms.has(term)) df += 1;
    idf.set(term, Math.log(1 + total / (1 + df)));
  }

  // Termo que a pergunta traz e o corpus inteiro desconhece continua no
  // denominador: é assim que a pergunta sobre Kubernetes pontua perto de zero
  // em vez de pontuar pelo único termo que por acaso casou.
  const denominator = terms.reduce((sum, term) => sum + (idf.get(term) ?? 0), 0);
  if (denominator === 0) return [];

  // A lista COMPLETA, com a forma compacta expandida e sem tirar nada: o bônus
  // de sequência lê adjacência, e uma remoção no meio juntaria termos que não
  // estavam juntos.
  const questionTokens = expandirTokens(question, compactos);

  const hits: DocsIndexHit[] = prepared.map((doc) => {
    let weighted = 0;
    const matched: string[] = [];

    for (const term of terms) {
      let weight = 0;
      if (doc.slugSet.has(term)) weight += WEIGHT.slug;
      if (doc.entitySet.has(term)) weight += WEIGHT.entities;
      if (doc.titleSet.has(term)) weight += WEIGHT.title;
      if (doc.categorySet.has(term)) weight += WEIGHT.category;
      if (doc.summarySet.has(term)) weight += WEIGHT.summary;

      const tf = doc.bodyCounts.get(term) ?? 0;
      if (tf > 0) weight += (WEIGHT.body * tf) / (tf + BODY_HALF);

      if (weight > 0) {
        matched.push(term);
        weighted += (idf.get(term) ?? 0) * weight;
      }
    }

    let score = weighted / denominator;
    if (mentionsSlug(questionTokens, doc.slugTokens)) {
      score +=
        PHRASE_BONUS_BASE + PHRASE_BONUS_PER_EXTRA_TOKEN * (doc.slugTokens.length - 1);
    }

    return { slug: doc.entry.slug, score, matched };
  });

  return hits
    .filter((hit) => hit.score > 0)
    .sort((a, b) => (b.score - a.score) || a.slug.localeCompare(b.slug))
    .slice(0, limit);
}

/**
 * A recuperação veio fraca?
 *
 * Existe como função, e não como comparação solta no servidor, porque é a
 * decisão que separa "responde com o que achou" de "diz que não sabe" — e essa
 * decisão precisa estar num lugar só, testável, do lado da nota que a produziu.
 */
export function isWeakRetrieval(
  hits: readonly DocsIndexHit[],
  floor: number = RETRIEVAL_FLOOR,
): boolean {
  return hits.length === 0 || hits[0].score < floor;
}

/** O que `entryFromTranslations` espera achar num `translations.json`. */
export interface TranslationsLocaleDocument {
  title?: string;
  category?: string;
  description?: string;
  seo?: {
    description?: string;
    aiSummary?: string;
    aiEntities?: string;
  };
  [key: string]: unknown;
}

/**
 * Achata o resto do documento em texto corrido.
 *
 * Pula chave terminada em `Code`: são os snippets por stack, e eles trazem
 * nome de API repetido em cinco variantes. Deixá-los entrar faria o corpo
 * pontuar por quantas stacks o componente tem, o que não é sinal de nada.
 */
function flatten(value: unknown, out: string[], key = ''): void {
  if (key.endsWith('Code')) return;
  if (typeof value === 'string') {
    out.push(value);
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) flatten(item, out);
    return;
  }
  if (value && typeof value === 'object') {
    for (const [childKey, child] of Object.entries(value as Record<string, unknown>)) {
      flatten(child, out, childKey);
    }
  }
}

/**
 * Monta a entrada do corpus a partir de um `translations.json` já lido.
 *
 * Recebe o objeto, e não o caminho: ler arquivo é I/O, e I/O aqui dentro
 * fecharia a porta do teste de nó e da execução no navegador.
 */
export function entryFromTranslations(
  slug: string,
  document: TranslationsLocaleDocument,
): DocsIndexEntry {
  const { title, category, description, seo, ...rest } = document;
  const body: string[] = [];
  flatten(rest, body);

  return {
    slug,
    title: title ?? '',
    category: category ?? '',
    entities: seo?.aiEntities ?? '',
    summary: [seo?.aiSummary, seo?.description, description].filter(Boolean).join(' '),
    body: body.join(' '),
  };
}
