/**
 * Transforms do painel Code do Pagination.
 *
 * Módulo de TS puro, sem import de `.vue`: é o que deixa as funções rodarem no
 * projeto `unit` do vitest. A saída do painel não chega ao DOM durante a `play`,
 * então este é o único lugar em que elas têm guarda.
 *
 * Duas ausências deliberadas nos snippets:
 *
 *   · o `aria-label` das stories ("Paginação em repouso", "Paginação sob o
 *     ponteiro") é nome de STORY, e existe para o axe não acusar
 *     `landmark-unique` com várias faixas na mesma docs page. O componente já
 *     entrega "Paginação" sozinho — repetir isso no snippet ensinaria ruído.
 *     Onde o nome descreve um contexto de verdade, ele fica;
 *   · o espião que conta os cliques. Onde a story mede, o snippet navega.
 */
import { attr, attrs, vueSnippet, type SourceTransform } from '@/lib/story-source';

export type PaginationArgs = {
  total: number;
  itemsPerPage: number;
  defaultPage: number;
  textoAnterior: string;
  textoProxima: string;
};

/** Rótulos que os controles direcionais já trazem de fábrica. */
const TEXTO_ANTERIOR = 'Anterior';
const TEXTO_PROXIMA = 'Próxima';

/** Import do design system, uma peça por linha e em ordem alfabética. */
function importa(...pecas: string[]): string {
  const lista = [...new Set(pecas)].sort();
  return `import {\n${lista.map((peca) => `  ${peca},`).join('\n')}\n} from '@/components/ui/pagination'`;
}

/** Número de control, com o padrão de volta quando o control não trouxe um. */
function numero(valor: unknown, padrao: number): number {
  return typeof valor === 'number' && Number.isFinite(valor) && valor > 0 ? valor : padrao;
}

/**
 * Link numerado.
 *
 * `href` é obrigatório na prática: sem ele a âncora não ganha papel de link,
 * não entra na ordem de tabulação e o Enter não a alcança — a faixa numerada
 * inteira ficaria fora do teclado.
 *
 * O `aria-label` com o número por extenso também não é enfeite: "3" sozinho não
 * diz nada em voz alta.
 */
function linkNumerado(opcoes: { ativo: string; recuo: number; aoClicar?: string; valor?: string }): string {
  const { ativo, recuo, aoClicar = '@click.prevent', valor = 'n' } = opcoes;
  const p = ' '.repeat(recuo);
  return `${p}<PaginationLink
${p}  href="#"
${p}  :is-active="${ativo}"
${p}  :aria-label="\`Ir para página \${${valor}}\`"
${p}  ${aoClicar}
${p}>
${p}  {{ ${valor} }}
${p}</PaginationLink>`;
}

/**
 * Faixa canônica: os direcionais nas pontas e um link por página no meio.
 *
 * `:page` é o que o componente lê para desabilitar o extremo sozinho — não há
 * prop de "desabilitado" nos direcionais, e escrever uma ensinaria a duplicar o
 * que o componente já calcula.
 */
export const paginationSource: SourceTransform<PaginationArgs> = (_gerado, ctx) => {
  const total = numero(ctx?.args?.total, 50);
  const porPagina = numero(ctx?.args?.itemsPerPage, 10);
  const inicial = numero(ctx?.args?.defaultPage, 1);
  const anterior = attrs(attr('text', ctx?.args?.textoAnterior, TEXTO_ANTERIOR));
  const proxima = attrs(attr('text', ctx?.args?.textoProxima, TEXTO_PROXIMA));

  return vueSnippet(
    `${importa(
      'Pagination',
      'PaginationContent',
      'PaginationItem',
      'PaginationLink',
      'PaginationNext',
      'PaginationPrevious',
    )}
import { computed, ref } from 'vue'

const total = ${total}
const itensPorPagina = ${porPagina}
const atual = ref(${inicial})

const paginas = computed(() =>
  Array.from({ length: Math.ceil(total / itensPorPagina) }, (_, i) => i + 1),
)

function irPara(n: number) {
  if (n < 1 || n > paginas.value.length) return
  atual.value = n
}`,
    `<Pagination :total="total" :items-per-page="itensPorPagina" :page="atual">
  <PaginationContent>
    <PaginationItem>
      <PaginationPrevious${anterior} @click="irPara(atual - 1)" />
    </PaginationItem>
    <PaginationItem v-for="n in paginas" :key="n">
${linkNumerado({ ativo: 'atual === n', recuo: 6, aoClicar: '@click.prevent="irPara(n)"' })}
    </PaginationItem>
    <PaginationItem>
      <PaginationNext${proxima} @click="irPara(atual + 1)" />
    </PaginationItem>
  </PaginationContent>
</Pagination>`,
  );
};

/**
 * Faixa fixa de cinco páginas, sem estado: é o molde das stories de estado.
 * O que muda entre elas é a página em que a faixa está parada — e é `:page`
 * que decide, junto, qual direcional o componente desabilita.
 */
