// Snippet do painel Code do Breadcrumb — ver `@/lib/story-source`.

import {
  importing,
  montar,
  opcoes,
  chamada,
  snippet,
  texto,
  type SourceTransform,
} from '@/lib/story-source';

/**
 * `import` de muitos nomes, quebrado em linhas.
 *
 * O Breadcrumb é uma família de sete fábricas, e a linha única passaria de 150
 * colunas dentro de um painel estreito. `importing` continua valendo para os
 * módulos de um nome só.
 */
function multipleImporting(slug: string, names: string[]): string {
  return names.length <= 3
    ? importing(slug, ...names)
    : `import {\n${names.map((n) => `  ${n},`).join('\n')}\n} from '@/components/ui/${slug}';`;
}

/** O que as stories usam das opções do Breadcrumb e o snippet precisa mostrar. */
export type BreadcrumbSnippetOptions = {
  /** Rótulos dos níveis navegáveis, na ordem em que aparecem. */
  levels?: string[];
  /** Texto do último item — a página atual, que nunca é link. */
  atual?: string;
  /**
   * Nome acessível do landmark de navegação. A opção da fábrica se chama
   * `'aria-label'`, e sem valor vale o padrão dela.
   */
  'aria-label'?: string;
  /** Reticências entre o primeiro nível e os seguintes. */
  ellipsis?: boolean;
  /** Nome acessível das reticências. Sem ele, elas ficam decorativas. */
  ellipsisLabel?: string;
  /** Desenho próprio no lugar do chevron padrão do separador. */
  separator?: string;
  /** Corpo do ouvinte de clique de cada nível, quando a story reporta navegação. */
  onNavigate?: string;
  /**
   * Instruções extras aplicadas ao `<a>` de cada nível — os `data-*` que o
   * roteador do consumidor pendura e que o componente preserva.
   */
  linkSetup?: string;
};

const LEVELS_DEFAULT = ['Início', 'Componentes'];
const CURRENT_DEFAULT = 'Breadcrumb';

/** Acentos combinantes, para o destino sair sem eles. */
const DIACRITICOS = /[̀-ͯ]/g;

/** `/`, `/componentes`, … — o destino que acompanha o rótulo do nível. */
function destination(rotulo: string, indice: number): string {
  if (indice === 0) return '/';
  return `/${rotulo
    .toLowerCase()
    .normalize('NFD')
    .replace(DIACRITICOS, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')}`;
}

/** A linha do separador, com ou sem desenho próprio. */
function separador(o: BreadcrumbSnippetOptions): string {
  return o.separator
    ? `createBreadcrumbSeparator({ content: ${texto(o.separator)} })`
    : 'createBreadcrumbSeparator()';
}

/**
 * A chamada real da família `createBreadcrumb*` com as opções da story.
 *
 * O nível navegável é construído por uma função curta declarada no próprio
 * snippet — é a mesma peça repetida, e escrevê-la duas vezes ensinaria a
 * repetição em vez do componente.
 */
export function breadcrumbSnippet(o: BreadcrumbSnippetOptions = {}): string {
  const levels = o.levels ?? LEVELS_DEFAULT;
  const atual = o.atual ?? CURRENT_DEFAULT;

  const names = [
    'createBreadcrumb',
    'createBreadcrumbList',
    'createBreadcrumbItem',
    'createBreadcrumbLink',
    'createBreadcrumbPage',
    'createBreadcrumbSeparator',
  ];
  if (o.ellipsis) names.push('createBreadcrumbEllipsis');

  const raiz = chamada(
    'createBreadcrumb',
    opcoes([['aria-label', o['aria-label'] ? texto(o['aria-label']) : undefined]]),
  );

  const levelBody =
    o.onNavigate || o.linkSetup
      ? [
          '  const link = createBreadcrumbLink({ href, text });',
          o.linkSetup ? `  ${o.linkSetup}` : undefined,
          o.onNavigate
            ? `  link.addEventListener('click', (evento) => {
    evento.preventDefault();
    ${o.onNavigate}
  });`
            : undefined,
          '  item.appendChild(link);',
        ]
          .filter(Boolean)
          .join('\n')
      : '  item.appendChild(createBreadcrumbLink({ href, text }));';

  const parts: string[] = [];
  levels.forEach((rotulo, i) => {
    parts.push(`  nivel(${texto(rotulo)}, ${texto(destination(rotulo, i))}),`);
    parts.push(`  ${separador(o)},`);
    if (o.ellipsis && i === 0) {
      parts.push('  oculto,');
      parts.push(`  ${separador(o)},`);
    }
  });
  parts.push('  atual,');

  const ellipsisBlock = o.ellipsis
    ? `const oculto = createBreadcrumbItem();
oculto.appendChild(${chamada(
        'createBreadcrumbEllipsis',
        opcoes([['aria-label', o.ellipsisLabel ? texto(o.ellipsisLabel) : undefined]]),
      )});`
    : undefined;

  return snippet(
    multipleImporting('breadcrumb', names),
    `const trilha = ${raiz};
const lista = createBreadcrumbList();`,
    `/** Um nível navegável da trilha. */
const nivel = (text: string, href: string) => {
  const item = createBreadcrumbItem();
${levelBody}
  return item;
};`,
    ellipsisBlock,
    `const atual = createBreadcrumbItem();
atual.appendChild(createBreadcrumbPage({ text: ${texto(atual)} }));`,
    `lista.append(\n${parts.join('\n')}\n);\ntrilha.appendChild(lista);`,
    montar('trilha'),
  );
}

