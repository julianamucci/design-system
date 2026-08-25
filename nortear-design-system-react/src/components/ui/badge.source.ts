/**
 * Transforms do painel Code do Badge.
 *
 * Módulo de TS puro — o `.tsx` só entra por `import type`, que o compilador
 * apaga. É o que deixa as funções rodarem no projeto `unit` do vitest, a única
 * guarda que elas têm: a saída do painel não chega ao DOM durante a `play`.
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
 * As três variantes semânticas juntas — a escala é o assunto da story, e um
 * badge sozinho esconderia justamente isso. A cor vem do fundo e da borda; o
 * texto fica neutro, que é o que sustenta 4.5:1 sem depender da variante.
 */
export function badgeSemanticasSource(): string {
  return jsxSnippet(
    IMPORT,
    `<div className="nds-cluster" data-spacing="sm">
  <Badge variant="warning">Vence hoje</Badge>
  <Badge variant="success">Aprovado</Badge>
  <Badge variant="info">Novidade</Badge>
</div>`,
  );
}

/**
 * Com ícone: o ícone é reforço visual, então sai da árvore de acessibilidade e
 * quem nomeia é o texto. O respiro entre os dois é do contêiner — `data-icon`
 * encurta o padding daquele lado —, nunca uma margem no ícone.
 */
export function badgeWithIconSource(): string {
  return jsxSnippet(
    `${IMPORT}
import { Check } from "lucide-react";`,
    `<Badge>
  <Check aria-hidden="true" data-icon="inline-start" />
  Ativo
</Badge>`,
  );
}

/**
 * Com contador: o número mora DENTRO da etiqueta, à direita do texto. Quem
 * nomeia a contagem é o rótulo ao lado, então o número não precisa de contexto
 * próprio — e a peça é neutra de propósito, porque a cor da variante fica na
 * borda ao redor.
 */
export function badgeWithCounterSource(): string {
  return jsxSnippet(
    'import { Badge, BadgeCounter } from "@/components/ui/badge";',
    `<Badge variant="destructive">
  Urgente
  <BadgeCounter>12</BadgeCounter>
</Badge>`,
  );
}

/**
 * Dentro de botão: o badge NÃO vira o elemento clicável. Quem recebe foco,
 * teclado e nome acessível é o botão; o badge fica decorativo dentro dele, sem
 * `tabindex` próprio para não competir pelo foco.
 */
export function badgeAsButtonSource(): string {
  return jsxSnippet(
    IMPORT,
    `<button
  type="button"
  aria-label="Filtrar por React"
  className="nds-cluster nds-rounded-md nds-focus-ring-inset"
>
  <Badge variant="info">React</Badge>
</button>`,
  );
}
