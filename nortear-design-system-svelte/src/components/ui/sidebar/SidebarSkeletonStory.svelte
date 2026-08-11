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

  // `open` bindável é a API real do provider desta stack; `defaultOpen` era
  // aceita e ignorada.
  let open = $state(true);
</script>

<div class="nds-cluster nds-min-h-100 nds-w-full nds-border-default nds-rounded-lg nds-overflow-hidden">
  <SidebarProvider bind:open>
    <nav aria-label="Navegação principal">
      <Sidebar side="left" variant="sidebar" collapsible="offcanvas">
        <SidebarHeader class="nds-px-4 nds-py-2 nds-border-b">
          <span class="nds-font-semibold nds-text-body nds-text-muted-foreground">Design System</span>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Carregando...</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {#each [1, 2, 3, 4, 5] as i (i)}
                  <SidebarMenuItem>
                    <SidebarMenuSkeleton showIcon={true} />
                  </SidebarMenuItem>
                {/each}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter class="nds-px-4 nds-py-2 nds-border-t">
          <span class="nds-text-caption nds-text-muted-foreground">v1.0.0</span>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
    </nav>
    <SidebarInset class="nds-stack nds-flex-1 nds-min-w-0">
      <header class="nds-cluster nds-border-b nds-px-4 nds-py-2" data-align="center" data-spacing="sm">
        <SidebarTrigger />
        <span class="nds-text-body nds-font-medium nds-text-muted-foreground">Estado de carregamento</span>
      </header>
      <main id="main-content" tabindex="-1" class="nds-flex-1 nds-p-6">
        <p class="nds-text-body">SidebarMenuSkeleton com showIcon=true exibindo placeholders de carregamento.</p>
      </main>
    </SidebarInset>
  </SidebarProvider>
</div>
