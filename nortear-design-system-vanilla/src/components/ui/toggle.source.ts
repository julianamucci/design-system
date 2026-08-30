// Snippet do painel Code do Toggle — ver `@/lib/story-source`.

import {
  callLine,
  importing,
  appendLine,
  options,
  snippet,
  text,
  type SourceTransform,
} from '@/lib/story-source';
import type { ToggleSize, ToggleVariant } from './toggle';

/**
 * As chaves são as MESMAS dos args da story — inclusive `'aria-label'`, que é o
 * nome canônico da opção na fábrica. Assim `{ ...ctx.args }` entra sem tradução
 * e não há um segundo vocabulário para manter em dia.
 */
export type ToggleSnippetOptions = {
  pressed?: boolean;
  disabled?: boolean;
  variant?: ToggleVariant;
  size?: ToggleSize;
  /** Texto visível ao lado do ícone. Vazio = toggle só de ícone. */
  label?: string;
  'aria-label'?: string;
  /** Nome do ícone lucide mostrado no snippet. */
  icon?: string;
  /** Presença liga a linha do callback; string troca a expressão mostrada. */
  onClick?: unknown;
  class?: string;
};

const CALLBACK_DEFAULT = '(pressed) => alternar(pressed)';

/** A chamada real de `createToggle` com as opções da story. */
export function toggleSnippet(o: ToggleSnippetOptions = {}): string {
  const withText = Boolean(o.label);
  // O ícone segue o caso: com texto visível o par canônico é ícone + rótulo.
  const icone = o.icon ?? (withText ? 'Eye' : 'Bold');

  // Ícone e texto são filhos DIRETOS — o espaço entre eles é o `gap` do próprio
  // `.nds-toggle`, e a medida do ícone vem da regra `.nds-toggle > svg`.
  const children = withText
    ? `[createElement(${icone}), ${text(o.label as string)}]`
    : `createElement(${icone})`;

  const lines = options([
    ['children', children],
    // Sem texto visível o nome acessível é obrigatório: `aria-pressed` sozinho
    // faz o leitor anunciar "pressionado" sem dizer o quê.
    ['aria-label', withText ? undefined : text(o['aria-label'] || 'Negrito')],
    ['variant', o.variant && o.variant !== 'default' ? text(o.variant) : undefined],
    ['size', o.size && o.size !== 'default' ? text(o.size) : undefined],
    ['pressed', o.pressed ? 'true' : undefined],
    ['disabled', o.disabled ? 'true' : undefined],
    ['class', o.class ? text(o.class) : undefined],
    ['onClick', o.onClick ? (typeof o.onClick === 'string' ? o.onClick : CALLBACK_DEFAULT) : undefined],
  ]);

  return snippet(
    [importing('toggle', 'createToggle'), `import { ${icone}, createElement } from 'lucide';`].join('\n'),
    `const alternador = ${callLine('createToggle', lines)};`,
    appendLine('alternador'),
  );
}

/**
 * Uma fileira de toggles — a forma das stories que mostram uma escada de
 * variações lado a lado. O agrupador é o `nds-cluster` do design system, não um
 * `cluster()` que só existe dentro do arquivo de story.
 */
export function toggleRowSnippet(variacoes: ToggleSnippetOptions[]): string {
  const icons = new Set<string>(['createElement']);
  const calls = variacoes.map((v) => {
    const withText = Boolean(v.label);
    const icone = v.icon ?? (withText ? 'Eye' : 'Bold');
    icons.add(icone);
    const lines = options([
      [
        'children',
        withText
          ? `[createElement(${icone}), ${text(v.label as string)}]`
          : `createElement(${icone})`,
      ],
      ['aria-label', withText ? undefined : text(v['aria-label'] || 'Negrito')],
      ['variant', v.variant && v.variant !== 'default' ? text(v.variant) : undefined],
      ['size', v.size && v.size !== 'default' ? text(v.size) : undefined],
      ['pressed', v.pressed ? 'true' : undefined],
      ['disabled', v.disabled ? 'true' : undefined],
    ]);
    return `  ${callLine('createToggle', lines)},`;
  });

  const names = [...icons].filter((n) => n !== 'createElement').sort();
  return snippet(
    [
      importing('toggle', 'createToggle'),
      `import { ${[...names, 'createElement'].join(', ')} } from 'lucide';`,
    ].join('\n'),
    `const fileira = document.createElement('div');
fileira.className = 'nds-cluster';
fileira.dataset.spacing = 'sm';
fileira.append(
${calls.join('\n')}
);`,
    appendLine('fileira'),
  );
}

