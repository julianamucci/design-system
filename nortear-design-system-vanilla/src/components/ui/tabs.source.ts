// Snippet do painel Code do Tabs — ver `@/lib/story-source`.

import {
  chamada,
  importar,
  montar,
  opcoes,
  snippet,
  texto,
  type SourceTransform,
} from '@/lib/story-source';
import type { TabsOrientation, TabsVariant } from './tabs';

/** Um item do conjunto. `content` é o TEXTO do painel, que o snippet monta. */
export type TabsSnippetItem = {
  value: string;
  label: string;
  content: string;
  disabled?: boolean;
};

/**
 * As chaves são as MESMAS dos args da story — inclusive `'aria-label'`, que é o
 * nome canônico da opção e é OBRIGATÓRIO: sem ele o leitor de tela anuncia só
 * "lista de abas", e dois conjuntos na mesma página ficam indistinguíveis.
 */
export type TabsSnippetOptions = {
  defaultValue?: string;
  'aria-label'?: string;
  variant?: TabsVariant;
  orientation?: TabsOrientation;
  class?: string;
  /** Substitui os itens de exemplo quando a story mostra outro conjunto. */
  itens?: TabsSnippetItem[];
  /** Presença liga a linha do callback; string troca a expressão mostrada. */
  onValueChange?: unknown;
};

const CALLBACK_PADRAO = '(valor) => registrarAba(valor)';

const ITENS_PADRAO: TabsSnippetItem[] = [
  { value: 'overview', label: 'Visão geral', content: 'Conteúdo da visão geral.' },
  { value: 'properties', label: 'Propriedades', content: 'Lista de propriedades.' },
  { value: 'examples', label: 'Exemplos', content: 'Exemplos de uso.' },
];

/**
 * O painel é conteúdo que quem consome constrói — a fábrica não o inventa. Ele
 * é escrito aqui, à vista do leitor, e não num `makePanel()` que só existe
 * dentro do arquivo de story.
 */
const FABRICA_DE_PAINEL = `const painel = (texto) => {
  const el = document.createElement('div');
  el.className = 'nds-text-body nds-p-4 nds-rounded-md nds-border-default nds-bg-card';
  el.textContent = texto;
  return el;
};`;

function itensLiterais(itens: TabsSnippetItem[]): string {
  const linhas = itens.map((i) => {
    const partes = [
      `value: ${texto(i.value)}`,
      `label: ${texto(i.label)}`,
      `content: painel(${texto(i.content)})`,
    ];
    if (i.disabled) partes.push('disabled: true');
    return `    { ${partes.join(', ')} },`;
  });
  return `[\n${linhas.join('\n')}\n  ]`;
}

function expressao(valor: unknown): string | undefined {
  if (!valor) return undefined;
  return typeof valor === 'string' ? valor : CALLBACK_PADRAO;
}

function linhasDoConjunto(o: TabsSnippetOptions, itens: TabsSnippetItem[]): string[] {
  return opcoes([
    ['defaultValue', texto(o.defaultValue ?? itens[0].value)],
    ['items', itensLiterais(itens)],
    ['aria-label', texto(o['aria-label'] || 'Seções do componente')],
    ['variant', o.variant && o.variant !== 'default' ? texto(o.variant) : undefined],
    ['orientation', o.orientation === 'vertical' ? texto('vertical') : undefined],
    ['class', o.class ? texto(o.class) : undefined],
    ['onValueChange', expressao(o.onValueChange)],
  ]);
}

/** A chamada real de `createTabs` com as opções da story. */
export function tabsSnippet(o: TabsSnippetOptions = {}): string {
  const itens = o.itens ?? ITENS_PADRAO;

  return snippet(
    importar('tabs', 'createTabs'),
    FABRICA_DE_PAINEL,
    `const abas = ${chamada('createTabs', linhasDoConjunto(o, itens))};`,
    montar('abas'),
  );
}

/**
 * Ícone no gatilho.
 *
 * `label` é texto: a fábrica escreve `textContent` no gatilho. O ícone entra
 * DEPOIS de montado, e é sempre decorativo — o rótulo já descreve a aba, e um
 * ícone anunciado só alongaria o nome sem acrescentar informação.
 */
