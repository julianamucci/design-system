/**
 * Duas funções porque as docs pages têm dois tipos de destino, e confundi-los
 * quebra de formas opostas.
 *
 * Os containers de seção se dividem assim:
 *
 *   - **renderizam HTML sanitizado** — DocsAnatomy, DocsAccessibility (resumo,
 *     itens, contraste), DocsNotes, DocsVariants, DocsCompositions,
 *     DocsWhenToUse (guidelines/do/dont), DocsProps (extensibilidade).
 *   - **escrevem textNode** — DocsTestes, a tabela do DocsProps, o DocsTokens,
 *     o DocsStates, as linhas de teclado do DocsAccessibility e os cenários e a
 *     tabela de UX writing do DocsWhenToUse.
 *
 * O `translations.json` é o MESMO para os dois, então guarda `<button>` como
 * `&lt;button&gt;`.
 *
 * `toPlainText` decodifica as entidades — é o que a tabela de testes precisa,
 * senão ela mostra "Elemento &lt;button&gt; nativo presente".
 *
 * `stripHtml` NÃO decodifica, de propósito. Decodificar antes de um destino que
 * renderiza HTML transforma o texto em markup vivo: `&lt;img&gt;` vira um
 * `<img>` de verdade, sem `alt`, e o axe reprova a página. Foi o que aconteceu
 * no Avatar e no Card quando as duas funções eram uma só.
 *
 * Nenhuma das duas é sanitizador. Para HTML dinâmico use `DOMPurify.sanitize()`
 * direto no call site (ver guideline 09-seguranca-xss).
 */

/** Tira as tags e preserva as entidades. Para destino que renderiza HTML. */
export function stripHtml(html: string | null | undefined): string {
  return String(html ?? "").replace(/<[^>]*>/g, "");
}

/**
 * Tira as tags E decodifica as entidades. Para destino que escreve textNode.
 *
 * `&amp;` por último: decodificado antes, `&amp;lt;` viraria `<` em vez de
 * `&lt;`.
 */
export function toPlainText(html: string | null | undefined): string {
  return stripHtml(html)
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&");
}
