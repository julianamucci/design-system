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
    SidebarMenuSub,
    SidebarMenuSubItem,
    SidebarMenuSubButton,
    SidebarTrigger,
    SidebarInset,
    SidebarRail,
  } from '@/components/ui/sidebar';
  import { LayoutDashboard, Box, ChevronDown, Circle, Palette, Settings } from 'lucide-svelte';
  import { slide } from 'svelte/transition';

  let componentsOpen = $state(true);

  const subItems = [
    { label: 'Button',  isActive: true  },
    { label: 'Alert',   isActive: false },
    { label: 'Badge',   isActive: false },
    { label: 'Card',    isActive: false },
  ];
</script>

<div class="min-h-[400px] w-full flex border rounded-lg overflow-hidden">
  <SidebarProvider defaultOpen={true}>
    <nav aria-label="Navegação principal">
      <Sidebar side="left" variant="sidebar" collapsible="offcanvas">
        <SidebarHeader class="px-4 py-3 border-b border-sidebar-border">
          <span class="font-semibold text-sm text-sidebar-foreground">Design System</span>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
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
                  <SidebarMenuButton
                    tooltip="Componentes"
                    onclick={() => (componentsOpen = !componentsOpen)}
                    aria-expanded={componentsOpen}
                  >
                    <Box aria-hidden="true" />
                    <span>Componentes</span>
                    <ChevronDown
                      aria-hidden="true"
                      class="ml-auto transition-transform {componentsOpen ? 'rotate-180' : ''}"
                    />
                  </SidebarMenuButton>
                  {#if componentsOpen}
                    <div transition:slide={{ duration: 150 }}>
                      <SidebarMenuSub>
                        {#each subItems as sub}
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton
                              isActive={sub.isActive}
                              aria-current={sub.isActive ? 'page' : undefined}
                            >
                              <Circle aria-hidden="true" class="size-2" />
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
        <span class="text-sm font-medium text-muted-foreground">Com sub-menu</span>
      </header>
      <main id="main-content" tabindex="-1" class="flex-1 p-6">
        <p class="text-sm text-muted-foreground">Sidebar com submenu expansível em "Componentes".</p>
      </main>
    </SidebarInset>
  </SidebarProvider>
</div>
