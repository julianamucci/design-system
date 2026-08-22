// Snippet do painel Code do Sidebar — ver `@/lib/story-source`.

import {
  chamada,
  importing,
  opcoes,
  snippet,
  texto,
  type SourceTransform,
} from '@/lib/story-source';
import { SIDEBAR_MOBILE_QUERY, type SidebarSide, type SidebarVariant } from './sidebar';

/** Um item de navegação. `icon` é o NOME do ícone lucide mostrado no snippet. */
export type SidebarItemSnippet = {
  label: string;
  href?: string;
  active?: boolean;
  badge?: string;
  icon?: string;
};

export type SidebarGroupSnippet = {
  label?: string;
  items: SidebarItemSnippet[];
};

/** O que as stories usam da `SidebarOptions`, mais as peças que elas compõem. */
export type SidebarSnippetOptions = {
  defaultOpen?: boolean;
  side?: SidebarSide;
  variant?: SidebarVariant;
  mobileQuery?: string;
  /** Presença liga a linha do callback; string troca a expressão mostrada. */
  onOpenChange?: unknown;
  /** Idem, para a abertura e o fechamento da gaveta. */
  onMobileOpenChange?: unknown;
  /** Nome do marco de navegação que envolve a barra. */
  navLabel?: string;
  grupos?: SidebarGroupSnippet[];
  /** Nome acessível do campo de busca no cabeçalho. Ausente = sem busca. */
  search?: string;
  /** Rótulo do item do rodapé. `false` monta a barra sem rodapé. */
  rodape?: string | false;
  /** `false` monta a página sem gatilho — a barra fica sempre visível. */
  withTrigger?: boolean;
  /** Mostra o `destroy()` — quem tira a barra da página o chama. */
  mostrarDestroy?: boolean;
};

const CALLBACK_COLUMN = '(aberta) => registrarBarra(aberta)';
const CALLBACK_GAVETA = '(aberta) => registrarGaveta(aberta)';

const GROUPS_DEFAULT: SidebarGroupSnippet[] = [
  {
    label: 'Navegação',
    items: [
      { label: 'Dashboard', href: '#', active: true, icon: 'House' },
      { label: 'Componentes', href: '#', icon: 'LayoutGrid' },
      { label: 'Tokens', href: '#', icon: 'Layers' },
    ],
  },
];

function expressao(valor: unknown, padrao: string): string | undefined {
  if (!valor) return undefined;
  return typeof valor === 'string' ? valor : padrao;
}

function iconsOf(grupos: SidebarGroupSnippet[], extras: string[] = []): string[] {
  const names = new Set<string>(extras);
  for (const grupo of grupos) for (const item of grupo.items) if (item.icon) names.add(item.icon);
  return [...names].sort();
}

/** `import { House, createElement } from 'lucide';` — só quando há ícone. */
function importingIcons(names: string[]): string | undefined {
  if (names.length === 0) return undefined;
  return `import { ${[...names, 'createElement'].join(', ')} } from 'lucide';`;
}

// ─── Peças da página ─────────────────────────────────────────────────────────

/**
 * A barra e o painel interno.
 *
 * `barra.element` é a raiz; o que recebe cabeçalho, conteúdo e rodapé é o painel
 * interno, que é onde a folha compartilhada desenha a coluna.
 */
function barBlock(o: SidebarSnippetOptions): string {
  const linhas = opcoes([
    // `true`, `left` e `sidebar` são os padrões da fábrica: nenhum entra.
    ['defaultOpen', o.defaultOpen === false ? 'false' : undefined],
    ['side', o.side === 'right' ? texto('right') : undefined],
    ['variant', o.variant && o.variant !== 'sidebar' ? texto(o.variant) : undefined],
    [
      'mobileQuery',
      o.mobileQuery && o.mobileQuery !== SIDEBAR_MOBILE_QUERY ? texto(o.mobileQuery) : undefined,
    ],
    ['onOpenChange', expressao(o.onOpenChange, CALLBACK_COLUMN)],
    ['onMobileOpenChange', expressao(o.onMobileOpenChange, CALLBACK_GAVETA)],
  ]);

  return `const barra = ${chamada('createSidebar', linhas)};
const interno = barra.element.querySelector('[data-sidebar="sidebar"]')!;`;
}

