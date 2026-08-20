/**
 * Transforms do painel Code do ScrollArea.
 *
 * Módulo de TS puro, sem import de `.vue`: é o que deixa as funções rodarem no
 * projeto `unit` do vitest. A saída do painel não chega ao DOM durante a `play`,
 * então este é o único lugar em que elas têm guarda.
 *
 * A ALTURA é a lição inteira do componente: sem limite não há transbordo, e sem
 * transbordo não há rolagem. Ela vem de `size`, a escada de janela do próprio
 * componente — as stories cravam a LARGURA da moldura em `style` inline, e essa
 * parte fica de fora: largura é enquadramento do canvas, e valor de design em
 * `style` não entra em snippet.
 */
import { attr, attrNum, attrs, indentar, vueSnippet, type SourceTransform } from '@/lib/story-source';

export type ScrollAreaArgs = {
  type?: 'auto' | 'always' | 'scroll' | 'hover';
  scrollHideDelay?: number;
};

const IMPORT_AREA = `import { ScrollArea } from '@/components/ui/scroll-area'`;
const IMPORT_COM_BARRA = `import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'`;

const TAGS = 'const tags = Array.from({ length: 40 }, (_, i) => `Tag ${i + 1}`)';

/**
 * A moldura em volta da área.
 *
 * `nds-overflow-hidden` é o que faz o canto arredondado recortar o conteúdo que
 * rola por baixo dele; sem isso a primeira linha aparece por cima da borda.
 * A largura sai de `max-width`, que é a utilitária que existe — não há
 * utilitária para uma largura cravada em pixels.
 */
function moldura(interno: string, largura = 'nds-max-w-xs'): string {
  return `<div class="nds-w-full ${largura} nds-rounded-md nds-border-default nds-overflow-hidden">
${indentar(interno)}
</div>`;
}

/** A área rolável com o conteúdo dentro. */
function area(partes: Array<string | false | null | undefined>, interno: string): string {
  return `<ScrollArea${attrs(...partes)}>
${indentar(interno)}
</ScrollArea>`;
}

/**
 * Uma pilha de etiquetas — conteúdo alto o bastante para transbordar.
 *
 * `nds-py-1` no lugar do `padding-block: 0.375rem` das stories: o valor de 6px
 * não tem utilitária na escada, e crayonar a medida em `style` é justamente o
 * que o snippet não pode ensinar.
 */
const PILHA_DE_TAGS = `<div class="nds-stack" data-spacing="sm">
  <div
    v-for="tag in tags"
    :key="tag"
    class="nds-text-body nds-rounded-sm nds-border-default nds-px-2 nds-py-1"
  >
    {{ tag }}
  </div>
</div>`;

const CONTEUDO_TAGS = `<div class="nds-p-4">
  <h4 class="nds-mb-2 nds-text-body nds-font-medium nds-leading-none">Tags</h4>
${indentar(PILHA_DE_TAGS)}
</div>`;

/**
 * Forma canônica: moldura, área com altura da escada e conteúdo que transborda.
 *
 * `size` é obrigatório na prática — é ele que dá o limite contra o qual o
 * conteúdo transborda. O componente monta o viewport, a barra e o canto
 * sozinho; só o conteúdo é responsabilidade de quem compõe.
 */
export const scrollAreaSource: SourceTransform<ScrollAreaArgs> = (_gerado, ctx) => {
  const args = ctx?.args ?? {};
  return vueSnippet(
    `${IMPORT_AREA}\n\n${TAGS}`,
    moldura(
      area(
        [
          attr('type', args.type, 'hover'),
          attrNum('scroll-hide-delay', args.scrollHideDelay, 600),
          'size="xl"',
          'class="nds-w-full"',
        ],
        CONTEUDO_TAGS,
      ),
    ),
  );
};

/**
 * Eixo vertical: o único que transborda, então o único que rola. A direção
 * nasce do CONTEÚDO — não há prop de eixo na área.
 *
 * `type="always"` mantém a barra montada; com o padrão ela só se materializa
 * enquanto o ponteiro está sobre a área.
 */
export function scrollAreaVerticalSource(): string {
  return vueSnippet(
    `${IMPORT_AREA}\n\n${TAGS}`,
    moldura(area(['type="always"', 'size="xl"', 'class="nds-w-full"'], CONTEUDO_TAGS)),
  );
}

/**
 * Eixo horizontal: a barra desse eixo é EXPLÍCITA — entra como filha da área.
 * A faixa é uma linha sem quebra (`nds-row`) com itens que não encolhem; com
 * uma linha que quebra, o conteúdo caberia e não haveria o que rolar.
 */
export function scrollAreaHorizontalSource(): string {
  return vueSnippet(
    `${IMPORT_COM_BARRA}

const cards = Array.from({ length: 12 }, (_, i) => \`Card \${i + 1}\`)`,
    moldura(
      area(
        ['type="always"', 'size="md"', 'class="nds-w-full nds-whitespace-nowrap"'],
        `<div class="nds-row nds-p-4" data-spacing="md">
  <figure
    v-for="card in cards"
    :key="card"
    class="nds-w-xs nds-shrink-0 nds-rounded-md nds-border-default nds-bg-muted nds-p-4"
  >
    <div class="nds-text-body nds-font-medium">{{ card }}</div>
    <div class="nds-mt-2 nds-text-caption nds-text-muted-foreground">Item horizontal</div>
  </figure>
</div>
<ScrollBar orientation="horizontal" />`,
      ),
      'nds-max-w-lg',
    ),
  );
}

