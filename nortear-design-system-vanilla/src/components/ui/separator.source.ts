// Snippet do painel Code do Separator — ver `@/lib/story-source`.
//
// O renderer html imprime o `outerHTML` do que a story montou — um
// `<div class="nds-stack">` inteiro com os dois parágrafos de exemplo. É o
// andaime, não o uso: o que se copia daqui é a chamada de `createSeparator`
// entre os dois blocos que ela divide.

import { importing, montar, options, snippet, text, type SourceTransform } from '@/lib/story-source';
import type { SeparatorEmphasis, SeparatorOrientation } from './separator';

/** O que as stories usam da `SeparatorOptions`, mais os dois blocos vizinhos. */
export type SeparatorSnippetOptions = {
  orientation?: SeparatorOrientation;
  decorative?: boolean;
  emphasis?: SeparatorEmphasis;
  className?: string;
  /** Texto do bloco ANTES da linha. */
  antes?: string;
  /** Texto do bloco DEPOIS da linha. */
  depois?: string;
};

/**
 * A chamada em UMA linha.
 *
 * O separador entra no meio de um `append(…)`, e uma chamada quebrada em várias
 * linhas sairia desalinhada da lista de irmãos. São no máximo quatro opções
 * curtas — cabem.
 */
function separatorCall(o: SeparatorSnippetOptions): string {
  const pairs = options([
    // Só o que difere do padrão entra: `horizontal`, `decorative: true` e
    // `emphasis: 'default'` são o que a fábrica já assume.
    ['orientation', o.orientation === 'vertical' ? text('vertical') : undefined],
    ['decorative', o.decorative === false ? 'false' : undefined],
    ['emphasis', o.emphasis === 'strong' ? text('strong') : undefined],
    ['className', o.className ? text(o.className) : undefined],
  ])
    .map((line) => line.replace(/,$/, ''))
    .join(', ');
  return pairs ? `createSeparator({ ${pairs} })` : 'createSeparator()';
}

/** Um parágrafo de exemplo, que é o que a linha separa. */
function block(variavel: string, content: string): string {
  return `const ${variavel} = document.createElement('p');
${variavel}.className = 'nds-text-body';
${variavel}.textContent = ${text(content)};`;
}

/**
 * A chamada real de `createSeparator` entre os dois blocos que ela divide.
 *
 * O contêiner faz parte do uso, não do andaime: na horizontal a linha ocupa a
 * largura do bloco pai, e na vertical a altura vem da linha do flex — fora de um
 * contêiner flex ou de grade o separador vertical colapsa para zero e continua
 * no DOM com o atributo certo.
 */
export function separatorSnippet(o: SeparatorSnippetOptions = {}): string {
  const vertical = o.orientation === 'vertical';
  const first = vertical ? 'esquerda' : 'topo';
  const segundo = vertical ? 'direita' : 'base';

  const container = vertical
    ? `const secao = document.createElement('div');
// Contêiner flex: é dele que a linha vertical tira a altura.
secao.className = 'nds-cluster nds-max-w-md';
secao.dataset.spacing = 'md';`
    : `const secao = document.createElement('div');
secao.className = 'nds-stack nds-max-w-md';
secao.dataset.spacing = 'md';`;

  return snippet(
    importing('separator', 'createSeparator'),
    container,
    block(first, o.antes ?? (vertical ? 'Item A' : 'Seção superior')),
    block(segundo, o.depois ?? (vertical ? 'Item B' : 'Seção inferior')),
    `secao.append(${first}, ${separatorCall(o)}, ${segundo});`,
    montar('secao'),
  );
}

/**
 * A linha dentro de um Card, separando o cabeçalho do conteúdo.
 *
 * Forma própria porque as sub-fábricas do Card SÃO o assunto da composição: o
 * separador é irmão do cabeçalho e do conteúdo, e é essa vizinhança que faz a
 * linha respeitar a caixa do cartão.
 */
export function separatorEmCardSnippet(o: SeparatorSnippetOptions = {}): string {
  return snippet(
    [
      importing('separator', 'createSeparator'),
      importing(
        'card',
        'createCard',
        'createCardContent',
        'createCardDescription',
        'createCardHeader',
        'createCardTitle',
      ),
    ].join('\n'),
    `const cabecalho = createCardHeader();
cabecalho.append(
  createCardTitle({ text: ${text(o.antes ?? 'Resumo do pedido')} }),
  createCardDescription({ text: '3 itens, entrega em 5 dias úteis.' }),
);`,
    `const conteudo = createCardContent();
conteudo.textContent = ${text(o.depois ?? 'Total: R$ 249,90')};`,
    `const cartao = createCard({ class: 'nds-max-w-md' });
cartao.append(cabecalho, ${separatorCall(o)}, conteudo);`,
    montar('cartao'),
  );
}

/**
 * Transform do `meta` — vale para todas as stories do arquivo. Lê os controls
 * do Playground; nas stories sem args cai nos padrões da fábrica, que é o uso
 * canônico do componente.
 */
export const separatorSource: SourceTransform<SeparatorSnippetOptions> = (_gerado, ctx) =>
  separatorSnippet(ctx.args ?? {});

/** Transform de story: mesma fábrica, opções fixas que os controls não cobrem. */
export function separatorSourceWith(
  fixas: SeparatorSnippetOptions,
): SourceTransform<SeparatorSnippetOptions> {
  return (_gerado, ctx) => separatorSnippet({ ...ctx.args, ...fixas });
}

/** Transform de story para a linha dentro de um Card. */
export function separatorEmCardSource(
  fixas: SeparatorSnippetOptions = {},
): SourceTransform<SeparatorSnippetOptions> {
  return (_gerado, ctx) => separatorEmCardSnippet({ ...ctx.args, ...fixas });
}
