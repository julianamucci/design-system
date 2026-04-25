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
  import { LayoutDashboard, Box, Palette, Settings, User, Bell, Search } from 'lucide-svelte';

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

<div class="min-h-[400px] w-full flex border rounded-lg overflow-hidden">
  <SidebarProvider defaultOpen={true}>
    <nav aria-label="Navegação principal">
      <Sidebar side="left" variant="sidebar" collapsible="offcanvas">
        <SidebarHeader class="px-3 py-2 border-b border-sidebar-border">
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
        <SidebarFooter class="px-4 py-3 border-t border-sidebar-border">
          <span class="text-xs text-sidebar-foreground/60">Design System v1.0</span>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
    </nav>
    <SidebarInset class="flex flex-col flex-1 min-w-0">
      <header class="flex h-12 items-center gap-2 border-b px-4">
        <SidebarTrigger />
        <span class="text-sm font-medium text-muted-foreground">Com grupos de navegação</span>
      </header>
      <main id="main-content" tabindex="-1" class="flex-1 p-6">
        <p class="text-sm text-muted-foreground">Sidebar com múltiplos grupos, badges e campo de busca.</p>
      </main>
    </SidebarInset>
  </SidebarProvider>
</div>
