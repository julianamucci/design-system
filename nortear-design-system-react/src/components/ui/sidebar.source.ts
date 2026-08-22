/**
 * Transforms do painel Code da Sidebar.
 *
 * Módulo de TS puro — o `.tsx` só entra por `import type`, que o compilador
 * apaga. É o que deixa as funções rodarem no projeto `unit` do vitest, a única
 * guarda que elas têm: a saída do painel não chega ao DOM durante a `play`.
 *
 * ── O que é andaime e fica de fora ───────────────────────────────────────────
 *
 * O painel imprimia a árvore do `render`, e ali dentro convivem duas coisas
 * diferentes. Sai do snippet:
 *
 *  · o `<div className="nds-cluster nds-min-h-100">` do decorator — quadro de
 *    altura para o canvas do Storybook ter contra o que posicionar uma barra
 *    que ocupa a coluna inteira;
 *  · a `key` de remontagem do Playground, que existe só para o control trocar
 *    de variante sem carregar o estado da anterior;
 *  · o texto de mentira da página ("Conteúdo principal", "Use os controles do
 *    painel…", `variant="…"` escrito na tela) — legenda de vitrine;
 *  · `mobileQuery="(min-width: 0px)"` e a classe de marcação da story móvel:
 *    consulta sempre verdadeira e classe de sonda existem para o runner
 *    headless alcançar o ramo da gaveta sem redimensionar a janela.
 *
 * ── O que PARECE andaime e não é ─────────────────────────────────────────────
 *
 *  · **`SidebarProvider`** é o dono do estado aberto/recolhido, do atalho
 *    Ctrl+B, do cookie e da decisão coluna-ou-gaveta. Sem ele o `useSidebar` de
 *    dentro de cada peça lança, e nada renderiza.
 *  · **`SidebarInset`** é o irmão da barra, não um invólucro do conteúdo: a
 *    regra que arredonda o conteúdo na variante encaixada é
 *    `[data-variant="inset"] ~ .nds-sidebar-inset`, e ela morre no instante em
 *    que alguém envolve um dos dois. O cabeçalho com o gatilho mora aqui porque
 *    é da página, não da barra — a barra pode estar fora da tela.
 *  · **`<nav aria-label="…">`** em volta da `<Sidebar>`: sem nome, a barra
 *    entra na lista de marcos do leitor de tela como "navegação" e mais nada,
 *    indistinguível de qualquer outra da página.
 *
 * ── Decisão de composição ────────────────────────────────────────────────────
 *
 * Todo snippet mostra a página inteira — provider, barra dentro da navegação
 * nomeada e conteúdo adjacente —, porque a Sidebar não é um bloco que se
 * encaixa: é um LAYOUT. Um trecho só com `<Sidebar>` compila e não desenha
 * nada. O menu fica curto de propósito (três destinos e o perfil): a quantidade
 * de itens não é o assunto de nenhuma story, e cada item repetido afasta da
 * tela a peça que a story ensina.
 */
import { attrs, jsxSnippet, propBool, propOption, texto, type SourceTransform } from '@/lib/story-source';

export type SidebarArgs = {
  side: 'left' | 'right';
  variant: 'sidebar' | 'floating' | 'inset';
  collapsible: 'offcanvas' | 'icon' | 'none';
  mobileQuery: string;
  defaultOpen: boolean;
};

const LADOS = ['left', 'right'] as const;
const VARIANTES = ['sidebar', 'floating', 'inset'] as const;
const RECOLHIMENTOS = ['offcanvas', 'icon', 'none'] as const;

/** Ponto de virada padrão do Provider — igual ao padrão não entra no snippet. */
const QUERY_DEFAULT = '(max-width: 767px)';

/** Peças que toda composição usa, mesmo a mais curta. */
const NUCLEO = [
  'Sidebar',
  'SidebarContent',
  'SidebarGroup',
  'SidebarGroupContent',
  'SidebarGroupLabel',
  'SidebarHeader',
  'SidebarInset',
  'SidebarMenu',
  'SidebarMenuButton',
  'SidebarMenuItem',
  'SidebarProvider',
];

/** Indenta `conteudo` em `n` níveis de dois espaços. */
function level(conteudo: string, n: number): string {
  const prefixo = '  '.repeat(n);
  return conteudo
    .split('\n')
    .map((linha) => (linha.trim() ? `${prefixo}${linha}` : linha))
    .join('\n');
}

/** Bloco de import do componente, em ordem alfabética e sem repetição. */
function importingSidebar(parts: string[]): string {
  const lista = [...new Set(parts)].sort();
  return `import {
${lista.map((part) => `  ${part},`).join('\n')}
} from "@/components/ui/sidebar";`;
}

