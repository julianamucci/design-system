/**
 * Transforms do painel Code do Breadcrumb.
 *
 * Módulo de TS puro, sem import de `.svelte`: é o que deixa as funções rodarem
 * no projeto `unit` do vitest. O snippet importa do design system, com os
 * nomes que `breadcrumb/index.ts` exporta de verdade.
 */
import { svelteSnippet } from '@/lib/story-source';

const IMPORT = `import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";`;

/**
 * Forma canônica: três níveis, separador automático e a página atual fechando
 * a trilha — ela é marcada, e nunca é link.
 */
export function breadcrumbSource(): string {
  return svelteSnippet(
    IMPORT,
    `<Breadcrumb>
  <BreadcrumbList>
    <BreadcrumbItem>
      <BreadcrumbLink href="/">Início</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <BreadcrumbLink href="/componentes">Componentes</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <BreadcrumbPage>Breadcrumb</BreadcrumbPage>
    </BreadcrumbItem>
  </BreadcrumbList>
</Breadcrumb>`,
  );
}

/** Trilha de dois níveis: o mínimo que ainda é um caminho. */
export function breadcrumbSimpleSource(): string {
  return svelteSnippet(
    IMPORT,
    `<Breadcrumb>
  <BreadcrumbList>
    <BreadcrumbItem>
      <BreadcrumbLink href="/">Início</BreadcrumbLink>
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
 * Trilha longa colapsada: com rótulo, as reticências são anunciadas; sem ele,
 * ficam decorativas.
 */
export function breadcrumbWithEllipsisSource(): string {
  return svelteSnippet(
    `import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";`,
    `<Breadcrumb>
  <BreadcrumbList>
    <BreadcrumbItem>
      <BreadcrumbLink href="/">Início</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <BreadcrumbEllipsis label="Mais páginas" />
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <BreadcrumbLink href="/componentes">Componentes</BreadcrumbLink>
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
 * Separador customizado: o desenho vem do conteúdo passado, e o item continua
 * fora da árvore de acessibilidade.
 */
export function breadcrumbSeparatorCustomizadoSource(): string {
  return svelteSnippet(
    `${IMPORT}
import Slash from "@lucide/svelte/icons/slash";`,
    `<Breadcrumb>
  <BreadcrumbList>
    <BreadcrumbItem>
      <BreadcrumbLink href="/">Início</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbSeparator><Slash /></BreadcrumbSeparator>
    <BreadcrumbItem>
      <BreadcrumbLink href="/componentes">Componentes</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbSeparator><Slash /></BreadcrumbSeparator>
    <BreadcrumbItem>
      <BreadcrumbPage>Breadcrumb</BreadcrumbPage>
    </BreadcrumbItem>
  </BreadcrumbList>
</Breadcrumb>`,
  );
}

/**
 * Link do consumidor: o elemento de fora mantém os próprios atributos e ganha
 * o estilo do componente, em vez de virar um segundo elemento aninhado.
 */
export function breadcrumbLinkCustomizadoSource(): string {
  return svelteSnippet(
    IMPORT,
    `<Breadcrumb>
  <BreadcrumbList>
    <BreadcrumbItem>
      <BreadcrumbLink href="/">
        {#snippet child({ props })}
          <a {...props} data-router-link="true">Início</a>
        {/snippet}
      </BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <BreadcrumbLink href="/componentes">
        {#snippet child({ props })}
          <a {...props} data-router-link="true">Componentes</a>
        {/snippet}
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
 * Trilha responsiva: as reticências informam, e o menu que as envolve é o que
 * leva de volta aos níveis ocultos. O rótulo fica no gatilho, uma vez só.
 */
export function breadcrumbResponsivoSource(): string {
  return svelteSnippet(
    `import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";`,
    `<Breadcrumb>
  <BreadcrumbList>
    <BreadcrumbItem>
      <BreadcrumbLink href="/">Início</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <DropdownMenu>
        <DropdownMenuTrigger
          class="nds-cluster"
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
