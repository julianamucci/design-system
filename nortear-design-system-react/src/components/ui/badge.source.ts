/**
 * Transforms do painel Code do Badge.
 *
 * Módulo de TS puro — o `.tsx` só entra por `import type`, que o compilador
 * apaga. É o que deixa as funções rodarem no projeto `unit` do vitest, a única
 * guarda que elas têm: a saída do painel não chega ao DOM durante a `play`.
 *
 * Um construtor por story, e o texto de cada um é o markup que a story monta:
 * o painel é a parte da página feita para ser copiada.
 */
import { attrs, childText, jsxSnippet, propOption, type SourceTransform } from '@/lib/story-source';

export type BadgeArgs = {
  variant: 'default' | 'destructive' | 'warning' | 'success' | 'info';
  children: string;
};

const VARIANTS = ['default', 'destructive', 'warning', 'success', 'info'] as const;

const IMPORT = 'import { Badge } from "@/components/ui/badge";';

/** Uma etiqueta com texto curto dentro — a forma inteira do componente. */
function badgeSnippet(variant: BadgeArgs['variant'] | undefined, content: string): string {
  return jsxSnippet(
    IMPORT,
    `<Badge${attrs(propOption('variant', variant, VARIANTS, 'default'))}>${content}</Badge>`,
  );
}

/**
 * Transform do `meta` — vale para todas as stories do arquivo. Lê os controls
 * do Playground; nas stories sem args cai no padrão do componente, que é
 * exatamente o uso canônico. O `variant` só aparece quando difere do padrão:
 * repetir `variant="default"` ensina ruído a quem copia.
 */
export const badgeSource: SourceTransform<BadgeArgs> = (_gerado, ctx) => {
  const args = ctx?.args ?? {};
  return badgeSnippet(
    typeof args.variant === 'string' ? (args.variant as BadgeArgs['variant']) : undefined,
    childText(args.children, 'Novo'),
  );
};

/** Ênfase alta: o padrão, e por isso sem atributo nenhum no snippet. */
export function badgeDefaultSource(): string {
  return badgeSnippet('default', 'Novo');
}

/** Ênfase de alerta, reservada ao que exige reação. */
export function badgeDestructiveSource(): string {
  return badgeSnippet('destructive', 'Urgente');
}

/**
 * As cinco variantes juntas — a escala é o assunto da story, e um badge sozinho
 * esconderia justamente isso. A cor vem só da borda; fundo e texto são neutros,
 * que é o que sustenta 4.5:1 sem depender da variante.
 */
export function badgeSemanticsSource(): string {
  return jsxSnippet(
    IMPORT,
    `<div className="nds-cluster" data-spacing="sm">
  <Badge>Novo</Badge>
  <Badge variant="destructive">Urgente</Badge>
  <Badge variant="warning">Vence hoje</Badge>
  <Badge variant="success">Aprovado</Badge>
  <Badge variant="info">Novidade</Badge>
</div>`,
  );
}

/**
 * Opções dos construtores de composição. O padrão é o texto das stories; a
 * docs page passa os rótulos do conteúdo, e o markup continua o mesmo do painel.
 */
export type BadgeCompositionSnippetOptions = {
  variant?: BadgeArgs['variant'];
  /** Texto da etiqueta. */
  label?: string;
  /** Número já formatado do contador — acima de 99, a aplicação passa `"99+"`. */
  count?: string;
  /** Nome acessível do botão em volta — o texto da etiqueta é curto demais para servir. */
  accessibleName?: string;
};

/**
 * Com ícone: o ícone é reforço visual, então sai da árvore de acessibilidade e
 * quem nomeia é o texto. O respiro entre os dois é do contêiner — `data-icon`
 * encurta o padding daquele lado —, nunca uma margem no ícone.
 */
export function badgeWithIconSnippet(o: BadgeCompositionSnippetOptions = {}): string {
  return jsxSnippet(
    `${IMPORT}
import { Check } from "lucide-react";`,
    `<Badge${attrs(propOption('variant', o.variant, VARIANTS, 'default'))}>
  <Check aria-hidden="true" data-icon="inline-start" />
  ${childText(o.label, 'Ativo')}
</Badge>`,
  );
}

/** Transform da story WithIcon — o construtor com o texto padrão. */
export function badgeWithIconSource(): string {
  return badgeWithIconSnippet();
}

/**
 * Com contador: o número mora DENTRO da etiqueta, à direita do texto. Quem
 * nomeia a contagem é o rótulo ao lado, então o número não precisa de contexto
 * próprio — e a peça é neutra de propósito, porque a cor da variante fica na
 * borda ao redor.
 */
export function badgeWithCounterSnippet(o: BadgeCompositionSnippetOptions = {}): string {
  return jsxSnippet(
    'import { Badge, BadgeCounter } from "@/components/ui/badge";',
    `<Badge${attrs(propOption('variant', o.variant ?? 'destructive', VARIANTS, 'default'))}>
  ${childText(o.label, 'Urgente')}
  <BadgeCounter>${childText(o.count, '12')}</BadgeCounter>
</Badge>`,
  );
}

/** Transform da story WithCounter — o construtor com o texto padrão. */
export function badgeWithCounterSource(): string {
  return badgeWithCounterSnippet();
}

/**
 * Como gatilho: a etiqueta dentro do Button do design system, `ghost` e `sm`.
 * Quem recebe foco, teclado, anel e nome acessível é o botão; o badge fica só
 * com a aparência, sem `tabIndex` próprio para não competir pelo foco.
 */
export function badgeAsButtonSnippet(o: BadgeCompositionSnippetOptions = {}): string {
  return jsxSnippet(
    `${IMPORT}
import { Button } from "@/components/ui/button";`,
    `<Button variant="ghost" size="sm" aria-label="${childText(o.accessibleName, 'Filtrar por Design')}">
  <Badge${attrs(propOption('variant', o.variant ?? 'info', VARIANTS, 'default'))}>${childText(o.label, 'Design')}</Badge>
</Button>`,
  );
}

/** Transform da story AsButton — o construtor com o texto padrão. */
export function badgeAsButtonSource(): string {
  return badgeAsButtonSnippet();
}

/**
 * Como link: a etiqueta é filha DIRETA do `<a>` — é essa relação que a regra de
 * hover da folha (`a > .nds-badge:hover`) exige. Foco e Enter são do link.
 */
export function badgeAsLinkSnippet(o: BadgeCompositionSnippetOptions = {}): string {
  return jsxSnippet(
    IMPORT,
    `<a href="#">
  <Badge${attrs(propOption('variant', o.variant ?? 'info', VARIANTS, 'default'))}>${childText(o.label, 'Design')}</Badge>
</a>`,
  );
}

/** Transform da story AsLink — o construtor com o texto padrão. */
export function badgeAsLinkSource(): string {
  return badgeAsLinkSnippet();
}
