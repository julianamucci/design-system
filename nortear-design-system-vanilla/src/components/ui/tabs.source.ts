// Snippet do painel Code do Tabs — ver `@/lib/story-source`.

import {
  chamada,
  importing,
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

const CALLBACK_DEFAULT = '(valor) => registrarAba(valor)';

const ITEMS_DEFAULT: TabsSnippetItem[] = [
  { value: 'overview', label: 'Visão geral', content: 'Conteúdo da visão geral.' },
  { value: 'properties', label: 'Propriedades', content: 'Lista de propriedades.' },
  { value: 'examples', label: 'Exemplos', content: 'Exemplos de uso.' },
];

/**
 * O painel é conteúdo que quem consome constrói — a fábrica não o inventa. Ele
 * é escrito aqui, à vista do leitor, e não num `makePanel()` que só existe
 * dentro do arquivo de story.
 */
const PANEL_FABRICA = `const painel = (texto) => {
  const el = document.createElement('div');
  el.className = 'nds-text-body nds-p-4 nds-rounded-md nds-border-default nds-bg-card';
  el.textContent = texto;
  return el;
};`;

function itemsLiterais(itens: TabsSnippetItem[]): string {
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
  return typeof valor === 'string' ? valor : CALLBACK_DEFAULT;
}

function conjuntoLines(o: TabsSnippetOptions, itens: TabsSnippetItem[]): string[] {
  return opcoes([
    ['defaultValue', texto(o.defaultValue ?? itens[0].value)],
    ['items', itemsLiterais(itens)],
    ['aria-label', texto(o['aria-label'] || 'Seções do componente')],
    ['variant', o.variant && o.variant !== 'default' ? texto(o.variant) : undefined],
    ['orientation', o.orientation === 'vertical' ? texto('vertical') : undefined],
    ['class', o.class ? texto(o.class) : undefined],
    ['onValueChange', expressao(o.onValueChange)],
  ]);
}

/** A chamada real de `createTabs` com as opções da story. */
export function tabsSnippet(o: TabsSnippetOptions = {}): string {
  const itens = o.itens ?? ITEMS_DEFAULT;

  return snippet(
    importing('tabs', 'createTabs'),
    PANEL_FABRICA,
    `const abas = ${chamada('createTabs', conjuntoLines(o, itens))};`,
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
export function tabsWithIconsSnippet(
  itens: Array<TabsSnippetItem & { icon: string }>,
  o: TabsSnippetOptions = {},
): string {
  const icons = [...new Set(itens.map((i) => i.icon))].sort();

  return snippet(
    [importing('tabs', 'createTabs'), `import { ${[...icons, 'createElement'].join(', ')} } from 'lucide';`].join('\n'),
    PANEL_FABRICA,
    `const abas = ${chamada('createTabs', conjuntoLines(o, itens))};`,
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
export function tabsWithBadgeSnippet(
  itens: Array<TabsSnippetItem & { badge?: { text: string; variant?: string } }>,
  o: TabsSnippetOptions = {},
): string {
  const withBadge = itens.filter((i) => i.badge);

  return snippet(
    [importing('tabs', 'createTabs'), importing('badge', 'createBadge')].join('\n'),
    PANEL_FABRICA,
    `const abas = ${chamada('createTabs', conjuntoLines(o, itens))};`,
    `const contadores = [
${withBadge
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
export function tabsSourceWithIcons(
  itens: Array<TabsSnippetItem & { icon: string }>,
  o: TabsSnippetOptions = {},
): SourceTransform<TabsSnippetOptions> {
  return () => tabsWithIconsSnippet(itens, o);
}

/** Transform de story para o gatilho com badge. */
export function tabsSourceWithBadge(
  itens: Array<TabsSnippetItem & { badge?: { text: string; variant?: string } }>,
  o: TabsSnippetOptions = {},
): SourceTransform<TabsSnippetOptions> {
  return () => tabsWithBadgeSnippet(itens, o);
}

/** Transform do `meta` — vale para todas as stories do arquivo. */
export const tabsSource: SourceTransform<TabsSnippetOptions> = (_gerado, ctx) =>
  tabsSnippet(ctx.args ?? {});

/** Transform de story: mesma fábrica, opções fixas que os controls não cobrem. */
export function tabsSourceWith(fixas: TabsSnippetOptions): SourceTransform<TabsSnippetOptions> {
  return (_gerado, ctx) => tabsSnippet({ ...ctx.args, ...fixas });
}
