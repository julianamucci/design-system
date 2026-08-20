/**
 * Transforms do painel Code do ScrollArea.
 *
 * Módulo de TS puro, sem import de `.svelte`: é o que deixa as funções rodarem
 * no projeto `unit` do vitest. O painel monta o snippet a partir do nome
 * interno do componente compilado, e sem estas funções ele mostrava o andaime
 * da story — que ninguém pode importar.
 */
import { attrs, svelteSnippet } from '@/lib/story-source';

export type ScrollAreaArgs = {
  orientation: 'vertical' | 'horizontal' | 'both';
  type: 'auto' | 'always' | 'scroll' | 'hover';
  scrollHideDelay: number;
};

/** Degrau da escada de janela (`--box-height-*`). Sem teto não há transbordo. */
type Tamanho = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

const IMPORT = `import { ScrollArea } from "@/components/ui/scroll-area";`;

type Opcoes = {
  type?: ScrollAreaArgs['type'];
  scrollHideDelay?: number;
  /** `undefined` reproduz o caso sem teto: o conteúdo expande e nada rola. */
  size?: Tamanho;
  itens?: number;
  classe?: string;
};

/**
 * Atributos do ScrollArea. `orientation` sai sempre explícita — é o assunto do
 * componente —, e o resto só quando difere do padrão (`type` = hover,
 * `scrollHideDelay` = 600).
 */
function props(orientation: ScrollAreaArgs['orientation'], o: Opcoes): string {
  const { type = 'hover', scrollHideDelay = 600, size, classe } = o;
  return attrs(
    `orientation="${orientation}"`,
    type === 'hover' ? '' : `type="${type}"`,
    scrollHideDelay === 600 ? '' : `scrollHideDelay={${scrollHideDelay}}`,
    size ? `size="${size}"` : '',
    classe ? `class="${classe}"` : '',
  );
}

/** Lista longa que transborda na vertical — a forma canônica do componente. */
function listaVertical(o: Opcoes): string {
  const itens = o.itens ?? 30;
  return svelteSnippet(
    `${IMPORT}

const tags = Array.from({ length: ${itens} }, (_, i) => \`Tag \${i + 1}\`);`,
    `<ScrollArea${props('vertical', o)}>
  <div class="nds-p-4">
    {#each tags as tag (tag)}
      <div class="nds-text-body nds-border-b nds-last-border-0 nds-pb-2">{tag}</div>
    {/each}
  </div>
</ScrollArea>`,
  );
}

/** Faixa de cards mais larga que a janela — transbordo no eixo horizontal. */
function faixaHorizontal(o: Opcoes): string {
  const itens = o.itens ?? 10;
  return svelteSnippet(
    `${IMPORT}

const cards = Array.from({ length: ${itens} }, (_, i) => \`Card \${i + 1}\`);`,
    `<ScrollArea${props('horizontal', { ...o, classe: 'nds-whitespace-nowrap' })}>
  <!-- A faixa precisa ser mais larga que a janela: sem transbordo não há barra. -->
  <div class="nds-row nds-p-4" data-spacing="md" style="width: max-content">
    {#each cards as card (card)}
      <div class="nds-shrink-0 nds-w-xs nds-p-4 nds-rounded-md nds-bg-muted nds-text-body">
        {card}
      </div>
    {/each}
  </div>
</ScrollArea>`,
  );
}

/** Matriz que transborda nos dois eixos — o caso de tabela ampla. */
function tabelaBidirecional(o: Opcoes & { linhas?: number; colunas?: number }): string {
  const linhas = o.linhas ?? 12;
  const colunas = o.colunas ?? 12;
  return svelteSnippet(
    `${IMPORT}

const linhas = Array.from({ length: ${linhas} }, (_, i) => i + 1);
const colunas = Array.from({ length: ${colunas} }, (_, i) => i + 1);`,
    `<ScrollArea${props('both', o)}>
  <table class="nds-border-collapse nds-text-caption" style="width: max-content">
    <tbody>
      {#each linhas as linha (linha)}
        <tr>
          {#each colunas as coluna (coluna)}
            <td class="nds-border-default nds-py-2 nds-px-2 nds-whitespace-nowrap">
              R{linha}·C{coluna}
            </td>
          {/each}
        </tr>
      {/each}
    </tbody>
  </table>
</ScrollArea>`,
  );
}

