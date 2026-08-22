// Snippet do painel Code do NavigationMenu — ver `@/lib/story-source`.
//
// A fábrica recebe os itens como PRIMEIRO ARGUMENTO POSICIONAL e as opções como
// segundo — `createNavigationMenu(items, options)`. O `chamada()` compartilhado
// monta `createX({ … })`, que é a forma das fábricas de argumento único; a
// montagem da chamada com lista posicional é local a este módulo.

import {
  importar,
  montar,
  opcoes,
  snippet,
  texto,
  type SourceTransform,
} from '@/lib/story-source';
import type { NavigationMenuOrientation } from './navigation-menu';

/** Um destino do painel. */
export type NavigationMenuChildSnippet = {
  label: string;
  href: string;
  description?: string;
};

/** Um item da barra: destino direto, ou gatilho quando tem filhos. */
export type NavigationMenuItemSnippet = {
  label: string;
  href?: string;
  value?: string;
  active?: boolean;
  children?: NavigationMenuChildSnippet[];
};

/** O que as stories do NavigationMenu usam. */
export type NavigationMenuSnippetOptions = {
  /** Estrutura da barra. Sem ela vale a barra canônica de cabeçalho de site. */
  items?: NavigationMenuItemSnippet[];
  orientation?: NavigationMenuOrientation;
  delayDuration?: number;
  skipDelayDuration?: number;
  defaultValue?: string;
  class?: string;
  /**
   * Nome do landmark.
   *
   * A fábrica nomeia a barra sozinha, e um nome genérico serve enquanto houver
   * uma só na página — a partir da segunda, dois landmarks homônimos são
   * indistinguíveis para quem navega por eles.
   */
  ariaLabel?: string;
  /** Mostra a linha que solta os ouvintes da barra. */
  destroy?: boolean;
};

const NAME_DEFAULT = 'Navegação principal';

const ITEMS_DEFAULT: NavigationMenuItemSnippet[] = [
  { label: 'Início', href: '#inicio' },
  {
    label: 'Produtos',
    children: [
      { label: 'Plano Inicial', href: '#inicial' },
      { label: 'Plano Profissional', href: '#profissional' },
    ],
  },
  { label: 'Sobre', href: '#sobre' },
];

/** `{ a: 1, b: 2 }` numa linha só. */
function objeto(linhas: string[]): string {
  if (linhas.length === 0) return '{}';
  return `{ ${linhas.map((l) => l.replace(/,$/, '')).join(', ')} }`;
}

function serializarTarget(filho: NavigationMenuChildSnippet, recuo: string): string {
  const base = opcoes([
    ['label', texto(filho.label)],
    ['href', texto(filho.href)],
    ['description', filho.description ? texto(filho.description) : undefined],
  ]);
  const inline = `${recuo}${objeto(base)},`;
  if (inline.length <= 92) return inline;
  return `${recuo}{\n${base.map((l) => `${recuo}  ${l}`).join('\n')}\n${recuo}},`;
}

function serializarItem(item: NavigationMenuItemSnippet, recuo: string): string {
  const base = opcoes([
    ['label', texto(item.label)],
    ['href', item.href ? texto(item.href) : undefined],
    ['value', item.value ? texto(item.value) : undefined],
    // `aria-current="page"` sai daqui: é o que o leitor anuncia E o que a folha
    // usa para pintar o destaque, num atributo só.
    ['active', item.active ? 'true' : undefined],
  ]);

  if (!item.children?.length) return `${recuo}${objeto(base)},`;

  const filhos = item.children.map((f) => serializarTarget(f, `${recuo}    `)).join('\n');
  return `${recuo}{
${base.map((l) => `${recuo}  ${l}`).join('\n')}
${recuo}  children: [
${filhos}
${recuo}  ],
${recuo}},`;
}

function serializarItems(itens: NavigationMenuItemSnippet[]): string {
  return `[\n${itens.map((i) => serializarItem(i, '  ')).join('\n')}\n]`;
}

/** As linhas do segundo argumento, compartilhadas pelas formas de snippet. */
function optionLines(o: NavigationMenuSnippetOptions): string[] {
  return opcoes([
    ['orientation', o.orientation && o.orientation !== 'horizontal' ? texto(o.orientation) : undefined],
    ['delayDuration', o.delayDuration !== undefined && o.delayDuration !== 200 ? String(o.delayDuration) : undefined],
    [
      'skipDelayDuration',
      o.skipDelayDuration !== undefined && o.skipDelayDuration !== 300 ? String(o.skipDelayDuration) : undefined,
    ],
    ['defaultValue', o.defaultValue ? texto(o.defaultValue) : undefined],
    ['class', o.class ? texto(o.class) : undefined],
  ]);
}

/** O bloco que cria a barra e a nomeia — comum a todas as formas de snippet. */
function barBlock(o: NavigationMenuSnippetOptions, itens: NavigationMenuItemSnippet[]): string {
  const linhas = optionLines(o);
  const segundo = linhas.length ? `, ${objeto(linhas)}` : '';
  return `const barra = createNavigationMenu(${serializarItems(itens)}${segundo});
barra.setAttribute('aria-label', ${texto(o.ariaLabel ?? NAME_DEFAULT)});`;
}

