// Snippet do painel Code do Progress — ver `@/lib/story-source`.

import {
  chamada,
  importing,
  montar,
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
};

/** Uma barra de uma lista, na forma com várias barras empilhadas. */
export type ProgressSnippetItem = {
  value: number;
  variant?: ProgressVariant;
  'aria-label': string;
};

const LABEL_DEFAULT = 'Progresso do upload';

/**
 * Reindenta as linhas seguintes de um bloco já montado.
 *
 * `chamada()` recua os próprios pares em dois espaços, medida certa para uma
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

/** As opções da fábrica. Só o que difere do padrão entra. */
function linhasDaBarra(o: ProgressSnippetOptions): string[] {
  const indeterminado = o.value === null;
  return options([
    ['value', indeterminado ? 'null' : String(o.value ?? 42)],
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
    o.value === null ? NOTA_INDETERMINADO : undefined,
    `const barra = ${chamada('createProgress', linhasDaBarra(o))};`,
    montar('barra'),
  );
}

/**
 * Barra com rótulo e valor visíveis.
 *
 * A fábrica desta stack não expõe partes de rótulo e valor: eles são compostos
 * acima da barra com as classes do design system, e o valor vive numa região
 * `polite` — `assertive` interromperia quem escuta a cada avanço.
 */
export function progressComRotuloSnippet(o: ProgressSnippetOptions = {}): string {
  const label = o.label ?? 'Enviando arquivo';
  const anunciado = o.valueText ?? `${o.value ?? 42}%`;

  return snippet(
    importing('progress', 'createProgress'),
    `const bloco = document.createElement('div');
bloco.className = 'nds-stack nds-w-md';
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

linha.append(nome, valor);`,
    `bloco.append(linha, ${chamada('createProgress', linhasDaBarra(o))});`,
    montar('bloco'),
  );
}

/** Uma lista de barras — a forma das stories que mostram várias de uma vez. */
export function progressListaSnippet(items: ProgressSnippetItem[]): string {
  const calls = items.map(
    (i) =>
      `  ${recuar(
        chamada(
          'createProgress',
          options([
            ['value', String(i.value)],
            ['variant', i.variant ? text(i.variant) : undefined],
            ['aria-label', text(i['aria-label'])],
          ]),
        ),
        '  ',
      )},`,
  );

  return snippet(
    importing('progress', 'createProgress'),
    `const lista = document.createElement('div');
lista.className = 'nds-stack nds-w-md';
lista.dataset.spacing = 'md';

// Um nome acessível DISTINTO por barra: quatro "Progresso do upload" numa
// lista são quatro controles indistinguíveis para quem só ouve.
lista.append(
${calls.join('\n')}
);`,
    montar('lista'),
  );
}

/** Transform de story para a lista de barras. */
export function progressSourceLista(items: ProgressSnippetItem[]): SourceTransform<ProgressSnippetOptions> {
  return () => progressListaSnippet(items);
}

/**
 * Barra que avança.
 *
 * A fábrica desenha um valor, não uma animação: quem faz a barra andar reescreve
 * `aria-valuenow` e a MESMA custom property que a fábrica alimenta. Escrever
 * `width` ou `transform` no lugar dela passaria por cima da folha compartilhada.
 */
export function progressAnimadoSnippet(o: ProgressSnippetOptions = {}): string {
  return snippet(
    importing('progress', 'createProgress'),
    `const barra = ${chamada('createProgress', linhasDaBarra({ ...o, value: o.value ?? 0 }))};
const indicador = barra.querySelector('[data-slot="progress-indicator"]');

function avancar(pct) {
  barra.setAttribute('aria-valuenow', String(pct));
  // A mesma custom property que a fábrica alimenta. \`width\` ou \`transform\`
  // aqui sobrescreveriam a regra do design system.
  indicador?.style.setProperty('--value', String(pct));
}`,
    montar('barra'),
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
  return snippet(
    importing('progress', 'createProgress'),
    `const cartao = document.createElement('div');
cartao.setAttribute('role', 'status');
// Enquanto a operação corre. Quem termina a operação apaga o atributo.
cartao.setAttribute('aria-busy', 'true');
cartao.className = 'nds-stack nds-w-md nds-p-4 nds-rounded-lg nds-border-default nds-bg-card nds-text-card-foreground';
cartao.dataset.spacing = 'sm';

const titulo = document.createElement('div');
titulo.className = 'nds-text-body nds-font-medium';
titulo.textContent = ${text(o.label ?? 'Processando relatório')};`,
    `cartao.append(titulo, ${chamada('createProgress', linhasDaBarra(o))});`,
    montar('cartao'),
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
