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
    SidebarSeparator,
    SidebarTrigger,
    SidebarInset,
    SidebarRail,
    SidebarInput,
  } from '@/components/ui/sidebar';
  import { LayoutDashboard, Box, Palette, Settings, User, Bell } from 'lucide-svelte';

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
</script>

<div class="nds-cluster min-h-[400px] nds-w-full nds-border-default nds-rounded-lg nds-overflow-hidden">
  <SidebarProvider defaultOpen={true}>
    <nav aria-label="Navegação principal">
      <Sidebar side="left" variant="sidebar" collapsible="offcanvas">
        <SidebarHeader class="nds-py-2 nds-border-b border-sidebar-border" style="padding-inline: 0.75rem">
          <SidebarInput placeholder="Buscar..." />
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Principal</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {#each mainNavItems as item}
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={item.isActive}
                      tooltip={item.label}
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
                {#each secondaryNavItems as item}
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={item.isActive}
                      tooltip={item.label}
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
        </SidebarContent>
        <SidebarFooter class="nds-px-4 border-t border-sidebar-border" style="padding-block: 0.75rem">
          <span class="nds-text-caption text-sidebar-foreground/60">Design System v1.0</span>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
    </nav>
    <SidebarInset class="nds-stack nds-flex-1 nds-min-w-0">
      <header class="nds-cluster nds-border-b nds-px-4" data-align="center" data-spacing="sm" style="height: 3rem">
        <SidebarTrigger />
        <span class="nds-text-body nds-font-medium nds-text-muted-foreground">Com grupos de navegação</span>
      </header>
      <main id="main-content" tabindex="-1" class="nds-flex-1 nds-p-6">
        <p class="nds-text-body nds-text-muted-foreground">Sidebar com múltiplos grupos, badges e campo de busca.</p>
      </main>
    </SidebarInset>
  </SidebarProvider>
</div>