/**
 * Os dois eixos: a barra vertical o componente já monta, a horizontal continua
 * sendo declarada. O canto aparece sozinho no encontro das duas.
 */
export function scrollAreaBidirecionalSource(): string {
  return vueSnippet(
    `${IMPORT_COM_BARRA}

const colunas = Array.from({ length: 12 }, (_, i) => \`C\${i + 1}\`)
const linhas = Array.from({ length: 16 }, (_, i) => \`R\${i + 1}\`)`,
    moldura(
      area(
        ['type="always"', 'size="xl"', 'class="nds-w-full"'],
        `<table class="nds-border-collapse nds-text-body">
  <thead>
    <tr>
      <th class="nds-bg-background nds-border-default nds-px-2 nds-py-2 nds-text-left">#</th>
      <th
        v-for="coluna in colunas"
        :key="coluna"
        class="nds-bg-background nds-border-default nds-px-2 nds-py-2 nds-text-left nds-whitespace-nowrap"
      >
        {{ coluna }}
      </th>
    </tr>
  </thead>
  <tbody>
    <tr v-for="linha in linhas" :key="linha">
      <th class="nds-bg-muted nds-border-default nds-px-2 nds-py-2 nds-text-left nds-whitespace-nowrap">
        {{ linha }}
      </th>
      <td
        v-for="coluna in colunas"
        :key="coluna"
        class="nds-border-default nds-px-2 nds-py-2 nds-whitespace-nowrap"
      >
        {{ linha }}-{{ coluna }}
      </td>
    </tr>
  </tbody>
</table>
<ScrollBar orientation="horizontal" />`,
      ),
      'nds-max-w-lg',
    ),
  );
}

const TAGS_30 = 'const tags = Array.from({ length: 30 }, (_, i) => `Tag ${i + 1}`)';

const LISTA_SIMPLES = `<div class="nds-stack nds-p-4" data-spacing="sm">
  <div
    v-for="tag in tags"
    :key="tag"
    class="nds-block nds-text-body nds-rounded-sm nds-border-default nds-px-2 nds-py-1"
  >
    {{ tag }}
  </div>
</div>`;

/**
 * Estado padrão: a área transborda e rola, e a barra só se materializa quando o
 * ponteiro entra. Não há prop a escrever — `hover` é o padrão do componente.
 */
export function scrollAreaOciosoSource(): string {
  return vueSnippet(
    `${IMPORT_AREA}\n\n${TAGS_30}`,
    moldura(area(['size="lg"', 'class="nds-w-full"'], LISTA_SIMPLES)),
  );
}

/**
 * Barra sempre montada: é a condição para arrastar o pegador — com o padrão,
 * ele nem existe no DOM enquanto o ponteiro está fora.
 */
export function scrollAreaSempreSource(): string {
  return vueSnippet(
    `${IMPORT_AREA}\n\n${TAGS_30}`,
    moldura(area(['type="always"', 'size="lg"', 'class="nds-w-full"'], LISTA_SIMPLES)),
  );
}

/**
 * Barra durante a rolagem: ela acende ao rolar e some depois da espera. O tempo
 * de espera tem padrão no componente, e por isso não aparece aqui — passe
 * `:scroll-hide-delay` só para mudá-lo.
 */
export function scrollAreaAoRolarSource(): string {
  return vueSnippet(
    `${IMPORT_AREA}\n\n${TAGS_30}`,
    moldura(area(['type="scroll"', 'size="lg"', 'class="nds-w-full"'], LISTA_SIMPLES)),
  );
}

/**
 * Conteúdo focável dentro da área: o componente não reordena nem tira nada da
 * ordem de tabulação. A navegação leva nome próprio — dentro de uma área
 * rolável ela vira um marco a mais na lista do leitor de tela.
 */
export function scrollAreaConteudoFocavelSource(): string {
  return vueSnippet(
    `${IMPORT_AREA}

const acoes = Array.from({ length: 20 }, (_, i) => \`Ação \${i + 1}\`)`,
    moldura(
      area(
        ['size="lg"', 'class="nds-w-full"'],
        `<nav aria-label="Ações" class="nds-p-4">
  <ul class="nds-stack nds-list-none" data-spacing="xs">
    <li v-for="acao in acoes" :key="acao">
      <a
        href="#"
        class="nds-block nds-rounded-sm nds-px-2 nds-py-1 nds-text-body nds-hover-bg-muted-soft"
      >
        {{ acao }}
      </a>
    </li>
  </ul>
</nav>`,
      ),
    ),
  );
}

/**
 * O erro de uso mais comum, lado a lado com a correção: sem altura o conteúdo
 * expande e a área não rola — ela aparenta estar quebrada quando ninguém disse
 * até onde ela pode ir. `size` é o que dá o limite.
 */
