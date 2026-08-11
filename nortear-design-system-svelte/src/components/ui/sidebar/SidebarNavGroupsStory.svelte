<script lang="ts">
  import {
    SidebarProvider,
    Sidebar,
    SidebarHeader,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarGroupContent,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarMenuBadge,
    SidebarGroupAction,
    SidebarMenuAction,
    SidebarSeparator,
    SidebarTrigger,
    SidebarInset,
    SidebarRail,
    SidebarInput,
  } from '@/components/ui/sidebar';
  import Plus from '@lucide/svelte/icons/plus';
  import MoreHorizontal from '@lucide/svelte/icons/more-horizontal';
  import LayoutDashboard from '@lucide/svelte/icons/layout-dashboard';
  import Box from '@lucide/svelte/icons/box';
  import Palette from '@lucide/svelte/icons/palette';
  import Settings from '@lucide/svelte/icons/settings';
  import User from '@lucide/svelte/icons/user';
  import Bell from '@lucide/svelte/icons/bell';

  const mainNavItems = [
    { icon: LayoutDashboard, label: 'Dashboard',    isActive: true,  badge: null },
    { icon: Box,             label: 'Componentes',  isActive: false, badge: '12' },
    { icon: Palette,         label: 'Tokens',       isActive: false, badge: null },
  ];

  const secondaryNavItems = [
    { icon: Bell,     label: 'Notificações', isActive: false, badge: '3' },
    { icon: Settings, label: 'Configurações', isActive: false, badge: null },
    { icon: User,     label: 'Perfil',        isActive: false, badge: null },
  ];

  // `open` bindável é a API real do provider desta stack; `defaultOpen` era
  // aceita e ignorada.
  let open = $state(true);
</script>

<div class="nds-cluster nds-min-h-100 nds-w-full nds-border-default nds-rounded-lg nds-overflow-hidden">
  <SidebarProvider bind:open>
    <nav aria-label="Navegação principal">
      <Sidebar side="left" variant="sidebar" collapsible="offcanvas">
        <SidebarHeader class="nds-py-2 nds-px-2 nds-border-b">
          <SidebarInput placeholder="Buscar..." aria-label="Buscar na navegação" />
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Principal</SidebarGroupLabel>
            <SidebarGroupAction aria-label="Adicionar atalho">
              <Plus aria-hidden="true" />
            </SidebarGroupAction>
            <SidebarGroupContent>
              <SidebarMenu>
                {#each mainNavItems as item (item.label)}
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={item.isActive}
                      tooltipContent={item.label}
                      aria-current={item.isActive ? 'page' : undefined}
                    >
                      <item.icon aria-hidden="true" />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
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
                {#each secondaryNavItems as item (item.label)}
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={item.isActive}
                      tooltipContent={item.label}
                    >
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
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter class="nds-px-4 nds-py-2 nds-border-t">
          <span class="nds-text-caption nds-text-muted-foreground">Design System v1.0</span>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
    </nav>
    <SidebarInset class="nds-stack nds-flex-1 nds-min-w-0">
      <header class="nds-cluster nds-border-b nds-px-4 nds-py-2" data-align="center" data-spacing="sm">
        <SidebarTrigger />
        <span class="nds-text-body nds-font-medium nds-text-muted-foreground">Com grupos de navegação</span>
      </header>
      <main id="main-content" tabindex="-1" class="nds-flex-1 nds-p-6">
        <p class="nds-text-body">Sidebar com múltiplos grupos, badges e campo de busca.</p>
      </main>
    </SidebarInset>
  </SidebarProvider>
</div>