function headerBlock(o: SidebarSnippetOptions): string {
  const search = o.search
    ? `

// O nome acessível é obrigatório: o \`placeholder\` some no primeiro caractere
// digitado, e um campo que perde o nome ao ser usado é um campo sem nome.
cabecalho.appendChild(
  createSidebarInput({ 'aria-label': ${texto(o.search)}, placeholder: 'Buscar...' }),
);`
    : '';

  return `const cabecalho = createSidebarHeader();
const marca = document.createElement('div');
marca.className = 'nds-text-body nds-font-semibold nds-px-2 nds-py-1';
marca.textContent = 'Design System';
cabecalho.appendChild(marca);${search}`;
}

function literalDoItem(item: SidebarItemSnippet): string {
  const partes = [`label: ${texto(item.label)}`];
  if (item.icon) partes.push(`icon: createElement(${item.icon})`);
  if (item.href) partes.push(`href: ${texto(item.href)}`);
  if (item.active) partes.push('active: true');
  if (item.badge) partes.push(`badge: ${texto(item.badge)}`);
  return `{ ${partes.join(', ')} }`;
}

function groupLiteral(grupo: SidebarGroupSnippet, recuo: string): string {
  const rotulo = grupo.label ? `${recuo}  label: ${texto(grupo.label)},\n` : '';
  return `${recuo}createSidebarGroup({
${rotulo}${recuo}  items: [
${grupo.items.map((i) => `${recuo}    ${literalDoItem(i)},`).join('\n')}
${recuo}  ],
${recuo}}),`;
}

function contentBlock(grupos: SidebarGroupSnippet[]): string {
  // Entre grupos entra a linha do próprio componente: é ela que separa dois
  // conjuntos de navegação, e ela se anuncia como divisor.
  const corpo = grupos
    .flatMap((grupo, i) => (i === 0 ? [] : ['  createSidebarSeparator(),']).concat(groupLiteral(grupo, '  ')))
    .join('\n');

  return `const conteudo = createSidebarContent();
conteudo.append(
${corpo}
);`;
}

function footerBlock(rotulo: string): string {
  return `const rodape = createSidebarFooter();
const menuDoRodape = createSidebarMenu();
menuDoRodape.appendChild(
  createSidebarMenuItem({ label: ${texto(rotulo)}, icon: createElement(User), href: '#' }),
);
rodape.appendChild(menuDoRodape);`;
}

/**
 * O marco de navegação e a área principal.
 *
 * A barra é a navegação principal da aplicação, e a fábrica NÃO impõe o
 * elemento: quem compõe é que decide o rótulo. Sem o `<nav aria-label>` o leitor
 * de tela não lista a barra como região, e quem navega por marcos não chega até
 * ela. Dois marcos com o mesmo nome também não servem — daí o nome próprio.
 */
function pageBlock(o: SidebarSnippetOptions): string {
  const gatilho =
    o.withTrigger === false
      ? `// Sem gatilho: a barra fica sempre visível, como num painel fixo.`
      : `principal.appendChild(createSidebarTrigger(barra.toggle));`;

  return `const nav = document.createElement('nav');
nav.setAttribute('aria-label', ${texto(o.navLabel ?? 'Navegação principal')});
nav.appendChild(barra.element);

// \`createSidebarInset\` devolve um \`<main>\`: é o marco principal da página.
const principal = createSidebarInset();
${gatilho}

const pagina = createSidebarProvider();
pagina.append(nav, principal);`;
}