export function tabsComIconesSnippet(
  itens: Array<TabsSnippetItem & { icon: string }>,
  o: TabsSnippetOptions = {},
): string {
  const icones = [...new Set(itens.map((i) => i.icon))].sort();

  return snippet(
    [importar('tabs', 'createTabs'), `import { ${[...icones, 'createElement'].join(', ')} } from 'lucide';`].join('\n'),
    FABRICA_DE_PAINEL,
    `const abas = ${chamada('createTabs', linhasDoConjunto(o, itens))};`,
    `const icones = {
${itens.map((i) => `  ${i.value}: ${i.icon},`).join('\n')}
};

Object.entries(icones).forEach(([valor, icone]) => {
  const gatilho = abas.querySelector(\`[role="tab"][data-value="\${valor}"]\`);
  if (!gatilho) return;
  const rotulo = document.createElement('span');
  rotulo.textContent = gatilho.textContent;
  gatilho.textContent = '';

  const conteudo = document.createElement('span');
  conteudo.className = 'nds-cluster';
  conteudo.dataset.spacing = 'sm';

  const svg = createElement(icone);
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('class', 'nds-icon-sm nds-shrink-0');

  conteudo.append(svg, rotulo);
  gatilho.append(conteudo);
});`,
    montar('abas'),
  );
}

/**
 * Badge no gatilho, para contador ou status.
 *
 * O badge é conteúdo do gatilho, não um par dele: entra no nome da aba e não
 * vira um segundo alvo de foco. O rótulo continua autoexplicativo sem ele.
 */
export function tabsComBadgeSnippet(
  itens: Array<TabsSnippetItem & { badge?: { text: string; variant?: string } }>,
  o: TabsSnippetOptions = {},
): string {
  const comBadge = itens.filter((i) => i.badge);

  return snippet(
    [importar('tabs', 'createTabs'), importar('badge', 'createBadge')].join('\n'),
    FABRICA_DE_PAINEL,
    `const abas = ${chamada('createTabs', linhasDoConjunto(o, itens))};`,
    `const contadores = [
${comBadge
  .map(
    (i) =>
      `  { value: ${texto(i.value)}, text: ${texto(i.badge!.text)}${
        i.badge!.variant && i.badge!.variant !== 'default' ? `, variant: ${texto(i.badge!.variant)}` : ''
      } },`,
  )
  .join('\n')}
];

contadores.forEach(({ value, text, variant }) => {
  const gatilho = abas.querySelector(\`[role="tab"][data-value="\${value}"]\`);
  if (!gatilho) return;
  const rotulo = document.createElement('span');
  rotulo.textContent = gatilho.textContent;
  gatilho.textContent = '';

  const conteudo = document.createElement('span');
  conteudo.className = 'nds-cluster';
  conteudo.dataset.spacing = 'sm';
  conteudo.append(rotulo, createBadge({ text, variant }));
  gatilho.append(conteudo);
});`,
    montar('abas'),
  );
}

/** Transform de story para o gatilho com ícone. */
export function tabsSourceComIcones(
  itens: Array<TabsSnippetItem & { icon: string }>,
  o: TabsSnippetOptions = {},
): SourceTransform<TabsSnippetOptions> {
  return () => tabsComIconesSnippet(itens, o);
}

/** Transform de story para o gatilho com badge. */
export function tabsSourceComBadge(
  itens: Array<TabsSnippetItem & { badge?: { text: string; variant?: string } }>,
  o: TabsSnippetOptions = {},
): SourceTransform<TabsSnippetOptions> {
  return () => tabsComBadgeSnippet(itens, o);
}

/** Transform do `meta` — vale para todas as stories do arquivo. */
export const tabsSource: SourceTransform<TabsSnippetOptions> = (_gerado, ctx) =>
  tabsSnippet(ctx.args ?? {});

/** Transform de story: mesma fábrica, opções fixas que os controls não cobrem. */
export function tabsSourceCom(fixas: TabsSnippetOptions): SourceTransform<TabsSnippetOptions> {
  return (_gerado, ctx) => tabsSnippet({ ...ctx.args, ...fixas });
}