function faixaFixa(atual: number): string {
  return vueSnippet(
    `${importa(
      'Pagination',
      'PaginationContent',
      'PaginationItem',
      'PaginationLink',
      'PaginationNext',
      'PaginationPrevious',
    )}

const paginas = [1, 2, 3, 4, 5]`,
    `<Pagination :total="50" :items-per-page="10" :page="${atual}">
  <PaginationContent>
    <PaginationItem><PaginationPrevious /></PaginationItem>
    <PaginationItem v-for="n in paginas" :key="n">
${linkNumerado({ ativo: `n === ${atual}`, recuo: 6 })}
    </PaginationItem>
    <PaginationItem><PaginationNext /></PaginationItem>
  </PaginationContent>
</Pagination>`,
  );
}

/**
 * Faixa parada no meio: os dois direcionais ficam ativos, e o destaque da
 * página atual não depende da posição em que ela caiu.
 */
export function paginationFaixaSource(): string {
  return faixaFixa(3);
}

/**
 * Primeira página: o "Anterior" desabilitado NÃO é uma prop — o componente
 * chega ao extremo lendo `:page` contra `:total` e `:items-per-page`.
 */
export function paginationPrimeiraPaginaSource(): string {
  return faixaFixa(1);
}

/** Link inativo: a ênfase padrão de toda página que não é a atual. */
export function paginationLinkInativoSource(): string {
  return vueSnippet(
    importa('Pagination', 'PaginationContent', 'PaginationItem', 'PaginationLink'),
    `<Pagination :total="50" :items-per-page="10" :page="1">
  <PaginationContent>
    <PaginationItem>
      <PaginationLink href="#" aria-label="Ir para página 2" @click.prevent>2</PaginationLink>
    </PaginationItem>
  </PaginationContent>
</Pagination>`,
  );
}

/**
 * Página atual: `is-active` é o que vira `aria-current="page"` no markup, e o
 * destaque vem junto. Um só link por faixa pode carregá-lo.
 */
export function paginationLinkAtivoSource(): string {
  return vueSnippet(
    importa('Pagination', 'PaginationContent', 'PaginationItem', 'PaginationLink'),
    `<Pagination :total="50" :items-per-page="10" :page="2">
  <PaginationContent>
    <PaginationItem>
      <PaginationLink href="#" aria-label="Ir para página 1" @click.prevent>1</PaginationLink>
    </PaginationItem>
    <PaginationItem>
      <PaginationLink href="#" :is-active="true" aria-label="Ir para página 2" @click.prevent>2</PaginationLink>
    </PaginationItem>
  </PaginationContent>
</Pagination>`,
  );
}

/**
 * Só os direcionais. Eles já trazem ícone, rótulo visível e nome acessível
 * próprios — o nome NÃO vem do texto visível, que some na tela estreita, e por
 * isso o controle continua anunciado lá.
 */
export function paginationDirecionalSource(): string {
  return vueSnippet(
    importa('Pagination', 'PaginationContent', 'PaginationItem', 'PaginationNext', 'PaginationPrevious'),
    `<Pagination :total="50" :items-per-page="10" :page="2">
  <PaginationContent>
    <PaginationItem><PaginationPrevious /></PaginationItem>
    <PaginationItem><PaginationNext /></PaginationItem>
  </PaginationContent>
</Pagination>`,
  );
}

/** Total pequeno: todos os números em sequência, sem reticências. */
export function paginationSimplesSource(): string {
  return vueSnippet(
    `${importa(
      'Pagination',
      'PaginationContent',
      'PaginationItem',
      'PaginationLink',
      'PaginationNext',
      'PaginationPrevious',
    )}

const paginas = [1, 2, 3, 4, 5]`,
    `<Pagination :total="50" :items-per-page="10" :page="1">
  <PaginationContent>
    <PaginationItem><PaginationPrevious /></PaginationItem>
    <PaginationItem v-for="n in paginas" :key="n">
${linkNumerado({ ativo: 'n === 1', recuo: 6 })}
    </PaginationItem>
    <PaginationItem><PaginationNext /></PaginationItem>
  </PaginationContent>
</Pagination>`,
  );
}

/**
 * Lista longa: primeira, última, atual e vizinhas ficam visíveis, e o resto
 * colapsa. As reticências são DECORAÇÃO — o número que elas escondem já está
 * nos links vizinhos, e por isso a peça sai da leitura e da tabulação sozinha.
 *
 * A lista mistura número e marcador, então ela precisa do tipo: é ele que faz
 * `trecho === 'ellipsis'` compilar.
 */
