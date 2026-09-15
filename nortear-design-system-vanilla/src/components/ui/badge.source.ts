// Snippet do painel Code do Badge — ver `@/lib/story-source`.

import {
  callLine,
  importing,
  appendLine,
  options,
  snippet,
  text,
  type SourceTransform,
} from '@/lib/story-source';
import type { BadgeVariant } from './badge';

export type BadgeSnippetOptions = {
  variant?: BadgeVariant;
  /** Texto da etiqueta — entra na chamada como `children`. */
  label?: string;
  className?: string;
  /** Ícone decorativo antes do texto, no mesmo `children`. */
  withIcon?: boolean;
};

/** A chamada real de `createBadge` com as opções da story. */
export function badgeSnippet(o: BadgeSnippetOptions = {}): string {
  const label = o.label ?? 'Novo';

  const lines = options([
    // `default` é o padrão da fábrica: só as outras variantes entram.
    ['variant', o.variant && o.variant !== 'default' ? text(o.variant) : undefined],
    // `children` aceita texto, elemento ou a lista dos dois — é assim que ícone
    // e rótulo entram juntos, sem sub-fábrica nenhuma.
    ['children', o.withIcon ? `[icon, ${text(label)}]` : text(label)],
    ['className', o.className ? text(o.className) : undefined],
  ]);

  // O ícone é construído À VISTA, com o `createElement` do próprio pacote de
  // ícones: um snippet que chamasse um helper da docs page entregaria a quem
  // copia uma função que ele não tem.
  return snippet(
    o.withIcon
      ? `${importing('badge', 'createBadge')}\nimport { Check, createElement } from 'lucide';`
      : importing('badge', 'createBadge'),
    o.withIcon
      ? `// Ícone decorativo: quem nomeia a etiqueta é o texto. O tamanho vem de
// \`.nds-badge > svg\`, e \`data-icon="inline-start"\` encurta o respiro daquele lado.
const icon = createElement(Check);
icon.setAttribute('aria-hidden', 'true');
icon.setAttribute('data-icon', 'inline-start');`
      : undefined,
    `const badge = ${callLine('createBadge', lines)};`,
    appendLine('badge'),
  );
}

/**
 * Transform do `meta` — vale para todas as stories do arquivo. Lê os controls
 * do Playground; nas stories sem args cai no padrão da fábrica.
 */
export const badgeSource: SourceTransform<BadgeSnippetOptions> = (_generated, ctx) =>
  badgeSnippet(ctx.args ?? {});

/** Transform de story: mesma fábrica, opções fixas que os controls não cobrem. */
export function badgeSourceWith(fixed: BadgeSnippetOptions): SourceTransform<BadgeSnippetOptions> {
  return (_generated, ctx) => badgeSnippet({ ...ctx.args, ...fixed });
}

// ─── Várias etiquetas lado a lado ────────────────────────────────────────────

export type BadgeGroupItem = { variant: BadgeVariant; label: string };

export type BadgeGroupSnippetOptions = {
  items?: readonly BadgeGroupItem[];
};

const DEFAULT_GROUP: readonly BadgeGroupItem[] = [
  { variant: 'default', label: 'Novo' },
  { variant: 'destructive', label: 'Urgente' },
  { variant: 'warning', label: 'Vence hoje' },
  { variant: 'success', label: 'Aprovado' },
  { variant: 'info', label: 'Novidade' },
];

/**
 * FORMA diferente: o assunto é o conjunto, e uma etiqueta sozinha não mostra o
 * que as variantes prometem — ser distinguíveis entre si.
 */
export function badgeGroupSnippet(o: BadgeGroupSnippetOptions = {}): string {
  const items = o.items?.length ? o.items : DEFAULT_GROUP;
  const calls = items
    .map((i) =>
      i.variant === 'default'
        ? `  createBadge({ children: ${text(i.label)} }),`
        : `  createBadge({ variant: ${text(i.variant)}, children: ${text(i.label)} }),`,
    )
    .join('\n');

  return snippet(
    importing('badge', 'createBadge'),
    `const group = document.createElement('div');
group.className = 'nds-cluster';
group.dataset.spacing = 'sm';
group.append(
${calls}
);`,
    appendLine('group'),
  );
}

export function badgeGroupSourceWith(
  fixed: BadgeGroupSnippetOptions,
): SourceTransform<BadgeGroupSnippetOptions> {
  return (_generated, ctx) => badgeGroupSnippet({ ...ctx.args, ...fixed });
}

