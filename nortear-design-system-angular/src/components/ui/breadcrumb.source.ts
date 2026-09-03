/**
 * Transform do painel Code do Breadcrumb.
 *
 * Módulo próprio, e não função solta no arquivo de story, porque é o que põe
 * este construtor sob o `source-snippets.test.ts`: aquela guarda varre
 * `./**\/*.source.ts` por glob e CHAMA cada export para ler a saída. Construtor
 * inline é função local — nem exportada, nem alcançável —, então o que ele
 * publica ao leitor não tem portão nenhum.
 *
 * O que este snippet ensina é a estrutura semântica da trilha: `<nav>` em volta
 * de uma `<ol>`, um `<li>` por passo, e o último item como PÁGINA e não como
 * link — é ele que espelha o `<h1>`. O separador é `<li>` vazio no desenho
 * padrão, porque o chevron vem do CSS; só o desenho alternativo carrega ícone.
 */

export type BreadcrumbArgs = {
  currentPage: string;
  separator: 'chevron' | 'slash';
};

/**
 * O painel Code mostra o `template` da story como está escrito — inclusive o
 * `@if` que alterna os dois desenhos de separador. Isso é o andaime da story,
 * não o que alguém escreve para usar um Breadcrumb. O `transform` devolve o uso
 * real, com o valor atual dos controls já resolvido. Ver a nota em
 * `separator.stories.ts`.
 */
export function breadcrumbPlaygroundSource(
  _gerado?: string,
  ctx: { args?: Partial<BreadcrumbArgs> } = {},
): string {
  const { currentPage = 'Breadcrumb', separator = 'chevron' } = ctx.args ?? {};
  // O chevron é o desenho padrão: no snippet o `<li>` fica vazio, porque é isso
  // que a pessoa escreve. Só o separador customizado carrega conteúdo.
  const sep =
    separator === 'chevron'
      ? '<li ndsBreadcrumbSeparator></li>'
      : '<li ndsBreadcrumbSeparator><svg ndsBreadcrumbIcon kind="slash"></svg></li>';

  return `import {
  NdsBreadcrumb, NdsBreadcrumbList, NdsBreadcrumbItem,
  NdsBreadcrumbLink, NdsBreadcrumbPage, NdsBreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

@Component({
  imports: [
    NdsBreadcrumb, NdsBreadcrumbList, NdsBreadcrumbItem,
    NdsBreadcrumbLink, NdsBreadcrumbPage, NdsBreadcrumbSeparator,
  ],
  template: \`
    <nav ndsBreadcrumb>
      <ol ndsBreadcrumbList>
        <li ndsBreadcrumbItem>
          <a ndsBreadcrumbLink href="/">Início</a>
        </li>
        ${sep}
        <li ndsBreadcrumbItem>
          <a ndsBreadcrumbLink href="/componentes">Componentes</a>
        </li>
        ${sep}
        <li ndsBreadcrumbItem>
          <span ndsBreadcrumbPage>${currentPage}</span>
        </li>
      </ol>
    </nav>
  \`,
})
export class Exemplo {}`;
}
