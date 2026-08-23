// Snippet do painel Code do Collapsible — ver `@/lib/story-source`.

import {
  chamada,
  importing,
  montar,
  opcoes,
  snippet,
  texto,
  type SourceTransform,
} from '@/lib/story-source';

/** Rótulo padrão do gatilho nas stories deste componente. */
const TRIGGER_DEFAULT = 'Exibir filtros avançados';

/**
 * O painel é conteúdo de quem consome — a fábrica não o inventa. O snippet
 * monta o dele com DOM curto e classes do design system, e não com o
 * `makeContent()` que só existe dentro do arquivo de story.
 */
const PANEL = [
  'const painel = document.createElement(\'div\');',
  "painel.className = 'nds-stack nds-rounded-md nds-border-default nds-bg-muted-soft nds-p-4';",
  "painel.dataset.spacing = 'sm';",
  "painel.textContent = 'Filtro avançado 1';",
].join('\n');

/** O que a story usa da `CollapsibleOptions` e que o snippet precisa mostrar. */
export type CollapsibleSnippetOptions = {
  /** Rótulo do gatilho. */
  trigger?: string;
  /** Estado inicial no modo não-controlado. */
  defaultOpen?: boolean;
  disabled?: boolean;
  /** Corpo do callback de mudança, quando a story o exercita. */
  onOpenChange?: string;
  class?: string;
};

/** O texto do callback só entra quando é texto: nos args ele chega como função. */
function callbackBody(valor: unknown): string | undefined {
  return typeof valor === 'string' && valor.length > 0 ? valor : undefined;
}

function optionsComuns(o: CollapsibleSnippetOptions, gatilho: string): string[] {
  return opcoes([
    ['trigger', gatilho],
    ['content', 'painel'],
    ['defaultOpen', o.defaultOpen ? 'true' : undefined],
    ['disabled', o.disabled ? 'true' : undefined],
    ['onOpenChange', callbackBody(o.onOpenChange)],
    ['class', o.class ? texto(o.class) : undefined],
  ]);
}

/** A chamada real de `createCollapsible` com um gatilho de texto. */
export function collapsibleSnippet(o: CollapsibleSnippetOptions = {}): string {
  return snippet(
    importing('collapsible', 'createCollapsible'),
    PANEL,
    `const colapsavel = ${chamada(
      'createCollapsible',
      optionsComuns(o, texto(o.trigger ?? TRIGGER_DEFAULT)),
    )};`,
    montar('colapsavel'),
  );
}

/**
 * Gatilho como ELEMENTO, e não como texto.
 *
 * Forma própria porque a diferença é estrutural: um `HTMLButtonElement` é usado
 * como está — a fábrica escreve `aria-expanded`, `aria-controls` e `data-state`
 * NELE, sem embrulhar em outro botão. É o que permite o botão do design system
 * ser o gatilho.
 */
export function collapsibleWithTriggerSnippet(
  o: CollapsibleSnippetOptions & { chevron?: boolean } = {},
): string {
  const chevron = o.chevron
    ? [
        '// O ícone é de quem consome (lucide, sprite, o que for) — aqui ele já',
        '// chega pronto em `chevron`. O design system entra com a CLASSE:',
        '// `.nds-chevron` gira 180° quando o gatilho está aberto, porque o',
        '// Collapsible escreve `data-state` no próprio botão.',
        "chevron.classList.add('nds-icon', 'nds-chevron');",
        'gatilho.appendChild(chevron);',
      ].join('\n')
    : undefined;

  return snippet(
    [importing('button', 'createButton'), importing('collapsible', 'createCollapsible')].join('\n'),
    `const gatilho = ${chamada('createButton', opcoes([
      ['variant', texto('outline')],
      ['label', texto(o.trigger ?? TRIGGER_DEFAULT)],
    ]))};`,
    chevron,
    PANEL,
    `const colapsavel = ${chamada('createCollapsible', optionsComuns(o, 'gatilho'))};`,
    montar('colapsavel'),
  );
}

/**
 * Modo CONTROLADO.
 *
 * Forma própria porque a posse do estado muda de lado: passar `open` faz o
 * clique no gatilho apenas PROPOR o novo valor, e quem escreve no DOM é quem
 * chama, por `setOpen`.
 */
export function collapsibleControlledSnippet(o: CollapsibleSnippetOptions = {}): string {
  const lines = opcoes([
    ['trigger', texto(o.trigger ?? TRIGGER_DEFAULT)],
    ['content', 'painel'],
    ['open', 'aberto'],
    ['onOpenChange', 'definir'],
    ['class', o.class ? texto(o.class) : undefined],
  ]);

  return snippet(
    importing('collapsible', 'createCollapsible'),
    PANEL,
    '// A fonte da verdade mora aqui, fora do componente.\nlet aberto = false;',
    `const colapsavel = ${chamada('createCollapsible', lines)};`,
    [
      'function definir(valor: boolean): void {',
      '  aberto = valor;',
      '  colapsavel.setOpen(valor);',
      '}',
    ].join('\n'),
    montar('colapsavel'),
  );
}

/**
 * Transform do `meta` — vale para todas as stories do arquivo. Lê os controls
 * do Playground; nas stories sem args cai nos padrões da fábrica.
 */
export const collapsibleSource: SourceTransform<CollapsibleSnippetOptions> = (_gerado, ctx) =>
  collapsibleSnippet(ctx.args ?? {});

/** Transform de story: mesma fábrica, opções fixas que os controls não cobrem. */
export function collapsibleSourceWith(
  fixas: CollapsibleSnippetOptions,
): SourceTransform<CollapsibleSnippetOptions> {
  return (_gerado, ctx) => collapsibleSnippet({ ...ctx.args, ...fixas });
}

/** Transform de story para o gatilho como elemento. */
export function collapsibleWithTriggerSource(
  fixas: CollapsibleSnippetOptions & { chevron?: boolean },
): SourceTransform<CollapsibleSnippetOptions> {
  return (_gerado, ctx) => collapsibleWithTriggerSnippet({ ...ctx.args, ...fixas });
}

/** Transform de story para o modo controlado. */
export function collapsibleControlledSource(
  fixas: CollapsibleSnippetOptions = {},
): SourceTransform<CollapsibleSnippetOptions> {
  return (_gerado, ctx) => collapsibleControlledSnippet({ ...ctx.args, ...fixas });
}
