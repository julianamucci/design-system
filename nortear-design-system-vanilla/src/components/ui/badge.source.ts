// Snippet do painel Code do Badge — ver `@/lib/story-source`.

import {
  chamada,
  importing,
  montar,
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
    ['children', o.withIcon ? `[icone, ${text(label)}]` : text(label)],
    ['className', o.className ? text(o.className) : undefined],
  ]);

  return snippet(
    importing('badge', 'createBadge'),
    o.withIcon
      ? `// \`icone\` é um SVG do seu conjunto, decorativo: aria-hidden="true".
// O tamanho vem de \`.nds-badge > svg\` e o respiro do gap da etiqueta —
// margem escrita à mão somaria ao gap e dobraria o espaço.`
      : undefined,
    `const etiqueta = ${chamada('createBadge', lines)};`,
    montar('etiqueta'),
  );
}

/**
 * Transform do `meta` — vale para todas as stories do arquivo. Lê os controls
 * do Playground; nas stories sem args cai no padrão da fábrica.
 */
export const badgeSource: SourceTransform<BadgeSnippetOptions> = (_gerado, ctx) =>
  badgeSnippet(ctx.args ?? {});

/** Transform de story: mesma fábrica, opções fixas que os controls não cobrem. */
export function badgeSourceCom(fixas: BadgeSnippetOptions): SourceTransform<BadgeSnippetOptions> {
  return (_gerado, ctx) => badgeSnippet({ ...ctx.args, ...fixas });
}

// ─── Várias etiquetas lado a lado ────────────────────────────────────────────

export type BadgeGrupoItem = { variant: BadgeVariant; label: string };

export type BadgeGrupoSnippetOptions = {
  items?: readonly BadgeGrupoItem[];
};

const GRUPO_PADRAO: readonly BadgeGrupoItem[] = [
  { variant: 'warning', label: 'Vence hoje' },
  { variant: 'success', label: 'Aprovado' },
  { variant: 'info', label: 'Novidade' },
];

/**
 * FORMA diferente: o assunto é o conjunto, e uma etiqueta sozinha não mostra o
 * que as variantes semânticas prometem — ser distinguíveis entre si.
 */
export function badgeEmGrupoSnippet(o: BadgeGrupoSnippetOptions = {}): string {
  const items = o.items?.length ? o.items : GRUPO_PADRAO;
  const calls = items
    .map((i) => `  createBadge({ variant: ${text(i.variant)}, children: ${text(i.label)} }),`)
    .join('\n');

  return snippet(
    importing('badge', 'createBadge'),
    `const grupo = document.createElement('div');
grupo.className = 'nds-cluster';
grupo.dataset.spacing = 'sm';
grupo.append(
${calls}
);`,
    montar('grupo'),
  );
}

export function badgeEmGrupoSourceCom(
  fixas: BadgeGrupoSnippetOptions,
): SourceTransform<BadgeGrupoSnippetOptions> {
  return (_gerado, ctx) => badgeEmGrupoSnippet({ ...ctx.args, ...fixas });
}

// ─── Dentro de um alvo clicável ──────────────────────────────────────────────

export type BadgeEmGatilhoSnippetOptions = BadgeSnippetOptions & {
  /** O elemento que recebe o clique e o foco. */
  como?: 'link' | 'botao';
  href?: string;
  /** Nome acessível do alvo — o texto da etiqueta é curto demais para servir. */
  accessibleName?: string;
};

/**
 * FORMA diferente: a etiqueta não é um alvo. Ela não recebe foco, não tem papel
 * e não aceita `tabindex` — quem clica é o link ou o botão em volta, e é dele o
 * nome acessível.
 */
export function badgeEmGatilhoSnippet(o: BadgeEmGatilhoSnippetOptions = {}): string {
  const button = o.como === 'botao';
  const label = o.label ?? (button ? 'React' : 'Design');
  const variant = o.variant ?? (button ? 'outline' : 'secondary');
  const name = o.accessibleName ?? (button ? 'Filtrar por React' : 'Ver todos os itens da categoria Design');

  const target = button
    ? `const alvo = document.createElement('button');
alvo.type = 'button';`
    : `const alvo = document.createElement('a');
alvo.href = ${text(o.href ?? '#design')};`;

  return snippet(
    importing('badge', 'createBadge'),
    `${target}
alvo.className = 'nds-cluster nds-rounded-md nds-focus-ring-inset';
alvo.setAttribute('aria-label', ${text(name)});
alvo.appendChild(createBadge({ variant: ${text(variant)}, children: ${text(label)} }));`,
    montar('alvo'),
  );
}

export function triggerSourceWithBadge(
  fixas: BadgeEmGatilhoSnippetOptions,
): SourceTransform<BadgeEmGatilhoSnippetOptions> {
  return (_gerado, ctx) => badgeEmGatilhoSnippet({ ...ctx.args, ...fixas });
}
