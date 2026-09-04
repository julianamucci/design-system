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
