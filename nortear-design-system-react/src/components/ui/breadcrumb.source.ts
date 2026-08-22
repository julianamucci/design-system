/**
 * Transforms do painel Code do Breadcrumb.
 *
 * Módulo de TS puro — o `.tsx` só entra por `import type`, que o compilador
 * apaga. É o que deixa as funções rodarem no projeto `unit` do vitest, a única
 * guarda que elas têm: a saída do painel não chega ao DOM durante a `play`.
 *
 * O Breadcrumb não tem control nenhum: a trilha é composição, e composição não
 * cabe num arg. Por isso a transform do `meta` devolve a trilha canônica em vez
 * de ler `ctx.args` — e cada story cuja forma difere dessa trilha traz a sua.
 */
import { jsxSnippet, type SourceTransform } from '@/lib/story-source';

/** O `meta` declara `component: Breadcrumb`, que não expõe arg de conteúdo. */
export type BreadcrumbArgs = Record<string, never>;

/** Import montado sob medida: só as peças que o snippet realmente usa. */
function importDe(...pecas: string[]): string {
  return `import {\n${pecas.map((peca) => `  ${peca},`).join('\n')}\n} from "@/components/ui/breadcrumb";`;
}

const TRACK_COMPLETA = importDe(
  'Breadcrumb',
  'BreadcrumbItem',
  'BreadcrumbLink',
  'BreadcrumbList',
  'BreadcrumbPage',
  'BreadcrumbSeparator',
);

/**
 * Trilha canônica: níveis anteriores são links, o último é `BreadcrumbPage`.
 *
 * A regra que sustenta a leitura está aqui: só quem leva a algum lugar é link.
 * O `BreadcrumbPage` marca a página atual com `aria-current="page"` por conta
 * própria, e o separador nasce fora da árvore de acessibilidade — nada disso
 * precisa ser escrito por quem compõe, e escrever seria repetir o componente.
 */
export const breadcrumbSource: SourceTransform<BreadcrumbArgs> = () =>
  jsxSnippet(
    TRACK_COMPLETA,
    `<Breadcrumb>
  <BreadcrumbList>
    <BreadcrumbItem>
      <BreadcrumbLink href="#">Início</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <BreadcrumbLink href="#">Componentes</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <BreadcrumbPage>Breadcrumb</BreadcrumbPage>
    </BreadcrumbItem>
  </BreadcrumbList>
</Breadcrumb>`,
  );

/**
 * O mínimo que ainda é uma trilha: um nível anterior e a página atual.
 *
 * A trilha de três níveis do `meta` esconderia justamente o que esta story
 * afirma — que com dois níveis existe UM único ponto focável, porque a página
 * atual nunca é navegável.
 */
export function breadcrumbSimplesSource(): string {
  return jsxSnippet(
    importDe(
      'Breadcrumb',
      'BreadcrumbItem',
      'BreadcrumbLink',
      'BreadcrumbList',
      'BreadcrumbPage',
      'BreadcrumbSeparator',
    ),
    `<Breadcrumb>
  <BreadcrumbList>
    <BreadcrumbItem>
      <BreadcrumbLink href="#">Início</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <BreadcrumbPage>Componentes</BreadcrumbPage>
    </BreadcrumbItem>
  </BreadcrumbList>
</Breadcrumb>`,
  );
}

/**
 * Níveis colapsados: o indicador é uma peça a mais na trilha, e o `meta` não
 * a tem.
 *
 * O `label` é o que decide se as reticências são anunciadas ou ficam decorativas.
 * Aqui elas informam sozinhas quantos níveis sumiram, então precisam de nome —
 * sem ele o leitor de tela pula um pedaço do caminho sem avisar.
 */
export function breadcrumbWithEllipsisSource(): string {
  return jsxSnippet(
    importDe(
      'Breadcrumb',
      'BreadcrumbEllipsis',
      'BreadcrumbItem',
      'BreadcrumbLink',
      'BreadcrumbList',
      'BreadcrumbPage',
      'BreadcrumbSeparator',
    ),
    `<Breadcrumb>
  <BreadcrumbList>
    <BreadcrumbItem>
      <BreadcrumbLink href="#">Início</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <BreadcrumbEllipsis label="Mais páginas" />
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <BreadcrumbLink href="#">Componentes</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <BreadcrumbPage>Breadcrumb</BreadcrumbPage>
    </BreadcrumbItem>
  </BreadcrumbList>
</Breadcrumb>`,
  );
}