// ─── Contador dentro da etiqueta ─────────────────────────────────────────────

export type BadgeWithCounterSnippetOptions = {
  variant?: BadgeVariant;
  label?: string;
  /** Número já formatado — acima de 99, a aplicação passa `'99+'`. */
  count?: string;
};

/**
 * FORMA diferente: o `children` recebe a LISTA rótulo + contador, e o contador
 * vem de uma subfábrica própria. Escrever a classe `.nds-badge-counter` à mão
 * na story ensinaria o leitor a ignorar a peça publicada — e é ela que carrega
 * o `data-slot`.
 *
 * O contador é neutro em qualquer variante: a cor da etiqueta vem da borda ao
 * redor, e pintar o número derrubaria o contraste dele em parte dos temas.
 */
export function badgeWithCounterSnippet(o: BadgeWithCounterSnippetOptions = {}): string {
  const variant = o.variant ?? 'destructive';
  const label = o.label ?? 'Urgente';
  const count = o.count ?? '12';

  return snippet(
    importing('badge', 'createBadge', 'createBadgeCounter'),
    `const badge = ${callLine('createBadge', [
      `variant: ${text(variant)},`,
      `children: [${text(label)}, createBadgeCounter({ text: ${text(count)} })],`,
    ])};`,
    appendLine('badge'),
  );
}

export function badgeWithCounterSourceWith(
  fixed: BadgeWithCounterSnippetOptions,
): SourceTransform<BadgeWithCounterSnippetOptions> {
  return (_generated, ctx) => badgeWithCounterSnippet({ ...ctx.args, ...fixed });
}

// ─── Dentro do Button do design system ───────────────────────────────────────

export type BadgeTriggerSnippetOptions = {
  /** Variante da etiqueta dentro do botão — `info`, a neutra discreta, nas cinco stacks. */
  variant?: BadgeVariant;
  label?: string;
  /** Nome acessível do botão — o texto da etiqueta é curto demais para servir. */
  accessibleName?: string;
};

/**
 * FORMA diferente: a etiqueta não é um alvo. Ela não recebe foco, não tem papel
 * e não aceita `tabindex` — quem clica é o Button em volta (ghost, sm), e é dele
 * o nome acessível. Nada de `<button>` cru com a aparência reiniciada à mão: o
 * Button do design system já traz foco visível, alvo e estados.
 */
export function badgeTriggerSnippet(o: BadgeTriggerSnippetOptions = {}): string {
  const label = o.label ?? 'Design';
  const name = o.accessibleName ?? 'Filtrar por Design';
  const variant = o.variant ?? 'info';

  return snippet(
    `${importing('badge', 'createBadge')}\n${importing('button', 'createButton')}`,
    `const trigger = ${callLine('createButton', [
      `variant: 'ghost',`,
      `size: 'sm',`,
      `'aria-label': ${text(name)},`,
      `children: createBadge({ variant: ${text(variant)}, children: ${text(label)} }),`,
    ])};`,
    appendLine('trigger'),
  );
}

export function badgeTriggerSourceWith(
  fixed: BadgeTriggerSnippetOptions,
): SourceTransform<BadgeTriggerSnippetOptions> {
  return (_generated, ctx) => badgeTriggerSnippet({ ...ctx.args, ...fixed });
}

// ─── Dentro de um link ───────────────────────────────────────────────────────

export type BadgeLinkSnippetOptions = {
  /** Variante da etiqueta dentro do link — `info`, a neutra discreta, nas cinco stacks. */
  variant?: BadgeVariant;
  label?: string;
  href?: string;
};

/**
 * FORMA diferente: quem recebe foco e `Enter` é o `<a>`. A etiqueta é filha
 * DIRETA do link — é o que a regra `a > .nds-badge:hover` da folha exige para o
 * fundo reagir ao ponteiro.
 */
export function badgeLinkSnippet(o: BadgeLinkSnippetOptions = {}): string {
  const label = o.label ?? 'Design';
  const href = o.href ?? '#';
  const variant = o.variant ?? 'info';

  return snippet(
    importing('badge', 'createBadge'),
    `const link = document.createElement('a');
link.href = ${text(href)};
link.append(createBadge({ variant: ${text(variant)}, children: ${text(label)} }));`,
    appendLine('link'),
  );
}

export function badgeLinkSourceWith(
  fixed: BadgeLinkSnippetOptions,
): SourceTransform<BadgeLinkSnippetOptions> {
  return (_generated, ctx) => badgeLinkSnippet({ ...ctx.args, ...fixed });
}
