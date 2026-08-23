/**
 * Transforms do painel Code da Sidebar.
 *
 * Módulo de TS puro, sem import de `.vue`: é o que deixa as funções rodarem no
 * projeto `unit` do vitest. A saída do painel não chega ao DOM durante a `play`,
 * então este é o único lugar em que elas têm guarda.
 *
 * A divisão de props entre as duas raízes é o que o snippet mais tem a ensinar:
 * `default-open`, `open` e `mobile-query` são do PROVIDER, que é quem guarda o
 * estado; `side`, `variant` e `collapsible` são da BARRA, que é quem se desenha.
 * Escrever uma no lugar da outra não dá erro nenhum — a prop desconhecida cai na
 * queda de atributos e vira atributo solto no elemento, em silêncio.
 */
import { attr, attrs, indentar, vueSnippet, type SourceTransform } from '@/lib/story-source';

export type SidebarArgs = {
  side: 'left' | 'right';
  variant: 'sidebar' | 'floating' | 'inset';
  collapsible: 'offcanvas' | 'icon' | 'none';
  mobileQuery: string;
};

/** O mesmo valor de `SIDEBAR_MOBILE_QUERY`: abaixo dele a barra vira gaveta. */
const QUERY_DEFAULT = '(max-width: 767px)';

/** Catálogo do que o pacote exporta e o snippet pode usar. */
const PARTS = [
  'Sidebar',
  'SidebarContent',
  'SidebarFooter',
  'SidebarGroup',
  'SidebarGroupAction',
  'SidebarGroupContent',
  'SidebarGroupLabel',
  'SidebarHeader',
  'SidebarInput',
  'SidebarInset',
  'SidebarMenu',
  'SidebarMenuAction',
  'SidebarMenuBadge',
  'SidebarMenuButton',
  'SidebarMenuItem',
  'SidebarMenuSkeleton',
  'SidebarMenuSub',
  'SidebarMenuSubButton',
  'SidebarMenuSubItem',
  'SidebarProvider',
  'SidebarRail',
  'SidebarSeparator',
  'SidebarTrigger',
];

/** Os ícones são decorativos, mas precisam existir no script para o template. */
const ICONS = [
  'Bell',
  'Blocks',
  'ChevronRight',
  'LayoutDashboard',
  'MoreHorizontal',
  'Palette',
  'Plus',
  'Settings',
  'User',
];

/** Usada de verdade: a tag abre e o próximo caractere não continua o nome. */
function usada(name: string, template: string): boolean {
  return new RegExp(`<${name}[\\s/>]`).test(template);
}

/**
 * Monta o SFC importando SÓ o que o template usa.
 *
 * A lista sai do próprio markup, e não de um catálogo escrito à mão por
 * composição: import que sobra é ruído no exemplo que alguém copia, e a lista
 * escrita à parte desencontra da composição no primeiro ajuste.
 */
function montar(template: string): string {
  const parts = PARTS.filter((part) => usada(part, template));
  const icons = ICONS.filter((icone) => usada(icone, template));
  const blocks = [
    `import {\n${parts.map((part) => `  ${part},`).join('\n')}\n} from '@/components/ui/sidebar'`,
  ];
  if (icons.length) blocks.push(`import { ${icons.join(', ')} } from 'lucide-vue-next'`);
  return vueSnippet(blocks.join('\n'), template);
}

const MARCA = `<SidebarHeader class="nds-p-4 nds-font-semibold nds-text-muted-foreground">Design System</SidebarHeader>`;

type Item = {
  icone?: string;
  label: string;
  active?: boolean;
  /** O balão só aparece com a barra recolhida — é o rótulo que sobrou. */
  tooltip?: boolean;
  badge?: string;
  acao?: string;
  expandido?: boolean;
  sub?: Array<{ label: string; active?: boolean }>;
};

