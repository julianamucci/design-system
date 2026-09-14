// Snippet do painel Code do Progress — ver `@/lib/story-source`.

import {
  callLine,
  importing,
  appendLine,
  options,
  snippet,
  text,
  type SourceTransform,
} from '@/lib/story-source';
import type { ProgressVariant } from './progress';

/** Chaves iguais às dos args da story — `{ ...ctx.args }` entra sem tradução. */
export type ProgressSnippetOptions = {
  /** `null` é o modo indeterminado; ausente cai no exemplo padrão do snippet. */
  value?: number | null;
  /**
   * O snippet ensina a OMITIR o valor — a outra forma do indeterminado. Não é
   * chave de story: `value` ausente já significa "use o exemplo padrão".
   */
  valueOmitted?: boolean;
  min?: number;
  max?: number;
  /** O control do Playground manda `''` quando a barra usa o primário. */
  variant?: ProgressVariant | '';
  'aria-label'?: string;
  /** Texto visível ao lado da barra, na forma com rótulo. */
  label?: string;
  /**
   * O que a região `polite` anuncia. Sem valor, a porcentagem; com valor, o
   * texto da etapa — que é o caso do assistente de várias telas.
   */
  valueText?: string;
  /** Título do cartão ao redor do bloco — ausente, o bloco fica solto. */
  title?: string;
  /** Linha secundária sob o título do cartão (tamanho, prazo). */
  meta?: string;
  /** Frase sob o título do contêiner ocupado. */
  description?: string;
};

/** Uma barra de uma lista, na forma com várias barras empilhadas. */
export type ProgressSnippetItem = {
  value: number;
  variant?: ProgressVariant;
  'aria-label': string;
  /** Texto visível acima da barra; ausente, a lista mostra só as barras. */
  label?: string;
};

const LABEL_DEFAULT = 'Progresso do upload';

/**
 * Reindenta as linhas seguintes de um bloco já montado.
 *
 * `callLine()` recua os próprios pares em dois espaços, medida certa para uma
 * chamada no topo do arquivo e curta demais quando ela entra numa lista de
 * argumentos.
 */
function recuar(block: string, espacos: string): string {
  return block
    .split('\n')
    .map((line, i) => (i === 0 ? line : `${espacos}${line}`))
    .join('\n');
}

/** Comentário do modo sem estimativa, mostrado só quando ele é o caso. */
const NOTA_INDETERMINADO = `// \`null\` é o modo sem estimativa: \`aria-valuenow\` não é escrito, porque zero
// diria "0%" onde a verdade é "não sei quanto falta".`;

/** Comentário da forma que omite o valor. */
const NOTA_OMITIDO = `// Sem \`value\` é o modo sem estimativa, igual a passar \`null\`: \`aria-valuenow\`
// não é escrito e o leitor de tela ouve "Em andamento".`;

// Os dois trechos com template literal ficam em aspas duplas: crase escapada
// dentro de outra crase desalinhava a máscara de snippet do `audit.mjs`, que
// passava a ler o texto do exemplo como código.
const CUSTOM_TEXT_LINE =
  "getAriaValueText: (value, min, max) =>\n    value === null ? 'Contando arquivos' : `${value} de ${max} arquivos`,";
const VALUETEXT_LINE = "  barra.setAttribute('aria-valuetext', `${pct}%`);";

function notaDoIndeterminado(o: ProgressSnippetOptions): string | undefined {
  if (o.valueOmitted) return NOTA_OMITIDO;
  return o.value === null ? NOTA_INDETERMINADO : undefined;
}

/** As opções da fábrica. Só o que difere do padrão entra. */
function linhasDaBarra(o: ProgressSnippetOptions): string[] {
  const indeterminado = o.value === null;
  return options([
    ['value', o.valueOmitted ? undefined : indeterminado ? 'null' : String(o.value ?? 42)],
    ['min', o.min !== undefined && o.min !== 0 ? String(o.min) : undefined],
    ['max', o.max !== undefined && o.max !== 100 ? String(o.max) : undefined],
    ['variant', o.variant ? text(o.variant) : undefined],
    // Um `role="progressbar"` sem nome é anunciado como "barra de progresso,
    // 40%": o leitor diz quanto, nunca de quê.
    ['aria-label', text(o['aria-label'] ?? LABEL_DEFAULT)],
  ]);
}

/** A chamada real de `createProgress` com as opções da story. */
export function progressSnippet(o: ProgressSnippetOptions = {}): string {
  return snippet(
    importing('progress', 'createProgress'),
    notaDoIndeterminado(o),
    `const barra = ${callLine('createProgress', linhasDaBarra(o))};`,
    appendLine('barra'),
  );
}

/**
 * Barra com texto anunciado próprio.
 *
 * `aria-valuetext` SUBSTITUI a leitura do número: quem conta arquivos quer
 * ouvir "42 de 100 arquivos", não "42%". A função recebe o valor já limitado à
 * faixa, ou `null` no indeterminado — e tem de dizer algo nos dois casos.
 */
