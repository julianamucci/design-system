<script lang="ts">
  import { untrack } from 'svelte';
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

  let {
    side = 'left' as 'left' | 'right',
    variant = 'sidebar' as 'sidebar' | 'floating' | 'inset',
    collapsible = 'offcanvas' as 'offcanvas' | 'icon' | 'none',
    defaultOpen = true,
    // Repassada ao provider. `undefined` cai no default do componente
    // (`SIDEBAR_MOBILE_QUERY`); a story móvel passa uma consulta sempre
    // verdadeira para forçar a gaveta sem depender da largura do iframe.
    mobileQuery = undefined as string | undefined,
  } = $props();

  // O provider desta stack não tem prop `defaultOpen` — o estado é `open`, e é
  // bindável. Passar `defaultOpen` caía no rest e virava atributo no <div>:
  // aceito, ignorado, e a barra abria sempre. Aqui `defaultOpen` é o valor
  // inicial do estado local que fica ligado ao provider.
  //
  // A leitura vai dentro de `untrack`: fora de um closure, o compilador avisa
  // que a referência captura só o valor inicial — e é exatamente o que ela faz.
  let open = $state(untrack(() => defaultOpen));

  // Depois da montagem quem manda é o gatilho, mas o painel Controls também
  // mexe em `defaultOpen`, e sem esta ressincronização mudar o controle não
  // reabria a barra: o estado tinha nascido do primeiro valor e nunca mais
  // olhava para a prop. Remontar por `{#key}` não resolveria — o bloco recria o
  // provider, não o escopo do script onde `open` mora.
  $effect(() => {
    open = defaultOpen;
  });

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', isActive: true },
    { icon: Box,             label: 'Componentes', isActive: false },
    { icon: Palette,         label: 'Tokens',      isActive: false },
    { icon: Settings,        label: 'Configurações', isActive: false },
    { icon: User,            label: 'Perfil',       isActive: false },
  ];
</script>

<div class="nds-cluster nds-min-h-100 nds-w-full nds-border-default nds-rounded-lg nds-overflow-hidden">
  <SidebarProvider bind:open {mobileQuery}>
    <Sidebar {side} {variant} {collapsible}>
      <SidebarHeader class="nds-px-4 nds-py-2 nds-border-b">
        <span class="nds-font-semibold nds-text-body nds-text-muted-foreground">Design System</span>
      </SidebarHeader>
      <SidebarContent>
        <!-- O marco de navegação fica DENTRO da barra, e não em volta dela.
             Em largura estreita o conteúdo da barra troca de lugar: vai para a
             gaveta, que é um portal no fim do <body>. Um <nav> por fora ficaria
             para trás vazio, anunciando "navegação principal" sem nada dentro,
             enquanto os itens de verdade estariam num diálogo sem marco. -->
        <nav aria-label="Navegação principal">
          <SidebarGroup>
            <SidebarGroupLabel>Navegação</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {#each navItems as item (item.label)}
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
        </nav>
      </SidebarContent>
      <SidebarFooter class="nds-px-4 nds-py-2 nds-border-t">
        <span class="nds-text-caption nds-text-muted-foreground nds-sidebar-hide-collapsed">v1.0.0</span>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
    <SidebarInset class="nds-stack nds-flex-1 nds-min-w-0">
      <header class="nds-cluster nds-border-b nds-px-4 nds-py-2" data-align="center" data-spacing="sm">
        <SidebarTrigger />
        <span class="nds-text-body nds-font-medium nds-text-muted-foreground">Conteúdo principal</span>
      </header>
      <main id="main-content" tabindex="-1" class="nds-flex-1 nds-p-6">
        <p class="nds-text-body">Área de conteúdo da aplicação.</p>
      </main>
    </SidebarInset>
  </SidebarProvider>
</div>