/** Lista de itens do menu, em coluna zero. */
function menu(items: Item[]): string {
  const body = items
    .map((item) => {
      const button = attrs(
        item.active ? 'is-active' : '',
        item.tooltip === false ? '' : `tooltip="${item.label}"`,
        item.expandido ? 'aria-expanded="true"' : '',
        item.active ? 'aria-current="page"' : '',
      );
      const icone = item.icone ? `      <${item.icone} aria-hidden="true" />\n` : '';
      // A chevron gira sozinha sob `[aria-expanded="true"]`: o estado no DOM é
      // que comanda, não uma classe trocada à mão.
      const chevron = item.expandido
        ? `\n      <ChevronRight class="nds-spacer-start nds-chevron" aria-hidden="true" />`
        : '';
      const extras: string[] = [];
      if (item.badge) extras.push(`    <SidebarMenuBadge>${item.badge}</SidebarMenuBadge>`);
      if (item.acao) {
        extras.push(`    <SidebarMenuAction title="${item.acao}">
      <MoreHorizontal aria-hidden="true" />
      <span class="nds-sr-only">${item.acao}</span>
    </SidebarMenuAction>`);
      }
      if (item.sub) {
        const children = item.sub
          .map(
            (child) => `      <SidebarMenuSubItem>
        <SidebarMenuSubButton${attrs(child.active ? 'is-active' : '')}>
          <span>${child.label}</span>
        </SidebarMenuSubButton>
      </SidebarMenuSubItem>`,
          )
          .join('\n');
        extras.push(`    <SidebarMenuSub>\n${children}\n    </SidebarMenuSub>`);
      }
      return `  <SidebarMenuItem>
    <SidebarMenuButton${button}>
${icone}      <span>${item.label}</span>${chevron}
    </SidebarMenuButton>${extras.length ? `\n${extras.join('\n')}` : ''}
  </SidebarMenuItem>`;
    })
    .join('\n');
  return `<SidebarMenu>\n${body}\n</SidebarMenu>`;
}

/** Grupo do conteúdo: rótulo opcional, ação opcional e o menu dentro. */
function group(options: { label?: string; acao?: string; miolo: string }): string {
  const partes: string[] = ['<SidebarGroup>'];
  if (options.label) partes.push(`  <SidebarGroupLabel>${options.label}</SidebarGroupLabel>`);
  if (options.acao) {
    partes.push(`  <SidebarGroupAction title="${options.acao}">
    <Plus aria-hidden="true" />
    <span class="nds-sr-only">${options.acao}</span>
  </SidebarGroupAction>`);
  }
  partes.push('  <SidebarGroupContent>');
  partes.push(indentar(options.miolo, 4));
  partes.push('  </SidebarGroupContent>');
  partes.push('</SidebarGroup>');
  return partes.join('\n');
}

/**
 * A página inteira: provider, a barra dentro de um marco de navegação nomeado e
 * o conteúdo adjacente.
 *
 * A barra e o `SidebarInset` são IRMÃOS de propósito — a regra que arredonda o
 * conteúdo na variante `inset` é um seletor de irmão, e envolver um dos dois é
 * o primeiro jeito de perdê-la.
 */
function frame(options: {
  provider?: string;
  barra?: string;
  header?: string;
  content: string;
  footer?: string;
  range?: boolean;
  trigger?: string | false;
  caption: string;
  paragrafo: string;
}): string {
  const lines: Array<string | false | undefined> = [
    `<SidebarProvider${options.provider ?? ''}>`,
    `  <nav aria-label="Navegação principal">`,
    `    <Sidebar${options.barra ?? ''}>`,
    options.header && indentar(options.header, 6),
    `      <SidebarContent>`,
    indentar(options.content, 8),
    `      </SidebarContent>`,
    options.footer && indentar(options.footer, 6),
    options.range === false ? undefined : `      <SidebarRail />`,
    `    </Sidebar>`,
    `  </nav>`,
    `  <SidebarInset>`,
    `    <header class="nds-cluster nds-px-4 nds-py-2 nds-border-b" data-align="center" data-spacing="sm">`,
    options.trigger === false ? undefined : `      <SidebarTrigger${options.trigger ?? ''} />`,
    `      <span class="nds-text-body nds-text-muted-foreground">${options.caption}</span>`,
    `    </header>`,
    `    <main id="main-content" class="nds-p-4">`,
    `      <p class="nds-text-body">${options.paragrafo}</p>`,
    `    </main>`,
    `  </SidebarInset>`,
    `</SidebarProvider>`,
  ];
  return lines.filter((line): line is string => Boolean(line)).join('\n');
}