/**
 * Separador desenhado por quem compõe: o `meta` usa o chevron implícito, que é
 * a ausência de children — o oposto do que esta story mostra.
 *
 * O que se ensina é que trocar o desenho não devolve o separador à leitura: o
 * `role="presentation"` e o `aria-hidden` continuam vindo do componente, e por
 * isso o ícone entra sem `aria-hidden` próprio.
 */
export function breadcrumbSeparadorCustomizadoSource(): string {
  return jsxSnippet(
    `${importDe(
      'Breadcrumb',
      'BreadcrumbItem',
      'BreadcrumbLink',
      'BreadcrumbList',
      'BreadcrumbPage',
      'BreadcrumbSeparator',
    )}
import { Slash } from "lucide-react";`,
    `<Breadcrumb>
  <BreadcrumbList>
    <BreadcrumbItem>
      <BreadcrumbLink href="#">Início</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbSeparator>
      <Slash />
    </BreadcrumbSeparator>
    <BreadcrumbItem>
      <BreadcrumbLink href="#">Componentes</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbSeparator>
      <Slash />
    </BreadcrumbSeparator>
    <BreadcrumbItem>
      <BreadcrumbPage>Breadcrumb</BreadcrumbPage>
    </BreadcrumbItem>
  </BreadcrumbList>
</Breadcrumb>`,
  );
}

/**
 * Link do roteador no lugar da âncora: a prop `render` é a API, e ela não
 * aparece em nenhuma outra story.
 *
 * O elemento passado NÃO é envolvido, é o próprio link — ele mantém os atributos
 * de quem o escreveu e ganha a classe do design system. Aqui vai um `<a>` para
 * o snippet compilar sozinho; o componente de link do roteador entra no mesmo
 * lugar, com a prop de destino dele.
 */
export function breadcrumbLinkCustomizadoSource(): string {
  return jsxSnippet(
    importDe(
      'Breadcrumb',
      'BreadcrumbItem',
      'BreadcrumbLink',
      'BreadcrumbList',
      'BreadcrumbPage',
      'BreadcrumbSeparator',
    ),
    `<Breadcrumb>
  <BreadcrumbList>
    <BreadcrumbItem>
      <BreadcrumbLink render={<a href="/" />}>Início</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <BreadcrumbLink render={<a href="/componentes" />}>
        Componentes
      </BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <BreadcrumbPage>Breadcrumb</BreadcrumbPage>
    </BreadcrumbItem>
  </BreadcrumbList>
</Breadcrumb>`,
  );
}

/**
 * Trilha responsiva: as reticências viram gatilho de menu, sub-composição que a
 * trilha do `meta` não tem como sugerir.
 *
 * Sem `label` aqui de propósito: quem se nomeia é o gatilho, e dois nomes no
 * mesmo controle viram leitura duplicada. As reticências sozinhas informam que
 * há níveis escondidos; o menu é o que devolve a navegação até eles.
 */
export function breadcrumbResponsivoSource(): string {
  return jsxSnippet(
    `${importDe(
      'Breadcrumb',
      'BreadcrumbEllipsis',
      'BreadcrumbItem',
      'BreadcrumbLink',
      'BreadcrumbList',
      'BreadcrumbPage',
      'BreadcrumbSeparator',
    )}
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";`,
    `<Breadcrumb>
  <BreadcrumbList>
    <BreadcrumbItem>
      <BreadcrumbLink href="#">Início</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <DropdownMenu>
        <DropdownMenuTrigger
          className="nds-cluster"
          data-spacing="xs"
          aria-label="Expandir níveis ocultos"
        >
          <BreadcrumbEllipsis />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem>Documentação</DropdownMenuItem>
          <DropdownMenuItem>Guia</DropdownMenuItem>
          <DropdownMenuItem>Componentes</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <BreadcrumbPage>Breadcrumb</BreadcrumbPage>
    </BreadcrumbItem>
  </BreadcrumbList>
</Breadcrumb>`,
  );
}