/** Transform de story para uma fileira de variações. */
export function toggleSourceRow(variacoes: ToggleSnippetOptions[]): SourceTransform<ToggleSnippetOptions> {
  return () => toggleRowSnippet(variacoes);
}

/**
 * Barra de formatação: toggles independentes dentro de um `role="group"` com
 * nome próprio. Sem o nome, o leitor anuncia "grupo" e mais nada.
 */
export function toggleBarSnippet(items: ToggleSnippetOptions[], nomeDoGrupo: string): string {
  const icons = items.map((i) => i.icon ?? 'Bold');
  const calls = items.map((i) =>
    `  ${callLine(
      'createToggle',
      options([
        ['children', `createElement(${i.icon ?? 'Bold'})`],
        ['aria-label', text(i['aria-label'] || 'Negrito')],
        ['variant', i.variant && i.variant !== 'default' ? text(i.variant) : undefined],
      ]),
    )},`,
  );

  return snippet(
    [
      importing('toggle', 'createToggle'),
      `import { ${[...new Set(icons)].join(', ')}, createElement } from 'lucide';`,
    ].join('\n'),
    `const barra = document.createElement('div');
barra.className = 'nds-cluster nds-rounded-lg nds-border-default nds-p-1';
barra.dataset.spacing = 'xs';
barra.dataset.align = 'center';
barra.setAttribute('role', 'group');
barra.setAttribute('aria-label', ${text(nomeDoGrupo)});
barra.append(
${calls.join('\n')}
);`,
    appendLine('barra'),
  );
}

/** Transform de story para a barra de formatação. */
export function toggleSourceBar(
  items: ToggleSnippetOptions[],
  nomeDoGrupo: string,
): SourceTransform<ToggleSnippetOptions> {
  return () => toggleBarSnippet(items, nomeDoGrupo);
}

/**
 * Toggle inválido. O anel vermelho é da regra
 * `.nds-toggle[aria-invalid="true"]` da folha compartilhada — o snippet marca o
 * atributo e aponta a mensagem, e não pinta nada por conta própria.
 */
export function toggleInvalidoSnippet(): string {
  return snippet(
    [importing('toggle', 'createToggle'), `import { Bold, createElement } from 'lucide';`].join('\n'),
    `const alternador = createToggle({
  children: createElement(Bold),
  'aria-label': 'Negrito',
});
alternador.setAttribute('aria-invalid', 'true');
alternador.setAttribute('aria-describedby', 'toggle-invalid-msg');`,
    `const mensagem = document.createElement('p');
mensagem.id = 'toggle-invalid-msg';
mensagem.className = 'nds-text-body nds-text-destructive';
mensagem.textContent = 'Selecione ao menos uma formatação.';`,
    `document.querySelector('#app')?.append(alternador, mensagem);`,
  );
}

/** Transform de story para o estado inválido. */
export const toggleSourceInvalido: SourceTransform<ToggleSnippetOptions> = () =>
  toggleInvalidoSnippet();

/** Transform do `meta` — vale para todas as stories do arquivo. */
export const toggleSource: SourceTransform<ToggleSnippetOptions> = (_gerado, ctx) =>
  toggleSnippet(ctx.args ?? {});

/** Transform de story: mesma fábrica, opções fixas que os controls não cobrem. */
export function toggleSourceWith(fixas: ToggleSnippetOptions): SourceTransform<ToggleSnippetOptions> {
  return (_gerado, ctx) => toggleSnippet({ ...ctx.args, ...fixas });
}
