/**
 * ─── O corpus, lido do disco ─────────────────────────────────────────────────
 *
 * A metade com I/O que `docs/shared/primitives/docs-index.ts` recusa ter. Ele é
 * puro de propósito — é o que o faz testável em nó e reutilizável no navegador;
 * ler arquivo é responsabilidade de quem o chama, e quem o chama aqui é uma
 * função de servidor.
 *
 * NÃO HÁ ÍNDICE GRAVADO. A leitura acontece uma vez por instância (cold start)
 * e fica em memória de módulo. Um artefato gravado seria mais rápido e
 * envelheceria em silêncio na primeira correção de conteúdo — o custo medido de
 * ler os 84 arquivos é de dezenas de milissegundos, e ele se paga uma vez por
 * instância.
 *
 * ── ONDE ISTO PODE FALHAR NA VERCEL, e vale saber antes de fazer deploy ──
 *
 * `docs/shared/content/` fica FORA da raiz desta stack (é irmã dela). O build
 * já depende disso e funciona — `vercel.json` chama `node ../scripts/…` —, mas
 * o EMPACOTAMENTO de função é outra coisa: o tracer da Vercel parte da raiz do
 * projeto e não sobe. Para publicar, é preciso ligar
 * *Include source files outside of the Root Directory* nas configurações do
 * projeto (ou apontar a Root Directory para a raiz do repositório). Sem isso a
 * função sobe sem corpus e responde `sem_corpus` — que é um estado tratado, e
 * não um erro mudo.
 */

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  entryFromTranslations,
  type DocsIndexEntry,
  type TranslationsLocaleDocument,
} from '../../docs/shared/primitives/docs-index';

/** As três línguas do conteúdo compartilhado. */
export type Locale = 'pt-BR' | 'en' | 'es';

export const LOCALES: readonly Locale[] = ['pt-BR', 'en', 'es'];

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value);
}

/** O documento inteiro de um slug, numa língua. É ele que vai no prompt. */
export interface CorpusDocument {
  slug: string;
  document: TranslationsLocaleDocument;
}

export interface Corpus {
  entries: DocsIndexEntry[];
  documents: Map<string, TranslationsLocaleDocument>;
}

/**
 * Onde procurar `docs/shared/content`, em ordem.
 *
 * A variável de ambiente vem primeiro porque é a saída de emergência que não
 * exige mexer em código quando o layout do deploy for outro.
 */
function candidateRoots(): string[] {
  const here = fileURLToPath(new URL('.', import.meta.url));
  const roots: string[] = [];
  if (process.env.NORTEAR_CONTENT_DIR) roots.push(process.env.NORTEAR_CONTENT_DIR);
  roots.push(join(here, '..', '..', 'docs', 'shared', 'content'));
  roots.push(join(process.cwd(), '..', 'docs', 'shared', 'content'));
  roots.push(join(process.cwd(), 'docs', 'shared', 'content'));
  return roots;
}

let contentRoot: string | null | undefined;

function resolveContentRoot(): string | null {
  if (contentRoot !== undefined) return contentRoot;
  contentRoot = candidateRoots().find((root) => existsSync(root)) ?? null;
  return contentRoot;
}

const cache = new Map<Locale, Corpus>();

/**
 * Devolve o corpus daquela língua, ou `null` quando o conteúdo não veio junto.
 *
 * `null` é um estado, e não uma exceção: quem chama precisa poder dizer à
 * interface "o conteúdo não subiu com a função" em vez de estourar 500.
 */
export function loadCorpus(locale: Locale): Corpus | null {
  const cached = cache.get(locale);
  if (cached) return cached;

  const root = resolveContentRoot();
  if (!root) return null;

  const entries: DocsIndexEntry[] = [];
  const documents = new Map<string, TranslationsLocaleDocument>();

  for (const slug of readdirSync(root)) {
    const file = join(root, slug, 'translations.json');
    // `foundations` não tem `translations.json`. O corpus é o que existe.
    if (!existsSync(file)) continue;
    let parsed: Record<string, TranslationsLocaleDocument>;
    try {
      parsed = JSON.parse(readFileSync(file, 'utf8')) as Record<string, TranslationsLocaleDocument>;
    } catch {
      // Um arquivo quebrado não pode derrubar os outros 83.
      continue;
    }
    const document = parsed[locale];
    if (!document) continue;
    documents.set(slug, document);
    entries.push(entryFromTranslations(slug, document));
  }

  if (entries.length === 0) return null;

  const corpus: Corpus = { entries, documents };
  cache.set(locale, corpus);
  return corpus;
}