const APLICACAO: Item[] = [
  { icone: 'LayoutDashboard', label: 'Dashboard', active: true },
  { icone: 'Blocks', label: 'Componentes' },
  { icone: 'Palette', label: 'Tokens' },
];

/**
 * Forma canônica: provider em volta, barra dentro do marco de navegação,
 * conteúdo ao lado. `side`, `variant` e `collapsible` acompanham os controls e
 * moram na BARRA; `mobile-query` mora no PROVIDER, que é quem decide o modo.
 */
export const sidebarPlaygroundSource: SourceTransform<SidebarArgs> = (_gerado, ctx) => {
  const args = ctx?.args ?? {};
  return montar(
    frame({
      provider: attrs(attr('mobile-query', args.mobileQuery, QUERY_DEFAULT)),
      barra: attrs(
        attr('side', args.side, 'left'),
        attr('variant', args.variant, 'sidebar'),
        attr('collapsible', args.collapsible, 'offcanvas'),
      ),
      header: MARCA,
      content: [
        group({ label: 'Aplicação', miolo: menu(APLICACAO) }),
        '<SidebarSeparator />',
        group({
          label: 'Conta',
          miolo: menu([
            { icone: 'Settings', label: 'Configurações' },
            { icone: 'User', label: 'Perfil' },
          ]),
        }),
      ].join('\n'),
      caption: 'Conteúdo principal',
      paragrafo: 'Conteúdo da página, adjacente à barra.',
    }),
  );
};

/**
 * As três variantes visuais compartilham a mesma composição: cabeçalho, um
 * grupo de navegação, rodapé com o perfil e a faixa de alternância.
 */
function variant(variant: 'sidebar' | 'floating' | 'inset'): string {
  return montar(
    frame({
      barra: attrs(attr('variant', variant, 'sidebar')),
      header: MARCA,
      content: group({
        label: 'Aplicação',
        miolo: menu([...APLICACAO, { icone: 'Settings', label: 'Configurações' }]),
      }),
      footer: `<SidebarFooter class="nds-p-2">
${indentar(menu([{ icone: 'User', label: 'Perfil' }]), 2)}
</SidebarFooter>`,
      trigger: ' class="nds-lg-hidden"',
      caption: 'Conteúdo principal',
      paragrafo: 'Conteúdo principal adjacente à barra.',
    }),
  );
}

/** Variante padrão: painel colado na borda, sem cantos nem sombra. */
export function sidebarVariantSidebarSource(): string {
  return variant('sidebar');
}

/** Flutuante: o painel ganha cantos, borda e sombra sobre um respiro. */
export function sidebarVariantFloatingSource(): string {
  return variant('floating');
}

/** Encaixada: quem ganha cantos é o conteúdo adjacente, não a barra. */
export function sidebarVariantInsetSource(): string {
  return variant('inset');
}

/**
 * Barra à direita: além de `side`, a ORDEM dos irmãos muda — o conteúdo vem
 * primeiro e a navegação depois, senão a barra aparece à direita mas a ordem de
 * leitura e de tabulação continua começando por ela.
 */
export function sidebarSideDireitoSource(): string {
  return montar(
    `<SidebarProvider>
  <SidebarInset>
    <main id="main-content" class="nds-p-4">
      <p class="nds-text-body">Conteúdo principal à esquerda.</p>
    </main>
  </SidebarInset>
  <nav aria-label="Navegação principal">
    <Sidebar side="right">
      <SidebarHeader class="nds-p-4 nds-font-semibold nds-text-muted-foreground">Detalhes</SidebarHeader>
      <SidebarContent>
${indentar(
  group({
    miolo: menu([
      { icone: 'Settings', label: 'Configurações' },
      { icone: 'User', label: 'Perfil' },
    ]),
  }),
  8,
)}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  </nav>
</SidebarProvider>`,
  );
}

