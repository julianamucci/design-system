/**
 * Transforms do painel Code do Badge.
 *
 * Módulo próprio, e não função solta no arquivo de story, porque é o que põe
 * estes construtores sob o `source-snippets.test.ts`: aquela guarda varre
 * `./**\/*.source.ts` por glob e CHAMA cada export para ler a saída. Construtor
 * inline é função local — nem exportada, nem alcançável —, então o que ele
 * publica ao leitor não tem portão nenhum. Exportar do próprio `.stories.ts`
 * não serve: export que não é story vira uma story fantasma na barra lateral.
 *
 * Um construtor por story, e a docs page chama os MESMOS: o código do card de
 * composição é o que o painel Code da story mostra, sem segunda cópia.
 *
 * Chamáveis SEM argumento, como a convenção da stack pede: os args da story são
 * opcionais e caem no padrão do componente, que é justamente o uso canônico.
 */
import type { BadgeVariant } from './badge';
import { useTranslation } from '@/lib/i18n';
import badgeTranslations from '@shared/content/badge/translations.json';

const { t } = useTranslation(badgeTranslations as Record<string, unknown>);

/**
 * Rótulos que o snippet INTERPOLA e as stories consultam — o mesmo texto no
 * exemplo e na asserção. Funções, e não valores: o idioma é lido na chamada.
 */
export const LABEL = {
  default: () => t('demonstration.labels.defaultLabel'),
  destructive: () => t('demonstration.labels.destructiveLabel'),
  warning: () => t('demonstration.labels.warningLabel'),
  success: () => t('demonstration.labels.successLabel'),
  info: () => t('demonstration.labels.infoLabel'),
  status: () => t('demonstration.labels.statusLabel'),
  category: () => t('demonstration.labels.categoryLabel'),
  categoryFilter: () => t('demonstration.labels.categoryFilterLabel'),
};

export type BadgeArgs = {
  variant: BadgeVariant;
  label: string;
};

/** As cinco variantes na ordem do conteúdo compartilhado. */
const VARIANTS: readonly BadgeVariant[] = ['default', 'destructive', 'warning', 'success', 'info'];

/** Número do contador nas stories e na docs page — texto pronto, já truncado. */
const COUNT = '12';

/** `variant` só entra quando difere do padrão: repetir o default ensina ruído. */
function variantAttr(variant: BadgeVariant): string {
  return variant === 'default' ? '' : ` variant="${variant}"`;
}

/** Um `<span ndsBadge>` numa linha — a peça que quase todo snippet repete. */
function badgeTag(variant: BadgeVariant, label: string): string {
  return `<span ndsBadge${variantAttr(variant)}>${label}</span>`;
}

/** Envelope de componente standalone, igual em todos os construtores. */
function example(imports: string[], importLines: string[], template: string): string {
  return `${importLines.join('\n')}

@Component({
  imports: [${imports.join(', ')}],
  template: \`
${template}
  \`,
})
export class Example {}`;
}

const IMPORT_BADGE = "import { NdsBadge } from '@/components/ui/badge';";

/** Transform do Playground — acompanha os controls. */
export function badgePlaygroundSource(
  _generated?: string,
  ctx: { args?: Partial<BadgeArgs> } = {},
): string {
  const { variant = 'default', label = LABEL.default() } = ctx.args ?? {};
  return example(['NdsBadge'], [IMPORT_BADGE], `    ${badgeTag(variant, label)}`);
}

/** Story `Default` — sem `variant`, porque `default` é o padrão. */
export function badgeDefaultSource(): string {
  return example(['NdsBadge'], [IMPORT_BADGE], `    ${badgeTag('default', LABEL.default())}`);
}

/** Story `Destructive`. */
export function badgeDestructiveSource(): string {
  return example(
    ['NdsBadge'],
    [IMPORT_BADGE],
    `    ${badgeTag('destructive', LABEL.destructive())}`,
  );
}

/**
 * Story `Semantics` — as cinco lado a lado. O assunto é o conjunto: uma
 * etiqueta sozinha não mostra que as bordas são distinguíveis entre si.
 */
export function badgeSemanticsSource(): string {
  const tags = VARIANTS.map((v) => `      ${badgeTag(v, LABEL[v]())}`).join('\n');
  return example(
    ['NdsBadge'],
    [IMPORT_BADGE],
    `    <div class="nds-cluster" data-spacing="sm">\n${tags}\n    </div>`,
  );
}

/**
 * Story `WithIcon` — o ícone vem antes do rótulo, marcado com
 * `data-icon="inline-start"` (encurta o respiro daquele lado). O `NdsButtonIcon`
 * já sai com `aria-hidden="true"`: o nome da etiqueta é só o texto.
 */
export function badgeWithIconSource(): string {
  return example(
    ['NdsBadge', 'NdsButtonIcon'],
    [IMPORT_BADGE, "import { NdsButtonIcon } from '@/components/ui/button';"],
    `    <span ndsBadge>
      <svg ndsButtonIcon kind="check" size="sm" data-icon="inline-start"></svg>
      ${LABEL.status()}
    </span>`,
  );
}

/**
 * Story `WithCounter` — o contador é peça DENTRO da etiqueta, à direita do
 * rótulo. Neutro em qualquer variante: a cor fica na borda ao redor.
 */
export function badgeWithCounterSource(): string {
  return example(
    ['NdsBadge', 'NdsBadgeCounter'],
    ["import { NdsBadge, NdsBadgeCounter } from '@/components/ui/badge';"],
    `    <span ndsBadge variant="destructive">
      ${LABEL.destructive()}
      <span ndsBadgeCounter>${COUNT}</span>
    </span>`,
  );
}

/**
 * Story `AsButton` — a etiqueta dentro do Button do design system, ghost e sm.
 * Quem recebe foco, clique e nome acessível é o botão; a etiqueta não ganha
 * `tabindex`.
 */
export function badgeAsButtonSource(): string {
  return example(
    ['NdsBadge', 'NdsButton'],
    [IMPORT_BADGE, "import { NdsButton } from '@/components/ui/button';"],
    `    <button ndsButton variant="ghost" size="sm" aria-label="${LABEL.categoryFilter()}">
      ${badgeTag('info', LABEL.category())}
    </button>`,
  );
}

/**
 * Story `AsLink` — a etiqueta dentro de um `<a>`. O link é o controle; com o
 * ponteiro em cima, a folha troca o fundo da etiqueta para `--secondary`.
 */
export function badgeAsLinkSource(): string {
  return example(
    ['NdsBadge'],
    [IMPORT_BADGE],
    `    <a href="#">
      ${badgeTag('info', LABEL.category())}
    </a>`,
  );
}

/** Snippet de uma variante isolada, para o card da seção Variantes. */
export function badgeVariantSnippet(variant: BadgeVariant = 'default'): string {
  return badgeTag(variant, LABEL[variant]());
}