/** Import dos ícones usados, quando há algum. */
function importingIcons(icons: string[]): string {
  const lista = [...new Set(icons)].sort();
  return lista.length ? `import { ${lista.join(', ')} } from "lucide-react";` : '';
}

/**
 * Um destino do menu. `aria-current="page"` anda junto de `isActive`: o
 * `data-active` que a prop escreve é para a folha pintar, e quem não vê a cor
 * precisa ouvir que aquele é o item da página aberta.
 */
function destination(
  icone: string,
  rotulo: string,
  opcoes: { ativo?: boolean; depois?: string } = {},
): string {
  const props = attrs(
    opcoes.ativo ? 'isActive' : undefined,
    `tooltip="${rotulo}"`,
    opcoes.ativo ? 'aria-current="page"' : undefined,
  );
  const extra = opcoes.depois ? `\n${level(opcoes.depois, 1)}` : '';
  return `<SidebarMenuItem>
  <SidebarMenuButton${props}>
    <${icone} aria-hidden="true" />
    <span>${rotulo}</span>
  </SidebarMenuButton>${extra}
</SidebarMenuItem>`;
}

/** Grupo nomeado. O rótulo nomeia o menu; a ação do grupo é opcional. */
function grupo(rotulo: string, itens: string[], acao?: string): string {
  const lineAction = acao ? `\n${level(acao, 1)}` : '';
  return `<SidebarGroup>
  <SidebarGroupLabel>${rotulo}</SidebarGroupLabel>${lineAction}
  <SidebarGroupContent>
    <SidebarMenu>
${level(itens.join('\n'), 3)}
    </SidebarMenu>
  </SidebarGroupContent>
</SidebarGroup>`;
}

/** Os três destinos que servem de menu em quase todo snippet. */
function menuDefault(): string[] {
  return [
    destination('LayoutDashboard', 'Dashboard', { ativo: true }),
    destination('Blocks', 'Componentes'),
    destination('Coins', 'Tokens'),
  ];
}

/** Rodapé com o perfil — o item que fica no fim da coluna, longe do menu. */
const FOOTER = `<SidebarFooter>
  <SidebarMenu>
${level(destination('User', 'Perfil'), 2)}
  </SidebarMenu>
</SidebarFooter>`;

const BAR_HEADER = `<SidebarHeader className="nds-p-2">
  <span className="nds-font-semibold nds-text-body nds-text-muted-foreground">
    Design System
  </span>
</SidebarHeader>`;

type Composition = {
  /** Atributos do `SidebarProvider`. */
  provider?: string;
  /** Atributos da `Sidebar`. */
  barra?: string;
  /** Cabeçalho da barra, quando ele carrega mais que a marca. */
  header?: string;
  /** Grupos já montados, na ordem em que aparecem. */
  grupos: string[];
  /** Peças além do núcleo (rodapé, faixa, separador, distintivo…). */
  parts?: string[];
  icons?: string[];
  /** Linhas de estado antes da marcação — só o uso controlado precisa. */
  estado?: string;
  withFooter?: boolean;
  comFaixa?: boolean;
  /** O gatilho some quando não há o que alternar (`collapsible="none"`). */
  withTrigger?: boolean;
};

/**
 * A página inteira: provider, navegação nomeada com a barra dentro e o
 * conteúdo adjacente com o gatilho no cabeçalho. É o menor exemplo que
 * realmente desenha uma sidebar.
 */
function pagina(c: Composition): string {
  const withTrigger = c.withTrigger !== false;
  const parts = [
    ...NUCLEO,
    ...(c.parts ?? []),
    ...(c.withFooter !== false ? ['SidebarFooter'] : []),
    ...(c.comFaixa ? ['SidebarRail'] : []),
    ...(withTrigger ? ['SidebarTrigger'] : []),
  ];

  const importHeader = [
    c.estado ? 'import { useState } from "react";' : '',
    importingSidebar(parts),
    importingIcons(c.icons ?? ['LayoutDashboard', 'Blocks', 'Coins', 'User']),
  ]
    .filter(Boolean)
    .join('\n');

  const barBody = [
    c.header ?? BAR_HEADER,
    `<SidebarContent>
${level(c.grupos.join('\n'), 1)}
</SidebarContent>`,
    ...(c.withFooter !== false ? [FOOTER] : []),
    ...(c.comFaixa ? ['<SidebarRail />'] : []),
  ].join('\n');

  // Sem recolhimento não há o que alternar, e um botão que não muda nada é uma
  // parada de teclado prometendo uma ação inexistente. O conteúdo adjacente
  // continua ali — vazio no exemplo porque a página é de quem consome.
  const conteudo = withTrigger
    ? `<SidebarInset>
    <header className="nds-cluster nds-p-4 nds-border-b" data-spacing="sm">
      <SidebarTrigger />
    </header>
  </SidebarInset>`
    : '<SidebarInset />';

  return jsxSnippet(
    c.estado ? `${importHeader}\n\n${c.estado}` : importHeader,
    `<SidebarProvider${c.provider ?? ''}>
  <nav aria-label="Navegação principal">
    <Sidebar${c.barra ?? ''}>
${level(barBody, 3)}
    </Sidebar>
  </nav>
  ${conteudo}
</SidebarProvider>`,
  );
}