function blockFinal(o: SidebarSnippetOptions): string {
  const destroy = o.mostrarDestroy
    ? `

// O atalho Ctrl+B é registrado no \`document\` na MONTAGEM: quem tira a barra da
// página chama \`destroy()\` para não deixar o ouvinte para trás.
barra.destroy();`
    : '';
  return `document.querySelector('#app')?.append(pagina);${destroy}`;
}

const IMPORTS_STRUCTURE = [
  'createSidebar',
  'createSidebarContent',
  'createSidebarHeader',
  'createSidebarInset',
  'createSidebarProvider',
];

// ─── Snippets ────────────────────────────────────────────────────────────────

/** A composição canônica: barra com cabeçalho, grupos de navegação e rodapé. */
export function sidebarSnippet(o: SidebarSnippetOptions = {}): string {
  const grupos = o.grupos ?? GROUPS_DEFAULT;
  const withFooter = o.rodape !== false;
  const footerLabel = typeof o.rodape === 'string' ? o.rodape : 'Perfil';

  const names = [
    ...IMPORTS_STRUCTURE,
    'createSidebarGroup',
    ...(grupos.length > 1 ? ['createSidebarSeparator'] : []),
    ...(withFooter ? ['createSidebarFooter', 'createSidebarMenu', 'createSidebarMenuItem'] : []),
    ...(o.search ? ['createSidebarInput'] : []),
    ...(o.withTrigger === false ? [] : ['createSidebarTrigger']),
  ].sort();

  return snippet(
    [
      importing('sidebar', ...names),
      importingIcons(iconsOf(grupos, withFooter ? ['User'] : [])),
    ]
      .filter(Boolean)
      .join('\n'),
    barBlock(o),
    headerBlock(o),
    contentBlock(grupos),
    withFooter ? footerBlock(footerLabel) : undefined,
    withFooter
      ? `interno.append(cabecalho, conteudo, rodape);`
      : `interno.append(cabecalho, conteudo);`,
    pageBlock(o),
    blockFinal(o),
  );
}

/**
 * O grupo montado peça a peça.
 *
 * Forma própria porque as sub-fábricas SÃO o assunto: o rótulo com `id` que
 * nomeia a lista por `aria-labelledby`, a ação no canto do grupo, e o item com
 * botão, contador ancorado e ação flutuante como três irmãos dentro do mesmo
 * `<li>`. O atalho `createSidebarGroup` esconderia todas elas.
 */
export function sidebarWithActionsSnippet(o: SidebarSnippetOptions = {}): string {
  const names = [
    ...IMPORTS_STRUCTURE,
    'createSidebarGroupAction',
    'createSidebarGroupContent',
    'createSidebarGroupLabel',
    'createSidebarMenu',
    'createSidebarMenuAction',
    'createSidebarMenuBadge',
    'createSidebarMenuButton',
    'createSidebarMenuItem',
    'createSidebarRail',
    'createSidebarTrigger',
  ].sort();

  return snippet(
    [
      importing('sidebar', ...names),
      importingIcons(['Ellipsis', 'LayoutGrid', 'Plus']),
    ].join('\n'),
    barBlock(o),
    headerBlock({}),
    `const grupo = document.createElement('div');
grupo.className = 'nds-sidebar-group';
grupo.setAttribute('data-sidebar', 'group');

// O \`id\` do rótulo é o que a lista aponta: sem a ligação, a <ul> é anunciada
// como "lista, 3 itens" e o rótulo ao lado é só pintura.
grupo.appendChild(createSidebarGroupLabel({ text: 'Projetos', id: 'grupo-projetos' }));
grupo.appendChild(
  createSidebarGroupAction({
    'aria-label': 'Adicionar projeto',
    icon: createElement(Plus),
    onClick: () => adicionarProjeto(),
  }),
);`,
    `const menu = createSidebarMenu({ 'aria-labelledby': 'grupo-projetos' });

const item = createSidebarMenuItem();
item.appendChild(
  createSidebarMenuButton({
    label: 'Nortear',
    // O contador ao lado é \`aria-hidden\`, então a contagem entra no NOME do
    // item — senão o número seria anunciado solto, sem dizer de quê.
    'aria-label': 'Nortear, 12 pendências',
    icon: createElement(LayoutGrid),
    href: '#',
    active: true,
  }),
);
item.appendChild(createSidebarMenuBadge({ text: '12' }));
item.appendChild(
  createSidebarMenuAction({
    'aria-label': 'Mais opções de Nortear',
    icon: createElement(Ellipsis),
    showOnHover: true,
    onClick: () => abrirOpcoes(),
  }),
);
menu.appendChild(item);

const conteudoDoGrupo = createSidebarGroupContent();
conteudoDoGrupo.appendChild(menu);
grupo.appendChild(conteudoDoGrupo);`,
    `const conteudo = createSidebarContent();
conteudo.appendChild(grupo);
interno.append(cabecalho, conteudo);

// A faixa é irmã do conteúdo, dentro do painel: ela faz o mesmo que o gatilho e
// por isso fica fora da ordem de tabulação.
interno.appendChild(createSidebarRail(barra.toggle));`,
    pageBlock(o),
    blockFinal(o),
  );
}