export function progressCustomTextSnippet(o: ProgressSnippetOptions = {}): string {
  return snippet(
    importing('progress', 'createProgress'),
    `const arquivos = ${callLine('createProgress', [
      ...linhasDaBarra({ ...o, 'aria-label': o['aria-label'] ?? 'Processamento de arquivos' }),
      CUSTOM_TEXT_LINE,
    ])};`,
    appendLine('arquivos'),
  );
}

/** Transform de story para a barra com texto anunciado próprio. */
export function progressSourceCustomText(
  fixas: ProgressSnippetOptions = {},
): SourceTransform<ProgressSnippetOptions> {
  return (_gerado, ctx) => progressCustomTextSnippet({ ...ctx.args, ...fixas });
}

/** Classes do cartão que as composições usam ao redor do bloco. */
const CARD_CLASSES =
  'nds-stack nds-w-md nds-p-4 nds-rounded-lg nds-border-default nds-bg-card nds-text-card-foreground';

/**
 * A linha de rótulo e valor acima de uma barra, como bloco de código.
 *
 * O valor vive numa região `polite` — `assertive` interromperia quem escuta a
 * cada avanço. `width` é a classe do bloco: solto ele tem a própria medida,
 * dentro de um cartão ocupa a do cartão.
 */
function labeledBlock(label: string, anunciado: string, barra: string, width: string): string {
  return `const bloco = document.createElement('div');
bloco.className = 'nds-stack ${width}';
bloco.dataset.spacing = 'xs';

const linha = document.createElement('div');
linha.className = 'nds-cluster nds-text-body';
linha.dataset.justify = 'between';

const nome = document.createElement('span');
nome.className = 'nds-text-foreground';
nome.textContent = ${text(label)};

const valor = document.createElement('span');
valor.className = 'nds-text-muted-foreground nds-tabular-nums';
// \`polite\` e nunca \`assertive\`: o valor muda o tempo todo, e interromper a
// cada avanço deixaria quem usa leitor de tela sem ouvir o resto da tela.
valor.setAttribute('aria-live', 'polite');
valor.textContent = ${text(anunciado)};

linha.append(nome, valor);
bloco.append(linha, ${barra});`;
}

/**
 * Barra com rótulo e valor visíveis — e, com `title`, dentro do cartão do
 * arquivo que está subindo.
 *
 * A fábrica desta stack não expõe partes de rótulo e valor: eles são compostos
 * acima da barra com as classes do design system.
 */
export function progressComRotuloSnippet(o: ProgressSnippetOptions = {}): string {
  const label = o.label ?? 'Enviando arquivo';
  const anunciado = o.valueText ?? `${o.value ?? 42}%`;
  const barra = callLine('createProgress', linhasDaBarra(o));

  if (o.title === undefined) {
    return snippet(
      importing('progress', 'createProgress'),
      labeledBlock(label, anunciado, barra, 'nds-w-md'),
      appendLine('bloco'),
    );
  }

  return snippet(
    importing('progress', 'createProgress'),
    `const cartao = document.createElement('div');
cartao.className = '${CARD_CLASSES}';
cartao.dataset.spacing = 'sm';

const titulo = document.createElement('div');
titulo.className = 'nds-text-body nds-font-medium';
titulo.textContent = ${text(o.title)};`,
    o.meta === undefined
      ? undefined
      : `const meta = document.createElement('div');
meta.className = 'nds-text-caption nds-text-muted-foreground';
meta.textContent = ${text(o.meta)};`,
    labeledBlock(label, anunciado, barra, 'nds-w-full'),
    `cartao.append(${o.meta === undefined ? 'titulo' : 'titulo, meta'}, bloco);`,
    appendLine('cartao'),
  );
}

/** Função do snippet que põe rótulo e valor acima de cada barra da lista. */
const WITH_LABEL_FN = `// O valor visível é o mesmo texto que a fábrica escreveu para o leitor de tela.
function comRotulo(rotulo, barra) {
  const bloco = document.createElement('div');
  bloco.className = 'nds-stack nds-w-full';
  bloco.dataset.spacing = 'xs';

  const linha = document.createElement('div');
  linha.className = 'nds-cluster nds-text-body';
  linha.dataset.justify = 'between';

  const nome = document.createElement('span');
  nome.className = 'nds-text-foreground';
  nome.textContent = rotulo;

  const valor = document.createElement('span');
  valor.className = 'nds-text-muted-foreground nds-tabular-nums';
  valor.setAttribute('aria-live', 'polite');
  valor.textContent = barra.getAttribute('aria-valuetext');

  linha.append(nome, valor);
  bloco.append(linha, barra);
  return bloco;
}`;

/**
 * Uma lista de barras — a forma das stories que mostram várias de uma vez.
 * Com `label` nos itens, cada barra ganha a linha de rótulo e valor.
 */