/** Composição de referência: um menu, um rodapé, e nada além disso. */
function barWith(provider: string, barra: string, extras: Partial<Composition> = {}): string {
  return pagina({
    provider,
    barra,
    grupos: [grupo('Menu', menuDefault())],
    ...extras,
  });
}

/**
 * Transform do `meta` — vale para todas as stories do arquivo. Lê os controls
 * do Playground e imprime a barra completa: dois grupos separados, rodapé e
 * faixa. É o exemplo de referência do componente, e por isso o único que mostra
 * a barra inteira; as stories de variante e de estado recortam o que ensinam.
 *
 * Só o que difere do padrão entra: `side="left"`, `variant="sidebar"`,
 * `collapsible="offcanvas"` e o ponto de virada padrão já são o que o
 * componente faz sozinho.
 */
export const sidebarSource: SourceTransform<SidebarArgs> = (_gerado, ctx) => {
  const args = ctx?.args ?? {};
  const consulta = texto(args.mobileQuery);

  return pagina({
    provider: attrs(
      propBool('defaultOpen', args.defaultOpen, true),
      consulta && consulta !== QUERY_DEFAULT ? `mobileQuery="${consulta}"` : undefined,
    ),
    barra: attrs(
      propOption('side', args.side, LADOS, 'left'),
      propOption('variant', args.variant, VARIANTES, 'sidebar'),
      propOption('collapsible', args.collapsible, RECOLHIMENTOS, 'offcanvas'),
    ),
    grupos: [
      grupo('Aplicação', menuDefault()),
      '<SidebarSeparator />',
      grupo('Sistema', [destination('Bell', 'Notificações'), destination('Settings', 'Configurações')]),
    ],
    parts: ['SidebarSeparator'],
    icons: ['LayoutDashboard', 'Blocks', 'Coins', 'Bell', 'Settings', 'User'],
    comFaixa: true,
  });
};

/**
 * Variante padrão. O valor é o mesmo do componente sem prop nenhuma, e mesmo
 * assim vai escrito: numa galeria de variantes, o snippet que não nomeia a
 * variante deixa quem lê sem saber qual das três está vendo.
 */
export function sidebarVariantDefaultSource(): string {
  return barWith('', ' variant="sidebar"');
}

/**
 * Flutuante. A borda, o raio e a sombra caem em `.nds-sidebar-inner` — dentro
 * do painel, não nele —, o que é o motivo de a variante ser um atributo na raiz
 * e não uma classe no elemento que muda de aparência.
 */
export function sidebarVariantFlutuanteSource(): string {
  return barWith('', ' variant="floating"');
}

/**
 * Encaixada. A única variante que muda o CONTEÚDO adjacente: a regra é
 * `[data-variant="inset"] ~ .nds-sidebar-inset`, e ela depende de a barra e o
 * conteúdo serem irmãos diretos. Envolver um dos dois desliga o arredondamento
 * sem erro nenhum na tela.
 */
export function sidebarVariantEncaixadaSource(): string {
  return barWith('', ' variant="inset"');
}

/**
 * Recolhimento para fora da tela. Recolhida, a barra some inteira e o vão que
 * ela ocupava no fluxo zera — o conteúdo ganha a largura toda.
 */
export function sidebarRecolhivelOffcanvasSource(): string {
  return barWith('', ' collapsible="offcanvas"');
}

/**
 * Recolhimento em ícones. Aqui o balão de cada item deixa de ser enfeite: sem
 * rótulo visível, `tooltip` é o que resta para quem usa ponteiro, e é por isso
 * que todo destino já nasce com ele.
 */
export function sidebarRecolhivelIconSource(): string {
  return barWith('', ' collapsible="icon"');
}