export function paginationComReticenciasSource(): string {
  return vueSnippet(
    `${importa(
      'Pagination',
      'PaginationContent',
      'PaginationEllipsis',
      'PaginationItem',
      'PaginationLink',
      'PaginationNext',
      'PaginationPrevious',
    )}

type Trecho = number | 'ellipsis'

const trechos: Trecho[] = [1, 'ellipsis', 5, 6, 7, 'ellipsis', 12]`,
    `<Pagination :total="120" :items-per-page="10" :page="6">
  <PaginationContent>
    <PaginationItem><PaginationPrevious /></PaginationItem>
    <PaginationItem v-for="(trecho, i) in trechos" :key="i">
      <PaginationEllipsis v-if="trecho === 'ellipsis'" />
      <PaginationLink
        v-else
        href="#"
        :is-active="trecho === 6"
        :aria-label="\`Ir para página \${trecho}\`"
        @click.prevent
      >
        {{ trecho }}
      </PaginationLink>
    </PaginationItem>
    <PaginationItem><PaginationNext /></PaginationItem>
  </PaginationContent>
</Pagination>`,
  );
}

/**
 * Última página: o "Próxima" desabilita pelo mesmo caminho do "Anterior" na
 * primeira — `:page` batendo no extremo que `:total` e `:items-per-page`
 * definem.
 */
export function paginationUltimaPaginaSource(): string {
  return vueSnippet(
    `${importa(
      'Pagination',
      'PaginationContent',
      'PaginationItem',
      'PaginationLink',
      'PaginationNext',
      'PaginationPrevious',
    )}

const paginas = [8, 9, 10]`,
    `<Pagination :total="100" :items-per-page="10" :page="10">
  <PaginationContent>
    <PaginationItem><PaginationPrevious /></PaginationItem>
    <PaginationItem v-for="n in paginas" :key="n">
${linkNumerado({ ativo: 'n === 10', recuo: 6 })}
    </PaginationItem>
    <PaginationItem><PaginationNext /></PaginationItem>
  </PaginationContent>
</Pagination>`,
  );
}

/**
 * Estado do lado de fora: a faixa não guarda a página atual. Quem consome
 * mantém o valor, e o mesmo valor alimenta o destaque da faixa e o contador
 * ao lado — é o que impede os dois de divergirem.
 */
export function paginationControladaSource(): string {
  return vueSnippet(
    `${importa(
      'Pagination',
      'PaginationContent',
      'PaginationItem',
      'PaginationLink',
      'PaginationNext',
      'PaginationPrevious',
    )}
import { ref } from 'vue'

const paginas = [1, 2, 3, 4]
const atual = ref(1)

function irPara(n: number) {
  if (n >= 1 && n <= paginas.length) atual.value = n
}`,
    `<div class="nds-stack" data-spacing="sm">
  <p class="nds-text-body nds-text-muted-foreground">
    Página {{ atual }} de {{ paginas.length }}
  </p>
  <Pagination :total="40" :items-per-page="10" :page="atual">
    <PaginationContent>
      <PaginationItem>
        <PaginationPrevious @click="irPara(atual - 1)" />
      </PaginationItem>
      <PaginationItem v-for="n in paginas" :key="n">
${linkNumerado({ ativo: 'atual === n', recuo: 8, aoClicar: '@click.prevent="irPara(n)"' })}
      </PaginationItem>
      <PaginationItem>
        <PaginationNext @click="irPara(atual + 1)" />
      </PaginationItem>
    </PaginationContent>
  </Pagination>
</div>`,
  );
}

/**
 * Rodapé de tabela: o contador à esquerda e a faixa encostada à direita.
 *
 * O invólucro é `nds-cluster`, e não `nds-stack`: só o cluster tem
 * `data-align` / `data-justify`, e é ele que quebra a linha sozinho quando a
 * largura aperta.
 *
 * Aqui o nome do landmark FICA: com duas faixas na mesma página, "Paginação" em
 * ambas deixa o leitor de tela sem como distingui-las.
 */
export function paginationRodapeDeTabelaSource(): string {
  return vueSnippet(
    `${importa(
      'Pagination',
      'PaginationContent',
      'PaginationEllipsis',
      'PaginationItem',
      'PaginationLink',
      'PaginationNext',
      'PaginationPrevious',
    )}

type Trecho = number | 'ellipsis'

const trechos: Trecho[] = [1, 2, 3, 'ellipsis', 12]`,
    `<div
  class="nds-cluster nds-w-prose nds-border-default nds-rounded-lg nds-p-4"
  data-spacing="sm"
  data-align="center"
  data-justify="between"
>
  <span class="nds-text-body nds-text-muted-foreground">Mostrando 11–20 de 120 resultados</span>
  <Pagination
    :total="120"
    :items-per-page="10"
    :page="2"
    data-align="end"
    aria-label="Paginação do rodapé da tabela"
  >
    <PaginationContent>
      <PaginationItem><PaginationPrevious /></PaginationItem>
      <PaginationItem v-for="(trecho, i) in trechos" :key="i">
        <PaginationEllipsis v-if="trecho === 'ellipsis'" />
        <PaginationLink
          v-else
          href="#"
          :is-active="trecho === 2"
          :aria-label="\`Ir para página \${trecho}\`"
          @click.prevent
        >
          {{ trecho }}
        </PaginationLink>
      </PaginationItem>
      <PaginationItem><PaginationNext /></PaginationItem>
    </PaginationContent>
  </Pagination>
</div>`,
  );
}