/** Lista de links dentro da área rolável — navegação de sidebar. */
function listaDeLinks(o: Opcoes & { rotulo: string; nav: string }): string {
  const itens = o.itens ?? 40;
  return svelteSnippet(
    `${IMPORT}

const itens = Array.from({ length: ${itens} }, (_, i) => i + 1);`,
    `<ScrollArea${props('vertical', o)}>
  <nav aria-label="${o.nav}" class="nds-p-4">
    <ul class="nds-stack nds-list-none nds-p-0 nds-m-0" data-spacing="xs">
      {#each itens as n (n)}
        <li>
          <a href="#secao-{n}" class="nds-block nds-rounded-sm nds-px-2 nds-py-1 nds-text-body nds-hover-bg-muted-soft">
            ${o.rotulo} {n}
          </a>
        </li>
      {/each}
    </ul>
  </nav>
</ScrollArea>`,
  );
}

/**
 * Playground: acompanha os controls de orientação, momento da barra e atraso
 * para escondê-la. O conteúdo troca junto, porque o eixo que rola é o eixo que
 * transborda — orientação sem conteúdo transbordando não mostra nada.
 */
export function scrollAreaSource(
  _gerado?: string,
  ctx?: { args?: Partial<ScrollAreaArgs> },
): string {
  const { orientation = 'vertical', type = 'always', scrollHideDelay = 600 } = ctx?.args ?? {};
  const base = { type, scrollHideDelay, size: 'xl' as Tamanho };
  if (orientation === 'horizontal') return faixaHorizontal({ ...base, size: 'md', itens: 10 });
  if (orientation === 'both') return tabelaBidirecional({ ...base, size: 'lg' });
  return listaVertical(base);
}

/** Variante vertical: lista longa dentro de uma janela de altura fixa. */
export function scrollAreaVerticalSource(): string {
  return listaVertical({ type: 'always', size: 'xl', itens: 30 });
}

/** Variante horizontal (também a galeria de cards das composições). */
export function scrollAreaHorizontalSource(): string {
  return faixaHorizontal({ type: 'always', size: 'md', itens: 10 });
}

/** Variante bidirecional: matriz que transborda na largura e na altura. */
export function scrollAreaBothSource(): string {
  return tabelaBidirecional({ type: 'always', size: 'lg' });
}

/** Estado ocioso: com o padrão de `type`, a barra só aparece sob o ponteiro. */
export function scrollAreaOciosoSource(): string {
  return listaVertical({ size: 'lg', itens: 20 });
}

/**
 * Barra sempre montada — também o estado de foco, cuja lição (o viewport entra
 * na ordem de tabulação) já vem do componente, sem prop nenhuma.
 */
export function scrollAreaSempreVisivelSource(): string {
  return listaVertical({ type: 'always', size: 'lg', itens: 20 });
}

/** Barra durante a rolagem, com atraso próprio para ela sumir depois. */
export function scrollAreaDuranteRolagemSource(): string {
  return listaVertical({ type: 'scroll', scrollHideDelay: 1000, size: 'lg', itens: 20 });
}

/** Conteúdo focável dentro da área: rolar por teclado e agir por teclado convivem. */
export function scrollAreaConteudoFocavelSource(): string {
  return listaDeLinks({
    type: 'always',
    size: 'lg',
    itens: 20,
    rotulo: 'Ação',
    nav: 'Ações',
  });
}

/**
 * Erro de uso: sem degrau de altura não há teto, sem teto não há transbordo e
 * sem transbordo não há rolagem — o componente aparenta estar quebrado.
 */
export function scrollAreaSemTetoSource(): string {
  return listaVertical({ type: 'always', itens: 20 });
}

/** Composição: lista de navegação numa barra lateral. */
export function scrollAreaListaEmSidebarSource(): string {
  return listaDeLinks({
    size: 'xl',
    itens: 40,
    rotulo: 'Item',
    nav: 'Seções da documentação',
  });
}

/** Composição: tabela ampla, com as duas barras e a janela mais alta. */
export function scrollAreaTabelaAmplaSource(): string {
  return tabelaBidirecional({ type: 'always', size: 'xl', linhas: 15, colunas: 15 });
}