/**
 * Expandida: `default-open` é prop do PROVIDER, que é quem guarda o estado.
 * Na barra ela não existe — cairia na queda de atributos e viraria um atributo
 * solto na `<div>`, sem erro nenhum e sem efeito nenhum.
 */
export function sidebarExpandidaSource(): string {
  return montar(
    frame({
      provider: ' default-open',
      header: MARCA,
      content: group({ label: 'Aplicação', miolo: menu(APLICACAO) }),
      caption: 'Barra expandida',
      paragrafo: 'A barra ocupa a largura inteira, com ícone e rótulo lado a lado.',
    }),
  );
}

/**
 * Recolhida em ícones: o par é `collapsible="icon"` na barra e
 * `:default-open="false"` no provider. Sem rótulo visível, o `tooltip` de cada
 * item passa a ser o único nome que quem usa ponteiro recebe.
 */
export function sidebarRecolhidaIconSource(): string {
  return montar(
    frame({
      provider: ' :default-open="false"',
      barra: ' collapsible="icon"',
      header: `<SidebarHeader class="nds-p-2 nds-font-semibold nds-text-muted-foreground nds-overflow-hidden">
  <span class="nds-sidebar-hide-collapsed">Design System</span>
</SidebarHeader>`,
      content: group({
        miolo: menu([...APLICACAO, { icone: 'Settings', label: 'Configurações' }]),
      }),
      caption: 'Barra recolhida em ícones',
      paragrafo: 'Só os ícones ficam visíveis; o balão traz o nome da seção.',
    }),
  );
}

/**
 * Fixa: `collapsible="none"` tira o recolhimento inteiro. A ausência do gatilho
 * e da faixa é o assunto — deixá-los seria oferecer um controle que não faz
 * nada. Sem recolhimento também não há balão a mostrar, então o `tooltip` sai.
 */
export function sidebarFixaSource(): string {
  return montar(
    frame({
      barra: ' collapsible="none"',
      header: MARCA,
      content: group({
        miolo: menu(APLICACAO.map((item) => ({ ...item, tooltip: false }))),
      }),
      range: false,
      trigger: false,
      caption: 'Barra sempre visível',
      paragrafo: 'Sem recolhimento, a barra é uma coluna fixa do layout.',
    }),
  );
}

/**
 * Carregando: um `SidebarMenuSkeleton` por item que virá. `show-icon` reserva
 * também o quadrado do ícone, para que a lista não salte quando os dados
 * chegarem.
 */
export function sidebarLoadingSource(): string {
  return montar(
    frame({
      header: MARCA,
      content: group({
        label: 'Carregando',
        miolo: `<SidebarMenu>
  <SidebarMenuItem v-for="i in 5" :key="i">
    <SidebarMenuSkeleton show-icon />
  </SidebarMenuItem>
</SidebarMenu>`,
      }),
      range: false,
      trigger: false,
      caption: 'Carregando a navegação',
      paragrafo: 'Cada item que virá tem um espaço reservado no lugar.',
    }),
  );
}

/**
 * Gaveta sobreposta: quem decide o modo é `mobile-query`, no PROVIDER. Uma
 * consulta sempre verdadeira força a gaveta em qualquer largura — é assim que
 * se vê o caminho móvel sem redimensionar a janela.
 *
 * A gaveta é um diálogo modal, e o nome dela vem de `mobile-title` na barra. O
 * padrão já é português; a prop existe para quando o produto tem nome próprio.
 */
export function sidebarGavetaMovelSource(): string {
  return montar(
    frame({
      provider: ' mobile-query="(min-width: 0px)"',
      header: MARCA,
      content: group({
        miolo: menu(APLICACAO.map((item) => ({ ...item, tooltip: false }))),
      }),
      range: false,
      caption: 'Toque no gatilho para abrir a gaveta',
      paragrafo: 'Em tela estreita a barra sai do fluxo e abre sobreposta.',
    }),
  );
}