export function scrollAreaSemLimiteSource(): string {
  const lista = `<div class="nds-stack nds-p-4" data-spacing="sm">
  <div v-for="tag in tags" :key="tag" class="nds-text-body">{{ tag }}</div>
</div>`;
  return vueSnippet(
    `${IMPORT_AREA}\n\n${TAGS_30}`,
    `<div class="nds-stack nds-w-full nds-max-w-xs" data-spacing="lg">
  <div class="nds-rounded-md nds-border-default">
${indentar(area(['class="nds-w-full"'], lista), 4)}
  </div>

  <div class="nds-rounded-md nds-border-default nds-overflow-hidden">
${indentar(area(['size="sm"', 'class="nds-w-full"'], lista), 4)}
  </div>
</div>`,
  );
}

/**
 * Lista de navegação rolável ao lado do conteúdo: a área rola sem mover a
 * região vizinha, que é a razão de existir do componente numa sidebar.
 */
export function scrollAreaSidebarSource(): string {
  return vueSnippet(
    `${IMPORT_AREA}

const secoes = [
  'Visão geral',
  'Componentes',
  'Tokens',
  'Padrões',
  'Acessibilidade',
  'Changelog',
]`,
    `<div class="nds-row nds-w-full nds-max-w-lg" data-spacing="md">
  <aside class="nds-w-xs nds-shrink-0 nds-rounded-md nds-border-default nds-overflow-hidden">
${indentar(
  area(
    ['size="xl"', 'class="nds-w-full"'],
    `<nav aria-label="Seções da documentação" class="nds-p-2">
  <a
    v-for="secao in secoes"
    :key="secao"
    href="#"
    class="nds-block nds-rounded-sm nds-px-2 nds-py-1 nds-text-body nds-hover-bg-muted-soft"
  >
    {{ secao }}
  </a>
</nav>`,
  ),
  4,
)}
  </aside>
  <main class="nds-flex-1 nds-rounded-md nds-border-default nds-p-6 nds-text-body nds-text-muted-foreground">
    Conteúdo principal — a sidebar rola sem mover esta área.
  </main>
</div>`,
  );
}

/**
 * Galeria horizontal: a miniatura tira a altura de uma proporção, e não de uma
 * medida cravada — assim ela acompanha a largura do card em qualquer tela.
 */
export function scrollAreaGaleriaSource(): string {
  return vueSnippet(
    `${IMPORT_COM_BARRA}

const imagens = Array.from({ length: 14 }, (_, i) => \`Imagem \${i + 1}\`)`,
    moldura(
      area(
        ['type="always"', 'size="md"', 'class="nds-w-full nds-whitespace-nowrap"'],
        `<div class="nds-row nds-p-4" data-spacing="sm">
  <figure
    v-for="imagem in imagens"
    :key="imagem"
    class="nds-w-xs nds-shrink-0 nds-overflow-hidden nds-rounded-md nds-border-default"
  >
    <div class="nds-aspect-video nds-bg-muted"></div>
    <figcaption class="nds-p-2 nds-text-caption">{{ imagem }}</figcaption>
  </figure>
</div>
<ScrollBar orientation="horizontal" />`,
      ),
      'nds-max-w-lg',
    ),
  );
}

/**
 * Tabela ampla: rola nos dois eixos dentro de uma janela de altura fixa. O
 * cabeçalho acompanha o conteúdo — colar o cabeçalho no topo é outra decisão,
 * e não é a que este exemplo toma.
 */
export function scrollAreaTabelaSource(): string {
  return vueSnippet(
    `${IMPORT_COM_BARRA}

const colunas = ['Nome', 'Email', 'Função', 'Departamento', 'Localização', 'Início', 'Status']

const pessoas = Array.from({ length: 18 }, (_, i) => [
  \`Pessoa \${i + 1}\`,
  \`pessoa\${i + 1}@exemplo.com\`,
  i % 2 === 0 ? 'Designer' : 'Engenheiro',
  i % 3 === 0 ? 'Design System' : 'Produto',
  i % 2 === 0 ? 'São Paulo' : 'Remoto',
  \`0\${(i % 9) + 1}/2024\`,
  i % 4 === 0 ? 'Férias' : 'Ativo',
])`,
    moldura(
      area(
        ['type="always"', 'size="xl"', 'class="nds-w-full"'],
        `<table class="nds-border-collapse nds-text-body">
  <thead>
    <tr>
      <th
        v-for="coluna in colunas"
        :key="coluna"
        class="nds-bg-background nds-border-b nds-px-2 nds-py-2 nds-text-left nds-whitespace-nowrap"
      >
        {{ coluna }}
      </th>
    </tr>
  </thead>
  <tbody>
    <tr v-for="(pessoa, i) in pessoas" :key="i">
      <td
        v-for="(celula, c) in pessoa"
        :key="c"
        class="nds-border-b nds-px-2 nds-py-2 nds-whitespace-nowrap"
      >
        {{ celula }}
      </td>
    </tr>
  </tbody>
</table>
<ScrollBar orientation="horizontal" />`,
      ),
      'nds-max-w-lg',
    ),
  );
}
