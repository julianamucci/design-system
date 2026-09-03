/**
 * Sonda de comparação das DOCS PAGES entre as cinco stacks.
 *
 * Existe porque o vão estava aberto e foi a dona quem o viu: a `/quality` revisa
 * docs page — oito verificações no Passo 3, mais o contrato que roda no
 * `docs-smoke` —, mas quase todas perguntam "esta página está correta?", e
 * nenhuma pergunta "as cinco mostram a mesma coisa?". A única comparação
 * cross-stack de docs page que existia era a tabela de tokens.
 *
 * ─── Por que LER O FONTE não responde ────────────────────────────────────────
 *
 * Foi a primeira coisa tentada, e as duas medições saíram ARTEFATO:
 *
 *  · contar `data-docs-preview` no fonte deu ZERO nas cinco, porque a âncora
 *    vem dos containers compartilhados (`DocsVariants`, `DocsDoDont`) e não da
 *    página;
 *  · contar `trackId:` deu 8/8/8/8/2 no sheet, porque o Angular gera os cartões
 *    com `.map()` sobre uma lista e as outras quatro os escrevem um a um — oito
 *    cartões nos cinco casos.
 *
 * As cinco montam a MESMA página de formas diferentes. Só o DOM renderizado diz
 * a verdade, e é por isso que isto é sonda de navegador e não varredura.
 *
 * ─── Os seletores saem do DOM REAL, e a primeira versão errou todos ──────────
 *
 * Escrevi este colhedor por suposição antes de abrir o `DocsVariants`, e cada
 * suposição estava errada: o cartão é um `Card` (`[data-slot="card"]`), e não um
 * `<article>`; o título do cartão é um `<p>` semibold, e não um `<h3>`; e o
 * `data-track-id` não fica no cartão — fica no BOTÃO de copiar, no formato
 * `{slug}:code:{trackId ?? name}`. Sonda com seletor suposto devolve `null` em
 * tudo e vira relatório de divergência que não existe.
 *
 * ─── Três armadilhas, todas tropeçadas de verdade nesta casa ─────────────────
 *
 *  1. `console.log` NÃO chega ao terminal — o addon do Storybook instrumenta o
 *     console dentro da `play`. O canal que funciona é a exceção, e é por isso
 *     que `reportar()` lança em vez de imprimir.
 *  2. Atributo de presença casa valor `"false"`: `[data-x]` casa
 *     `data-x="false"`, que algumas libs emitem em todo elemento.
 *  3. Divergência de NOME entre stacks faz o seletor não casar e o campo voltar
 *     vazio — e isso É o achado, não falha da medição. Por isso os ids de seção
 *     são colhidos como estão, sem lista fechada: se uma stack chamar a seção de
 *     `variants` em vez de `variantes`, a diferença aparece no diff.
 */

export interface CartaoMedido {
  /** O que a leitora vê como título do cartão. */
  nome: string;
  /**
   * O sufixo estável do `data-track-id` do botão de copiar.
   *
   * O valor cheio é `{slug}:code:{trackId ?? name}` — guardo só a última parte,
   * que é o que vira `snippet_id` no `docs_code_copy`. Nome traduzido ou
   * diferente por stack faz o MESMO evento chegar ao GA4 com valores distintos,
   * então ele entra ao lado do nome visível e não no lugar dele.
   */
  trackId: string | null;
  /** O cartão traz bloco de código? */
  temCodigo: boolean;
}

export interface DocsPageMedida {
  slug: string;
  /** Âncoras de seção, na ordem — é o índice da página. */
  secoes: string[];
  /** Texto dos `<h2>`, na ordem: é por eles que a leitora se acha. */
  titulos: string[];
  variantes: CartaoMedido[];
  composicoes: CartaoMedido[];
  /** Contêineres de exemplo que o contrato de docs page ancora. */
  previews: number;
  linhasProps: number;
  linhasTokens: number;
  blocosDeCodigo: number;
}