/**
 * Grupos de navegação: dois grupos separados por `SidebarSeparator`, cada um
 * com o próprio rótulo.
 *
 * A ação do grupo e a do item são só um ícone — o nome delas vem do
 * `nds-sr-only` ao lado, porque um "+" sozinho não diz nada a quem ouve. O
 * `SidebarMenuBadge` é texto de apoio do item, e por isso fica FORA do botão:
 * dentro, o contador entraria no nome acessível do item.
 */
export function sidebarGroupsSource(): string {
  return montar(
    frame({
      header: MARCA,
      content: [
        group({
          label: 'Aplicação',
          acao: 'Adicionar item',
          miolo: menu([
            { icone: 'LayoutDashboard', label: 'Dashboard', active: true, badge: '3' },
            { icone: 'Blocks', label: 'Componentes' },
            { icone: 'Palette', label: 'Tokens' },
          ]),
        }),
        '<SidebarSeparator />',
        group({
          label: 'Conta',
          miolo: menu([
            { icone: 'Bell', label: 'Notificações', badge: '12', acao: 'Mais opções' },
            { icone: 'Settings', label: 'Configurações' },
          ]),
        }),
      ].join('\n'),
      footer: `<SidebarFooter class="nds-p-2">
${indentar(menu([{ icone: 'User', label: 'Perfil do Usuário' }]), 2)}
</SidebarFooter>`,
      trigger: ' class="nds-lg-hidden"',
      caption: 'Com grupos e contadores',
      paragrafo: 'Dois grupos de navegação, com contadores e ações por item.',
    }),
  );
}

/**
 * Sub-menu: `SidebarMenuSub` é uma lista aninhada de verdade, e mora DENTRO do
 * item pai. O pai declara `aria-expanded` — sem ele a chevron gira só para quem
 * vê, e quem ouve não recebe aviso de que existe um nível abaixo.
 */
export function sidebarSubmenuSource(): string {
  return montar(
    frame({
      header: MARCA,
      content: group({
        label: 'Documentação',
        miolo: menu([
          { icone: 'LayoutDashboard', label: 'Dashboard', active: true },
          {
            icone: 'Blocks',
            label: 'Componentes',
            expandido: true,
            sub: [
              { label: 'Alert' },
              { label: 'Button' },
              { label: 'Barra lateral', active: true },
              { label: 'Card' },
            ],
          },
          {
            icone: 'Palette',
            label: 'Tokens',
            expandido: true,
            sub: [{ label: 'Cores' }, { label: 'Tipografia' }, { label: 'Espaçamento' }],
          },
        ]),
      }),
      trigger: ' class="nds-lg-hidden"',
      caption: 'Com sub-menus',
      paragrafo: 'Hierarquia de navegação aninhada dentro do item pai.',
    }),
  );
}

/**
 * Busca no cabeçalho: `SidebarInput` leva `aria-label` porque o `placeholder`
 * some assim que a pessoa digita — e com ele iria embora o único nome do campo.
 */
export function sidebarSearchSource(): string {
  return montar(
    frame({
      header: `<SidebarHeader class="nds-p-2" data-spacing="sm">
  <span class="nds-px-2 nds-font-semibold nds-text-muted-foreground nds-sidebar-hide-collapsed">Design System</span>
  <SidebarInput placeholder="Buscar..." aria-label="Buscar na navegação" />
</SidebarHeader>`,
      content: group({
        miolo: menu([
          ...APLICACAO,
          { icone: 'Settings', label: 'Configurações' },
          { icone: 'User', label: 'Perfil' },
        ]),
      }),
      trigger: ' class="nds-lg-hidden"',
      caption: 'Com busca no cabeçalho',
      paragrafo: 'O campo filtra a navegação sem sair da barra.',
    }),
  );
}