/**
 * Sem recolhimento. O gatilho sai do cabeçalho de propósito: não há o que
 * alternar, e um botão que não muda nada é uma parada de teclado que promete
 * uma ação inexistente. A barra também deixa de reservar vão no fluxo — ela É a
 * coluna.
 */
export function sidebarNoRecolhimentoSource(): string {
  return barWith('', ' collapsible="none"', { withTrigger: false });
}

/** Barra à esquerda — o lado padrão, escrito para a galeria poder compará-lo. */
export function sidebarSideEsquerdoSource(): string {
  return barWith('', ' side="left"');
}

/**
 * Barra à direita. `side` posiciona o painel E vira a faixa de arrasto junto:
 * são regras diferentes lendo o mesmo `data-side`, e é por isso que o lado não
 * se resolve com uma classe de alinhamento por fora.
 */
export function sidebarSideDireitoSource(): string {
  return barWith('', ' side="right"');
}

/**
 * Expandida. `defaultOpen` é o estado INICIAL, não o estado: o gatilho, o
 * Ctrl+B e a faixa continuam alternando a partir dele, e o valor escolhido
 * volta no cookie na próxima visita.
 */
export function sidebarExpandidaSource(): string {
  return barWith(' defaultOpen', '');
}

/**
 * Nasce recolhida em ícones. O par `defaultOpen={false}` + `collapsible="icon"`
 * é o que estreita o painel para a largura de um ícone em vez de tirá-lo da
 * tela — recolhida ela continua navegável.
 */
export function iconsSidebarRecolhidaSource(): string {
  return barWith(' defaultOpen={false}', ' collapsible="icon"');
}

/**
 * Nasce recolhida para fora da tela. Diferente do modo de ícones, aqui não
 * sobra coluna nenhuma: o único caminho de volta é o gatilho, que por isso vive
 * no conteúdo e não na barra.
 */
export function sidebarRecolhidaOffcanvasSource(): string {
  return barWith(' defaultOpen={false}', ' collapsible="offcanvas"');
}

/**
 * Carregando. O placeholder ocupa o lugar do item de menu, dentro do mesmo
 * `SidebarMenuItem`: trocar a lista inteira por um bloco cinza faria a navegação
 * saltar quando os itens chegassem.
 */
export function sidebarLoadingSource(): string {
  const item = `<SidebarMenuItem key={posicao}>
  <SidebarMenuSkeleton showIcon />
</SidebarMenuItem>`;

  return pagina({
    grupos: [
      `<SidebarGroup>
  <SidebarGroupLabel>Carregando…</SidebarGroupLabel>
  <SidebarGroupContent>
    <SidebarMenu>
      {[1, 2, 3, 4, 5].map((posicao) => (
${level(item, 4)}
      ))}
    </SidebarMenu>
  </SidebarGroupContent>
</SidebarGroup>`,
    ],
    parts: ['SidebarMenuSkeleton'],
    icons: [],
    withFooter: false,
  });
}

/**
 * Ponto de virada para a gaveta. Abaixo da consulta a barra deixa de ser coluna
 * e passa a ser um diálogo modal sobreposto — com nome, foco preso e devolução
 * do foco ao gatilho no fechamento, tudo do próprio componente.
 *
 * O valor é do PRODUTO, não do design system: uma aplicação com barra mais
 * larga vira mais cedo, e é para isso que a consulta é prop em vez de constante.
 */
export function sidebarMovelSource(): string {
  return barWith(' defaultOpen={false} mobileQuery="(max-width: 1024px)"', '');
}

/**
 * Grupos, contador e ação de grupo. O separador entre grupos vem do componente,
 * e não de uma margem: ele é irmão dos grupos, e é o que dá ao segundo bloco um
 * começo visível sem inventar um segundo nível de título.
 *
 * O contador é texto de APOIO ao lado do item, nunca dentro do botão: dentro,
 * ele entraria no nome acessível e o destino passaria a se chamar
 * "Componentes 12".
 */
export function sidebarGroupsSource(): string {
  return pagina({
    grupos: [
      grupo('Aplicação', [
        destination('LayoutDashboard', 'Dashboard', { ativo: true }),
        destination('Blocks', 'Componentes', { depois: '<SidebarMenuBadge>12</SidebarMenuBadge>' }),
        destination('Coins', 'Tokens'),
      ]),
      '<SidebarSeparator />',
      grupo(
        'Sistema',
        [
          destination('Bell', 'Notificações', { depois: '<SidebarMenuBadge>3</SidebarMenuBadge>' }),
          destination('Settings', 'Configurações'),
        ],
        `<SidebarGroupAction aria-label="Adicionar notificação">
  <Plus aria-hidden="true" />
</SidebarGroupAction>`,
      ),
    ],
    parts: ['SidebarGroupAction', 'SidebarMenuBadge', 'SidebarSeparator'],
    icons: ['LayoutDashboard', 'Blocks', 'Coins', 'Bell', 'Settings', 'User', 'Plus'],
  });
}

