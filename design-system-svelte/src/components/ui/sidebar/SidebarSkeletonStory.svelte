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
    SidebarMenuSkeleton,
    SidebarTrigger,
    SidebarInset,
    SidebarRail,
  } from '@/components/ui/sidebar';
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
            <SidebarGroupLabel>Carregando...</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {#each [1, 2, 3, 4, 5] as i}
                  <SidebarMenuItem>
                    <SidebarMenuSkeleton showIcon={true} />
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
        <span class="text-sm font-medium text-muted-foreground">Estado de carregamento</span>
      </header>
      <main id="main-content" tabindex="-1" class="flex-1 p-6">
        <p class="text-sm text-muted-foreground">SidebarMenuSkeleton com showIcon=true exibindo placeholders de carregamento.</p>
      </main>
    </SidebarInset>
  </SidebarProvider>
</div>
