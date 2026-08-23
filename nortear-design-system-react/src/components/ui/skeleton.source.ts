/**
 * Transforms do painel Code do Skeleton.
 *
 * Módulo de TS puro — o `.tsx` só entra por `import type`, que o compilador
 * apaga. É o que deixa as funções rodarem no projeto `unit` do vitest, a única
 * guarda que elas têm: a saída do painel não chega ao DOM durante a `play`.
 *
 * O que as stories montam em volta e NÃO entra no snippet: nada, quase. É o
 * caso raro em que o entorno é o componente. A região `role="status"` com
 * `aria-busy` e nome não é andaime de Storybook: o placeholder sai
 * `aria-hidden` de fábrica, então quem anuncia o carregamento é ela. Um
 * snippet com o `<Skeleton>` solto ensinaria um carregamento que leitor de
 * tela nenhum percebe.
 *
 * A decisão de composição é a mesma em todas as funções: **a FORMA é o
 * assunto**. O esqueleto não imita conteúdo por prop de tamanho — imita pela
 * caixa que `data-shape` escolhe e pela fração de largura que `data-width` dá
 * (docs/shared/styles/nds/skeleton.css). Por isso cada story ganha a
 * composição que ela imita, e não uma barra genérica: um avatar sozinho, três
 * linhas de larguras decrescentes, um bloco dentro de proporção de mídia.
 *
 * `data-shape="fill"` NÃO carrega medida própria: ele preenche a caixa que o
 * contêiner estabelece. Fora de um contêiner com altura, o bloco nasce com
 * altura zero e o exemplo mostra um esqueleto invisível — foi assim que
 * `h-4 w-[250px]` sobreviveu como texto inerte. Todo snippet de `fill` entra
 * dentro de um `AspectRatio`.
 */
import { indentar, jsxSnippet, type SourceTransform } from '@/lib/story-source';

export type SkeletonArgs = {
  shape: 'text' | 'heading' | 'avatar' | 'fill';
  width: 'full' | '3-4' | '2-3' | '1-2' | '1-3';
  loading: boolean;
};

const FORMAS = ['text', 'heading', 'avatar', 'fill'] as const;
const LARGURAS = ['full', '3-4', '2-3', '1-2', '1-3'] as const;

const IMPORT = 'import { Skeleton } from "@/components/ui/skeleton";';
const IMPORT_RATIO = 'import { AspectRatio } from "@/components/ui/aspect-ratio";';

/**
 * Forma vinda do control, e só uma das quatro que a folha conhece. Control
 * adulterado não vira atributo inventado: cai no padrão do componente.
 */
function forma(valor: unknown): (typeof FORMAS)[number] {
  return typeof valor === 'string' && (FORMAS as readonly string[]).includes(valor)
    ? (valor as (typeof FORMAS)[number])
    : 'text';
}

/** Mesma guarda para a fração de largura. */
function largura(valor: unknown): (typeof LARGURAS)[number] {
  return typeof valor === 'string' && (LARGURAS as readonly string[]).includes(valor)
    ? (valor as (typeof LARGURAS)[number])
    : '3-4';
}

/**
 * A região que anuncia. `role` + `aria-label` andam JUNTOS: `aria-busy` sozinho
 * num `<div>` sem papel não é anunciado, e `aria-label` em `<div>` sem papel é
 * violação de ARIA. As duas metades juntas são o que faz o leitor de tela
 * dizer "carregando conteúdo".
 */
function regiao(rotulo: string, conteudo: string, className = 'nds-w-sm', ocupada = true): string {
  const lineClassName = className ? `\n  className="${className}"` : '';
  return `<div
  role="status"
  aria-busy="${ocupada}"
  aria-label="${rotulo}"${lineClassName}
>
${conteudo}
</div>`;
}

/** Linha de texto: a forma escolhe a altura, a fração escolhe a largura. */
function line(fraction: (typeof LARGURAS)[number], tipo: 'text' | 'heading' = 'text'): string {
  return `  <Skeleton data-shape="${tipo}" data-width="${fraction}" />`;
}

/**
 * Transform do `meta` — vale para todas as stories dos quatro arquivos. Lê os
 * controls do Playground e troca a COMPOSIÇÃO junto com a forma: `avatar` não
 * tem fração de largura para receber, e `fill` sem contêiner com altura não
 * desenha nada.
 */
export const skeletonSource: SourceTransform<SkeletonArgs> = (_gerado, ctx) => {
  const args = ctx?.args ?? {};
  const caixa = forma(args.shape);
  const ocupada = args.loading === false ? false : true;

  if (caixa === 'fill') {
    return jsxSnippet(
      `${IMPORT}\n${IMPORT_RATIO}`,
      regiao(
        'Carregando conteúdo',
        `  <AspectRatio ratio={16 / 9}>
    <Skeleton data-shape="fill" />
  </AspectRatio>`,
        'nds-w-sm',
        ocupada,
      ),
    );
  }

  if (caixa === 'avatar') {
    return jsxSnippet(
      IMPORT,
      regiao('Carregando conteúdo', '  <Skeleton data-shape="avatar" />', '', ocupada),
    );
  }

  return jsxSnippet(
    IMPORT,
    regiao('Carregando conteúdo', line(largura(args.width), caixa), 'nds-w-sm', ocupada),
  );
};

