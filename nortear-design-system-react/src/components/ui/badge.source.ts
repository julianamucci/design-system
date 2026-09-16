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
import badgeTranslations from '@shared/content/badge/translations.json';

/**
 * Rótulos padrão: saem do conteúdo compartilhado (pt-BR), o MESMO dicionário que
 * as stories deste componente leem.
 *
 * Cravar o texto aqui deixava DUAS cópias de cada exemplo — uma no construtor do
 * snippet, outra no `render` da story — e a que envelhecia primeiro era sempre a
 * do painel, porque nada a compara com a tela. A docs page continua passando os
 * rótulos do idioma ativo por opção; sem opção, cai neste bloco.
 */
const LABELS = badgeTranslations['pt-BR'].demonstration.labels;

/** Número do contador nas stories e na docs page — texto pronto, já truncado. */
const COUNT = '12';

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
 * O rótulo do Playground, e por que ele NÃO usa o `childText` compartilhado.
 *
 * O `childText` de `@/lib/story-source` cai no padrão para qualquer valor que
 * não seja string ÚTIL — e a string vazia entra nesse balaio. Isso é correto lá
 * e é de propósito: nove componentes desta stack dependem dele (`button`,
 * `label`, `sheet`, `slider`, `sonner`, `alert-dialog`, `context-menu`,
 * `hover-card` e este), porque o control de action chega como FUNÇÃO e o corpo
 * do mock não pode vazar para o painel. Mexer no helper para consertar o badge
 * mudaria o fallback dos outros oito.
 *
 * Aqui ele resolvia o problema errado: esvaziar o control de texto deixa o
 * render com uma etiqueta VAZIA, e o painel dizia "Novo" — o snippet ensinando
 * um exemplo que a tela ao lado não mostra. Então a distinção é feita
 * localmente: o que É string é o que a tela mostra, mesmo vazia; o que NÃO é
 * string é control ausente ou espião de action, e só nesse caso entra o padrão
 * do `meta`.
 */
function playgroundLabel(value: unknown): string {
  return typeof value === 'string' ? value.trim() : LABELS.defaultLabel;
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
    playgroundLabel(args.children),
  );
};

/** Ênfase alta: o padrão, e por isso sem atributo nenhum no snippet. */
export function badgeDefaultSource(): string {
  return badgeSnippet('default', LABELS.defaultLabel);
}

/** Ênfase de alerta, reservada ao que exige reação. */
export function badgeDestructiveSource(): string {
  return badgeSnippet('destructive', LABELS.destructiveLabel);
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
  <Badge>${LABELS.defaultLabel}</Badge>
  <Badge variant="destructive">${LABELS.destructiveLabel}</Badge>
  <Badge variant="warning">${LABELS.warningLabel}</Badge>
  <Badge variant="success">${LABELS.successLabel}</Badge>
  <Badge variant="info">${LABELS.infoLabel}</Badge>
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
  ${childText(o.label, LABELS.statusLabel)}
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
  ${childText(o.label, LABELS.destructiveLabel)}
  <BadgeCounter>${childText(o.count, COUNT)}</BadgeCounter>
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
    `<Button variant="ghost" size="sm" aria-label="${childText(o.accessibleName, LABELS.categoryFilterLabel)}">
  <Badge${attrs(propOption('variant', o.variant ?? 'info', VARIANTS, 'default'))}>${childText(o.label, LABELS.categoryLabel)}</Badge>
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
  <Badge${attrs(propOption('variant', o.variant ?? 'info', VARIANTS, 'default'))}>${childText(o.label, LABELS.categoryLabel)}</Badge>
</a>`,
  );
}

/** Transform da story AsLink — o construtor com o texto padrão. */
export function badgeAsLinkSource(): string {
  return badgeAsLinkSnippet();
}