/**
 * Submenu aninhado. `aria-expanded` no botão pai é o que separa esta composição
 * de uma lista que simplesmente cresce: sem ele a seta gira só para quem vê, e
 * quem ouve não recebe aviso de que existe um nível abaixo nem de que ele abriu.
 *
 * A rotação sai do estado no DOM — `.nds-chevron` gira sob
 * `[aria-expanded="true"]` —, não de classe condicional em JavaScript.
 */
export function sidebarSubmenuSource(): string {
  const subitem = (rotulo: string, ativo = false) => `<SidebarMenuSubItem>
  <SidebarMenuSubButton${ativo ? ' isActive' : ''}>
    <span>${rotulo}</span>
  </SidebarMenuSubButton>
</SidebarMenuSubItem>`;

  const pai = `<SidebarMenuItem>
  <SidebarMenuButton
    tooltip="Componentes"
    aria-expanded={componentesAbertos}
    onClick={() => setComponentesAbertos((aberto) => !aberto)}
  >
    <Blocks aria-hidden="true" />
    <span>Componentes</span>
    <ChevronRight aria-hidden="true" className="nds-spacer-start nds-chevron" />
  </SidebarMenuButton>
  {componentesAbertos && (
    <SidebarMenuSub>
${level([subitem('Button', true), subitem('Input'), subitem('Select')].join('\n'), 3)}
    </SidebarMenuSub>
  )}
</SidebarMenuItem>`;

  const withAction = destination('Settings', 'Configurações', {
    depois: `<SidebarMenuAction showOnHover aria-label="Mais opções de configurações">
  <ChevronRight aria-hidden="true" />
</SidebarMenuAction>`,
  });

  return pagina({
    barra: ' collapsible="icon"',
    grupos: [
      grupo('Menu', [destination('LayoutDashboard', 'Dashboard', { ativo: true }), pai, withAction]),
    ],
    parts: [
      'SidebarMenuAction',
      'SidebarMenuSub',
      'SidebarMenuSubButton',
      'SidebarMenuSubItem',
    ],
    icons: ['LayoutDashboard', 'Blocks', 'ChevronRight', 'Settings', 'User'],
    estado: `const [componentesAbertos, setComponentesAbertos] = useState(true);`,
  });
}

/**
 * Busca dentro da barra. O campo mora no cabeçalho, acima do conteúdo que
 * rola — filtrar uma lista que já saiu da tela é o mesmo que não filtrar.
 *
 * O rótulo do grupo conta quantos sobraram porque o resultado de uma busca
 * precisa ser dito, não só desenhado: quem não vê a lista encolher só percebe o
 * filtro se o número mudar num texto.
 */
export function sidebarSearchSource(): string {
  const menu = `<SidebarMenu>
  {visiveis.map((rotulo) => (
    <SidebarMenuItem key={rotulo}>
      <SidebarMenuButton tooltip={rotulo} isActive={rotulo === "Dashboard"}>
        <span>{rotulo}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  ))}
</SidebarMenu>`;

  return pagina({
    header: `<SidebarHeader className="nds-p-2" data-spacing="sm">
  <span className="nds-font-semibold nds-text-body nds-text-muted-foreground">
    Design System
  </span>
  <SidebarInput
    type="search"
    value={busca}
    onChange={(evento) => setBusca(evento.target.value)}
    placeholder="Buscar…"
    aria-label="Buscar na navegação"
  />
</SidebarHeader>`,
    grupos: [
      `<SidebarGroup>
  <SidebarGroupLabel>
    {busca ? \`Resultados (\${visiveis.length})\` : "Navegação"}
  </SidebarGroupLabel>
  <SidebarGroupContent>
${level(menu, 2)}
  </SidebarGroupContent>
</SidebarGroup>`,
    ],
    parts: ['SidebarInput'],
    icons: [],
    withFooter: false,
    estado: `const DESTINOS = ["Dashboard", "Componentes", "Tokens", "Notificações", "Perfil"];

const [busca, setBusca] = useState("");
const visiveis = DESTINOS.filter((rotulo) =>
  rotulo.toLowerCase().includes(busca.toLowerCase()),
);`,
  });
}