/** A chamada real de `createNavigationMenu` com a estrutura e as opções da story. */
export function navigationMenuSnippet(o: NavigationMenuSnippetOptions = {}): string {
  return snippet(
    importar('navigation-menu', 'createNavigationMenu'),
    barBlock(o, o.items ?? ITEMS_DEFAULT),
    montar('barra'),
    // A barra registra ouvinte no documento. Sair da página dispara a limpeza
    // sozinha; `destroy()` é o caminho de quem desmonta antes disso.
    o.destroy ? `barra.destroy();` : undefined,
  );
}

/**
 * Painel em duas colunas.
 *
 * A largura e as colunas vêm das utilities compartilhadas: o painel padrão é
 * uma coluna, e o resto é composição de quem usa — nada em `style` inline, que
 * ficaria de fora do tema e da escala.
 */
export function navigationMenuMegaSnippet(o: NavigationMenuSnippetOptions = {}): string {
  return snippet(
    importar('navigation-menu', 'createNavigationMenu'),
    barBlock(o, o.items ?? ITEMS_DEFAULT),
    `const painel = barra.querySelector<HTMLElement>('.nds-navigation-menu-content');
if (painel) {
  painel.classList.add('nds-grid', 'nds-w-lg');
  painel.setAttribute('data-fixed', '');
  painel.dataset.cols = '2';
  painel.dataset.spacing = 'sm';
}`,
    montar('barra'),
  );
}

/**
 * Painel com destino em destaque ao lado dos complementares.
 *
 * O destaque ocupa a coluna inteira e os demais empilham na outra — a hierarquia
 * aparece pelo tamanho, sem depender de cor.
 */
export function navigationMenuHighlightSnippet(o: NavigationMenuSnippetOptions = {}): string {
  return snippet(
    importar('navigation-menu', 'createNavigationMenu'),
    barBlock(o, o.items ?? ITEMS_DEFAULT),
    `const painel = barra.querySelector<HTMLElement>('.nds-navigation-menu-content');
if (painel) {
  painel.classList.add('nds-grid', 'nds-w-lg');
  painel.setAttribute('data-fixed', '');
  painel.dataset.cols = '2';
  painel.dataset.spacing = 'sm';

  const [destaque, ...apoio] = [
    ...painel.querySelectorAll<HTMLElement>('.nds-navigation-menu-child'),
  ];
  destaque.classList.add('nds-h-full');

  const coluna = document.createElement('div');
  coluna.className = 'nds-stack';
  coluna.dataset.spacing = 'xs';
  for (const link of apoio) coluna.appendChild(link);
  painel.appendChild(coluna);
}`,
    montar('barra'),
  );
}

/**
 * Barra em modo CONTROLADO.
 *
 * Definir `value` é o que troca o modo: a interação deixa de mover a barra e
 * passa a apenas ANUNCIAR por `onValueChange`. Nada abre até `setValue()` — é o
 * que permite manter a barra em sincronia com a rota ou com o resto da tela.
 */
export function navigationMenuControlledSnippet(o: NavigationMenuSnippetOptions = {}): string {
  const itens = o.items ?? [
    { label: 'Início', href: '#inicio' },
    {
      label: 'Produtos',
      value: 'produtos',
      children: [
        { label: 'Plano Inicial', href: '#inicial' },
        { label: 'Plano Profissional', href: '#profissional' },
      ],
    },
  ];

  return snippet(
    importar('navigation-menu', 'createNavigationMenu'),
    `const barra = createNavigationMenu(${serializarItems(itens)}, {
  // Definir \`value\` é o que troca o modo. Vazio quer dizer "nenhum aberto".
  value: '',
  onValueChange: (valor) => registrarPedido(valor),
});
barra.setAttribute('aria-label', ${texto(o.ariaLabel ?? NAME_DEFAULT)});`,
    montar('barra'),
    `// Nada se move enquanto quem controla não mandar.
barra.setValue('produtos');
barra.getValue(); // 'produtos'`,
  );
}

/** Transform do `meta` — vale para todas as stories do arquivo. */
export const navigationMenuSource: SourceTransform<NavigationMenuSnippetOptions> = (_gerado, ctx) =>
  navigationMenuSnippet(ctx.args ?? {});

/** Transform de story: mesma fábrica, estrutura e opções que os controls não cobrem. */
export function navigationMenuSourceWith(
  fixas: NavigationMenuSnippetOptions,
): SourceTransform<NavigationMenuSnippetOptions> {
  return (_gerado, ctx) => navigationMenuSnippet({ ...ctx.args, ...fixas });
}

/** Transform de story para o painel em duas colunas. */
export function navigationMenuSourceMega(
  fixas: NavigationMenuSnippetOptions = {},
): SourceTransform<NavigationMenuSnippetOptions> {
  return () => navigationMenuMegaSnippet(fixas);
}

/** Transform de story para o painel com destino em destaque. */
export function navigationMenuSourceHighlight(
  fixas: NavigationMenuSnippetOptions = {},
): SourceTransform<NavigationMenuSnippetOptions> {
  return () => navigationMenuHighlightSnippet(fixas);
}

/** Transform de story para a barra em modo controlado. */
export function navigationMenuSourceControlled(
  fixas: NavigationMenuSnippetOptions = {},
): SourceTransform<NavigationMenuSnippetOptions> {
  return () => navigationMenuControlledSnippet(fixas);
}
