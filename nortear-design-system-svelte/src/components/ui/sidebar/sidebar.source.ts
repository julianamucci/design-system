/**
 * Transforms do painel Code da Sidebar.
 *
 * Módulo de TS puro, sem import de `.svelte`: é o que deixa as funções rodarem
 * no projeto `unit` do vitest. Sem elas o painel montava a tag pelo nome interno
 * do componente compilado — o andaime da story, que ninguém pode importar.
 *
 * O marco de navegação vai DENTRO da barra em todos os snippets. Em largura
 * estreita o conteúdo da barra troca de lugar (vai para a gaveta, que é um
 * portal no fim do documento): um `<nav>` por fora ficaria para trás vazio,
 * anunciando "navegação principal" sem nada dentro.
 */
import { attrs, attrsMultilinha, svelteSnippet } from '@/lib/story-source';

export type SidebarArgs = {
  side: 'left' | 'right';
  variant: 'sidebar' | 'floating' | 'inset';
  collapsible: 'offcanvas' | 'icon' | 'none';
  mobileQuery: string;
};

/** Conteúdo da barra. Cada valor é uma composição inteira, não uma variação. */
type Menu = 'navegacao' | 'grupos' | 'submenu' | 'esqueleto';

type Options = Partial<SidebarArgs> & {
  /** Estado inicial de quem não controla `open` de fora. */
  defaultOpen?: boolean;
  menu?: Menu;
  titulo?: string;
};

const QUERY_DEFAULT = '(max-width: 767px)';

const ICONS: Record<string, string> = {
  Bell: 'bell',
  Box: 'box',
  ChevronDown: 'chevron-down',
  Circle: 'circle',
  LayoutDashboard: 'layout-dashboard',
  MoreHorizontal: 'more-horizontal',
  Palette: 'palette',
  Plus: 'plus',
  Settings: 'settings',
  User: 'user',
};

/** Peças da barra que cada composição usa, em ordem alfabética. */
function parts(menu: Menu, withTrigger: boolean): string[] {
  const base = [
    'Sidebar',
    'SidebarContent',
    'SidebarFooter',
    'SidebarGroup',
    'SidebarGroupContent',
    'SidebarGroupLabel',
    'SidebarHeader',
    'SidebarInset',
    'SidebarMenu',
    'SidebarMenuItem',
    'SidebarProvider',
  ];
  if (menu !== 'esqueleto') base.push('SidebarMenuButton');
  if (menu === 'grupos') {
    base.push('SidebarGroupAction', 'SidebarInput', 'SidebarMenuAction', 'SidebarMenuBadge', 'SidebarSeparator');
  }
  if (menu === 'submenu') base.push('SidebarMenuSub', 'SidebarMenuSubButton', 'SidebarMenuSubItem');
  if (menu === 'esqueleto') base.push('SidebarMenuSkeleton');
  if (withTrigger) base.push('SidebarRail', 'SidebarTrigger');
  return [...new Set(base)].sort();
}

/** Ícones de cada composição, também em ordem alfabética. */
function icones(menu: Menu): string[] {
  if (menu === 'esqueleto') return [];
  if (menu === 'grupos') {
    return ['Bell', 'Box', 'LayoutDashboard', 'MoreHorizontal', 'Palette', 'Plus', 'Settings', 'User'];
  }
  if (menu === 'submenu') return ['Box', 'ChevronDown', 'Circle', 'LayoutDashboard', 'Palette', 'Settings'];
  return ['Box', 'LayoutDashboard', 'Palette', 'Settings', 'User'];
}

