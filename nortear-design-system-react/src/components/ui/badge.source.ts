/**
 * Transforms do painel Code do Badge.
 *
 * Módulo de TS puro — o `.tsx` só entra por `import type`, que o compilador
 * apaga. É o que deixa as funções rodarem no projeto `unit` do vitest, a única
 * guarda que elas têm: a saída do painel não chega ao DOM durante a `play`.
 */
import { attrs, childText, jsxSnippet, propOption, type SourceTransform } from '@/lib/story-source';

export type BadgeArgs = {
  variant: 'default' | 'secondary' | 'destructive' | 'warning' | 'success' | 'info' | 'outline';
  children: string;
};

const VARIANTS = [
  'default',
  'secondary',
  'destructive',
  'warning',
  'success',
  'info',
  'outline',
] as const;

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

/** Ênfase de apoio, para o que informa sem competir com o conteúdo. */
export function badgeSecundarioSource(): string {
  return badgeSnippet('secondary', 'Beta');
}

/** Ênfase de alerta, reservada ao que exige reação. */
export function badgeDestructiveSource(): string {
  return badgeSnippet('destructive', 'Urgente');
}

/** Ênfase mínima: só contorno, para o que apenas rotula. */
export function badgeOutlineSource(): string {
  return badgeSnippet('outline', 'Rascunho');
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
 * Contador: "12" sozinho não diz de quê. Quem carrega o significado é o rótulo
 * do contêiner, que também é quem se anuncia como região de status.
 */
export function badgeCounterSource(): string {
  return jsxSnippet(
    `${IMPORT}
import { Bell } from "lucide-react";`,
    `<span
  className="nds-cluster"
  data-spacing="sm"
  role="status"
  aria-label="12 notificações não lidas"
>
  <Bell aria-hidden="true" className="nds-text-foreground nds-icon-lg" />
  <Badge variant="destructive">12</Badge>
</span>`,
  );
}

/**
 * Dentro de link: o badge NÃO vira o elemento clicável. Quem recebe foco e
 * nome acessível é a âncora; o badge fica decorativo dentro dela, sem
 * `tabindex` próprio para não competir pelo foco.
 */
export function badgeAsLinkSource(): string {
  return jsxSnippet(
    IMPORT,
    `<a
  href="#design"
  aria-label="Ver todos os itens da categoria Design"
  className="nds-cluster nds-rounded-md nds-focus-ring-inset"
>
  <Badge variant="secondary">Design</Badge>
</a>`,
  );
}

/** Mesma regra do link, com o botão no lugar da âncora. */
export function badgeAsButtonSource(): string {
  return jsxSnippet(
    IMPORT,
    `<button
  type="button"
  aria-label="Filtrar por categoria Design"
  className="nds-cluster nds-rounded-md nds-focus-ring-inset"
>
  <Badge variant="outline">Design</Badge>
</button>`,
  );
}
