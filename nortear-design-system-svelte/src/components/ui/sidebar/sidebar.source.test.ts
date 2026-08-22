import { describe, expect, it } from 'vitest';
import {
  sidebarSkeletonSource,
  sidebarExpandidaSource,
  sidebarFixaSource,
  sidebarGavetaSource,
  navigationSourceSidebarGroups,
  sidebarLadoDireitoSource,
  sidebarModeIconSource,
  sidebarOffcanvasFechadaSource,
  sidebarSource,
  sidebarSubmenuSource,
  sidebarVarianteFloatingSource,
  sidebarVarianteInsetSource,
  sidebarVarianteSidebarSource,
} from './sidebar.source';

describe('sidebarSource', () => {
  it('sem args, entrega a aplicação inteira: barra, conteúdo e o mesmo provider', () => {
    expect(sidebarSource()).toBe(
      `<script lang="ts">
  import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarInset,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarProvider,
    SidebarRail,
    SidebarTrigger,
  } from "@/components/ui/sidebar";
  import Box from "@lucide/svelte/icons/box";
  import LayoutDashboard from "@lucide/svelte/icons/layout-dashboard";
  import Palette from "@lucide/svelte/icons/palette";
  import Settings from "@lucide/svelte/icons/settings";
  import User from "@lucide/svelte/icons/user";

  const itens = [
    { icon: LayoutDashboard, label: "Dashboard", isActive: true },
    { icon: Box, label: "Componentes", isActive: false },
    { icon: Palette, label: "Tokens", isActive: false },
    { icon: Settings, label: "Configurações", isActive: false },
    { icon: User, label: "Perfil", isActive: false },
  ];
</script>

<SidebarProvider>
  <Sidebar side="left" variant="sidebar" collapsible="offcanvas">
    <SidebarHeader class="nds-px-4 nds-py-2 nds-border-b">
      <span class="nds-font-semibold nds-text-body nds-text-muted-foreground">Design System</span>
    </SidebarHeader>
    <SidebarContent>
      <nav aria-label="Navegação principal">
        <SidebarGroup>
          <SidebarGroupLabel>Navegação</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {#each itens as item (item.label)}
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={item.isActive}
                    tooltip={item.label}
                    aria-current={item.isActive ? "page" : null}
                  >
                    <item.icon aria-hidden="true" />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              {/each}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </nav>
    </SidebarContent>
    <SidebarFooter class="nds-px-4 nds-py-2 nds-border-t">
      <span class="nds-text-caption nds-text-muted-foreground">v1.0.0</span>
    </SidebarFooter>
    <SidebarRail />
  </Sidebar>
  <SidebarInset class="nds-stack nds-flex-1 nds-min-w-0">
    <header class="nds-cluster nds-border-b nds-px-4 nds-py-2" data-align="center" data-spacing="sm">
      <SidebarTrigger />
      <span class="nds-text-body nds-font-medium nds-text-muted-foreground">Conteúdo principal</span>
    </header>
    <main id="main-content" tabindex="-1" class="nds-flex-1 nds-p-6">
      <p class="nds-text-body">Área de conteúdo da aplicação.</p>
    </main>
  </SidebarInset>
</SidebarProvider>`,
    );
  });

  it('o marco de navegação fica DENTRO da barra, não em volta dela', () => {
    // Em largura estreita o conteúdo da barra vai para a gaveta: um <nav> por
    // fora ficaria para trás vazio, prometendo navegação e sem itens.
    const saida = sidebarSource();
    const nav = saida.indexOf('<nav aria-label="Navegação principal">');
    expect(nav).toBeGreaterThan(saida.indexOf('<SidebarContent>'));
    expect(nav).toBeLessThan(saida.indexOf('</SidebarContent>'));
  });

  it('os controls de lado e variante chegam à barra', () => {
    expect(sidebarSource('', { args: { side: 'right' } })).toContain('<Sidebar side="right"');
    expect(sidebarSource('', { args: { variant: 'floating' } })).toContain('variant="floating"');
  });

  it('só escreve mobileQuery quando o ponto de virada difere do padrão', () => {
    expect(sidebarSource('', { args: { mobileQuery: '(max-width: 767px)' } })).not.toContain(
      'mobileQuery',
    );
    expect(sidebarSource('', { args: { mobileQuery: '(min-width: 0px)' } })).toContain(
      'mobileQuery="(min-width: 0px)"',
    );
  });

  it('sem recolhimento não há gatilho, faixa nem balão de dica', () => {
    const saida = sidebarSource('', { args: { collapsible: 'none' } });
    expect(saida).not.toContain('<SidebarTrigger />');
    expect(saida).not.toContain('<SidebarRail />');
    expect(saida).not.toContain('tooltip=');
  });
});

describe('transforms das stories de variação, estado e composição', () => {
  it('cada variante visual declara a sua', () => {
    expect(sidebarVarianteSidebarSource()).toContain('variant="sidebar"');
    expect(sidebarVarianteFloatingSource()).toContain('variant="floating"');
    expect(sidebarVarianteInsetSource()).toContain('variant="inset"');
    expect(sidebarLadoDireitoSource()).toContain('side="right"');
  });

  it('a expandida é o padrão do provider, e a fechada usa o estado bindável', () => {
    expect(sidebarExpandidaSource()).not.toContain('bind:open');

    // `defaultOpen` NÃO existe neste provider: cai no rest, vira atributo no
    // `<div>` e a barra abre assim mesmo — aceita e ignorada em silêncio. Quem
    // começa fechada faz isso com estado ligado, e é o que o snippet ensina.
    const fechada = sidebarOffcanvasFechadaSource();
    expect(fechada).not.toContain('defaultOpen');
    expect(fechada).toContain('let aberta = $state(false);');
    expect(fechada).toContain('<SidebarProvider bind:open={aberta}>');
  });

  it('o modo ícone nomeia o item, porque o rótulo visível some', () => {
    const saida = sidebarModeIconSource();
    expect(saida).toContain('collapsible="icon"');
    expect(saida).toContain('aria-label={item.label}');
    expect(saida).toContain('nds-sidebar-hide-collapsed');
  });

  it('a barra fixa dispensa o gatilho, e a gaveta força o ponto de virada', () => {
    expect(sidebarFixaSource()).toContain('collapsible="none"');
    expect(sidebarGavetaSource()).toContain('mobileQuery="(min-width: 0px)"');
  });

  it('a composição de grupos traz busca, separador, contador e ações nomeadas', () => {
    const saida = navigationSourceSidebarGroups();
    expect(saida).toContain('<SidebarInput placeholder="Buscar..." aria-label="Buscar na navegação" />');
    expect(saida).toContain('<SidebarSeparator />');
    expect(saida).toContain('<SidebarMenuBadge>{item.badge}</SidebarMenuBadge>');
    expect(saida).toContain('aria-label="Adicionar atalho"');
    expect(saida).toContain('aria-label="Mais opções de {item.label}"');
  });

  it('o submenu anuncia o nível abaixo e o estado dele', () => {
    const saida = sidebarSubmenuSource();
    expect(saida).toContain('aria-expanded={componentesAberto}');
    expect(saida).toContain('<SidebarMenuSub>');
    expect(saida).toContain('href={sub.href}');
  });

  it('o carregamento troca cada item por um espaço reservado com ícone', () => {
    const saida = sidebarSkeletonSource();
    expect(saida).toContain('<SidebarMenuSkeleton showIcon />');
    expect(saida).not.toContain('<SidebarMenuButton');
  });
});
