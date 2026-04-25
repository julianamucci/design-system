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
  import { LayoutDashboard, Box, Palette, Settings, User } from 'lucide-svelte';

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard',    isActive: true  },
    { icon: Box,             label: 'Componentes',  isActive: false },
    { icon: Palette,         label: 'Tokens',       isActive: false },
    { icon: Settings,        label: 'Configurações', isActive: false },
    { icon: User,            label: 'Perfil',        isActive: false },
  ];
</script>

<div class="min-h-[400px] w-full flex border rounded-lg overflow-hidden">
  <SidebarProvider defaultOpen={false}>
    <nav aria-label="Navegação principal">
      <Sidebar side="left" variant="sidebar" collapsible="icon">
        <SidebarHeader class="px-4 py-3 border-b border-sidebar-border">
          <span class="font-semibold text-sm text-sidebar-foreground group-data-[collapsible=icon]:hidden">
            Design System
          </span>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel class="group-data-[collapsible=icon]:hidden">Navegação</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {#each navItems as item}
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={item.isActive}
                      tooltip={item.label}
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
        <SidebarFooter class="px-4 py-3 border-t border-sidebar-border">
          <span class="text-xs text-sidebar-foreground/60 group-data-[collapsible=icon]:hidden">v1.0.0</span>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
    </nav>
    <SidebarInset class="flex flex-col flex-1 min-w-0">
      <header class="flex h-12 items-center gap-2 border-b px-4">
        <SidebarTrigger />
        <span class="text-sm font-medium text-muted-foreground">Modo icon colapsado</span>
      </header>
      <main id="main-content" tabindex="-1" class="flex-1 p-6">
        <p class="text-sm text-muted-foreground">Apenas ícones visíveis na sidebar. Passe o mouse para ver os tooltips.</p>
      </main>
    </SidebarInset>
  </SidebarProvider>
</div>