/** Listas e estado que a marcação consome. */
function dados(menu: Menu): string {
  if (menu === 'esqueleto') return '';
  if (menu === 'grupos') {
    return `

const itensPrincipais = [
  { icon: LayoutDashboard, label: "Dashboard", isActive: true, badge: null },
  { icon: Box, label: "Componentes", isActive: false, badge: "12" },
  { icon: Palette, label: "Tokens", isActive: false, badge: null },
];

const itensDaConta = [
  { icon: Bell, label: "Notificações", badge: "3" },
  { icon: Settings, label: "Configurações", badge: null },
  { icon: User, label: "Perfil", badge: null },
];`;
  }
  if (menu === 'submenu') {
    return `

let componentesAberto = $state(true);

// Subitem de navegação é link, e link precisa de destino: sem \`href\` o <a> não
// tem papel de link e o leitor de tela não o anuncia como parada.
const subItens = [
  { label: "Button", href: "#button", isActive: true },
  { label: "Alert", href: "#alert", isActive: false },
  { label: "Badge", href: "#badge", isActive: false },
  { label: "Card", href: "#card", isActive: false },
];`;
  }
  return `

const itens = [
  { icon: LayoutDashboard, label: "Dashboard", isActive: true },
  { icon: Box, label: "Componentes", isActive: false },
  { icon: Palette, label: "Tokens", isActive: false },
  { icon: Settings, label: "Configurações", isActive: false },
  { icon: User, label: "Perfil", isActive: false },
];`;
}

/** Cabeçalho da barra: marca, ou o campo de busca da composição com grupos. */
function cabecalho(menu: Menu, collapsible: SidebarArgs['collapsible']): string {
  if (menu === 'grupos') {
    return `    <SidebarHeader class="nds-py-2 nds-px-2 nds-border-b">
      <SidebarInput placeholder="Buscar..." aria-label="Buscar na navegação" />
    </SidebarHeader>`;
  }
  // Em modo ícone o texto da marca sai de cena junto com os rótulos: a classe
  // é o que o esconde sem tirá-lo do documento.
  const classe = collapsible === 'icon'
    ? 'nds-font-semibold nds-text-body nds-text-muted-foreground nds-sidebar-hide-collapsed'
    : 'nds-font-semibold nds-text-body nds-text-muted-foreground';
  return `    <SidebarHeader class="nds-px-4 nds-py-2 nds-border-b">
      <span class="${classe}">Design System</span>
    </SidebarHeader>`;
}

/** Botão de item de menu, com o que cada modo de recolhimento exige. */
function itemButton(collapsible: SidebarArgs['collapsible']): string {
  // `tooltip` só faz sentido onde a barra encolhe; em modo ícone o rótulo
  // visível some, e o `aria-label` é o que garante o nome em qualquer entrada —
  // o balão não aparece para quem navega por teclado.
  const props = attrsMultilinha(
    [
      'isActive={item.isActive}',
      collapsible === 'none' ? '' : 'tooltip={item.label}',
      collapsible === 'icon' ? 'aria-label={item.label}' : '',
      // `null` e não o valor ausente: o Svelte remove o atributo nos dois casos,
      // e a guarda transversal dos snippets proíbe a palavra — ela é sinal de
      // gabarito mal fechado, que já apareceu num snippet antes.
      'aria-current={item.isActive ? "page" : null}',
    ],
    '                    ',
    0,
  );
  return `                  <SidebarMenuButton${props}                  >
                    <item.icon aria-hidden="true" />
                    <span>{item.label}</span>
                  </SidebarMenuButton>`;
}

