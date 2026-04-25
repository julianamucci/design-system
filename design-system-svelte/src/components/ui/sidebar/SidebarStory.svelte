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

  let {
    side = 'left' as 'left' | 'right',
    variant = 'sidebar' as 'sidebar' | 'floating' | 'inset',
    collapsible = 'offcanvas' as 'offcanvas' | 'icon' | 'none',
    defaultOpen = true,
  } = $props();

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', isActive: true },
    { icon: Box,             label: 'Componentes', isActive: false },
    { icon: Palette,         label: 'Tokens',      isActive: false },
    { icon: Settings,        label: 'Configurações', isActive: false },
    { icon: User,            label: 'Perfil',       isActive: false },
  ];
</script>

<div class="min-h-[400px] w-full flex border rounded-lg overflow-hidden">
  <SidebarProvider {defaultOpen}>
    <nav aria-label="Navegação principal">
      <Sidebar {side} {variant} {collapsible}>
        <SidebarHeader class="px-4 py-3 border-b border-sidebar-border">
          <span class="font-semibold text-sm text-sidebar-foreground">Design System</span>
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
          <span class="text-xs text-sidebar-foreground/60">v1.0.0</span>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
    </nav>
    <SidebarInset class="flex flex-col flex-1 min-w-0">
      <header class="flex h-12 items-center gap-2 border-b px-4">
        <SidebarTrigger />
        <span class="text-sm font-medium text-muted-foreground">Conteúdo principal</span>
      </header>
      <main id="main-content" tabindex="-1" class="flex-1 p-6">
        <p class="text-sm text-muted-foreground">Área de conteúdo da aplicação.</p>
      </main>
    </SidebarInset>
  </SidebarProvider>
</div>