/**
 * O item com sub-menu.
 *
 * Forma própria porque o recolhimento NÃO é do componente: a fábrica entrega a
 * lista aninhada e quem compõe liga `aria-expanded` do item pai à visibilidade
 * dela. Um snippet com o atalho de grupo esconderia esse par.
 */
export function sidebarWithSubmenuSnippet(o: SidebarSnippetOptions = {}): string {
  const names = [
    ...IMPORTS_STRUCTURE,
    'createSidebarGroupContent',
    'createSidebarGroupLabel',
    'createSidebarMenu',
    'createSidebarMenuButton',
    'createSidebarMenuItem',
    'createSidebarMenuSub',
    'createSidebarMenuSubButton',
    'createSidebarMenuSubItem',
    'createSidebarTrigger',
  ].sort();

  return snippet(
    [importing('sidebar', ...names), importingIcons(['House', 'LayoutGrid'])].join('\n'),
    barBlock(o),
    headerBlock({}),
    `const menu = createSidebarMenu({ 'aria-labelledby': 'grupo-componentes' });
menu.appendChild(
  createSidebarMenuItem({ label: 'Dashboard', icon: createElement(House), href: '#', active: true }),
);`,
    `const itemPai = createSidebarMenuItem();
const botaoPai = createSidebarMenuButton({
  label: 'Componentes',
  icon: createElement(LayoutGrid),
});
// O estado do sub-menu é de quem compõe: a fábrica entrega a lista, não o
// recolhimento.
botaoPai.setAttribute('aria-expanded', 'false');

const subLista = createSidebarMenuSub();
// A lista tem \`display: flex\` na folha compartilhada, então quem a esconde é a
// própria propriedade — o atributo \`hidden\` perderia para a classe.
subLista.style.display = 'none';
for (const sub of [
  { label: 'Alert', href: '#' },
  { label: 'Button', href: '#', active: true },
  { label: 'Card', href: '#' },
  { label: 'Dialog', disabled: true },
]) {
  const subItem = createSidebarMenuSubItem();
  subItem.appendChild(createSidebarMenuSubButton({ ...sub, size: 'sm' }));
  subLista.appendChild(subItem);
}

botaoPai.addEventListener('click', () => {
  const aberto = botaoPai.getAttribute('aria-expanded') === 'true';
  botaoPai.setAttribute('aria-expanded', String(!aberto));
  subLista.style.display = aberto ? 'none' : '';
});

itemPai.append(botaoPai, subLista);
menu.appendChild(itemPai);`,
    `const grupo = document.createElement('div');
grupo.className = 'nds-sidebar-group';
grupo.setAttribute('data-sidebar', 'group');
grupo.appendChild(createSidebarGroupLabel({ text: 'Componentes', id: 'grupo-componentes' }));

const conteudoDoGrupo = createSidebarGroupContent();
conteudoDoGrupo.appendChild(menu);
grupo.appendChild(conteudoDoGrupo);

const conteudo = createSidebarContent();
conteudo.appendChild(grupo);
interno.append(cabecalho, conteudo);`,
    pageBlock(o),
    blockFinal(o),
  );
}