/**
 * Transform do `meta` — vale para todas as stories do arquivo. Sem args, cai na
 * trilha canônica de dois níveis mais a página atual.
 */
export const breadcrumbSource: SourceTransform<BreadcrumbSnippetOptions> = (_gerado, ctx) =>
  breadcrumbSnippet(ctx.args ?? {});

/** Transform de story: mesma família, opções fixas que os controls não cobrem. */
export function breadcrumbSourceWith(
  fixas: BreadcrumbSnippetOptions,
): SourceTransform<BreadcrumbSnippetOptions> {
  return (_gerado, ctx) => breadcrumbSnippet({ ...ctx.args, ...fixas });
}

// ─── Trilha responsiva, com os níveis ocultos num menu ────────────────────────

/** O que a composição com menu precisa mostrar. */
export type BreadcrumbWithMenuSnippetOptions = {
  /** Rótulos dos níveis que ficaram colapsados. */
  ocultos?: string[];
  /** Nome acessível do gatilho que abre os níveis ocultos. */
  gatilho?: string;
  /** Primeiro nível, o único que continua visível ao lado das reticências. */
  primeiro?: string;
  /** Texto da página atual. */
  atual?: string;
};

/**
 * Trilha responsiva: as reticências viram o conteúdo de um gatilho, e o gatilho
 * abre o menu com os níveis que não couberam.
 *
 * O gatilho é `createButton`, e não um `<button>` cru com estilo escrito à mão:
 * quem nomeia e quem recebe o foco é ele, as reticências dentro dele ficam
 * decorativas — senão o controle teria dois nomes —, e a aparência sai do
 * design system em vez de sair de valores soltos.
 */
export function breadcrumbWithMenuSnippet(o: BreadcrumbWithMenuSnippetOptions = {}): string {
  const ocultos = o.ocultos ?? ['Documentação', 'Guia', 'Componentes'];
  const gatilho = o.gatilho ?? 'Expandir níveis ocultos';
  const primeiro = o.primeiro ?? 'Início';
  const atual = o.atual ?? CURRENT_DEFAULT;

  return snippet(
    [
      multipleImporting('breadcrumb', [
        'createBreadcrumb',
        'createBreadcrumbEllipsis',
        'createBreadcrumbItem',
        'createBreadcrumbLink',
        'createBreadcrumbList',
        'createBreadcrumbPage',
        'createBreadcrumbSeparator',
      ]),
      importing('button', 'createButton'),
      importing('dropdown-menu', 'createDropdownMenu'),
    ].join('\n'),
    `// Quem nomeia e quem recebe o foco é o gatilho; as reticências dentro dele
// ficam decorativas, senão o controle teria dois nomes.
const gatilho = createButton({
  variant: 'ghost',
  size: 'icon-sm',
  'aria-label': ${texto(gatilho)},
  children: createBreadcrumbEllipsis(),
});`,
    `const oculto = createBreadcrumbItem();
oculto.appendChild(
  createDropdownMenu({
    trigger: gatilho,
    items: [
${ocultos.map((rotulo) => `      { label: ${texto(rotulo)} },`).join('\n')}
    ],
  }),
);`,
    `const primeiro = createBreadcrumbItem();
primeiro.appendChild(createBreadcrumbLink({ href: '/', text: ${texto(primeiro)} }));

const atual = createBreadcrumbItem();
atual.appendChild(createBreadcrumbPage({ text: ${texto(atual)} }));`,
    `const trilha = createBreadcrumb();
const lista = createBreadcrumbList();
lista.append(
  primeiro,
  createBreadcrumbSeparator(),
  oculto,
  createBreadcrumbSeparator(),
  atual,
);
trilha.appendChild(lista);`,
    montar('trilha'),
  );
}

/** Transform de story para a trilha responsiva. */
export function breadcrumbWithMenuSourceWith(
  fixas: BreadcrumbWithMenuSnippetOptions = {},
): SourceTransform<BreadcrumbWithMenuSnippetOptions> {
  return (_gerado, ctx) => breadcrumbWithMenuSnippet({ ...ctx.args, ...fixas });
}
