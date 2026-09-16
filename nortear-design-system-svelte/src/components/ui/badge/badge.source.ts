/**
 * Transforms do painel Code do Badge.
 *
 * Módulo de TS puro, sem import de `.svelte`: é o que deixa as funções rodarem
 * no projeto `unit` do vitest. O snippet importa do design system, com o nome
 * que `badge/index.ts` exporta de verdade.
 *
 * Os rótulos NÃO são cravados aqui: saem do conteúdo compartilhado. Sem opção,
 * cada construtor cai no bloco pt-BR — lido DIRETO do JSON, e não por
 * `useTranslation`, porque o painel Code da story é fixture e não pode mudar de
 * texto conforme o idioma guardado no navegador. A docs page passa os rótulos
 * do idioma ativo por opção, e é assim que o código do card acompanha a troca.
 */
import { attrs, attrsMultilinha, svelteSnippet } from '@/lib/story-source';
import badgeTranslations from '@shared/content/badge/translations.json';

export type BadgeArgs = {
  variant: 'default' | 'destructive' | 'warning' | 'success' | 'info';
};

type BadgeVariant = BadgeArgs['variant'];

/** Rótulos do bloco pt-BR — o padrão de todo construtor chamado sem opção. */
const LABELS = badgeTranslations['pt-BR'].demonstration.labels;

/** O rótulo de cada variante, na chave que o conteúdo publica para ela. */
const VARIANT_LABEL: Record<BadgeVariant, string> = {
  default: LABELS.defaultLabel,
  destructive: LABELS.destructiveLabel,
  warning: LABELS.warningLabel,
  success: LABELS.successLabel,
  info: LABELS.infoLabel,
};

const VARIANTS: readonly BadgeVariant[] = ['default', 'destructive', 'warning', 'success', 'info'];

const IMPORT = `import { Badge } from "@/components/ui/badge";`;
const IMPORT_BUTTON = `import { Button } from "@/components/ui/button";`;

/** A tag de uma etiqueta. `default` omite a prop: é o padrão do componente. */
function badgeTag(variant: BadgeVariant, label: string): string {
  return `<Badge${attrs(variant !== 'default' ? `variant="${variant}"` : '')}>${label}</Badge>`;
}

/** Forma canônica: uma etiqueta de texto curto. Serve o Playground. */
export function badgeSource(_generated?: string, ctx?: { args?: Partial<BadgeArgs> }): string {
  const { variant = 'default' } = ctx?.args ?? {};
  return svelteSnippet(IMPORT, badgeTag(variant, VARIANT_LABEL.default));
}

/**
 * Uma variante isolada, com o rótulo dela. Serve a story de cada variante e o
 * card da seção Variantes da docs page, que passa o rótulo do idioma ativo.
 * Não serve de `transform` direto: o primeiro argumento é a variante.
 */
export function badgeVariantSnippet(
  variant: BadgeVariant = 'default',
  label: string = VARIANT_LABEL[variant],
): string {
  return svelteSnippet(IMPORT, badgeTag(variant, label));
}

/**
 * Variante padrão: a borda em `primary`, e a prop omitida porque `default` é o
 * padrão do componente. Existe como construtor PRÓPRIO para que a story
 * `Default` declare a transform dela em vez de herdar a do `meta` — a herança
 * acertava por coincidência, já que o `meta` deste arquivo serve o Playground.
 */
export function badgeDefaultSource(): string {
  return badgeVariantSnippet('default');
}

/** Variante destrutiva: a borda em `destructive`; o texto fica neutro, como em todas. */
export function badgeDestructiveSource(): string {
  return badgeVariantSnippet('destructive');
}

/** As cinco variantes juntas — o que elas prometem é serem distinguíveis. */
export function badgeSemanticsSource(): string {
  const tags = VARIANTS.map((v) => `  ${badgeTag(v, VARIANT_LABEL[v])}`).join('\n');
  return svelteSnippet(IMPORT, `<div class="nds-cluster" data-spacing="sm">\n${tags}\n</div>`);
}

/**
 * Opção de rótulo das composições. Objeto, e não string posicional: estes
 * construtores também servem de `transform`, e o Storybook passa o código
 * gerado como PRIMEIRO argumento — uma string ali viraria o rótulo.
 */
export type BadgeLabelSnippetOptions = { label?: string };

/**
 * Composição com ícone: o respiro entre desenho e texto é do componente
 * (`gap` do container + `data-icon`), nunca uma margem posta à mão.
 */
export function badgeWithIconSource(o: BadgeLabelSnippetOptions = {}): string {
  const label = o.label ?? LABELS.statusLabel;
  return svelteSnippet(
    `${IMPORT}
import Check from "@lucide/svelte/icons/check";`,
    `<Badge>
  <Check aria-hidden="true" data-icon="inline-start" />
  ${label}
</Badge>`,
  );
}

/**
 * Composição com contador: o número entra DENTRO da etiqueta, à direita do
 * texto. A peça é neutra de propósito — quem carrega a variante é a borda ao
 * redor, e preencher o número com a cor da variante o deixaria sem contraste.
 */
export function badgeWithCounterSource(o: BadgeLabelSnippetOptions = {}): string {
  const label = o.label ?? LABELS.destructiveLabel;
  return svelteSnippet(
    `import { Badge, BadgeCounter } from "@/components/ui/badge";`,
    `<Badge variant="destructive">
  ${label}
  <BadgeCounter>12</BadgeCounter>
</Badge>`,
  );
}

export type BadgeAsButtonSnippetOptions = {
  /** Texto da etiqueta — `categoryLabel` no conteúdo. */
  label?: string;
  /** Nome acessível do botão — `categoryFilterLabel`: o rótulo curto não basta. */
  accessibleName?: string;
};

/**
 * Composição clicável: a etiqueta dentro do Button do design system (ghost,
 * sm). Quem recebe foco, teclado e nome acessível é o botão.
 */
export function badgeAsButtonSource(o: BadgeAsButtonSnippetOptions = {}): string {
  const label = o.label ?? LABELS.categoryLabel;
  const name = o.accessibleName ?? LABELS.categoryFilterLabel;
  const props = attrsMultilinha(['variant="ghost"', 'size="sm"', `aria-label="${name}"`]);

  return svelteSnippet(
    `${IMPORT}
${IMPORT_BUTTON}`,
    `<Button${props}>
  ${badgeTag('info', label)}
</Button>`,
  );
}

/** Composição como link: o `<a>` recebe foco e navegação; a etiqueta é a aparência. */
export function badgeAsLinkSource(o: BadgeLabelSnippetOptions = {}): string {
  const label = o.label ?? LABELS.categoryLabel;
  return svelteSnippet(
    IMPORT,
    `<a href="#">
  ${badgeTag('info', label)}
</a>`,
  );
}