/**
 * O espaço reservado enquanto o menu carrega.
 *
 * Forma própria porque a regra de anúncio é o assunto: só a PRIMEIRA linha ganha
 * nome e vira `role="status"`; as demais ficam `aria-hidden`. Três regiões vivas
 * repetindo o mesmo aviso seria pior que nenhuma.
 */
export function sidebarWithSkeletonSnippet(o: SidebarSnippetOptions = {}): string {
  const names = [
    ...IMPORTS_STRUCTURE,
    'createSidebarGroupContent',
    'createSidebarGroupLabel',
    'createSidebarMenu',
    'createSidebarMenuItem',
    'createSidebarMenuSkeleton',
    'createSidebarTrigger',
  ].sort();

  return snippet(
    importing('sidebar', ...names),
    barBlock(o),
    headerBlock({}),
    `const menu = createSidebarMenu({ 'aria-labelledby': 'grupo-carregando' });

// Só a primeira linha se anuncia: com nome ela vira \`role="status"\`, e sem nome
// a linha inteira é \`aria-hidden\` — um bloco cinza pulsando não é conteúdo.
for (const linha of [
  { showIcon: true, 'aria-label': 'Carregando navegação', width: '70%' },
  { showIcon: true, width: '55%' },
  { showIcon: false, width: '85%' },
]) {
  const item = createSidebarMenuItem();
  item.appendChild(createSidebarMenuSkeleton(linha));
  menu.appendChild(item);
}`,
    `const grupo = document.createElement('div');
grupo.className = 'nds-sidebar-group';
grupo.setAttribute('data-sidebar', 'group');
grupo.appendChild(createSidebarGroupLabel({ text: 'Navegação', id: 'grupo-carregando' }));

const conteudoDoGrupo = createSidebarGroupContent();
conteudoDoGrupo.appendChild(menu);
grupo.appendChild(conteudoDoGrupo);

const conteudo = createSidebarContent();
conteudo.appendChild(grupo);
interno.append(cabecalho, conteudo);`,
    pageBlock(o),
    blockFinal(o),
  );
}

/**
 * Transform do `meta` — vale para todas as stories do arquivo. Lê os controls
 * do Playground; nas stories sem args cai na barra expandida à esquerda, que é
 * o uso canônico do componente.
 */
export const sidebarSource: SourceTransform<SidebarSnippetOptions> = (_gerado, ctx) =>
  sidebarSnippet(ctx.args ?? {});

/** Transform de story: mesmas fábricas, opções fixas que os controls não cobrem. */
export function sidebarSourceWith(
  fixas: SidebarSnippetOptions,
): SourceTransform<SidebarSnippetOptions> {
  return (_gerado, ctx) => sidebarSnippet({ ...ctx.args, ...fixas });
}

/** Transform de story para o grupo montado peça a peça. */
export function sidebarSourceWithActions(
  fixas: SidebarSnippetOptions = {},
): SourceTransform<SidebarSnippetOptions> {
  return (_gerado, ctx) => sidebarWithActionsSnippet({ ...ctx.args, ...fixas });
}

/** Transform de story para o item com sub-menu. */
export function sidebarSourceWithSubmenu(
  fixas: SidebarSnippetOptions = {},
): SourceTransform<SidebarSnippetOptions> {
  return (_gerado, ctx) => sidebarWithSubmenuSnippet({ ...ctx.args, ...fixas });
}

/** Transform de story para o esqueleto de carregamento. */
export function sidebarSourceWithSkeleton(
  fixas: SidebarSnippetOptions = {},
): SourceTransform<SidebarSnippetOptions> {
  return (_gerado, ctx) => sidebarWithSkeletonSnippet({ ...ctx.args, ...fixas });
}