/** Grupos de navegação, já indentados para dentro do `<nav>`. */
function grupos(menu: Menu, collapsible: SidebarArgs['collapsible']): string {
  if (menu === 'esqueleto') {
    return `        <SidebarGroup>
          <SidebarGroupLabel>Carregando...</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {#each [1, 2, 3, 4, 5] as i (i)}
                <SidebarMenuItem>
                  <SidebarMenuSkeleton showIcon />
                </SidebarMenuItem>
              {/each}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>`;
  }

  if (menu === 'grupos') {
    return `        <SidebarGroup>
          <SidebarGroupLabel>Principal</SidebarGroupLabel>
          <!-- O "+" sozinho não diz nada: a ação do grupo precisa de nome. -->
          <SidebarGroupAction aria-label="Adicionar atalho">
            <Plus aria-hidden="true" />
          </SidebarGroupAction>
          <SidebarGroupContent>
            <SidebarMenu>
              {#each itensPrincipais as item (item.label)}
                <SidebarMenuItem>
${itemButton(collapsible)}
                  {#if item.badge}
                    <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>
                  {/if}
                </SidebarMenuItem>
              {/each}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarSeparator />
        <SidebarGroup>
          <SidebarGroupLabel>Conta</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {#each itensDaConta as item (item.label)}
                <SidebarMenuItem>
                  <SidebarMenuButton tooltip={item.label}>
                    <item.icon aria-hidden="true" />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                  {#if item.badge}
                    <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>
                  {:else}
                    <SidebarMenuAction showOnHover aria-label="Mais opções de {item.label}">
                      <MoreHorizontal aria-hidden="true" />
                    </SidebarMenuAction>
                  {/if}
                </SidebarMenuItem>
              {/each}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>`;
  }

  if (menu === 'submenu') {
    return `        <SidebarGroup>
          <SidebarGroupLabel>Navegação</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Dashboard">
                  <LayoutDashboard aria-hidden="true" />
                  <span>Dashboard</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <!-- Sem aria-expanded a seta gira só para quem vê: quem ouve não
                     recebe aviso de que há um nível abaixo, nem de que ele abriu. -->
                <SidebarMenuButton
                  tooltip="Componentes"
                  onclick={() => (componentesAberto = !componentesAberto)}
                  aria-expanded={componentesAberto}
                >
                  <Box aria-hidden="true" />
                  <span>Componentes</span>
                  <ChevronDown aria-hidden="true" class="nds-spacer-start nds-chevron" />
                </SidebarMenuButton>
                {#if componentesAberto}
                  <div transition:slide={{ duration: 150 }}>
                    <SidebarMenuSub>
                      {#each subItens as sub (sub.label)}
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton
                            href={sub.href}
                            isActive={sub.isActive}
                            aria-current={sub.isActive ? "page" : null}
                          >
                            <Circle aria-hidden="true" class="nds-size-2" />
                            {sub.label}
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      {/each}
                    </SidebarMenuSub>
                  </div>
                {/if}
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Tokens">
                  <Palette aria-hidden="true" />
                  <span>Tokens</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Configurações">
                  <Settings aria-hidden="true" />
                  <span>Configurações</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>`;
  }

  return `        <SidebarGroup>
          <SidebarGroupLabel>Navegação</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {#each itens as item (item.label)}
                <SidebarMenuItem>
${itemButton(collapsible)}
                </SidebarMenuItem>
              {/each}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>`;
}

/** Aplicação inteira: barra à esquerda do conteúdo, sob o mesmo provider. */
function aplicacao(o: Options = {}): string {
  const {
    side = 'left',
    variant = 'sidebar',
    collapsible = 'offcanvas',
    mobileQuery = QUERY_DEFAULT,
    defaultOpen = true,
    menu = 'navegacao',
    titulo = 'Conteúdo principal',
  } = o;

  // Sem recolhimento não há o que alternar: o gatilho e a faixa saem junto.
  const withTrigger = collapsible !== 'none';

  const iconImportes = icones(menu)
    .map((nome) => `import ${nome} from "@lucide/svelte/icons/${ICONS[nome]}";`)
    .join('\n');
  const importeDeTransicao = menu === 'submenu' ? `\nimport { slide } from "svelte/transition";` : '';

  // O provider desta stack NÃO tem `defaultOpen` — o estado é `open`, e é
  // bindável. Passar `defaultOpen` cai no rest e vira atributo no `<div>`:
  // aceito, ignorado, e a barra abre sempre. O invólucro de story já sabia
  // disso (o comentário está lá desde antes), mas o snippet ensinava o
  // contrário — e o gate `nonexistent_lib_prop` do auditor pegou.
  //
  // Aqui o valor inicial vira estado ligado ao provider, que é a única forma
  // de "começar fechado" que esta API oferece.
  const stateInitial = defaultOpen ? '' : '\nlet aberta = $state(false);';

  const script = `import {
${parts(menu, withTrigger).map((p) => `  ${p},`).join('\n')}
} from "@/components/ui/sidebar";
${iconImportes}${importeDeTransicao}${stateInitial}${dados(menu)}`;

  const rodape = menu === 'grupos' ? 'Design System v1.0' : 'v1.0.0';
  const footerClassName =
    collapsible === 'icon'
      ? 'nds-text-caption nds-text-muted-foreground nds-sidebar-hide-collapsed'
      : 'nds-text-caption nds-text-muted-foreground';

  return svelteSnippet(
    script,
    `<SidebarProvider${attrs(
      defaultOpen ? '' : 'bind:open={aberta}',
      mobileQuery === QUERY_DEFAULT ? '' : `mobileQuery="${mobileQuery}"`,
    )}>
  <Sidebar side="${side}" variant="${variant}" collapsible="${collapsible}">
${cabecalho(menu, collapsible)}
    <SidebarContent>
      <nav aria-label="Navegação principal">
${grupos(menu, collapsible)}
      </nav>
    </SidebarContent>
    <SidebarFooter class="nds-px-4 nds-py-2 nds-border-t">
      <span class="${footerClassName}">${rodape}</span>
    </SidebarFooter>${withTrigger ? '\n    <SidebarRail />' : ''}
  </Sidebar>
  <SidebarInset class="nds-stack nds-flex-1 nds-min-w-0">
    <header class="nds-cluster nds-border-b nds-px-4 nds-py-2" data-align="center" data-spacing="sm">
${withTrigger ? '      <SidebarTrigger />\n' : ''}      <span class="nds-text-body nds-font-medium nds-text-muted-foreground">${titulo}</span>
    </header>
    <main id="main-content" tabindex="-1" class="nds-flex-1 nds-p-6">
      <p class="nds-text-body">Área de conteúdo da aplicação.</p>
    </main>
  </SidebarInset>
</SidebarProvider>`,
  );
}

