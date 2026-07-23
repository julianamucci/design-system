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
    SidebarInset,
  } from '@/components/ui/sidebar';
  import LayoutDashboard from '@lucide/svelte/icons/layout-dashboard';
  import Box from '@lucide/svelte/icons/box';
  import Palette from '@lucide/svelte/icons/palette';
  import Settings from '@lucide/svelte/icons/settings';
  import User from '@lucide/svelte/icons/user';

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard',    isActive: true  },
    { icon: Box,             label: 'Componentes',  isActive: false },
    { icon: Palette,         label: 'Tokens',       isActive: false },
    { icon: Settings,        label: 'Configurações', isActive: false },
    { icon: User,            label: 'Perfil',        isActive: false },
  ];
</script>

<div class="nds-cluster nds-min-h-100 nds-w-full nds-border-default nds-rounded-lg nds-overflow-hidden">
  <SidebarProvider>
    <nav aria-label="Navegação principal">
      <Sidebar side="left" variant="sidebar" collapsible="none">
        <SidebarHeader class="nds-px-4 nds-border-b border-sidebar-border" style="padding-block: 0.75rem">
          <span class="nds-font-semibold nds-text-body nds-text-muted-foreground">Design System</span>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Navegação</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {#each navItems as item}
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={item.isActive}
                      aria-current={item.isActive ? 'page' : undefined}
                    >
                      <item.icon aria-hidden="true" />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                {/each}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter class="nds-px-4 border-t border-sidebar-border" style="padding-block: 0.75rem">
          <span class="nds-text-caption text-sidebar-foreground/60">v1.0.0</span>
        </SidebarFooter>
      </Sidebar>
    </nav>
    <SidebarInset class="nds-stack nds-flex-1 nds-min-w-0">
      <header class="nds-cluster nds-border-b nds-px-4" data-align="center" data-spacing="sm" style="height: 3rem">
        <span class="nds-text-body nds-font-medium nds-text-muted-foreground">Sidebar sempre visível — sem toggle</span>
      </header>
      <main id="main-content" tabindex="-1" class="nds-flex-1 nds-p-6">
        <p class="nds-text-body nds-text-muted-foreground">collapsible="none": sidebar fixa sem possibilidade de recolher.</p>
      </main>
    </SidebarInset>
  </SidebarProvider>
</div>
