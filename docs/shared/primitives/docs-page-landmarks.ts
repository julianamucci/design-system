/**
 * Ids dos marcos de página que as docs pages amarram entre si.
 *
 * Existe um só valor aqui, e ele já vinha escrito em cinco lugares. React,
 * Vanilla e Angular declaravam cada um o seu `export const`; Vue e Svelte
 * repetiam a string crua no header, no layout, no renderizador de fundamentos e
 * em duas docs pages — cinco pontos por stack, mantidos à mão.
 *
 * O que torna essa duplicação pior que o normal é o tipo de defeito que ela
 * produz. O `<main>` do `DocsPageLayout` aponta para o `<h1>` por
 * `aria-labelledby`. Se as duas pontas divergirem, nada quebra: a página
 * renderiza igual, nenhum teste de layout reclama, nenhum tipo reprova. O que
 * some é o anúncio — o leitor de tela diz "principal" e para aí, sem dizer de
 * que página, exatamente para quem depende dele para saber onde está.
 *
 * Por isso o valor mora aqui e não em cada stack: um marco que só existe se as
 * duas pontas concordarem não pode ter cinco donos.
 */

/**
 * Id do `<h1>` da docs page, referenciado pelo `aria-labelledby` do `<main>`.
 *
 * A docs page é única por iframe, então não há risco de colisão de id — cada
 * story roda no seu próprio documento.
 */
export const DOCS_PAGE_TITLE_ID = 'docs-page-title';

/**
 * Id da seção → chave do rótulo no `ui.json`.
 *
 * O `h2` de uma seção e o item de menu que salta para ela são **a mesma frase**,
 * e essa é a razão de o mapa existir: enquanto os dois eram escritos em lugares
 * diferentes, o leitor clicava em "Estados" e chegava num cabeçalho escrito
 * "Configurações". Nada reprovava — o âncora resolvia, a página renderizava, e
 * só quem lia as duas coisas no mesmo movimento percebia.
 *
 * Medido em 2026-09-12: **900 dos 3375 títulos de seção** diziam palavra
 * diferente da do menu, nos três idiomas. A maior parte era deriva de escrita
 * ("Design Tokens" contra "Tokens", "Critérios de Teste" contra "Testes"), e
 * 65 eram renomeação por componente ("Tipos de Gráfico" no lugar de
 * "Variantes").
 *
 * Com o mapa, o container de seção deriva o próprio título do id que ele já
 * declara — a divergência deixa de ser possível em vez de passar a ser
 * proibida. Id que não estiver aqui não tem título, e é o portão
 * `titulo_de_secao_sem_rotulo` que cobra.
 *
 * `exemplos` está no mapa sem uso hoje: o `ui.json` declara `nav.examples`, e
 * seção que nasça com esse id já encontra o rótulo pronto.
 */
export const CHAVE_DE_ROTULO_POR_SECAO: Readonly<Record<string, string>> = Object.freeze({
  demonstracao: 'nav.demonstration',
  anatomia: 'nav.anatomy',
  'quando-usar': 'nav.usage',
  'do-dont': 'nav.doDont',
  importacao: 'nav.import',
  exemplos: 'nav.examples',
  variantes: 'nav.variants',
  tamanhos: 'nav.sizes',
  composicoes: 'nav.compositions',
  estados: 'nav.states',
  propriedades: 'nav.props',
  tokens: 'nav.tokens',
  acessibilidade: 'nav.accessibility',
  relacionados: 'nav.related',
  notas: 'nav.notes',
  analytics: 'nav.analytics',
  testes: 'nav.testes',
});

/**
 * A chave de rótulo de uma seção, ou `undefined` para id desconhecido.
 *
 * Devolver `undefined` é deliberado: o container mostra o id cru, que aparece na
 * tela e cobra correção, em vez de cair num rótulo genérico que esconderia a
 * seção nova atrás de uma palavra errada.
 */
export function chaveDeRotuloDaSecao(id: string): string | undefined {
  return CHAVE_DE_ROTULO_POR_SECAO[id];
}
