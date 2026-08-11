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
    SidebarTrigger,
    SidebarInset,
    SidebarRail,
  } from '@/components/ui/sidebar';
  import LayoutDashboard from '@lucide/svelte/icons/layout-dashboard';
  import Box from '@lucide/svelte/icons/box';
  import Palette from '@lucide/svelte/icons/palette';
  import Settings from '@lucide/svelte/icons/settings';
  import User from '@lucide/svelte/icons/user';

  // O provider desta stack expõe `open` (bindável), não `defaultOpen`: a prop
  // antiga era aceita e ignorada, e esta story — que existe para mostrar a
  // barra RECOLHIDA — vinha abrindo expandida.
  let open = $state(false);

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard',    isActive: true  },
    { icon: Box,             label: 'Componentes',  isActive: false },
    { icon: Palette,         label: 'Tokens',       isActive: false },
    { icon: Settings,        label: 'Configurações', isActive: false },
    { icon: User,            label: 'Perfil',        isActive: false },
  ];
</script>

<div class="nds-cluster nds-min-h-100 nds-w-full nds-border-default nds-rounded-lg nds-overflow-hidden">
  <SidebarProvider bind:open>
    <nav aria-label="Navegação principal">
      <Sidebar side="left" variant="sidebar" collapsible="icon">
        <SidebarHeader class="nds-px-4 nds-py-2 nds-border-b">
          <span class="nds-font-semibold nds-text-body nds-text-muted-foreground nds-sidebar-hide-collapsed">
            Design System
          </span>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Navegação</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {#each navItems as item (item.label)}
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={item.isActive}
                      tooltipContent={item.label}
                      aria-label={item.label}
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
        <SidebarFooter class="nds-px-4 nds-py-2 nds-border-t">
          <span class="nds-text-caption nds-text-muted-foreground nds-sidebar-hide-collapsed">v1.0.0</span>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
    </nav>
    <SidebarInset class="nds-stack nds-flex-1 nds-min-w-0">
      <header class="nds-cluster nds-border-b nds-px-4 nds-py-2" data-align="center" data-spacing="sm">
        <SidebarTrigger />
        <span class="nds-text-body nds-font-medium nds-text-muted-foreground">Modo icon colapsado</span>
      </header>
      <main id="main-content" tabindex="-1" class="nds-flex-1 nds-p-6">
        <p class="nds-text-body">Apenas ícones visíveis na sidebar. Passe o mouse para ver os tooltips.</p>
      </main>
    </SidebarInset>
  </SidebarProvider>
</div>
