/**
 * Transforms do painel Code do Breadcrumb.
 *
 * Módulo de TS puro, sem import de `.vue`: é o que deixa as funções rodarem no
 * projeto `unit` do vitest. O snippet importa do design system, com os nomes
 * que `breadcrumb/index.ts` exporta de verdade.
 */
import { indentar, vueSnippet } from '@/lib/story-source';

const IMPORT = `import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'`;

const IMPORT_COM_RETICENCIAS = `import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'`;

/**
 * Monta a trilha: cada peça entra num `BreadcrumbItem`, e o separador vai
 * ENTRE os itens — nunca depois do último, que fecha o caminho.
 *
 * O separador é irmão dos itens dentro da `<ol>`, e não filho de um deles: é
 * assim que ele fica fora da leitura sem levar o nível junto.
 */
function trilha(itens: string[], separador = '<BreadcrumbSeparator />'): string {
  const corpo = itens
    .map((item) => `    <BreadcrumbItem>\n${indentar(item, 6)}\n    </BreadcrumbItem>`)
    .join(`\n    ${separador}\n`);
  return `<Breadcrumb>
  <BreadcrumbList>
${corpo}
  </BreadcrumbList>
</Breadcrumb>`;
}

/** Nível anterior: navegável, e por isso link de verdade, com destino. */
function link(rotulo: string, destino: string): string {
  return `<BreadcrumbLink href="${destino}">${rotulo}</BreadcrumbLink>`;
}

/**
 * Nível atual: marcado com `aria-current="page"` pelo próprio componente, e
 * nunca link — clicar nele não leva a lugar nenhum.
 */
function pagina(rotulo: string): string {
  return `<BreadcrumbPage>${rotulo}</BreadcrumbPage>`;
}

/**
 * Forma canônica: três níveis, separador automático e a página atual fechando
 * a trilha.
 */
export function breadcrumbSource(): string {
  return vueSnippet(
    IMPORT,
    trilha([
      link('Início', '/'),
      link('Componentes', '/componentes'),
      pagina('Breadcrumb'),
    ]),
  );
}

/** Trilha de dois níveis: o mínimo que ainda é um caminho. */
export function breadcrumbSimplesSource(): string {
  return vueSnippet(IMPORT, trilha([link('Início', '/'), pagina('Componentes')]));
}

/**
 * Trilha longa colapsada. Com rótulo, as reticências entram na leitura como
 * imagem nomeada; sem ele, ficam decorativas — que é o certo quando um gatilho
 * as envolve e já carrega o próprio nome.
 */
export function breadcrumbComReticenciasSource(): string {
  return vueSnippet(
    IMPORT_COM_RETICENCIAS,
    trilha([
      link('Início', '/'),
      '<BreadcrumbEllipsis label="Mais páginas" />',
      link('Componentes', '/componentes'),
      pagina('Breadcrumb'),
    ]),
  );
}

/**
 * Separador customizado: o desenho vem do conteúdo passado ao slot, e o item
 * continua fora da árvore de acessibilidade — trocar o chevron não devolve o
 * separador à leitura.
 */
export function breadcrumbSeparadorCustomizadoSource(): string {
  return vueSnippet(
    `${IMPORT}
import { Slash } from 'lucide-vue-next'`,
    trilha(
      [link('Início', '/'), link('Componentes', '/componentes'), pagina('Breadcrumb')],
      '<BreadcrumbSeparator><Slash /></BreadcrumbSeparator>',
    ),
  );
}

/**
 * Link do consumidor: com `as-child` o elemento de fora mantém os próprios
 * atributos e ganha o estilo do componente, em vez de virar um segundo
 * elemento aninhado. É o caminho de integração com um roteador.
 */
export function breadcrumbLinkCustomizadoSource(): string {
  return vueSnippet(
    `${IMPORT}
import { RouterLink } from 'vue-router'`,
    trilha([
      `<BreadcrumbLink as-child>
  <RouterLink to="/">Início</RouterLink>
</BreadcrumbLink>`,
      `<BreadcrumbLink as-child>
  <RouterLink to="/componentes">Componentes</RouterLink>
</BreadcrumbLink>`,
      pagina('Breadcrumb'),
    ]),
  );
}

/**
 * Trilha responsiva: as reticências informam, e o menu que as envolve é o que
 * leva de volta aos níveis ocultos. O rótulo fica no gatilho, uma vez só —
 * nomear os dois faria o leitor de tela anunciar o mesmo controle duas vezes.
 */
export function breadcrumbResponsivoSource(): string {
  return vueSnippet(
    `${IMPORT_COM_RETICENCIAS}
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'`,
    trilha([
      link('Início', '/'),
      `<DropdownMenu>
  <DropdownMenuTrigger class="nds-cluster" data-spacing="xs" aria-label="Expandir níveis ocultos">
    <BreadcrumbEllipsis />
  </DropdownMenuTrigger>
  <DropdownMenuContent align="start">
    <DropdownMenuItem>Documentação</DropdownMenuItem>
    <DropdownMenuItem>Guia</DropdownMenuItem>
    <DropdownMenuItem>Componentes</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>`,
      pagina('Breadcrumb'),
    ]),
  );
}