export function progressListaSnippet(items: ProgressSnippetItem[], spacing: 'sm' | 'md' = 'md'): string {
  const hasLabels = items.some((i) => i.label !== undefined);
  const calls = items.map((i) => {
    const call = recuar(
      callLine(
        'createProgress',
        options([
          ['value', String(i.value)],
          ['variant', i.variant ? text(i.variant) : undefined],
          ['aria-label', text(i['aria-label'])],
        ]),
      ),
      '  ',
    );
    return i.label === undefined ? `  ${call},` : `  comRotulo(${text(i.label)}, ${call}),`;
  });

  return snippet(
    importing('progress', 'createProgress'),
    hasLabels ? WITH_LABEL_FN : undefined,
    `const lista = document.createElement('div');
lista.className = 'nds-stack nds-w-md';
lista.dataset.spacing = '${spacing}';

// Um nome acessível DISTINTO por barra: quatro "Progresso do upload" numa
// lista são quatro controles indistinguíveis para quem só ouve.
lista.append(
${calls.join('\n')}
);`,
    appendLine('lista'),
  );
}

/**
 * Transform de story para a lista de barras. O espaçamento acompanha o da story:
 * a `SemanticColor` junta duas barras com `sm`, as listas de upload usam `md`.
 */
export function progressSourceLista(
  items: ProgressSnippetItem[],
  spacing: 'sm' | 'md' = 'md',
): SourceTransform<ProgressSnippetOptions> {
  return () => progressListaSnippet(items, spacing);
}

/**
 * Barra que avança.
 *
 * A fábrica desenha um valor, não uma animação: quem faz a barra andar reescreve
 * `aria-valuenow`, `aria-valuetext` e a MESMA custom property que a fábrica
 * alimenta. Escrever `width` ou `transform` no lugar dela passaria por cima da
 * folha compartilhada; esquecer o texto anunciaria "0%" numa barra em 80%.
 */
export function progressAnimadoSnippet(o: ProgressSnippetOptions = {}): string {
  return snippet(
    importing('progress', 'createProgress'),
    `const barra = ${callLine('createProgress', linhasDaBarra({ ...o, value: o.value ?? 0 }))};
const indicador = barra.querySelector('[data-slot="progress-indicator"]');

function avancar(pct) {
  barra.setAttribute('aria-valuenow', String(pct));
  // O texto anunciado anda junto: ele substitui a leitura do número.
${VALUETEXT_LINE}
  // A mesma custom property que a fábrica alimenta. \`width\` ou \`transform\`
  // aqui sobrescreveriam a regra do design system.
  indicador?.style.setProperty('--value', String(pct));
}`,
    appendLine('barra'),
  );
}

/** Transform de story para a barra que avança. */
export function progressSourceAnimado(
  fixas: ProgressSnippetOptions = {},
): SourceTransform<ProgressSnippetOptions> {
  return (_gerado, ctx) => progressAnimadoSnippet({ ...ctx.args, ...fixas });
}

/**
 * Barra dentro de um contêiner que se declara ocupado.
 *
 * `aria-busy` diz que a região está sendo montada; a barra diz quanto falta.
 * Um `aria-busy="true"` sobre uma barra em 100% seria contradição.
 */
export function progressOcupadoSnippet(o: ProgressSnippetOptions = {}): string {
  const label = o.label ?? 'Analisando dados';
  const anunciado = o.valueText ?? `${o.value ?? 42}%`;

  return snippet(
    importing('progress', 'createProgress'),
    `const cartao = document.createElement('div');
cartao.setAttribute('role', 'status');
// Enquanto a operação corre. Quem termina a operação apaga o atributo.
cartao.setAttribute('aria-busy', 'true');
cartao.className = '${CARD_CLASSES}';
cartao.dataset.spacing = 'sm';

const titulo = document.createElement('div');
titulo.className = 'nds-text-body nds-font-medium';
titulo.textContent = ${text(o.title ?? 'Processando relatório')};

const descricao = document.createElement('div');
descricao.className = 'nds-text-caption nds-text-muted-foreground';
descricao.textContent = ${text(o.description ?? 'Isso pode levar alguns minutos.')};`,
    labeledBlock(label, anunciado, callLine('createProgress', linhasDaBarra(o)), 'nds-w-full'),
    'cartao.append(titulo, descricao, bloco);',
    appendLine('cartao'),
  );
}

/** Transform de story para o contêiner ocupado. */
export function progressSourceOcupado(
  fixas: ProgressSnippetOptions = {},
): SourceTransform<ProgressSnippetOptions> {
  return (_gerado, ctx) => progressOcupadoSnippet({ ...ctx.args, ...fixas });
}

/** Transform do `meta` — vale para todas as stories do arquivo. */
export const progressSource: SourceTransform<ProgressSnippetOptions> = (_gerado, ctx) =>
  progressSnippet(ctx.args ?? {});

/** Transform de story: mesma fábrica, opções fixas que os controls não cobrem. */
export function progressSourceWith(
  fixas: ProgressSnippetOptions,
): SourceTransform<ProgressSnippetOptions> {
  return (_gerado, ctx) => progressSnippet({ ...ctx.args, ...fixas });
}

/** Transform de story para a barra com rótulo e valor visíveis. */
export function progressSourceLabel(
  fixas: ProgressSnippetOptions,
): SourceTransform<ProgressSnippetOptions> {
  return (_gerado, ctx) => progressComRotuloSnippet({ ...ctx.args, ...fixas });
}
