// Snippet do painel Code do Toggle — ver `@/lib/story-source`.

import {
  chamada,
  importar,
  montar,
  opcoes,
  snippet,
  texto,
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
  const comTexto = Boolean(o.label);
  // O ícone segue o caso: com texto visível o par canônico é ícone + rótulo.
  const icone = o.icon ?? (comTexto ? 'Eye' : 'Bold');

  // Ícone e texto são filhos DIRETOS — o espaço entre eles é o `gap` do próprio
  // `.nds-toggle`, e a medida do ícone vem da regra `.nds-toggle > svg`.
  const children = comTexto
    ? `[createElement(${icone}), ${texto(o.label as string)}]`
    : `createElement(${icone})`;

  const linhas = opcoes([
    ['children', children],
    // Sem texto visível o nome acessível é obrigatório: `aria-pressed` sozinho
    // faz o leitor anunciar "pressionado" sem dizer o quê.
    ['aria-label', comTexto ? undefined : texto(o['aria-label'] || 'Negrito')],
    ['variant', o.variant && o.variant !== 'default' ? texto(o.variant) : undefined],
    ['size', o.size && o.size !== 'default' ? texto(o.size) : undefined],
    ['pressed', o.pressed ? 'true' : undefined],
    ['disabled', o.disabled ? 'true' : undefined],
    ['class', o.class ? texto(o.class) : undefined],
    ['onClick', o.onClick ? (typeof o.onClick === 'string' ? o.onClick : CALLBACK_DEFAULT) : undefined],
  ]);

  return snippet(
    [importar('toggle', 'createToggle'), `import { ${icone}, createElement } from 'lucide';`].join('\n'),
    `const alternador = ${chamada('createToggle', linhas)};`,
    montar('alternador'),
  );
}

/**
 * Uma fileira de toggles — a forma das stories que mostram uma escada de
 * variações lado a lado. O agrupador é o `nds-cluster` do design system, não um
 * `cluster()` que só existe dentro do arquivo de story.
 */
export function toggleRowSnippet(variacoes: ToggleSnippetOptions[]): string {
  const icones = new Set<string>(['createElement']);
  const chamadas = variacoes.map((v) => {
    const comTexto = Boolean(v.label);
    const icone = v.icon ?? (comTexto ? 'Eye' : 'Bold');
    icones.add(icone);
    const linhas = opcoes([
      [
        'children',
        comTexto
          ? `[createElement(${icone}), ${texto(v.label as string)}]`
          : `createElement(${icone})`,
      ],
      ['aria-label', comTexto ? undefined : texto(v['aria-label'] || 'Negrito')],
      ['variant', v.variant && v.variant !== 'default' ? texto(v.variant) : undefined],
      ['size', v.size && v.size !== 'default' ? texto(v.size) : undefined],
      ['pressed', v.pressed ? 'true' : undefined],
      ['disabled', v.disabled ? 'true' : undefined],
    ]);
    return `  ${chamada('createToggle', linhas)},`;
  });

  const nomes = [...icones].filter((n) => n !== 'createElement').sort();
  return snippet(
    [
      importar('toggle', 'createToggle'),
      `import { ${[...nomes, 'createElement'].join(', ')} } from 'lucide';`,
    ].join('\n'),
    `const fileira = document.createElement('div');
fileira.className = 'nds-cluster';
fileira.dataset.spacing = 'sm';
fileira.append(
${chamadas.join('\n')}
);`,
    montar('fileira'),
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
export function toggleBarSnippet(itens: ToggleSnippetOptions[], nomeDoGrupo: string): string {
  const icones = itens.map((i) => i.icon ?? 'Bold');
  const chamadas = itens.map((i) =>
    `  ${chamada(
      'createToggle',
      opcoes([
        ['children', `createElement(${i.icon ?? 'Bold'})`],
        ['aria-label', texto(i['aria-label'] || 'Negrito')],
        ['variant', i.variant && i.variant !== 'default' ? texto(i.variant) : undefined],
      ]),
    )},`,
  );

  return snippet(
    [
      importar('toggle', 'createToggle'),
      `import { ${[...new Set(icones)].join(', ')}, createElement } from 'lucide';`,
    ].join('\n'),
    `const barra = document.createElement('div');
barra.className = 'nds-cluster nds-rounded-lg nds-border-default nds-p-1';
barra.dataset.spacing = 'xs';
barra.dataset.align = 'center';
barra.setAttribute('role', 'group');
barra.setAttribute('aria-label', ${texto(nomeDoGrupo)});
barra.append(
${chamadas.join('\n')}
);`,
    montar('barra'),
  );
}

/** Transform de story para a barra de formatação. */
export function toggleSourceBar(
  itens: ToggleSnippetOptions[],
  nomeDoGrupo: string,
): SourceTransform<ToggleSnippetOptions> {
  return () => toggleBarSnippet(itens, nomeDoGrupo);
}

/**
 * Toggle inválido. O anel vermelho é da regra
 * `.nds-toggle[aria-invalid="true"]` da folha compartilhada — o snippet marca o
 * atributo e aponta a mensagem, e não pinta nada por conta própria.
 */
export function toggleInvalidoSnippet(): string {
  return snippet(
    [importar('toggle', 'createToggle'), `import { Bold, createElement } from 'lucide';`].join('\n'),
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
