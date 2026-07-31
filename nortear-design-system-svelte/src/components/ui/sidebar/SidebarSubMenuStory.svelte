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
  import LayoutDashboard from '@lucide/svelte/icons/layout-dashboard';
  import Box from '@lucide/svelte/icons/box';
  import ChevronDown from '@lucide/svelte/icons/chevron-down';
  import Circle from '@lucide/svelte/icons/circle';
  import Palette from '@lucide/svelte/icons/palette';
  import Settings from '@lucide/svelte/icons/settings';
  import { slide } from 'svelte/transition';

  let componentsOpen = $state(true);

  const subItems = [
    { label: 'Button',  isActive: true  },
    { label: 'Alert',   isActive: false },
    { label: 'Badge',   isActive: false },
    { label: 'Card',    isActive: false },
  ];
</script>

<div class="nds-cluster nds-min-h-100 nds-w-full nds-border-default nds-rounded-lg nds-overflow-hidden">
  <SidebarProvider defaultOpen={true}>
    <nav aria-label="Navegação principal">
      <Sidebar side="left" variant="sidebar" collapsible="offcanvas">
        <SidebarHeader class="nds-px-4 nds-border-b border-sidebar-border" style="padding-block: 0.75rem">
          <span class="nds-font-semibold nds-text-body nds-text-muted-foreground">Design System</span>
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
                      class="ml-auto nds-transition-transform {componentsOpen ? 'rotate-180' : ''}"
                    />
                  </SidebarMenuButton>
                  {#if componentsOpen}
                    <div transition:slide={{ duration: 150 }}>
                      <SidebarMenuSub>
                        {#each subItems as sub (sub.label)}
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton
                              isActive={sub.isActive}
                              aria-current={sub.isActive ? 'page' : undefined}
                            >
                              <Circle aria-hidden="true" class="" style="width: 0.5rem; height: 0.5rem" />
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
        <SidebarFooter class="nds-px-4 border-t border-sidebar-border" style="padding-block: 0.75rem">
          <span class="nds-text-caption text-sidebar-foreground/60">v1.0.0</span>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
    </nav>
    <SidebarInset class="nds-stack nds-flex-1 nds-min-w-0">
      <header class="nds-cluster nds-border-b nds-px-4" data-align="center" data-spacing="sm" style="height: 3rem">
        <SidebarTrigger />
        <span class="nds-text-body nds-font-medium nds-text-muted-foreground">Com sub-menu</span>
      </header>
      <main id="main-content" tabindex="-1" class="nds-flex-1 nds-p-6">
        <p class="nds-text-body">Sidebar com submenu expansível em "Componentes".</p>
      </main>
    </SidebarInset>
  </SidebarProvider>
</div>