/**
 * Playground: acompanha os controls de lado, variante visual, modo de
 * recolhimento e ponto de virada para a gaveta.
 */
export function sidebarSource(_gerado?: string, ctx?: { args?: Partial<SidebarArgs> }): string {
  return aplicacao(ctx?.args ?? {});
}

/** Variante padrão: painel encostado, sem cantos nem sombra. */
export function sidebarVariantSidebarSource(): string {
  return aplicacao({ variant: 'sidebar' });
}

/** Variante flutuante: o painel interno ganha borda, cantos e sombra. */
export function sidebarVariantFloatingSource(): string {
  return aplicacao({ variant: 'floating' });
}

/** Variante embutida: é o conteúdo adjacente que arredonda, e ele é irmão da barra. */
export function sidebarVariantInsetSource(): string {
  return aplicacao({ variant: 'inset' });
}

/** A barra do outro lado — o conteúdo não muda de ordem no documento. */
export function sidebarSideDireitoSource(): string {
  return aplicacao({ side: 'right' });
}

/** Estado expandido: o estado inicial de quem não controla `open` de fora. */
export function sidebarExpandidaSource(): string {
  return aplicacao();
}

/** Recolhida em ícones: o rótulo some da tela, o nome acessível fica. */
export function sidebarModeIconSource(): string {
  return aplicacao({ collapsible: 'icon', defaultOpen: false, titulo: 'Modo ícone recolhido' });
}

/** Recolhida em offcanvas: o vão no fluxo zera e a barra sai da coluna. */
export function sidebarOffcanvasFechadaSource(): string {
  return aplicacao({ defaultOpen: false });
}

/** Fixa: sem recolhimento não há estado, nem gatilho, nem faixa. */
export function sidebarFixaSource(): string {
  return aplicacao({ collapsible: 'none', titulo: 'Barra sempre visível' });
}

/**
 * Gaveta sobreposta: o ponto de virada é do produto, e uma consulta sempre
 * verdadeira força a gaveta em qualquer largura.
 */
export function sidebarGavetaSource(): string {
  return aplicacao({ defaultOpen: false, mobileQuery: '(min-width: 0px)' });
}

/** Composição: dois grupos, busca no cabeçalho, contadores e ações nomeadas. */
export function navigationSidebarGroupsSource(): string {
  return aplicacao({ menu: 'grupos', titulo: 'Com grupos de navegação' });
}

/** Composição: item com nível abaixo, anunciado por aria-expanded. */
export function sidebarSubmenuSource(): string {
  return aplicacao({ menu: 'submenu', titulo: 'Com submenu' });
}

/** Composição: carregamento — cada item vira um espaço reservado. */
export function sidebarSkeletonSource(): string {
  return aplicacao({ menu: 'esqueleto', titulo: 'Estado de carregamento' });
}
