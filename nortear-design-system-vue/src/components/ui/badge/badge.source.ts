/**
 * Transforms do painel Code do Badge.
 *
 * Módulo de TS puro, sem import de `.vue`: é o que deixa as funções rodarem no
 * projeto `unit` do vitest. A saída do painel não chega ao DOM durante a `play`,
 * então este é o único lugar em que elas têm guarda.
 */
import { attr, attrs, indentar, vueSnippet, type SourceTransform } from '@/lib/story-source';
import badgeTranslations from '@shared/content/badge/translations.json';

export type BadgeArgs = {
  variant: 'default' | 'destructive' | 'warning' | 'success' | 'info';
};

const IMPORT = `import { Badge } from '@/components/ui/badge'`;
const IMPORT_WITH_COUNTER = `import { Badge, BadgeCounter } from '@/components/ui/badge'`;
const IMPORT_BUTTON = `import { Button } from '@/components/ui/button'`;

/**
 * Rótulos padrão: saem do conteúdo compartilhado (pt-BR), o MESMO dicionário que
 * story e docs page leem. Cravar o texto aqui deixava o painel Code divergir do
 * conteúdo no dia em que a chave mudasse. A docs page passa os do idioma ativo.
 */
const LABELS = badgeTranslations['pt-BR'].demonstration.labels;

/** Rótulos da etiqueta de categoria — a do gatilho e a do link. */
export type BadgeCategoryLabels = {
  /** Texto da etiqueta (`categoryLabel`). */
  label?: string;
  /** Nome acessível do botão em volta (`categoryFilterLabel`). */
  accessibleName?: string;
};

/** Import do ícone. Ele é reforço visual; quem nomeia o badge é o texto. */
function importIcon(...names: string[]): string {
  return `import { ${names.join(', ')} } from 'lucide-vue-next'`;
}

/**
 * A etiqueta. `variant` some quando é a padrão, e nenhum exemplo escreve `as`:
 * o badge já nasce em elemento inline, que é o que o deixa caber dentro de
 * frase, de título e de célula de tabela.
 */
function badge(variant: string | undefined, content: string): string {
  return `<Badge${attrs(attr('variant', variant, 'default'))}>${content}</Badge>`;
}

/**
 * Forma canônica: o badge é só o texto dentro dele. A variante acompanha o
 * control, e a padrão não é escrita.
 */
export const badgeSource: SourceTransform<BadgeArgs> = (_gerado, ctx) =>
  vueSnippet(IMPORT, badge(ctx?.args?.variant, LABELS.defaultLabel));

/**
 * Uma variante com o rótulo dado — o código dos cartões de variante da docs
 * page, que passa o rótulo do idioma ativo. Sem argumento, a etiqueta padrão.
 */
export function badgeVariantSource(
  variant: BadgeArgs['variant'] = 'default',
  label: string = LABELS.defaultLabel,
): string {
  return vueSnippet(IMPORT, badge(variant, label));
}

/** Ênfase máxima: a borda em `primary`, para o que precisa ser visto primeiro. */
export function badgeDefaultSource(): string {
  return badgeVariantSource('default', LABELS.defaultLabel);
}

/**
 * Alerta: a borda em `destructive`, com o texto neutro. É a combinação que
 * sustenta os 4.5:1 — a cor sinaliza no contorno, o contraste vem do texto.
 */
export function badgeDestructiveSource(): string {
  return badgeVariantSource('destructive', LABELS.destructiveLabel);
}

/**
 * As cinco variantes juntas, porque o que elas prometem é serem DISTINGUÍVEIS
 * entre si: uma destaca, uma alerta, uma avisa, uma confirma e uma contextualiza.
 */
export function badgeSemanticsSource(): string {
  const badges = [
    badge('default', 'Novo'),
    badge('destructive', 'Urgente'),
    badge('warning', 'Vence hoje'),
    badge('success', 'Aprovado'),
    badge('info', 'Novidade'),
  ];
  return vueSnippet(
    IMPORT,
    `<div class="nds-cluster" data-spacing="sm">
${indentar(badges.join('\n'))}
</div>`,
  );
}

/**
 * Ícone junto do texto: o respiro entre os dois é do próprio badge, e
 * `data-icon` diz de que lado o ícone está para que o preenchimento daquele
 * lado encurte. Margem escrita à mão somaria ao respiro e o dobraria.
 */
export function badgeWithIconSource(): string {
  return vueSnippet(
    `${IMPORT}\n${importIcon('Check')}`,
    `<Badge>
  <Check aria-hidden="true" data-icon="inline-start" />
  Ativo
</Badge>`,
  );
}

/**
 * Contador DENTRO da etiqueta: o número fica à direita do texto, na mesma
 * caixa. O rótulo diz de que é a contagem, então quem lê ouve "Urgente 12".
 *
 * O contador é neutro em qualquer variante: a cor da etiqueta vem da borda ao
 * redor, e pintar o número derrubaria o contraste dele em parte dos temas.
 */
export function badgeWithCounterSource(): string {
  return vueSnippet(
    IMPORT_WITH_COUNTER,
    `<Badge variant="destructive">
  Urgente
  <BadgeCounter>12</BadgeCounter>
</Badge>`,
  );
}

/**
 * Badge dentro do Button do design system: quem é focável e clicável é o BOTÃO
 * — o badge não vira controle. O anel de foco mora no botão, e o badge
 * continua sem tabulação própria.
 */
export function badgeAsButtonSource(o: BadgeCategoryLabels = {}): string {
  const label = o.label ?? LABELS.categoryLabel;
  const name = o.accessibleName ?? LABELS.categoryFilterLabel;
  return vueSnippet(
    `${IMPORT}\n${IMPORT_BUTTON}`,
    `<Button variant="ghost" size="sm" aria-label="${name}">
  ${badge('info', label)}
</Button>`,
  );
}

/**
 * Badge dentro de link: foco e navegação são do `<a>`. Com o ponteiro em cima,
 * o fundo da etiqueta sai do neutro para a superfície suave — é a folha que
 * faz, sem classe nem estado escrito à mão.
 */
export function badgeAsLinkSource(o: BadgeCategoryLabels = {}): string {
  return vueSnippet(
    IMPORT,
    `<a href="#">
  ${badge('info', o.label ?? LABELS.categoryLabel)}
</a>`,
  );
}
