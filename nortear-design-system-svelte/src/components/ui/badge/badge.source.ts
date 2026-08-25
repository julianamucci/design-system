/**
 * Transforms do painel Code do Badge.
 *
 * Módulo de TS puro, sem import de `.svelte`: é o que deixa as funções rodarem
 * no projeto `unit` do vitest. O snippet importa do design system, com o nome
 * que `badge/index.ts` exporta de verdade.
 */
import { attrs, attrsMultilinha, svelteSnippet } from '@/lib/story-source';

export type BadgeArgs = {
  variant: 'default' | 'secondary' | 'destructive' | 'warning' | 'success' | 'info' | 'outline';
};

const IMPORT = `import { Badge } from "@/components/ui/badge";`;

/** Uma etiqueta solta: a forma que todas as variantes compartilham. */
function etiqueta(variant: BadgeArgs['variant'], label: string): string {
  const props = attrs(variant !== 'default' ? `variant="${variant}"` : '');
  return svelteSnippet(IMPORT, `<Badge${props}>${label}</Badge>`);
}

/** Forma canônica: uma etiqueta de texto curto. Serve o Playground. */
export function badgeSource(_gerado?: string, ctx?: { args?: Partial<BadgeArgs> }): string {
  const { variant = 'default' } = ctx?.args ?? {};
  return etiqueta(variant, 'Novo');
}

/** Variante secundária: borda cinza legível, para etiqueta sem carga semântica. */
export function badgeSecundarioSource(): string {
  return etiqueta('secondary', 'Beta');
}

/** Variante destrutiva: a borda em `destructive`; o texto fica neutro, como em todas. */
export function badgeDestructiveSource(): string {
  return etiqueta('destructive', 'Urgente');
}

/** Variante de baixa ênfase: a borda mais discreta do conjunto. */
export function badgeOutlineSource(): string {
  return etiqueta('outline', 'Rascunho');
}

/** As três semânticas juntas — o que elas prometem é serem distinguíveis. */
export function badgeSemanticasSource(): string {
  return svelteSnippet(
    IMPORT,
    `<div class="nds-cluster" data-spacing="sm">
  <Badge variant="warning">Vence hoje</Badge>
  <Badge variant="success">Aprovado</Badge>
  <Badge variant="info">Novidade</Badge>
</div>`,
  );
}

/**
 * Composição com ícone: o respiro entre desenho e texto é do componente
 * (`gap` do container + `data-icon`), nunca uma margem posta à mão.
 */
export function badgeWithIconSource(): string {
  return svelteSnippet(
    `${IMPORT}
import Check from "@lucide/svelte/icons/check";`,
    `<Badge>
  <Check aria-hidden="true" data-icon="inline-start" />
  Ativo
</Badge>`,
  );
}

/** Composição de contador: quem nomeia a contagem é o container. */
export function badgeCounterSource(): string {
  const props = attrsMultilinha([
    'class="nds-cluster"',
    'data-spacing="sm"',
    'role="status"',
    'aria-label="12 notificações não lidas"',
  ]);

  return svelteSnippet(
    `${IMPORT}
import Bell from "@lucide/svelte/icons/bell";`,
    `<span${props}>
  <Bell aria-hidden="true" class="nds-text-foreground nds-icon-lg" />
  <Badge variant="destructive">12</Badge>
</span>`,
  );
}

/**
 * Composição com contador: o número entra DENTRO da etiqueta, à direita do
 * texto. A peça é neutra de propósito — quem carrega a variante é a borda ao
 * redor, e preencher o número com a cor da variante o deixaria sem contraste.
 */
export function badgeWithCounterSource(): string {
  return svelteSnippet(
    `import { Badge, BadgeCounter } from "@/components/ui/badge";`,
    `<Badge variant="destructive">
  Urgente
  <BadgeCounter>12</BadgeCounter>
</Badge>`,
  );
}

/** Composição navegável: o badge é envolvido pelo link, e não vira o link. */
export function badgeEmLinkSource(): string {
  const props = attrsMultilinha([
    'href="/categorias/design"',
    'aria-label="Ver todos os itens da categoria Design"',
    'class="nds-cluster nds-rounded-md nds-focus-ring-inset"',
  ]);

  return svelteSnippet(
    IMPORT,
    `<a${props}>
  <Badge variant="secondary">Design</Badge>
</a>`,
  );
}

/** Composição clicável: quem recebe o foco é o botão que envolve a etiqueta. */
export function buttonBadgeSource(): string {
  const props = attrsMultilinha([
    'type="button"',
    'aria-label="Filtrar por acessibilidade"',
    'class="nds-cluster nds-rounded-md nds-focus-ring-inset"',
  ]);

  return svelteSnippet(
    IMPORT,
    `<button${props}>
  <Badge variant="outline">Acessibilidade</Badge>
</button>`,
  );
}