/**
 * Bloco de mídia. A proporção é quem estabelece a caixa — é o único jeito de
 * `fill` ter o que preencher, e o motivo de o exemplo importar duas peças em
 * vez de uma.
 */
export function midiaSkeletonBlockSource(): string {
  return jsxSnippet(
    `${IMPORT}\n${IMPORT_RATIO}`,
    regiao(
      'Carregando bloco',
      `  <AspectRatio ratio={16 / 9}>
    <Skeleton data-shape="fill" />
  </AspectRatio>`,
    ),
  );
}

/**
 * Avatar. Sem `data-width` de propósito: a fração só vale para as formas de
 * texto, e o quadrado tira a medida da escada `--size-*` — peça sem fluxo de
 * texto é a exceção que a guideline 12 prevê.
 */
export function skeletonAvatarSource(): string {
  return jsxSnippet(
    IMPORT,
    regiao('Carregando avatar', '  <Skeleton data-shape="avatar" />', ''),
  );
}

/**
 * Parágrafo. A largura DECRESCENTE é o assunto: três linhas iguais parecem uma
 * tabela, e é a variação entre elas que faz o bloco ser lido como texto. Serve
 * às duas stories que ensinam a mesma coisa — a linha de texto entre as formas
 * e o parágrafo entre as composições.
 */
export function skeletonParagrafoSource(): string {
  return jsxSnippet(
    IMPORT,
    `<div
  role="status"
  aria-busy="true"
  aria-label="Carregando parágrafo"
  className="nds-stack nds-w-sm"
  data-spacing="sm"
>
${line('full')}
${line('3-4')}
${line('1-2')}
</div>`,
  );
}

/**
 * Duas linhas, que é o mínimo para o pulso ser lido como bloco carregando e
 * não como um traço qualquer na tela. O pulso em si não aparece no snippet: ele
 * é da classe base, e desliga sozinho sob `prefers-reduced-motion`.
 */
export function skeletonPulsandoSource(): string {
  return jsxSnippet(
    IMPORT,
    `<div
  role="status"
  aria-busy="true"
  aria-label="Carregando conteúdo"
  className="nds-stack nds-w-sm"
  data-spacing="sm"
>
${line('full')}
${line('3-4')}
</div>`,
  );
}

/**
 * Card de perfil. O avatar e as linhas ficam lado a lado num `cluster`, e as
 * duas linhas empilhadas ocupam o resto com `nds-flex-1` — sem isso elas
 * encolhem para o próprio conteúdo, que é vazio, e o card sai só com a bolinha.
 */
export function skeletonCardDePerfilSource(): string {
  return jsxSnippet(
    IMPORT,
    `<div
  role="status"
  aria-busy="true"
  aria-label="Carregando card de perfil"
  className="nds-cluster nds-p-4 nds-border-default nds-rounded-md nds-w-sm"
  data-align="center"
  data-spacing="md"
>
  <Skeleton data-shape="avatar" />
  <div className="nds-stack nds-flex-1" data-spacing="sm">
${indentar(line('2-3'))}
${indentar(line('1-2'))}
  </div>
</div>`,
  );
}

/**
 * Lista. A região ocupada é a LISTA inteira, não cada item: cinco avisos de
 * carregamento para uma coisa só é ruído, e o leitor de tela anuncia o
 * conjunto. `data-size="sm"` encolhe o avatar — item de lista não usa o mesmo
 * bloco do card de perfil.
 */
export function skeletonListSource(): string {
  return jsxSnippet(
    IMPORT,
    `<ul
  role="list"
  aria-busy="true"
  aria-label="Carregando lista de pedidos"
  className="nds-stack nds-list-none nds-p-0 nds-w-md"
  data-spacing="md"
>
  {[1, 2, 3, 4, 5].map((posicao) => (
    <li key={posicao} className="nds-cluster" data-align="center" data-spacing="sm">
      <Skeleton data-shape="avatar" data-size="sm" />
      <div className="nds-stack nds-flex-1" data-spacing="xs">
        <Skeleton data-shape="text" data-width="2-3" />
        <Skeleton data-shape="text" data-width="1-3" />
      </div>
    </li>
  ))}
</ul>`,
  );
}

/**
 * Imagem em proporção. É o mesmo bloco de mídia da story de forma, mas aqui o
 * assunto é a troca: o placeholder ocupa exatamente a caixa que a imagem vai
 * ocupar, então nada salta quando ela chega.
 */
export function ratioSkeletonImageSource(): string {
  return jsxSnippet(
    `${IMPORT}\n${IMPORT_RATIO}`,
    regiao(
      'Carregando imagem',
      `  <AspectRatio ratio={16 / 9}>
    <Skeleton data-shape="fill" />
  </AspectRatio>`,
    ),
  );
}
