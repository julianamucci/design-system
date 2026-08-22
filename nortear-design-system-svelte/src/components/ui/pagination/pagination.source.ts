/**
 * Transforms do painel Code do Pagination.
 *
 * Módulo de TS puro, sem import de `.svelte`: é o que deixa as funções
 * rodarem no projeto `unit` do vitest. A saída do painel não chega ao DOM
 * durante a `play`, então este é o único lugar em que elas têm guarda.
 *
 * O `rotulo` das stories não vira `aria-label` no snippet: ele existe para dar
 * um nome DIFERENTE a cada landmark da mesma página de docs (sem isso o axe
 * acusa `landmark-unique`), e o nome padrão do primitivo já é "Paginação".
 * Copiar "Paginação com link inativo" para dentro de um projeto ensinaria o
 * andaime da story, não o componente.
 */
import { attrs, svelteSnippet } from '@/lib/story-source';

export type PaginationArgs = {
  count: number;
  perPage: number;
  page: number;
  siblingCount: number;
  demonstration: 'simples' | 'directional' | 'controlada' | 'tabela';
};

const IMPORT_RANGE = `import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";`;

const IMPORT_DIRECIONAL = `import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";`;

/**
 * Atributos da raiz. Só o que difere do padrão do primitivo entra —
 * `perPage` é 10, `page` é 1 e `siblingCount` é 1 sem que ninguém escreva.
 * `count` fica sempre: o padrão dele é 0, que não pagina nada.
 */
function rootProps(
  args: Pick<PaginationArgs, 'count' | 'perPage' | 'page' | 'siblingCount'>,
  ...extras: string[]
): string {
  return attrs(
    `count={${args.count}}`,
    args.perPage === 10 ? '' : `perPage={${args.perPage}}`,
    args.page === 1 ? '' : `page={${args.page}}`,
    args.siblingCount === 1 ? '' : `siblingCount={${args.siblingCount}}`,
    ...extras,
  );
}

/**
 * A fila de números com as reticências no lugar dos saltos — o miolo que as
 * três composições numeradas repetem, com a indentação de cada uma.
 */
function fila(indentacao: string, active: string, onClick = ''): string {
  const i = indentacao;
  const abertura = onClick
    ? `${i}      <PaginationLink
${i}        page={p}
${i}        isActive={${active} === p.value}
${i}        ${onClick}
${i}      >`
    : `${i}      <PaginationLink page={p} isActive={${active} === p.value}>`;

  return `${i}{#each pages as p (p.key)}
${i}  <PaginationItem>
${i}    {#if p.type === "ellipsis"}
${i}      <PaginationEllipsis />
${i}    {:else}
${abertura}
${i}        {p.value}
${i}      </PaginationLink>
${i}    {/if}
${i}  </PaginationItem>
${i}{/each}`;
}

/** Faixa completa: direcionais nas pontas e os números no meio. */
function simpleMarkup(props: string): string {
  return `<Pagination${props}>
  {#snippet children({ pages, currentPage })}
    <PaginationContent>
      <PaginationItem>
        <PaginationPrevious />
      </PaginationItem>
${fila('      ', 'currentPage')}
      <PaginationItem>
        <PaginationNext />
      </PaginationItem>
    </PaginationContent>
  {/snippet}
</Pagination>`;
}

/** Só os controles de direção: sem números, o snippet dispensa o snippet `children`. */
function markupDirecional(props: string): string {
  return `<Pagination${props}>
  <PaginationContent>
    <PaginationItem>
      <PaginationPrevious />
    </PaginationItem>
    <PaginationItem>
      <PaginationNext />
    </PaginationItem>
  </PaginationContent>
</Pagination>`;
}

/** Estado da página atual do lado de quem consome, por `bind:page`. */
function markupControlada(args: PaginationArgs): string {
  const props = attrs(
    'count={TOTAL}',
    'perPage={POR_PAGINA}',
    'bind:page={paginaAtual}',
    args.siblingCount === 1 ? '' : `siblingCount={${args.siblingCount}}`,
  );

  return `<div class="nds-stack" data-spacing="sm">
  <p class="nds-text-body nds-text-muted-foreground">
    Página {paginaAtual} de {totalPaginas}
  </p>
  <Pagination${props}>
    {#snippet children({ pages })}
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            onclick={() => (paginaAtual = Math.max(1, paginaAtual - 1))}
          />
        </PaginationItem>
${fila('        ', 'paginaAtual', 'onclick={() => (paginaAtual = p.value)}')}
        <PaginationItem>
          <PaginationNext
            onclick={() => (paginaAtual = Math.min(totalPaginas, paginaAtual + 1))}
          />
        </PaginationItem>
      </PaginationContent>
    {/snippet}
  </Pagination>
</div>`;
}

/** Rodapé de tabela: contador à esquerda e a faixa encostada à direita. */
function markupTable(args: PaginationArgs): string {
  const props = rootProps(args, 'data-align="end"');
  const primeiro = (args.page - 1) * args.perPage + 1;
  const last = args.page * args.perPage;

  return `<div
  class="nds-cluster nds-w-prose nds-border-default nds-rounded-lg nds-p-4"
  data-spacing="sm"
  data-align="center"
  data-justify="between"
>
  <span class="nds-text-body nds-text-muted-foreground">
    Mostrando ${primeiro}–${last} de ${args.count} resultados
  </span>
  <Pagination${props}>
    {#snippet children({ pages, currentPage })}
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious />
        </PaginationItem>
${fila('        ', 'currentPage')}
        <PaginationItem>
          <PaginationNext />
        </PaginationItem>
      </PaginationContent>
    {/snippet}
  </Pagination>
</div>`;
}

/**
 * Transform do meta — serve o Playground e, por cascata, toda story destes
 * arquivos. A composição sai do control `demonstration`, que é o mesmo arg
 * que troca a marcação na tela: ler o arg é o que mantém painel e demonstração
 * dizendo a mesma coisa.
 */
export function paginationSource(
  _gerado?: string,
  ctx?: { args?: Partial<PaginationArgs> },
): string {
  const {
    count = 50,
    perPage = 10,
    page = 1,
    siblingCount = 2,
    demonstration = 'simples',
  } = ctx?.args ?? {};
  const args: PaginationArgs = { count, perPage, page, siblingCount, demonstration };

  if (demonstration === 'directional') {
    return svelteSnippet(IMPORT_DIRECIONAL, markupDirecional(rootProps(args)));
  }

  if (demonstration === 'controlada') {
    return svelteSnippet(
      `${IMPORT_RANGE}

const TOTAL = ${count};
const POR_PAGINA = ${perPage};
const totalPaginas = Math.ceil(TOTAL / POR_PAGINA);

let paginaAtual = $state(${page});`,
      markupControlada(args),
    );
  }

  if (demonstration === 'tabela') {
    return svelteSnippet(IMPORT_RANGE, markupTable(args));
  }

  return svelteSnippet(IMPORT_RANGE, simpleMarkup(rootProps(args)));
}
