/**
 * Um `page_view` por página VISTA — não por efeito executado.
 *
 * O `page_view` nasce dentro do mesmo efeito que escreve título, meta tags e
 * JSON-LD. Reescrever meta tag à toa é desperdício; disparar `page_view` à toa
 * corrompe a métrica mais básica do GA4, e em silêncio: o número sobe, ninguém
 * vê erro, e a taxa de tudo que se divide por sessão fica errada.
 *
 * Medido em 2026-09-04, no React: as docs pages passam `breadcrumb` como array
 * LITERAL, então a identidade muda a cada render e o efeito re-roda sempre. Como
 * a página re-renderiza a cada troca de seção ativa (o realce da navegação ao
 * rolar), saía um `page_view` por seção — visível no console lado a lado com
 * cada `docs_section_viewed`. Quatro renders, quatro `page_view`.
 *
 * A causa foi corrigida onde nasceu, mas a guarda fica: `page_view` é sobre uma
 * PÁGINA ter sido vista, e amarrá-lo à execução de um efeito é confundir as duas
 * coisas. Qualquer outro motivo de re-execução — em qualquer das cinco stacks,
 * cada uma com seu sistema de reatividade — voltaria a inflar o número.
 *
 * A chave é o que define "outra página": URL, título, componente e idioma.
 * Voltar para uma página já vista dispara de novo, e deve mesmo — foi uma nova
 * visita.
 */

let ultimaChave: string | null = null;

/** A página é diferente da última que disparou `page_view`? */
export function pageViewInedito(chave: string): boolean {
  if (chave === ultimaChave) return false;
  ultimaChave = chave;
  return true;
}

/** Esquece a última página. Existe para teste — nada em produção chama isto. */
export function esquecerUltimoPageView(): void {
  ultimaChave = null;
}