const texto = (el: Element | null | undefined): string =>
  (el?.textContent ?? '').trim().replace(/\s+/g, ' ');

/**
 * Os cartões de uma seção, medidos pelo que o `DocsVariants` de fato monta.
 *
 * O cartão é `[data-slot="card"]`; o nome é o primeiro parágrafo semibold dele;
 * o identificador está no botão de copiar. Onde uma stack montar diferente, o
 * campo vem vazio — e é isso que o diff tem de mostrar.
 */
function medirCartoes(secao: Element | null): CartaoMedido[] {
  if (!secao) return [];
  // Cartão da SEÇÃO, e não cartão dentro de preview.
  //
  // A primeira versão varria `[data-slot="card"]` solto, e qualquer preview que
  // usasse Card inflava a conta: o tooltip declara três composições e a sonda
  // devolveu quatro, por um `Card` aninhado no preview de `metricDescription`.
  // Como o preview vem do conteúdo compartilhado, as cinco inflavam IGUAL — o
  // número ficava consistentemente errado em vez de divergente, que é o modo
  // mais difícil de perceber.
  const diretos = Array.from(secao.querySelectorAll<HTMLElement>('[data-slot="card"]')).filter(
    (c) => !c.parentElement?.closest('[data-slot="card"]'),
  );
  return diretos.map((c) => ({
    // `:is(h3,p)` porque as cinco DIVERGEM aqui, e a divergência é o achado:
    // vanilla e angular montam o título como `<h3>`, react, vue e svelte como
    // `<p>` semibold — mesmas classes, tag diferente.
    //
    // E o fallback antigo (`?? querySelector('p')`) era pior que erro nenhum:
    // onde o `<h3>` não casava, ele pegava o parágrafo de DESCRIÇÃO e devolvia
    // o campo preenchido com a coisa errada. Campo errado parece medição; campo
    // vazio se investiga. Sem fallback.
    nome: texto(c.querySelector(':is(h3,p).nds-font-semibold')),
    trackId: (c.querySelector('[data-track-id]')?.getAttribute('data-track-id') ?? '')
      .split(':code:')
      .slice(1)
      .join(':code:') || null,
    temCodigo: Boolean(c.querySelector('pre')),
  }));
}

/** Colhe o que a docs page RENDERIZOU. Quem monta a página é a story da stack. */
export function medirDocsPage(raiz: ParentNode, slug: string): DocsPageMedida {
  const secoes = Array.from(raiz.querySelectorAll('section[id]')).map((s) => s.id);
  const titulos = Array.from(raiz.querySelectorAll('h2')).map((h) => texto(h));
  const secaoDe = (id: string) => raiz.querySelector<HTMLElement>(`section#${id}`);
  const linhasDe = (id: string) => secaoDe(id)?.querySelectorAll('tbody tr').length ?? 0;

  return {
    slug,
    secoes,
    titulos,
    variantes: medirCartoes(secaoDe('variantes')),
    composicoes: medirCartoes(secaoDe('composicoes')),
    // `:not([…="false"])` pela armadilha 2: presença não é valor.
    previews: raiz.querySelectorAll('[data-docs-preview]:not([data-docs-preview="false"])').length,
    linhasProps: linhasDe('propriedades'),
    linhasTokens: linhasDe('tokens'),
    blocosDeCodigo: raiz.querySelectorAll('pre').length,
  };
}

/**
 * O canal de saída — LANÇA, e não imprime.
 *
 * Ver armadilha 1: dentro da `play` o console é instrumentado e nada dele chega
 * ao terminal. Quem lê a sonda faz `grep` por `SONDA::` na saída da suíte.
 */
export function reportar(stack: string, medida: DocsPageMedida): never {
  throw new Error(`SONDA::${stack}::${medida.slug}::${JSON.stringify(medida)}`);
}
